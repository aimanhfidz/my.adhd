-- ============================================================
-- my.adhd — the self-check record
--
-- Three tables, because there are three different kinds of fact here and
-- they have three different lifetimes:
--
--   profile      a CURRENT fact. It gets corrected. One row per person.
--   consent      a HISTORICAL EVENT. It must never be edited: a consent
--                record that can be updated is not evidence of anything.
--   submission   also an event, and there can be several — taking the
--                screener twice is two submissions, not one overwritten.
--
-- Collapsing these into one table means either losing the retake or
-- rewriting the consent, and both are wrong.
--
-- WHAT THIS HOLDS. Someone's name, their Google email, their phone, their
-- age, their gender, and their answers to eighteen questions about their
-- own attention. Those answers are health data — sensitive personal data
-- under the PDPA — which is why the write path below is service-key only,
-- why the read policy is auth.uid() = user_id and nothing else, and why
-- the 24-month limit is a scheduled job rather than a sentence on a page.
-- Design as though this table will leak, because a list of named
-- Malaysians scored against an ADHD instrument is the kind of list that
-- costs somebody a job.
--
-- Run once, in the Supabase SQL editor. Enable pg_cron first
-- (Database -> Extensions), or the schedule at the foot is skipped with a
-- notice and retention silently never runs.
-- ============================================================


-- ---------- who they are ----------
create table if not exists public.self_check_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,

  full_name text not null,

  -- Copied from auth.users rather than joined to it. Deliberate: when a
  -- human is in this editor answering "delete everything you have about
  -- me", the row should say who it is about without a second lookup
  -- against the Auth Admin API.
  email text not null,

  -- Optional, and nullable for real. The intake says so and the API
  -- accepts a blank. Data we have no use for is data the Act calls
  -- excessive.
  phone text,

  -- 18 is the floor in three places that must agree: the browser, the API
  -- and here. Malaysia's age of majority is 18, so a minor cannot consent
  -- for themselves and we cannot verify a guardian; and the instrument is
  -- the *Adult* ADHD Self-Report Scale, whose scoring has only ever been
  -- validated on adults.
  age smallint not null check (age between 18 and 100),

  gender text not null check (gender in ('male', 'female', 'undisclosed')),

  -- Purpose (1), and only if they ticked the third box. Never defaulted
  -- to true, in the table or anywhere above it.
  contact_opt_in boolean not null default false,

  created_at timestamptz not null default now(),

  -- THE RETENTION CLOCK. Bumped by a completed submission and by nothing
  -- else — see purge_self_check() for why a page view must never touch
  -- it.
  last_seen_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

comment on table public.self_check_profile is
  'Who took the self-check. Written only by /api/self-check with the service key.';


-- ---------- what they agreed to, and when ----------
create table if not exists public.self_check_consent (
  id uuid primary key default gen_random_uuid(),

  -- SET NULL, not CASCADE, and this is the one deliberate asymmetry in
  -- the file. Deleting the account takes the profile and the answers with
  -- it; this row stays behind with the identity removed, as proof that a
  -- consent happened, under which version of the notice, in which
  -- language.
  --
  -- Be honest about what the survivor is worth: with user_id nulled it
  -- proves the process ran and what the notice said, not that a named
  -- person agreed. That is the correct trade. Once the health data is
  -- gone there is nothing left that needs justifying against a name, and
  -- keeping a name after somebody asked you to erase it — in order to
  -- prove you were allowed to hold data you no longer hold — is exactly
  -- what the Retention Principle disfavours.
  user_id uuid references auth.users(id) on delete set null,

  -- Which notice they actually read. api/self-check.js holds the matching
  -- constant; bump it there and everyone is asked again.
  version text not null,

  -- Which language the notice was in when they ticked. The s.7 notice is
  -- shown in both, but this records the page they were reading.
  lang text not null check (lang in ('en', 'ms')),

  terms   boolean not null,   -- mandatory
  health  boolean not null,   -- mandatory, and separate: PDPA s.40 wants
                              -- explicit consent for sensitive data, and
                              -- a single combined tick is not explicit
  contact boolean not null,   -- optional

  given_at timestamptz not null default now()
);

-- No ip_hash and no user_agent here on purpose. Behind a Google-verified
-- identity an IP adds nothing evidential, and hashing it would need a new
-- salt — reusing FEEDBACK_SALT would make the two tables correlatable and
-- break what privacy.html promises about anonymous feedback.
comment on table public.self_check_consent is
  'One row per consent given. Never updated. Survives account deletion with user_id nulled.';


-- ---------- what they answered ----------
create table if not exists public.self_check_submission (
  id uuid primary key default gen_random_uuid(),

  -- CASCADE, and it has to be: purpose (2) that we tell people is "so you
  -- can delete your own record". If deleting the account left the answers
  -- behind, that sentence would be a lie.
  user_id uuid not null references auth.users(id) on delete cascade,

  consent_id uuid references public.self_check_consent(id) on delete set null,

  part text not null check (part in ('a', 'ab')),

  -- An ordered, fixed-length list, stored as one. Not eighteen columns
  -- (which would need migrating, and test.js is explicit that the
  -- instrument never changes) and not jsonb (whose keys drift). The order
  -- is the only thing that makes an answer mean anything: answer 7 is
  -- meaningless without knowing it is question 7.
  answers smallint[] not null,

  lang text not null check (lang in ('en', 'ms')),

  -- ==========================================================
  -- POSTGRES ARRAYS ARE 1-INDEXED. test.js IS 0-INDEXED.
  --
  -- The bands below are answers[1..18]; the same table in test.js is
  -- PART_A[0..5] and PART_B[0..11]. That off-by-one is precisely the
  -- error class test.js warns about at the head of the file: wrong, and
  -- invisible when it is wrong, because every value still looks like a
  -- plausible score.
  --
  -- `band` is the index of the first answer that counts — the leftmost
  -- shaded box on that row of the printed form — and it is NOT the same
  -- for every question:
  --
  --   Q1-Q3   shade from "Sometimes" (2)      answers[1..3]  >= 2
  --   Q4-Q6   shade from "Often"     (3)      answers[4..6]  >= 3
  --   Part B varies row by row                answers[7..18] below
  --
  -- Verified against a hand-computed vector before this shipped. If you
  -- touch it, check it against page 2 of adhd-questionnaire-ASRS111.pdf
  -- again rather than against memory.
  -- ==========================================================
  score_a smallint generated always as (
    (case when answers[1] >= 2 then 1 else 0 end) +
    (case when answers[2] >= 2 then 1 else 0 end) +
    (case when answers[3] >= 2 then 1 else 0 end) +
    (case when answers[4] >= 3 then 1 else 0 end) +
    (case when answers[5] >= 3 then 1 else 0 end) +
    (case when answers[6] >= 3 then 1 else 0 end)
  ) stored,

  -- A COUNT, not a score, and named that way on purpose. The printed form
  -- says outright that "no total score or diagnostic likelihood is
  -- utilized" for these twelve. Calling this column score_b is how
  -- somebody averages it in 2028 and publishes a number that means
  -- nothing.
  --
  -- NULL rather than 0 when Part B was not answered: unknown is not the
  -- same as none, and a 0 here would drag any average down.
  part_b_in_band smallint generated always as (
    case when part = 'ab' then
      (case when answers[7]  >= 3 then 1 else 0 end) +
      (case when answers[8]  >= 3 then 1 else 0 end) +
      (case when answers[9]  >= 2 then 1 else 0 end) +
      (case when answers[10] >= 3 then 1 else 0 end) +
      (case when answers[11] >= 3 then 1 else 0 end) +
      (case when answers[12] >= 2 then 1 else 0 end) +
      (case when answers[13] >= 3 then 1 else 0 end) +
      (case when answers[14] >= 3 then 1 else 0 end) +
      (case when answers[15] >= 3 then 1 else 0 end) +
      (case when answers[16] >= 2 then 1 else 0 end) +
      (case when answers[17] >= 3 then 1 else 0 end) +
      (case when answers[18] >= 2 then 1 else 0 end)
    else null end
  ) stored,

  created_at timestamptz not null default now(),

  constraint answers_length_matches_part
    check (array_length(answers, 1) = case when part = 'a' then 6 else 18 end),

  -- Every answer is an index into the five-point scale, and nothing else.
  constraint answers_in_scale
    check (answers <@ array[0,1,2,3,4]::smallint[])
);

comment on table public.self_check_submission is
  'One row per completed screener. A retake is a second row, deliberately — overwriting would erase the first answer set.';


create index if not exists self_check_submission_user_idx
  on public.self_check_submission (user_id, created_at desc);
create index if not exists self_check_profile_last_seen_idx
  on public.self_check_profile (last_seen_at);
create index if not exists self_check_consent_user_idx
  on public.self_check_consent (user_id);


-- ---------- who may read this ----------
-- The same shape as billing: a person reads their own rows and may never
-- write. Consent gets a read policy too (rather than the policy-less
-- treatment google_tokens has) because a right of access is one of the
-- things we promise them, and a future "your data" screen should be able
-- to show what they agreed to.
alter table public.self_check_profile    enable row level security;
alter table public.self_check_consent    enable row level security;
alter table public.self_check_submission enable row level security;

drop policy if exists "read own self-check profile" on public.self_check_profile;
create policy "read own self-check profile"
  on public.self_check_profile for select
  using (auth.uid() = user_id);

drop policy if exists "read own self-check consent" on public.self_check_consent;
create policy "read own self-check consent"
  on public.self_check_consent for select
  using (auth.uid() = user_id);

drop policy if exists "read own self-check submissions" on public.self_check_submission;
create policy "read own self-check submissions"
  on public.self_check_submission for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy anywhere, on purpose. /api/self-check
-- writes with the service key, which bypasses RLS; everyone else is
-- refused by default.


-- ---------- the write, in one transaction ----------
-- PostgREST gives no transaction across requests, so three separate calls
-- from the API could leave a consent row with no submission attached to
-- it, or a profile updated for a screener that never saved. One function,
-- one round trip, all or nothing.
create or replace function public.save_self_check(
  p_user    uuid,
  p_email   text,
  p_name    text,
  p_phone   text,
  p_age     smallint,
  p_gender  text,
  p_part    text,
  p_answers smallint[],
  p_lang    text,
  p_version text,
  p_terms   boolean,
  p_health  boolean,
  p_contact boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consent uuid;
  v_sub     uuid;
begin
  -- The last line of defence. The browser checks these and so does the
  -- API; this is the one that cannot be skipped by anybody hand-rolling a
  -- request, which is the only reason to repeat it a third time.
  if not (p_terms and p_health) then
    raise exception 'consent required';
  end if;
  if p_age < 18 then
    raise exception 'under 18';
  end if;

  insert into self_check_consent (user_id, version, lang, terms, health, contact)
  values (p_user, p_version, p_lang, p_terms, p_health, p_contact)
  returning id into v_consent;

  insert into self_check_profile as p
    (user_id, full_name, email, phone, age, gender, contact_opt_in, last_seen_at, updated_at)
  values
    (p_user, p_name, p_email, p_phone, p_age, p_gender, p_contact, now(), now())
  on conflict (user_id) do update set
    full_name      = excluded.full_name,
    email          = excluded.email,
    phone          = excluded.phone,
    age            = excluded.age,
    gender         = excluded.gender,
    contact_opt_in = excluded.contact_opt_in,
    last_seen_at   = now(),
    updated_at     = now();

  insert into self_check_submission (user_id, consent_id, part, answers, lang)
  values (p_user, v_consent, p_part, p_answers, p_lang)
  returning id into v_sub;

  return v_sub;
end;
$$;

-- ============================================================
-- LOAD-BEARING. Do not delete this because it looks like tidying.
--
-- A security-definer function is published by PostgREST at
--   /rest/v1/rpc/save_self_check
-- to anyone holding the publishable key — and that key is in config.js,
-- which means it is in every browser that has ever opened this site.
-- Without this revoke, a stranger can write rows as any user id they care
-- to type, including one that is not theirs.
--
-- It is silent when it works and silent when the signature does not
-- match, so if you edit the argument list above you must edit it here too
-- and then re-check from a browser console that a bare POST is refused.
-- ============================================================
revoke execute on function public.save_self_check(
  uuid, text, text, text, smallint, text, text, smallint[], text, text,
  boolean, boolean, boolean
) from anon, authenticated, public;


-- ---------- retention: 24 months, enforced ----------
-- A promise in a privacy notice that nothing carries out is not a
-- retention policy. This runs inside the database: no key to leak, no
-- HTTP endpoint whose only job is deleting rows, and it lives in the same
-- file as the tables it protects so the two cannot drift apart.
create or replace function public.purge_self_check()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  gone integer;
begin
  -- Twenty-four months from LAST ACTIVITY, and last_seen_at is bumped
  -- only by a completed submission. If merely opening /self-check reset
  -- the clock, retention would be unbounded for anyone who visits — which
  -- is the failure mode that makes a stated period meaningless.
  --
  -- This deletes the screener record, not the account. auth.users, the
  -- tasks and any Google link live on their own terms and nobody is
  -- signed out by it.
  delete from self_check_submission s
   using self_check_profile p
   where s.user_id = p.user_id
     and p.last_seen_at < now() - interval '24 months';

  delete from self_check_profile
   where last_seen_at < now() - interval '24 months';
  get diagnostics gone = row_count;

  -- A submission whose profile is already gone.
  delete from self_check_submission s
   where not exists (
     select 1 from self_check_profile p where p.user_id = s.user_id
   );

  -- A consent old enough that there is no longer any data left for it to
  -- justify holding.
  delete from self_check_consent
   where given_at < now() - interval '24 months';

  return gone;
end;
$$;

comment on function public.purge_self_check is
  'Deletes self-check records 24 months after last activity. Scheduled nightly by pg_cron.';

revoke execute on function public.purge_self_check() from anon, authenticated, public;

-- Scheduling is separate and guarded, so that a project without pg_cron
-- still gets the tables rather than a half-applied migration. If you see
-- the notice, enable the extension and run this block again.
do $$
begin
  perform cron.unschedule('self-check-purge');
exception when others then
  null;   -- no such job, or no pg_cron; either is fine here
end $$;

do $$
begin
  perform cron.schedule('self-check-purge', '17 3 * * *',
                        'select public.purge_self_check()');
  raise notice 'self-check: retention scheduled nightly at 03:17.';
exception when others then
  raise notice 'self-check: pg_cron not available — RETENTION IS NOT RUNNING. Enable it under Database -> Extensions and re-run this block, or the 24-month promise in the privacy notice is not being kept.';
end $$;


-- ---------- purpose (3), made real ----------
-- "Aggregate anonymised statistics" is what we tell people the research
-- purpose is. The HAVING is what makes that a property of the query
-- rather than an intention: a cell of one is not a statistic, it is a
-- person.
create or replace view public.self_check_stats as
  select
    date_trunc('month', s.created_at)      as month,
    p.gender,
    width_bucket(p.age, 18, 78, 6)         as age_band,
    s.part,
    s.score_a,
    count(*)                               as n
  from public.self_check_submission s
  join public.self_check_profile p using (user_id)
  group by 1, 2, 3, 4, 5
  having count(*) >= 5;

comment on view public.self_check_stats is
  'Aggregate counts for the research purpose. Cells smaller than five are withheld.';

-- Not for the browser. The operator reads this with the service key; the
-- publishable key must not be able to enumerate even aggregates, because
-- a small enough aggregate is an identity.
revoke all on public.self_check_stats from anon, authenticated;
