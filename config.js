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

window.MYADHD_GOOGLE_CLIENT_ID = '';
