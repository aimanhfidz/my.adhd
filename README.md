# my.adhd — MVP #1

**Brain dump → auto-triage → one task.**

The whole app does one thing: you empty your head into a box, and it hands back
a single task with a 2-minute first step. Everything else is parked out of sight.

## The feature

1. **Dump** — one textarea, no structure, no categories. Plus a *fuel* selector
   (running on fumes / okay-ish / wired).
2. **Triage** — Claude turns the mess into structured tasks: rewritten title,
   realistic minutes, energy cost, urgency, and a first step small enough that
   refusing feels stupid.
3. **The lists** — everything comes back grouped by category (work, admin,
   money, health, home, social, errand). Within a list: most urgent first,
   then shortest. Between lists: whichever holds the most urgent item leads.
   Tap a task for its first step and "break it down". Completed items collect
   in a "N done" row with undo.

### Dumps accumulate

A dump **adds** to the lists — it never replaces them. Identical open titles
are skipped so repeating yourself doesn't create duplicates. Opening the app
always lands on the dump box; the lists are one tap away via **View my lists**,
which shows the open count.

### Why it orders what it orders

`score()` in `app.js` weighs urgency, then **penalizes tasks that need more
fuel than the user currently has**. A task you have no energy for is worse than
useless — it's the one you stare at before closing the app. Short tasks win
ties, because momentum beats optimality.

## Running it

**No build step.** Open `index.html` in a browser and it works — offline, using
the local heuristic parser (`parseLocally`). You lose AI-quality triage and the
"break it down" button, and nothing else.

For the real thing you need the serverless function, which needs Vercel:

```bash
npx vercel dev
```

## Deploying

```bash
npx vercel --prod
```

Then set `ANTHROPIC_API_KEY` in the Vercel project's Environment Variables. The
key is only ever read server-side in `api/triage.js` — it never reaches the
browser.

`@anthropic-ai/sdk` is pinned to an exact version (`0.120.0`), not a range —
`api/triage.js` depends on beta request parameters (`betas`, `fallbacks`,
`output_config`), so a floating dependency can change behaviour under you with
no code change. Bump it deliberately and re-test both modes of `/api/triage`.

There is no lockfile, so transitive dependencies still resolve fresh on each
build. Run `npm install` locally and commit `package-lock.json` if you want
fully reproducible builds.

## Data

`localStorage`, key `myadhd.v1`. No accounts, no signup, no sync — signup
friction is where ADHD users leave. `state` in `app.js` is a plain object, so
swapping in Supabase later means replacing `load()` / `save()` only.

## Files

| File | What it is |
|---|---|
| `index.html` | Landing page — the front door. Full-bleed hero + copy |
| `landing.css` | Landing-only layout |
| `app.html` | The app. Three screens: dump, loading, now — plus the mascot and logo SVG sprite |
| `theme.css` | Palette, type, mascot colours. Loaded by **both** pages before their own stylesheet |
| `mascot.svg` | Standalone mascot for the landing hero (`<img>` can't read the page's CSS, so its colours are baked in) |
| `favicon.svg` | The logo mark, standalone |
| `fonts/` | Baloo 2 (variable, wght 400-800), self-hosted |
| `styles.css` | App layout: one white page, content held to `--measure` (720px), gradient pill actions |
| `app.js` | State, triage call, scoring, rendering |
| `api/triage.js` | Claude call — triage + breakdown modes |

## Pages

`index.html` is the landing page; every CTA on it points at `app.html`.

It is **one viewport and nothing more** — `100dvh`, sized in `vh`/`dvh`
clamps, with `overflow:hidden` on the body so it never scrolls. Hero, CTA,
and a one-line disclaimer; no sections below. If you add anything, re-check
it at 320x568 and in landscape, because there is no scrollbar to absorb
overflow — content will simply be cut off.

The copy makes no clinical claims. It describes what starting a task feels
like and what the app does about it — nothing about causes, diagnosis, or
treatment. The footer says so outright. Keep it that way.

## Design system

The app is **light only**. `color-scheme:light` is set and there is no
`prefers-color-scheme` block, so a phone in dark mode still gets the white
app — and `html`, `body` and the `theme-color` meta are all white so the iOS
overscroll band and browser chrome don't flash a tint.

The app is a page, not a phone mock: no card, no shadow, no tinted backdrop.
Content is centred and capped at `--measure`. The landing page is the
exception — it is deliberately dark, and hardcodes its own colours rather
than relying on theme tokens.

Palette lives in `theme.css` `:root` as brand tokens (`--blue`, `--navy`, `--stone`,
`--orange`, `--pale`, `--grad`); the semantic tokens (`--ink`, `--accent`,
`--muted`) point at those, so changing a brand hex updates the whole app.
Vivid Orange is reserved for one thing — the "start here" first step. It
means *act now*, and it stops meaning that if it decorates anything else.

Type is Baloo 2, served from `fonts/` — no Google Fonts request, so the app
still renders correctly offline. `Baloo2-ExtraBold.ttf` is unused; the
variable file covers 400-800 on its own.

**`mascot.svg` duplicates the mascot geometry** held in the `index.html`
sprite — an `<img>` cannot reference a symbol defined in another document.
Edit the character in one and copy it to the other, or they will drift.

The mascot and the logo are inline SVG symbols at the top of `index.html`
(`#mx-head`, `#mx-bust`, `#logo-mark`), pulled in with `<use>` and coloured
through tokens — so each shape is defined once for the whole app.

The logo is a seven-arm asterisk: the eighth arm is detached and carried by
the violet capsule off the lower right. That gap is the mark — closing it
into a plain eight-point star loses the whole idea. `favicon.svg` repeats
the geometry standalone, so the two must be edited together.

## Deliberately not in v1

Timers, streaks, XP, calendars, notifications, sub-projects, tags, accounts.
Every one of those is a reason for the app to feel like homework.
