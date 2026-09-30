/**
 * POST /api/push-send   (Authorization: Bearer <PUSH_CRON_SECRET>)
 *
 * Sends every reminder that is due. Called once a minute by the pg_cron
 * job in sql/003_push.sql — not by a Vercel cron, because the Hobby plan
 * refuses to deploy a cron that runs more than once a day.
 *
 * A row is deleted once it has been sent, so a slow minute that overlaps
 * the next can at worst send one reminder twice, and `tag` on the
 * notification makes the second one replace the first on the screen.
 * Anything more than LATE overdue is dropped unsent: a reminder for 9:00
 * arriving at 11:00, after an outage, is noise.
 *
 * The payload is the tag and nothing else. The words are on the device —
 * see push.js.
 *
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUSH_CRON_SECRET,
 * VAPID_PRIVATE_KEY, and MYADHD_VAPID_PUBLIC_KEY in config.js to match it.
 */

import webpush from 'web-push';
import { configured, db } from './_supabase.js';

const LATE = 30 * 60 * 1000;
const BATCH = 500;

/* Public by design, and the same string config.js hands the browser. The
   two halves have to match or every push is refused as unauthorised. */
const VAPID_PUBLIC = 'BKFIeQ7iPHrY5ZuivUcIwKIAY0grSlnqHznje1mSHjN9LvCYg46q9pscQavApRj2XDhj49e6A0eOGquIUXj15Ws';

export default async function handler(req, res) {
  const secret = process.env.PUSH_CRON_SECRET || '';
  const priv = process.env.VAPID_PRIVATE_KEY || '';
  if (!configured() || !secret || !priv) {
    console.error('[push-send] missing PUSH_CRON_SECRET / VAPID_PRIVATE_KEY / Supabase env');
    return res.status(503).json({ error: 'not configured' });
  }
  if ((req.headers.authorization || '') !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'no' });
  }

  webpush.setVapidDetails('https://myadhd.my', VAPID_PUBLIC, priv);

  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  try {
    /* Too late to be worth saying: gone, unsent. */
    await db(`push_fire?fire_at=lt.${new Date(now - LATE).toISOString()}`, { method: 'DELETE' });

    const due = await db(
      `push_fire?fire_at=lte.${nowIso}&select=id,tag,endpoint,push_sub(p256dh,auth)`
      + `&order=fire_at.asc&limit=${BATCH}`
    ) || [];

    const sent = [];
    const gone = new Set();

    await Promise.all(due.map(async (row) => {
      const keys = row.push_sub;
      sent.push(row.id);
      if (!keys || gone.has(row.endpoint)) return;
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
          JSON.stringify({ tag: row.tag }),
          { TTL: 60 * 30, urgency: 'high' }
        );
      } catch (err) {
        /* 404 and 410 are the push service saying this subscription no
           longer exists — uninstalled, permission withdrawn, expired. */
        if (err.statusCode === 404 || err.statusCode === 410) gone.add(row.endpoint);
        else console.error('[push-send]', err.statusCode || '', (err.body || err.message || '').slice(0, 200));
      }
    }));

    if (sent.length) {
      await db(`push_fire?id=in.(${sent.join(',')})`, { method: 'DELETE' });
    }
    for (const endpoint of gone) {
      await db(`push_sub?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: 'DELETE' });
    }

    return res.status(200).json({ ok: true, sent: sent.length, gone: gone.size });
  } catch (err) {
    console.error('[push-send]', err.message);
    return res.status(500).json({ error: 'failed' });
  }
}
