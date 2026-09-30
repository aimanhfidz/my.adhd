/**
 * POST   /api/push  { sub, fires: [{ tag, at }] }  ->  { ok: true, n }
 * DELETE /api/push  { endpoint }                   ->  { ok: true }
 *
 * One device's reminder schedule, replaced whole on every call. push.js
 * sends it after every save and every open; /api/push-send reads it.
 *
 * No account. The subscription endpoint is the identity: it is a long
 * unguessable URL the browser minted for this site, and anyone holding it
 * could already push to the device directly, so it grants nothing that
 * knowing it did not. What is stored is the endpoint, its two keys, and a
 * list of times with opaque tags — never a task's words. See push.js.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The two tables have
 * RLS on with no policies, so only this side of the wire can touch them.
 */

import { configured, db } from './_supabase.js';
import { send } from './_push-send.js';

const MAX_FIRES = 60;
const HORIZON = 31 * 24 * 60 * 60 * 1000;

/* Only the browsers' own push services. The sender POSTs to whatever
   endpoint is stored, so an open list would make this a way to have our
   server call any URL on the internet every minute. */
const PUSH_HOSTS = [
  /(^|\.)push\.apple\.com$/,
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)notify\.windows\.com$/,
];

function validEndpoint(s) {
  try {
    const u = new URL(String(s || ''));
    return u.protocol === 'https:' && s.length <= 1000 && PUSH_HOSTS.some(re => re.test(u.hostname));
  } catch (_) { return false; }
}

const B64URL = /^[A-Za-z0-9_-]{16,200}$/;
const TAG = /^[A-Za-z0-9_.:-]{1,120}$/;

function body(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return req.body || {};
}

export default async function handler(req, res) {
  /* /api/push-send, by way of the rewrite in vercel.json. */
  if (req.query && req.query.op === 'send') return send(req, res);

  if (!configured()) return res.status(503).json({ error: 'not configured' });

  const b = body(req);

  if (req.method === 'DELETE') {
    if (!validEndpoint(b.endpoint)) return res.status(400).json({ error: 'bad endpoint' });
    try {
      /* push_fire goes with it — on delete cascade. */
      await db(`push_sub?endpoint=eq.${encodeURIComponent(b.endpoint)}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[push] delete', err.message);
      return res.status(500).json({ error: 'failed' });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST or DELETE' });

  const sub = b.sub || {};
  const keys = sub.keys || {};
  if (!validEndpoint(sub.endpoint) || !B64URL.test(keys.p256dh || '') || !B64URL.test(keys.auth || '')) {
    return res.status(400).json({ error: 'bad subscription' });
  }

  const now = Date.now();
  const fires = (Array.isArray(b.fires) ? b.fires : [])
    .filter(f => f && TAG.test(f.tag || '') && Number.isFinite(f.at) && f.at > now && f.at < now + HORIZON)
    .slice(0, MAX_FIRES);

  try {
    await db('push_sub?on_conflict=endpoint', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: {
        endpoint: sub.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updated_at: new Date(now).toISOString(),
      },
    });

    /* Replaced whole. A diff would save a few rows and cost a reconcile
       that could get out of step; this cannot. */
    await db(`push_fire?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' });

    if (fires.length) {
      await db('push_fire', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: fires.map(f => ({
          endpoint: sub.endpoint,
          tag: f.tag,
          fire_at: new Date(f.at).toISOString(),
        })),
      });
    }

    return res.status(200).json({ ok: true, n: fires.length });
  } catch (err) {
    console.error('[push] save', err.message);
    return res.status(500).json({ error: 'failed' });
  }
}
