-- ============================================================
-- my.adhd — billing
--
-- One row per account, holding the answer to one question: is this
-- person entitled right now. Everything else in here exists to make that
-- answer trustworthy or to let a human work out why it is what it is.
--
-- Stripe is the source of truth for money. This table is a local cache of
-- what Stripe last told us, written only by the webhook with the service
-- key. The app never computes entitlement from a payment — it reads this.
--
-- Run once, in the Supabase SQL editor.
-- ============================================================

create table if not exists public.billing (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Stripe's id for this person. Kept so the billing portal can be opened
  -- without searching Stripe by email, which is slow and ambiguous.
  stripe_customer_id text unique,

  -- Which of the three, or null if they have never paid.
  -- 'weekly' | 'annual' | 'lifetime'
  plan text,

  -- Stripe's own subscription status, plus 'none'. Deliberately the same
  -- vocabulary Stripe uses rather than a translation of it: when this
  -- disagrees with the dashboard, the disagreement should be obvious.
  -- none | trialing | active | past_due | canceled | incomplete | unpaid
  status text not null default 'none',

  -- When access lapses if nothing renews. NULL for lifetime, which is the
  -- point of lifetime.
  current_period_end timestamptz,

  -- They have cancelled but the period they paid for is still running.
  -- Access continues until current_period_end; this only changes what the
  -- account screen should say.
  cancel_at_period_end boolean not null default false,

  -- 'stripe' today. Room for 'apple' when the iOS shell needs StoreKit,
  -- because Apple requires In-App Purchase for anything unlocked inside
  -- the app and that receipt will have to grant the same entitlement.
  -- One table, two writers.
  source text not null default 'stripe',

  -- The subscription this row is about. Null for lifetime (a payment, not
  -- a subscription) and for accounts that never bought anything.
  stripe_subscription_id text,

  updated_at timestamptz not null default now()
);

comment on table public.billing is
  'Cache of what Stripe last said about this account. Written only by /api/stripe-webhook.';

create index if not exists billing_customer_idx on public.billing (stripe_customer_id);

-- ---------- who may read this ----------
-- The client reads its own row and nothing else. It may never write:
-- entitlement that a browser can set is entitlement that is free.
alter table public.billing enable row level security;

drop policy if exists "read own billing" on public.billing;
create policy "read own billing"
  on public.billing for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy exists on purpose. The service key used
-- by the webhook bypasses RLS; everyone else is refused by default.

-- ---------- the one question ----------
-- Entitlement in one place, so the app, the API and a human in the SQL
-- editor all answer it the same way. 'past_due' is deliberately NOT
-- entitled — Stripe keeps retrying the card and will move the row to
-- 'active' if it succeeds.
create or replace function public.is_entitled(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.billing b
    where b.user_id = uid
      and b.status in ('trialing', 'active')
      and (b.current_period_end is null or b.current_period_end > now())
  );
$$;

comment on function public.is_entitled is
  'True while the account is inside a trial or a paid period. Lifetime has a null period end and never lapses.';
