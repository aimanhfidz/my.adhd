/**
 * POST /api/gcal-calendar   { calendarId }   ->   { calendarId }
 *
 * Settles, once and for the whole account, which Google calendar is "the"
 * my.adhd calendar.
 *
 * Why this exists: the column was already here and already read back by
 * /api/gcal-token, and nothing ever wrote it. So every device fell through
 * to gcal.js's fallback — list the calendars, look for one called my.adhd,
 * make one if there isn't — and that fallback is a check-then-act race.
 * Two devices linked close together both looked, both saw nothing, and
 * both created one. The result is two identical calendars in somebody's
 * sidebar with half their tasks in each.
 *
 * The fix is that the claim is conditional. The update only applies while
 * the column is still null, and the answer is whatever the row says
 * afterwards — which is the first writer's id, not necessarily the
 * caller's. A device that loses the race is told so and adopts the winner
 * instead of keeping the calendar it just made.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { configured, userFromRequest, db } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  if (!configured()) {
    console.error('[gcal-calendar] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    return res.status(503).json({ error: 'not configured' });
  }

  const userId = await userFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'sign in first' });

  const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const claimed = String(parsed.calendarId || '').trim();

  /* A Google calendar id is an address-shaped string. The only check worth
     making is that this is not obviously junk; anything stricter would
     break the day Google changes the shape. An empty body is allowed and
     means "just tell me what it is", which is how a device asks before it
     makes anything. */
  if (claimed && (claimed.length > 320 || /[\s<>]/.test(claimed))) {
    return res.status(400).json({ error: 'that is not a calendar id' });
  }

  const where = `user_id=eq.${encodeURIComponent(userId)}`;

  try {
    if (claimed) {
      /* The conditional half. `calendar_id=is.null` is what makes this a
         claim rather than an overwrite: a second device arriving later
         changes nothing and reads back the first one's answer. */
      await db(`google_tokens?${where}&calendar_id=is.null`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: { calendar_id: claimed },
      });
    }

    const rows = await db(`google_tokens?${where}&select=calendar_id&limit=1`);
    const row = rows && rows[0];

    /* No row at all means this account never linked Google. Not an error —
       the caller simply has nothing to adopt and will make its own. */
    return res.status(200).json({ calendarId: (row && row.calendar_id) || null });
  } catch (err) {
    console.error('[gcal-calendar]', err.message);
    return res.status(500).json({ error: 'could not settle the calendar' });
  }
}
