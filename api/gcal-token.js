/**
 * POST /api/gcal-token   ->   { accessToken, expiresIn, calendarId }
 *
 * Mints a fresh Google access token for the signed-in user, by spending
 * the refresh token this server holds on their behalf.
 *
 * This is what replaced the reconnect prompt. The browser used to ask
 * Google for a new token silently, which requires Google's iframe to read
 * its own session cookie — something iOS refuses, and a home-screen
 * install cannot do at all, so on a phone it always failed. Here the
 * exchange happens server to server, where none of that applies.
 *
 * What goes back to the browser is an access token that dies in an hour
 * and can only touch the app's own calendar. The refresh token itself
 * never leaves this side.
 *
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET.
 */

import { configured, userFromRequest, db } from './_supabase.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  /* Name what is missing rather than saying "not configured" and leaving
     someone to guess across four variables. Only ever booleans — whether a
     name is set, never any part of a value. A config error you cannot
     diagnose from the outside costs more than this tells an attacker,
     which is nothing they could not learn by trying. */
  const missing = [
    !configured() && 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    !clientId && 'GOOGLE_CLIENT_ID',
    !clientSecret && 'GOOGLE_CLIENT_SECRET',
  ].filter(Boolean);

  if (missing.length) {
    console.error('[gcal-token] missing:', missing.join(', '));
    return res.status(503).json({ error: 'not configured', missing });
  }

  const userId = await userFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'sign in first' });

  let row;
  try {
    const rows = await db(
      `google_tokens?user_id=eq.${encodeURIComponent(userId)}&select=refresh_token,calendar_id&limit=1`
    );
    row = rows && rows[0];
  } catch (err) {
    console.error('[gcal-token] lookup:', err.message);
    return res.status(500).json({ error: 'could not read the link' });
  }

  /* No row means signed in but never linked the calendar — a normal
     state, not an error, and the app shows the link button for it. */
  if (!row) return res.status(404).json({ error: 'calendar not linked' });

  let google;
  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refresh_token,
      grant_type: 'refresh_token',
    });
    const r = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    google = await r.json();

    if (!r.ok) {
      /* invalid_grant is the one that means something specific: the user
         revoked access, or changed their password, or the token was never
         valid. It will never start working again, so the dead row goes
         rather than being retried on every sync for ever. */
      if (google.error === 'invalid_grant') {
        try {
          await db(`google_tokens?user_id=eq.${encodeURIComponent(userId)}`, {
            method: 'DELETE',
            headers: { Prefer: 'return=minimal' },
          });
        } catch (_) {}
        return res.status(409).json({ error: 'link revoked, sign in again' });
      }
      console.error('[gcal-token] google said:', google.error);
      return res.status(502).json({ error: 'google refused' });
    }
  } catch (err) {
    console.error('[gcal-token] exchange:', err.message);
    return res.status(502).json({ error: 'could not reach google' });
  }

  return res.status(200).json({
    accessToken: google.access_token,
    expiresIn: Number(google.expires_in) || 3600,
    calendarId: row.calendar_id || null,
  });
}
