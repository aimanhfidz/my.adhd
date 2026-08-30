/* ============================================================
   my.adhd — front-end configuration

   Everything in here is public. It ships to the browser and anyone can
   read it, so nothing secret is allowed to live in this file. The one
   real secret the project has, ANTHROPIC_API_KEY, stays in Vercel's env
   vars and is only ever touched by /api/triage.js.

   ---- Google Calendar ----
   An OAuth client ID is public by design — it appears in every redirect
   Google performs and in Google's own sample code. What actually stops
   somebody else using it is the authorised-origins list on the client,
   which is why the setup steps in README.md matter more than hiding this.

   Leave it empty and the calendar feature simply does not appear. The
   app works exactly as it did before.
   ============================================================ */

window.MYADHD_GOOGLE_CLIENT_ID = '303221611117-6t5ss8n6cuq5048dtra6jchu0tjcceo4.apps.googleusercontent.com';

/* ---- Supabase ----
   Also public, and designed to be. The publishable key identifies the
   project; it does not grant anything. Row-level security is what decides
   who may read what, and every policy on `tasks` compares against
   auth.uid(), so this key on its own can reach nobody's data.

   The service key is the one that bypasses RLS. It is in Vercel's env vars
   and only /api ever sees it. It must never appear in this file. */

window.MYADHD_SUPABASE_URL = 'https://ekjlzzqdzmvfhkimppsw.supabase.co';
window.MYADHD_SUPABASE_KEY = 'sb_publishable_KCCs2u3DJ5pnZ6veM6TySw_eO8GHA9m';

/* ---- Donations ----
   A Stripe Payment Link. Public by design — it is a page anyone is meant
   to be able to open, and it carries no key. Stripe hosts the checkout,
   so no card detail ever touches this app and there is nothing to store:
   giving is a gift, not a purchase, and buys no feature.

   Leave it empty and the ask never renders. The Love tab works exactly
   as it did before. */

window.MYADHD_DONATE_URL = 'https://donate.stripe.com/00w9ATcWR3EGaOugv718c00';
