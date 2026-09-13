/**
 * GET  /api/self-check   ->  { profile, consent, needsConsent }
 * POST /api/self-check   { name, phone, age, gender, part, answers, lang,
 *                          consent: { terms, health, contact, version } }
 *                        ->  { ok: true, id }
 *
 * The screener's record. Two methods in one file, which is a departure
 * from every other route here — they are all a single POST with a 405 at
 * the top — and the reason is CONSENT_VERSION below. The GET's only job
 * is answering "must I ask this person to consent again", and only the
 * code that writes consent can answer that correctly. Split across two
 * files, the constant is declared twice, and a CONSENT_VERSION that can
 * disagree with itself is not a versioning scheme, it is a consent bug
 * waiting for a deploy.
 *
 * WHAT THIS HANDLES. Somebody's name, phone, age, gender and their answers
 * to eighteen questions about their own attention. Those answers are
 * health data — sensitive personal data under Malaysia's PDPA — so every
 * check the browser makes is made again here. The browser's copies exist
 * so a person gets a civil error message; these are the ones that count,
 * because the browser is not where the rules live.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. No new env vars.
 */

import { configured, userWithEmail, db } from './_supabase.js';

/* Which version of the notice a consent was given against.
 *
 * Bump this when the s.7 notice on /self-check changes in a way that
 * changes what somebody is agreeing to, and everyone is asked again the
 * next time they use the screener. terms.html promises exactly that —
 * "if the notice changes, you are asked again, and the old tick is not
 * carried over" — and this line is the whole of that promise. The two may
 * not move independently. */
const CONSENT_VERSION = 'pdpa-2026-09';

const GENDERS = ['male', 'female', 'undisclosed'];
const LANGS = ['en', 'ms'];

/* The bands are not here on purpose. score_a is a generated column in
   sql/002_self_check.sql, computed from the answers by the database.
   test.js warns that the per-question bands are easy to get wrong and
   invisible when you do; a third transcription of that table, in this
   file, would be a third chance to get it wrong. */

/**
 * A phone number, or null, or the string 'bad'.
 *
 * Deliberately lenient. A strict Malaysian pattern rejects a Malaysian
 * living in Singapore, and the field is optional anyway — refusing a
 * number we were offered buys nothing and loses a contact. Local forms
 * are normalised to E.164 so the column holds one shape; anything else
 * that looks like an international number is kept as given.
 */
function cleanPhone(raw) {
  const s = String(raw == null ? '' : raw).replace(/[\s()\-.]/g, '');
  if (!s) return null;

  const my = s.match(/^(?:\+?60|0)(\d{9,10})$/);
  if (my) return '+60' + my[1];

  if (/^\+\d{8,15}$/.test(s)) return s;

  return 'bad';
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' });
  }

  if (!configured()) {
    console.error('[self-check] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    return res.status(503).json({ error: 'not configured' });
  }

  const user = await userWithEmail(req);
  if (!user) return res.status(401).json({ error: 'sign in first' });

  return req.method === 'GET' ? read(user, res) : write(user, req, res);
}

/* ---------- GET: what do we already have, and do we need to ask again ---------- */
async function read(user, res) {
  try {
    const profiles = await db(
      'self_check_profile' +
        `?user_id=eq.${user.id}` +
        '&select=full_name,phone,age,gender,contact_opt_in'
    );
    const consents = await db(
      'self_check_consent' +
        `?user_id=eq.${user.id}` +
        `&version=eq.${encodeURIComponent(CONSENT_VERSION)}` +
        '&terms=is.true&health=is.true' +
        '&select=version,given_at&order=given_at.desc&limit=1'
    );

    const p = profiles && profiles[0];
    const c = consents && consents[0];

    return res.status(200).json({
      profile: p
        ? {
            name: p.full_name,
            phone: p.phone || '',
            age: p.age,
            gender: p.gender,
            contactOptIn: !!p.contact_opt_in,
          }
        : null,
      consent: c ? { version: c.version, at: c.given_at } : null,

      /* Computed here, never sent by the client and never inferred from
         the presence of a profile. A stale or forged "I already agreed"
         from a browser is exactly the thing consent must not be. */
      needsConsent: !c,
    });
  } catch (err) {
    console.error('[self-check] read', err.message);
    return res.status(502).json({ error: 'could not read' });
  }
}

/* ---------- POST: save one completed screener ---------- */
async function write(user, req, res) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const consent = body.consent || {};

  /* Consent first, before anything else is even looked at. If this is
     wrong there is nothing to validate, because there is nothing we are
     allowed to keep. */
  if (consent.version !== CONSENT_VERSION) {
    return res.status(400).json({ error: 'the notice changed — reload the page' });
  }
  if (consent.terms !== true || consent.health !== true) {
    return res.status(400).json({ error: 'consent required' });
  }

  const name = String(body.name || '').trim().slice(0, 80);
  if (name.length < 2) {
    return res.status(400).json({ error: 'that name looks wrong' });
  }

  const age = Number(body.age);
  if (!Number.isInteger(age)) {
    return res.status(400).json({ error: 'age should be a number' });
  }

  /* The page will never send this, because it branches to its own screen
     long before here. It exists for the request that did not come from
     the page: without it, a hand-written POST walks a fifteen-year-old
     straight past the one door that is meant to be shut. */
  if (age < 18) {
    return res.status(400).json({ error: 'under 18' });
  }
  if (age > 100) {
    return res.status(400).json({ error: 'that age looks wrong' });
  }

  const gender = String(body.gender || '');
  if (!GENDERS.includes(gender)) {
    return res.status(400).json({ error: 'gender looks wrong' });
  }

  const part = String(body.part || '');
  if (part !== 'a' && part !== 'ab') {
    return res.status(400).json({ error: 'bad request' });
  }

  const answers = body.answers;
  const wanted = part === 'a' ? 6 : 18;
  if (
    !Array.isArray(answers) ||
    answers.length !== wanted ||
    !answers.every((n) => Number.isInteger(n) && n >= 0 && n <= 4)
  ) {
    return res.status(400).json({ error: 'bad answers' });
  }

  const lang = String(body.lang || '');
  if (!LANGS.includes(lang)) {
    return res.status(400).json({ error: 'bad request' });
  }

  const phone = cleanPhone(body.phone);
  if (phone === 'bad') {
    return res.status(400).json({ error: 'that phone number looks wrong' });
  }

  try {
    /* One call, one transaction. Consent, profile and answers land
       together or not at all — three separate PostgREST writes could
       leave a consent row with nothing attached to it, which would be a
       record that somebody agreed to something we then failed to keep.

       score_a and part_b_in_band are generated columns and must not
       appear here; PostgREST answers 400 if they do. */
    const id = await db('rpc/save_self_check', {
      method: 'POST',
      body: {
        p_user: user.id,
        p_email: user.email,
        p_name: name,
        p_phone: phone,
        p_age: age,
        p_gender: gender,
        p_part: part,
        p_answers: answers,
        p_lang: lang,
        p_version: CONSENT_VERSION,
        p_terms: true,
        p_health: true,
        p_contact: consent.contact === true,
      },
    });

    return res.status(200).json({ ok: true, id: id || null });
  } catch (err) {
    console.error('[self-check] write', err.message);
    return res.status(502).json({ error: 'could not save' });
  }
}
