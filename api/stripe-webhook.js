/**
 * POST /api/stripe-webhook   ->   { received: true }
 *
 * The only thing that ever grants or revokes access.
 *
 * Nothing in the browser decides entitlement, and neither does
 * /api/checkout — a Checkout session that was created is not a payment
 * that succeeded. Stripe tells us what actually happened here, and this
 * writes it to `billing`. That is why the signature check in _stripe.js
 * matters more than any other line in the billing code: without it this
 * is an open endpoint that hands out subscriptions to anyone who can
 * spell the JSON.
 *
 * Set it up with:
 *   stripe listen --forward-to localhost:3000/api/stripe-webhook   (dev)
 *   Dashboard -> Developers -> Webhooks                            (live)
 *
 * and subscribe to exactly these events:
 *   checkout.session.completed
 *   customer.subscription.created
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *
 * Requires STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY.
 */

import { verifyWebhook, rawBody, stripe, configured as stripeConfigured } from './_stripe.js';
import { configured as sbConfigured, db } from './_supabase.js';

/* Vercel parses JSON bodies by default and that breaks the signature —
   see rawBody() in _stripe.js for why. This turns it off for this route
   only. */
export const config = { api: { bodyParser: false } };

const iso = (unixSeconds) =>
  unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;

/** Upsert the account's billing row. The webhook is the only writer. */
async function write(userId, patch) {
  const row = Object.assign({ user_id: userId, updated_at: new Date().toISOString() }, patch);
  await db('billing?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: [row],
  });
}

/**
 * Which account is this event about?
 *
 * The metadata stamped in /api/checkout is the fast path and covers
 * everything bought through this app. The customer lookup is the fallback
 * for anything created elsewhere — a subscription started from the Stripe
 * dashboard by hand, say — which would otherwise silently do nothing.
 */
async function resolveUser(object) {
  const meta = object.metadata || {};
  if (meta.user_id) return meta.user_id;
  if (object.client_reference_id) return object.client_reference_id;

  const customer = typeof object.customer === 'string' ? object.customer : null;
  if (!customer) return null;
  try {
    const rows = await db(`billing?stripe_customer_id=eq.${customer}&select=user_id`);
    if (Array.isArray(rows) && rows[0]) return rows[0].user_id;
  } catch (e) {
    console.error('[webhook] customer lookup failed:', e.message);
  }
  return null;
}

/** Which of our three a Stripe subscription is, by price id. */
function planFromSubscription(sub) {
  const price = sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].price;
  const id = price && price.id;
  if (!id) return null;
  if (id === process.env.STRIPE_PRICE_WEEKLY) return 'weekly';
  if (id === process.env.STRIPE_PRICE_ANNUAL) return 'annual';
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!stripeConfigured() || !sbConfigured()) {
    console.error('[webhook] missing Stripe or Supabase env');
    return res.status(503).json({ error: 'not configured' });
  }

  const buf = await rawBody(req);
  const check = verifyWebhook(buf, req.headers['stripe-signature']);
  if (!check.ok) {
    /* 400, not 401: Stripe reads any non-2xx as "retry later", and a
       request that failed verification is one we never want replayed. */
    console.error('[webhook] rejected:', check.reason);
    return res.status(400).json({ error: 'bad signature' });
  }

  const event = check.event;
  const object = event.data && event.data.object;

  try {
    switch (event.type) {
      /* ---------- the one-time purchase ----------
         A subscription checkout also fires this, but the subscription
         events below carry the period and the status, so for those this
         only records the customer id. Lifetime has no subscription and
         is granted right here. */
      case 'checkout.session.completed': {
        const userId = await resolveUser(object);
        if (!userId) { console.error('[webhook] session with no user'); break; }

        const customerId = typeof object.customer === 'string' ? object.customer : null;

        if (object.mode === 'payment') {
          /* Only on a paid session. `payment_status` is the field that
             says money moved; `status: complete` alone does not. */
          if (object.payment_status !== 'paid') break;
          await write(userId, {
            stripe_customer_id: customerId,
            plan: 'lifetime',
            status: 'active',
            current_period_end: null,   // the point of lifetime
            cancel_at_period_end: false,
            source: 'stripe',
            stripe_subscription_id: null,
          });
        } else if (customerId) {
          await write(userId, { stripe_customer_id: customerId });
        }
        break;
      }

      /* ---------- the subscriptions ----------
         created, updated and deleted all land here because the shape of
         the answer is identical: whatever Stripe now says the status and
         the period end are, that is what the row says. Trial starting,
         trial converting, card failing, customer cancelling, us changing
         the price — all of it is one write. */
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const userId = await resolveUser(object);
        if (!userId) { console.error('[webhook] subscription with no user'); break; }

        const deleted = event.type === 'customer.subscription.deleted';
        const plan = planFromSubscription(object);

        await write(userId, {
          stripe_customer_id: typeof object.customer === 'string' ? object.customer : null,
          plan: deleted ? plan : plan,
          status: deleted ? 'canceled' : object.status,
          current_period_end: iso(object.current_period_end),
          cancel_at_period_end: !!object.cancel_at_period_end,
          source: 'stripe',
          stripe_subscription_id: object.id,
        });
        break;
      }

      default:
        /* Everything else is subscribed to by accident. Say so once and
           move on — answering 2xx stops Stripe retrying it forever. */
        console.log('[webhook] ignoring', event.type);
    }
  } catch (e) {
    /* A 500 makes Stripe retry with backoff, which is what we want when
       the write failed: the event is not lost, it arrives again. */
    console.error('[webhook] handler failed:', event.type, e.message);
    return res.status(500).json({ error: 'handler failed' });
  }

  return res.status(200).json({ received: true });
}
