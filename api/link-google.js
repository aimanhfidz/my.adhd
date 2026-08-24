/**
 * POST /api/link-google   { refreshToken }   ->   { ok: true }
 *
 * Takes custody of the Google refresh token the browser was handed once,
 * at sign-in, and puts it somewhere the browser can never read it again.
 *
 * This is the whole point of the accounts work. An access token lasts an
 * hour; only a refresh token outlives that, and a refresh token in
 * localStorage would be a permanent credential sitting on a phone. So it
 * lives in google_tokens, which has RLS on and deliberately no policies —
 * no anon or user JWT can read that table at all. Only this file and
 * /api/gcal-token, both holding the service key, ever touch it.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { configured, userFromRequest, db } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  if (!configured()) {
    console.error('[link-google] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    return res.status(503).json({ error: 'not configured' });
  }

  const userId = await userFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'sign in first' });

  const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const refreshToken = String(parsed.refreshToken || '').trim();

  /* Google's refresh tokens are long and opaque. The only cheap check
     worth making is that this is not obviously junk — anything more
     specific would just break the day Google changes the format. */
  if (refreshToken.length < 20 || refreshToken.length > 2048) {
    return res.status(400).json({ error: 'that is not a refresh token' });
  }

  try {
    /* Upsert on the primary key: signing in again on a second device
       replaces the token rather than failing, which is what someone
       linking a laptop after a phone expects to happen. */
    await db('google_tokens?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: {
        user_id: userId,
        refresh_token: refreshToken,
        updated_at: new Date().toISOString(),
      },
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[link-google]', err.message);
    return res.status(500).json({ error: 'could not save the link' });
  }
}
