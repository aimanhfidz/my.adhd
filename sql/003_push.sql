-- ============================================================
-- my.adhd — web reminders
--
-- Two tables and a clock. push_sub is one row per browser that turned
-- reminders on; push_fire is when each of them has something on, for the
-- next fortnight, replaced whole by /api/push on every save. The clock is
-- a pg_cron job that asks /api/push-send to send what is due, once a
-- minute.
--
-- WHAT THIS HOLDS. A push endpoint, its two keys, and a list of times
-- with tags like `t.k3j9x2a`. No account, no user id, no words: the title
-- and first step stay in the browser (see push.js). A row says "this
-- browser has something at 16:30" and nothing more.
--
-- Run once, in the Supabase SQL editor, after enabling BOTH pg_cron and
-- pg_net (Database -> Extensions), and after putting the cron secret in
-- the vault — see docs/supabase-setup.md. Without them the tables land and
-- the schedule block raises a notice: nothing is ever sent.
-- ============================================================


create table if not exists public.push_sub (
  endpoint   text primary key,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_fire (
  id       bigint generated always as identity primary key,
  endpoint text not null references public.push_sub(endpoint) on delete cascade,
  tag      text not null,
  fire_at  timestamptz not null
);

create index if not exists push_fire_due on public.push_fire (fire_at);
create index if not exists push_fire_endpoint on public.push_fire (endpoint);

-- Service key only. No policies means the publishable key can neither
-- read who has reminders on nor write a schedule for somebody else.
alter table public.push_sub  enable row level security;
alter table public.push_fire enable row level security;
revoke all on public.push_sub, public.push_fire from anon, authenticated;


-- ---------- the clock ----------
-- The secret is read from the vault at run time rather than written here,
-- so this file can live in the repo. It must equal PUSH_CRON_SECRET in
-- Vercel's env vars.
do $$
begin
  perform cron.unschedule('push-send')
    where exists (select 1 from cron.job where jobname = 'push-send');

  perform cron.schedule('push-send', '* * * * *', $job$
    select net.http_post(
      url     := 'https://myadhd.my/api/push-send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets
           where name = 'push_cron_secret'
        )
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 20000
    );
  $job$);
exception when others then
  raise notice 'push: pg_cron or pg_net not available — NO REMINDER WILL EVER BE SENT. Enable both under Database -> Extensions and re-run this block.';
end $$;
