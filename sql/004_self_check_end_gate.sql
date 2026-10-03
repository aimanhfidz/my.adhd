-- ============================================================
-- my.adhd — the self-check asks for sign-in at the end
--
-- 2026-10-04. The screener used to ask for a Google sign-in before
-- question one. It now asks three things up front — age, gender, and
-- whether somebody has been diagnosed — keeps them in the browser with the
-- answers, and only asks for the sign-in once the questions are done, to
-- unlock the full report. Two things in the database follow from that:
--
--   1. diagnosis — a new fact on each submission. Per submission and not
--      on the profile, because it is a fact about a moment: somebody who
--      was "thinking about an assessment" last year may be "in treatment"
--      now, and the retake should say so without rewriting the first.
--
--   2. p_consent — a way to save a submission against a consent already
--      on file. Before this, somebody who had consented under the current
--      notice skipped the details form, so the page had nothing to send
--      and their result was never saved. Inserting a fresh consent row for
--      them instead would record an agreement they did not give that day;
--      a consent row is evidence, and evidence is not something to mint.
--      So the function takes the id of the row they did give, checks it is
--      theirs and current, and points the submission at it.
--
-- Run once, in the Supabase SQL editor, AFTER 002 and BEFORE deploying the
-- api/self-check.js that sends p_diagnosis. Until this has run, every save
-- from the new page fails — the reader still gets their report, and the
-- page tells them it could not be saved.
-- ============================================================


-- ---------- 1. the new fact ----------
-- Nullable: every row before today has none, and "prefer not to say" is
-- sent as null rather than stored as a fifth value. A null here means
-- "not given", whichever way it came to be not given.
alter table public.self_check_submission
  add column if not exists diagnosis text
  check (diagnosis in ('never', 'considering', 'diagnosed', 'treatment'));

comment on column public.self_check_submission.diagnosis is
  'What the person said about diagnosis when they took it. Health data, like the answers.';


-- ---------- 2. the save, again ----------
-- Dropped and recreated rather than replaced: adding arguments to a
-- function in Postgres makes a second function beside the first, and the
-- old 13-argument one would stay published at /rest/v1/rpc/save_self_check
-- with its own grants. One function, one signature.
drop function if exists public.save_self_check(
  uuid, text, text, text, smallint, text, text, smallint[], text, text,
  boolean, boolean, boolean
);

create or replace function public.save_self_check(
  p_user      uuid,
  p_email     text,
  p_name      text,
  p_phone     text,
  p_age       smallint,
  p_gender    text,
  p_part      text,
  p_answers   smallint[],
  p_lang      text,
  p_version   text,
  p_terms     boolean,
  p_health    boolean,
  p_contact   boolean,
  p_diagnosis text default null,
  p_consent   uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consent uuid;
  v_contact boolean := p_contact;
  v_sub     uuid;
begin
  if p_age < 18 then
    raise exception 'under 18';
  end if;

  if p_consent is not null then
    -- A consent already on file. It has to be this person's, under the
    -- notice the page is showing now, with both mandatory boxes ticked —
    -- the API checks the same three things, and this is the copy that
    -- cannot be skipped by a hand-written request. The contact preference
    -- comes from the row, not from the request: it is part of what they
    -- agreed to, and it is not the request's to change.
    select id, contact into v_consent, v_contact
      from self_check_consent
     where id = p_consent
       and user_id = p_user
       and version = p_version
       and terms and health;
    if v_consent is null then
      raise exception 'consent required';
    end if;
  else
    -- The last line of defence. The browser checks these and so does the
    -- API; this is the one that cannot be skipped by anybody hand-rolling
    -- a request, which is the only reason to repeat it a third time.
    if not (p_terms and p_health) then
      raise exception 'consent required';
    end if;

    insert into self_check_consent (user_id, version, lang, terms, health, contact)
    values (p_user, p_version, p_lang, p_terms, p_health, p_contact)
    returning id into v_consent;
  end if;

  insert into self_check_profile as p
    (user_id, full_name, email, phone, age, gender, contact_opt_in, last_seen_at, updated_at)
  values
    (p_user, p_name, p_email, p_phone, p_age, p_gender, v_contact, now(), now())
  on conflict (user_id) do update set
    full_name      = excluded.full_name,
    email          = excluded.email,
    phone          = excluded.phone,
    age            = excluded.age,
    gender         = excluded.gender,
    contact_opt_in = excluded.contact_opt_in,
    last_seen_at   = now(),
    updated_at     = now();

  insert into self_check_submission (user_id, consent_id, part, answers, lang, diagnosis)
  values (p_user, v_consent, p_part, p_answers, p_lang, p_diagnosis)
  returning id into v_sub;

  return v_sub;
end;
$$;

-- ============================================================
-- LOAD-BEARING, exactly as in 002, and for the same reason: a
-- security-definer function is published by PostgREST to anyone holding
-- the publishable key, which is in config.js and so in every browser.
-- Without this revoke a stranger can write rows as any user id.
--
-- The signature below must match the one above argument for argument. A
-- revoke against a signature that does not exist is an error here, which
-- is the good outcome; the bad one is editing the function and not this.
-- After running, check from a browser console on myadhd.my that
--   fetch(MYADHD_SUPABASE_URL + '/rest/v1/rpc/save_self_check', {method:'POST', ...})
-- with only the publishable key is refused.
-- ============================================================
revoke execute on function public.save_self_check(
  uuid, text, text, text, smallint, text, text, smallint[], text, text,
  boolean, boolean, boolean, text, uuid
) from anon, authenticated, public;
