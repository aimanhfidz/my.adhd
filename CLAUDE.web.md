# my.adhd — the web app

The repo root, which deploys to myadhd.my. Read **`README.md`** first — it has
the full picture: the dump → triage → lists loop and why it orders what it
orders, the voice pipeline, Google Calendar, the design system, billing, and a
file-by-file map. This file is standing rules for working in here.

`CLAUDE.md` holds the boundary with the iOS shell. The half that matters most
from this side: a change here must not assume the shell exists, and
`ios/README.md` lists what it is quietly depending on.

## Hard rules

- **The task shape lives in three places and all three move together**:
  `TASK_SCHEMA` in `api/triage.js`, `normalizeTask()` in `app.js`, and
  `parseLocally()` in `app.js`. `normalizeTask()` is the gatekeeper — it builds
  a fresh object literal rather than spreading, so a field it does not name is
  **dropped without a word**. Add a field to the schema only, and the model
  returns it and the app throws it away. The schema is
  `additionalProperties: false`, so anything added must also be listed in
  `required`.
- **`load()` must never re-run `normalizeTask()` over stored tasks.** It mints a
  fresh `id`, which would orphan every Google Calendar event and every cloud
  row. Missing fields degrade to their defaults at the point of use instead.
- **No user text ever reaches `innerHTML`.** Every write to the DOM goes through
  `textContent` or `createElement`. This is not a style preference: `README.md`
  leans on it to justify keeping a Google access token in `localStorage`, so
  breaking it breaks that argument. It is why notes store a block model rather
  than HTML — `grep -c innerHTML app.js` should only ever find clears and
  static SVG.
- **`localStorage` under `myadhd.v1` is the source of truth**, signed in or
  not. Nothing about opening the app may require the network: signup friction is
  where ADHD users leave. Anything persisted goes *inside* that key — the iOS
  shell watches it and only it, so a new `myadhd.*` key is a write the phone
  never hears.
- **The service role key never appears in `config.js`**, and no secret is ever
  pasted into this repo, a file, or a chat. `config.js` is public by design and
  says so at the top.
- **Both AI keys fail silently.** Without `ANTHROPIC_API_KEY` triage 500s and
  the local heuristic parser answers instead; without `GEMINI_API_KEY` the
  browser's own speech engine answers instead. After any deploy or project
  change, dump something real and check the small "sorted offline" banner is
  **absent** before trusting it.
- **`@anthropic-ai/sdk` is pinned to an exact version**, not a range, because
  `api/triage.js` uses beta request parameters. Bump it deliberately and re-test
  both modes.
- **Entitlement is written by the Stripe webhook and by nothing else.**
  `billing.entitled()` is for showing and hiding UI, never for locking; anything
  with a real unit cost must check the token server-side. `api/checkout.js`
  takes a plan name, never a price id.
- **Vivid Orange means *act now* and nothing else** — the mark, and anything
  late. Danger Red is destructive actions only, never decoration. Spend either
  on a third thing and it stops meaning anything.
- **The Malay is not a translation and must not read like one.** It is the same
  promises said again by someone who speaks Malay, in `awak`.
  `docs/bahasa-melayu-voice.md` is the rules. Keys in `site.ms.js` are hashes of
  the English, so editing English markup silently drops that string back to
  English — grep the old key before you touch it.
- **The eighteen ASRS questions must not be reworded, reordered or trimmed**, and
  Part B is not scored at all. A screening instrument's validity is a property
  of its exact wording. The minimum age of 18 lives in three places that must
  agree: the browser, the API, and a `check` constraint in the table.
- **The inline theme stamp in `<head>` is load-bearing.** It runs before first
  paint; moving it later shows a flash of the wrong theme, and the
  `prefers-color-scheme` block it beats is the no-JS fallback, not dead code.

## Right now

**The app is held behind `/soon`** while it is rebuilt. `localhost` is never
held. The block comment at the top of `app.html` lists everything to undo when
it opens again. Note this also catches the iOS shell — see `CLAUDE.md`.

## Running it

**No build step.** Pages link to `/app` and `/install` rather than the `.html`
behind them, so `file://` does not resolve:

```bash
python3 serve.py 8765      # same cleanUrls rule Vercel applies; no API
npx vercel dev             # the real thing, with the serverless functions
```

Bump the port on each round — a reused one serves stale assets without saying
so. Deploying is a push to `main`; there is one Vercel project.

## The docs that are instructions, not content

Reach for these rather than guessing; an agent will not infer any of them.

| | |
|---|---|
| `docs/ui-screens-brief.md` | Every screen and every element on it. A design may restyle anything listed; it may not remove one or invent a new one. |
| `docs/bahasa-melayu-voice.md` | How the Malay is written, and the failure mode it exists to prevent. |
| `docs/stripe-setup.md` | Products, webhook, env vars, test cards. Test mode first. |
| `docs/supabase-setup.md` | Dashboard settings that are in no diff and fail in ways that look like code bugs — including the `pg_cron` retention job and the `myadhd://auth` redirect the iOS shell needs. |
| `docs/content/*.md` | The user's own copy, verbatim. Do not edit, shorten, translate or improve it. |
