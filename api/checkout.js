/**
 * POST /api/checkout   { plan: 'weekly' | 'annual' | 'lifetime' }
 *   ->  { url }        a Stripe Checkout page to send the browser to
 *
 * Starts a purchase. Nothing is charged here and no card touches this
 * app — Stripe hosts the form, we only say who is buying and what.
 *
 * The plan arrives as a NAME, not a price id. That is deliberate: a price
 * id in the request body is a price id the client can change, and the
 * client is a browser belonging to the person paying. The mapping from
 * name to price lives in _stripe.js and reads from env, so the worst a
 * tampered request can do is name a plan that does not exist.
 *
 * Requires STRIPE_SECRET_KEY, the three STRIPE_PRICE_* vars, SUPABASE_URL
 * and SUPABASE_SERVICE_ROLE_KEY. Without them the route answers 503 and
 * names what is missing in the log rather than half-working.
 */

import { configured as stripeConfigured, planConfigured, PLANS, stripe } from './_stripe.js';
import { configured as sbConfigured, userFromRequest, db } from './_supabase.js';

/** Where Stripe sends the browser back. Same origin as the request. */
function origin(req) {
  const envUrl = process.env.PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'myadhd.my';
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!stripeConfigured() || !sbConfigured()) {
    console.error('[checkout] missing STRIPE_SECRET_KEY or Supabase env');
    return res.status(503).json({ error: 'not configured' });
  }

  /* Who is buying. A purchase has to attach to an account or there is
     nothing to grant the entitlement to afterwards — the webhook needs a
     user id, and the only trustworthy source of one is the token. */
  const userId = await userFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'sign in first' });

  const plan = String((req.body && req.body.plan) || '').toLowerCase();
  if (!PLANS[plan]) return res.status(400).json({ error: 'unknown plan' });
  if (!planConfigured(plan)) {
    console.error(`[checkout] plan "${plan}" has no price id in env`);
    return res.status(503).json({ error: 'plan not configured' });
  }

  const spec = PLANS[plan];
  const base = origin(req);

  try {
    /* Reuse the Stripe customer if this account already has one. Letting
       Checkout make a fresh one each time gives a person several customer
       records, which splits their history and breaks the billing portal —
       it can only ever open one of them. */
    let customerId = null;
    let email = null;
    try {
      const rows = await db(`billing?user_id=eq.${userId}&select=stripe_customer_id`);
      if (Array.isArray(rows) && rows[0] && rows[0].stripe_customer_id) {
        customerId = rows[0].stripe_customer_id;
      }
    } catch (e) {
      /* Not fatal. Worst case Stripe makes a customer and the webhook
         records it; the purchase must not fail over a cache read. */
      console.error('[checkout] billing lookup failed:', e.message);
    }

    const body = {
      mode: spec.mode,
      line_items: [{ price: spec.price(), quantity: 1 }],
      success_url: `${base}/billing?ok=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/billing?cancelled=1`,
      /* Stamped on the session AND on the object the webhook will see, so
         whichever event arrives first can identify the account without a
         lookup. */
      client_reference_id: userId,
      metadata: { user_id: userId, plan },
      allow_promotion_codes: true,
    };

    if (customerId) body.customer = customerId;
    else body.customer_creation = spec.mode === 'payment' ? 'always' : undefined;

    if (spec.mode === 'subscription') {
      body.subscription_data = { metadata: { user_id: userId, plan } };
      /* The trial. Only the weekly plan has one, and `trial_period_days`
         is what makes Stripe collect the card now and charge in three
         days — the alternative, a free trial with no card, means chasing
         a payment method later and is a different product. */
      if (spec.trialDays > 0) body.subscription_data.trial_period_days = spec.trialDays;
    } else {
      /* One-time. The metadata has to be repeated onto the payment intent
         because a `payment` session does not create a subscription for it
         to hang off. */
      body.payment_intent_data = { metadata: { user_id: userId, plan } };
    }

    const session = await stripe('checkout/sessions', body);
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[checkout] stripe error:', e.message);
    return res.status(502).json({ error: 'could not start checkout' });
  }
}
