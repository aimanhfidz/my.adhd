/**
 * POST /api/portal   ->   { url }
 *
 * Opens Stripe's own billing portal for the signed-in account: change
 * card, see invoices, cancel. All of it hosted by Stripe.
 *
 * This exists so the app never has to build a cancel flow, and — less
 * obviously — so it never has to be trusted with one. "Cancel my
 * subscription" implemented here would be a button whose failure mode is
 * charging somebody who asked you to stop.
 *
 * Lifetime accounts have no subscription to manage. They still get a
 * portal (invoices, receipts) as long as they have a customer id.
 *
 * Requires STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { configured as stripeConfigured, stripe } from './_stripe.js';
import { configured as sbConfigured, userFromRequest, db } from './_supabase.js';

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
    console.error('[portal] missing Stripe or Supabase env');
    return res.status(503).json({ error: 'not configured' });
  }

  const userId = await userFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'sign in first' });

  try {
    const rows = await db(`billing?user_id=eq.${userId}&select=stripe_customer_id`);
    const customer = Array.isArray(rows) && rows[0] && rows[0].stripe_customer_id;
    /* 404 rather than an error page: an account that has never paid has
       nothing to manage, and the caller should hide the button instead of
       showing a portal that cannot open. */
    if (!customer) return res.status(404).json({ error: 'nothing to manage' });

    const session = await stripe('billing_portal/sessions', {
      customer,
      return_url: `${origin(req)}/billing`,
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[portal] stripe error:', e.message);
    return res.status(502).json({ error: 'could not open portal' });
  }
}
