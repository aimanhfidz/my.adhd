/**
 * Shared bits for the routes that talk to Stripe.
 *
 * No SDK. `_supabase.js` next door reaches Supabase with plain fetch and
 * this file does the same to Stripe, for the same reasons: the repo has
 * one dependency and adding a second to send three kinds of POST is a
 * poor trade, and a hand-rolled call is a call you can read. Stripe's API
 * is form-encoded and versioned by header; none of that needs a library.
 *
 * The secret key lives in Vercel's env and is only ever touched here.
 * Nothing in this file may be imported by anything that ships to a
 * browser.
 */

import crypto from 'node:crypto';

const SECRET = process.env.STRIPE_SECRET_KEY || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/* Pinned. An account's default API version can be changed from the
   dashboard by somebody who has no idea this code exists, and Stripe's
   breaking changes arrive that way. Bump it deliberately or not at all. */
const API_VERSION = '2024-06-20';

/**
 * The three things being sold, and the only place their shape is decided.
 *
 * The price IDs are env vars rather than literals because they differ
 * between test mode and live mode, and shipping a test price to
 * production is the classic way to discover that at the worst moment.
 *
 * `mode` is Stripe's, and it is the whole difference between the plans:
 * `subscription` bills again, `payment` does not. Lifetime is a one-time
 * charge, so it is a payment — not a subscription with a very long
 * interval, which is what it looks like from the outside and would leave
 * a renewal to go wrong in a year's time.
 */
export const PLANS = {
  weekly: {
    price: () => process.env.STRIPE_PRICE_WEEKLY || '',
    mode: 'subscription',
    trialDays: 3,
    label: 'Weekly',
  },
  annual: {
    price: () => process.env.STRIPE_PRICE_ANNUAL || '',
    mode: 'subscription',
    trialDays: 0,
    label: 'Annual',
  },
  lifetime: {
    price: () => process.env.STRIPE_PRICE_LIFETIME || '',
    mode: 'payment',
    trialDays: 0,
    label: 'Lifetime',
  },
};

export function configured() {
  return !!SECRET;
}

export function planConfigured(name) {
  const p = PLANS[name];
  return !!p && !!p.price();
}

/**
 * Form-encode a nested object the way Stripe wants it.
 *
 *   { line_items: [{ price: 'x', quantity: 1 }] }
 *     -> line_items[0][price]=x&line_items[0][quantity]=1
 *
 * Written out rather than reached for from a package because it is
 * fifteen lines and the failure mode of getting it wrong is loud.
 */
function encode(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') encode(item, `${key}[${i}]`, out);
        else out.push(`${key}[${i}]=${encodeURIComponent(item)}`);
      });
    } else if (typeof v === 'object') {
      encode(v, key, out);
    } else {
      out.push(`${key}=${encodeURIComponent(v)}`);
    }
  }
  return out;
}

/** A call to Stripe as the account. Throws with the status attached. */
export async function stripe(path, body, opts = {}) {
  const headers = {
    Authorization: `Bearer ${SECRET}`,
    'Stripe-Version': API_VERSION,
  };
  /* An idempotency key so a retried POST — a flaky network, a user
     double-clicking, Vercel replaying a request — cannot create a second
     subscription. Stripe keys these for 24 hours. */
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  let payload;
  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = encode(body).join('&');
  }

  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    body: payload,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (json && json.error && json.error.message) || `stripe ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.stripeCode = json && json.error && json.error.code;
    throw err;
  }
  return json;
}

/**
 * The raw request body, unparsed.
 *
 * Signature verification is over the exact bytes Stripe sent. Anything
 * that parses the JSON and re-serialises it — which is what a framework's
 * default body parser does — changes whitespace and key order and the
 * signature stops matching, for a request that was perfectly genuine.
 * Every route that verifies a webhook must therefore also turn the body
 * parser off; see the `config` export in stripe-webhook.js.
 */
export async function rawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

/**
 * Is this webhook actually from Stripe?
 *
 * Without this the endpoint is an unauthenticated POST that grants
 * subscriptions to anyone who can spell the JSON. It is the single most
 * important function in the billing code.
 *
 * Stripe signs `${timestamp}.${body}` with the endpoint secret. The
 * timestamp is checked too: a valid signature replayed a month later is
 * still a valid signature, and the tolerance is what stops that.
 */
export function verifyWebhook(rawBuf, signatureHeader, toleranceSeconds = 300) {
  if (!WEBHOOK_SECRET) return { ok: false, reason: 'no STRIPE_WEBHOOK_SECRET' };
  if (!signatureHeader) return { ok: false, reason: 'no signature header' };

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(',')
      .map((p) => p.split('='))
      .filter((p) => p.length === 2)
  );
  const t = parts.t;
  const given = parts.v1;
  if (!t || !given) return { ok: false, reason: 'malformed signature header' };

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(t));
  if (!Number.isFinite(age) || age > toleranceSeconds) {
    return { ok: false, reason: 'timestamp outside tolerance' };
  }

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${t}.${rawBuf.toString('utf8')}`, 'utf8')
    .digest('hex');

  /* Constant time. A plain === leaks how much of the digest matched, one
     byte at a time, to anyone willing to send enough requests. */
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(given, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'signature mismatch' };
  }

  try {
    return { ok: true, event: JSON.parse(rawBuf.toString('utf8')) };
  } catch (_) {
    return { ok: false, reason: 'body is not json' };
  }
}
