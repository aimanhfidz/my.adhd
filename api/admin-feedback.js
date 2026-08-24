/**
 * GET /api/admin-feedback   ->   { notes: [...] }
 *
 * Reads the feedback table. The only route in this project that hands one
 * person another person's writing, so it is the only one that needs to
 * care who is asking.
 *
 * The gate is here and nowhere else. admin.html hides itself from anyone
 * who is not signed in, but that is courtesy, not security — a hidden
 * page is one devtools away from being a visible one. What actually
 * protects the notes is this file refusing to answer.
 *
 * Two things have to be true: a valid Supabase session, and an email on
 * the ADMIN_EMAILS list. Fails closed — an unset list locks everyone out,
 * including me, which is the right way round for a mistake to go.
 *
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS.
 */

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Comma-separated, case-insensitive, whitespace forgiven. */
function admins() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const allowed = admins();
  if (!URL_BASE || !SERVICE || !allowed.length) {
    console.error('[admin-feedback] missing SUPABASE_* or ADMIN_EMAILS');
    return res.status(503).json({ error: 'not configured' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'sign in first' });

  /* Ask Supabase who this token belongs to rather than verifying the JWT
     here. One extra hop, no signing keys in this file, and the party that
     issued the token is the one that decides whether it is still good. */
  let email = null;
  try {
    const who = await fetch(`${URL_BASE}/auth/v1/user`, {
      headers: { apikey: SERVICE, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) return res.status(401).json({ error: 'sign in first' });
    const user = await who.json();
    email = String(user.email || '').toLowerCase();
  } catch (_) {
    return res.status(401).json({ error: 'sign in first' });
  }

  if (!email || !allowed.includes(email)) {
    /* Deliberately says nothing about why, or who would be allowed. */
    return res.status(403).json({ error: 'not for you' });
  }

  try {
    const r = await fetch(
      `${URL_BASE}/rest/v1/feedback?select=id,created_at,body,day&order=created_at.desc&limit=500`,
      { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } }
    );
    if (!r.ok) throw new Error(`supabase ${r.status}`);
    const notes = await r.json();

    /* ip_hash is never selected above and never leaves the database. It
       exists to count one note per person per day and nothing else;
       shipping it to a browser would turn a rate-limit counter into a way
       of telling whether two notes came from the same person. */
    return res.status(200).json({ notes });
  } catch (err) {
    console.error('[admin-feedback]', err.message);
    return res.status(500).json({ error: 'could not read the notes' });
  }
}
