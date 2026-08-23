/**
 * POST /api/feedback  { body }  ->  { ok: true }
 *
 * Anonymous product feedback, one per person per day.
 *
 * "Anonymous" is meant literally: no account, no name, no address stored.
 * The IP is salted and hashed here and only the hash is written, purely so
 * the daily limit has something to count against. It never goes back to an
 * address, and it is not returned to anyone.
 *
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and FEEDBACK_SALT in the
 * environment (Vercel project settings). The service key stays on this side
 * of the wire — the table has RLS on with no policies, so nothing else can
 * write to it even if the project URL is known.
 */

import { createHash } from 'node:crypto';

const MIN = 4;
const MAX = 2000;

/** The client's real address, as far as the edge will tell us. */
function clientIP(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/* Salted, so the stored hashes cannot be checked against a precomputed
   table of every IPv4 address — which is a small enough space to walk. */
function hashIP(ip, salt) {
  return createHash('sha256').update(salt + '|' + ip).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const salt = process.env.FEEDBACK_SALT;
  if (!url || !key || !salt) {
    console.error('[feedback] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / FEEDBACK_SALT');
    return res.status(503).json({ error: 'not configured' });
  }

  try {
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const body = String(parsed.body || '').trim().slice(0, MAX);

    if (body.length < MIN) {
      return res.status(400).json({ error: 'too short' });
    }

    const ip_hash = hashIP(clientIP(req), salt);

    const r = await fetch(`${url}/rest/v1/feedback`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ body, ip_hash }),
    });

    if (r.ok) return res.status(200).json({ ok: true });

    /* 23505 is a unique violation, which here can only be the one-per-day
       index. That is not an error the sender did anything wrong with, so it
       gets its own status and its own copy on the client. */
    const detail = await r.json().catch(() => ({}));
    if (r.status === 409 || detail.code === '23505') {
      return res.status(429).json({ error: 'already sent today' });
    }

    console.error('[feedback] supabase said', r.status, detail);
    return res.status(502).json({ error: 'could not save' });
  } catch (err) {
    console.error('[feedback]', err);
    return res.status(502).json({ error: 'could not save' });
  }
}
