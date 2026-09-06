/**
 * POST /api/delete-account        ->   { ok: true }
 *
 * Ends an account and takes the cloud copy of the lists with it.
 *
 * Required by App Store Review Guideline 5.1.1(v): an app that lets people
 * make an account has to let them end it from inside the app. Offering an
 * email address is named in the guideline as not enough, and it was what
 * privacy.html offered until this file existed.
 *
 * What actually goes:
 *
 *   auth.users        the account itself, by the Auth Admin API
 *   tasks             ON DELETE CASCADE from tasks_user_id_fkey
 *   google_tokens     ON DELETE CASCADE from google_tokens_user_id_fkey
 *
 * The cascades are why this is one call rather than three, and they are a
 * fact about the database rather than about this file — if either
 * constraint is ever rebuilt without CASCADE, deleting the user starts
 * failing on a foreign key and this stops working loudly, which is the
 * right way round.
 *
 * What stays: the lists in the browser's own storage, on each device. That
 * is the same promise sign-out already makes — the account was only ever
 * the place the devices met — and privacy.html has always described it
 * that way. Nothing here touches localStorage; the page does that, or
 * doesn't, on its own.
 *
 * `feedback` is not touched. It carries an ip_hash and no user_id, so
 * there is nothing in it that belongs to an account.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { configured, userFromRequest, db, authAdmin } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  if (!configured()) {
    console.error('[delete-account] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    return res.status(503).json({ error: 'not configured' });
  }

  /* The only thing standing between a stranger and somebody's account.
     The token is checked by Supabase, not here, and a request without a
     good one never reaches the delete below. */
  const userId = await userFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'sign in first' });

  /* Hand Google back its token before dropping ours.
     Best effort, and deliberately not fatal: a refresh token we can no
     longer read is a token we cannot revoke either, and refusing to
     delete the account over it would leave the user holding the one
     thing they asked to be rid of. Google expires an orphaned token on
     its own eventually; this simply does not wait for that. */
  try {
    const rows = await db(
      `google_tokens?user_id=eq.${encodeURIComponent(userId)}&select=refresh_token`
    );
    const token = rows && rows[0] && rows[0].refresh_token;
    if (token) {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token }).toString(),
      });
    }
  } catch (err) {
    console.warn('[delete-account] could not revoke at Google:', err.message);
  }

  try {
    await authAdmin(`admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  } catch (err) {
    console.error('[delete-account]', err.message);
    return res.status(500).json({ error: 'could not delete the account' });
  }

  return res.status(200).json({ ok: true });
}
