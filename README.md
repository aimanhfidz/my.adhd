# my.adhd — MVP #1

<img src="animation/my-adhd-morph.svg" alt="The my.adhd logo mark morphing through four states" width="200" align="right" />

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
| `animation/` | Logo morph exports — self-animating svg, mp4, gif. Not loaded by the app |
| `animation/source/` | The generator, the four beats as static SVGs, and the motion sheet |

## The loading animation

<img src="animation/my-adhd-morph.svg" alt="The four beats: mark, burst, clock, collapse" width="160" align="right" />

The wait on screen 2 is the logo mark morphing through four beats — the full
mark, a burst, a clock, a collapse — and back. It is the **same eight
rectangles** throughout, changing length, thickness and corner radius; nothing
is added, removed or crossfaded, which is what makes it read as one shape
thinking rather than a spinner.

It is inline SMIL in `app.html`, not a file, for one reason: an `<img>` can't
read the page's CSS, and the mark has to follow the theme. The arms bind to
`--orange` and the capsule to `--violet` through `.lm-arm` / `.lm-pill` /
`.lm-ring` — the same two tokens `.lg-star` / `.lg-pill` use — so the loader
and the header logo are always the same mark.

**Retiming is one find-and-replace.** Every `<animate>` carries `dur="4s"`;
change them together and the four beats stay proportional, landing at 0/1/2/3s.

    sed -i '' 's/dur="4s"/dur="6s"/g' app.html

Don't slow it past the wait itself — a triage that returns in 2s should not
cut the mark off mid-beat. Don't speed it up either; below ~3s the morph reads
as a twitch.

CSS cannot pause SMIL — `animation-play-state` has no effect on `<animate>`.
Reduced motion is honoured in `app.js` via `svg.pauseAnimations()`, which
freezes the clock at beat 01, the full mark. The screen loses the motion, not
the logo.

**`animation/` holds the standalone exports, and they will drift.** All three
are the original 8s loop with the dark `#21262A` ground and the pre-token brand
hexes baked in — deliberately, because Threads and Reels need an opaque frame,
not a themed one, and `my-adhd-morph.svg` has to carry its own colours to work
through an `<img>` or in a README. But that means none of them follow a palette
change the way the inline SVG in `app.html` does. They ship to Vercel as static
files (~1.7MB) and no page requests them.

`animation/source/gen.py` is that generator. It rewrites the standalone morph
SVG and the four static beats from one place:

    python3 animation/source/gen.py

The choreography lives in the state tables at the top as `(inner, outer, width,
radius, opacity)` per arm — `LOGO[3]` is the purple capsule. Edit those, not the
generated SVGs, which are overwritten on every run.

It regenerates `my-adhd-morph.svg` and the four beats, and nothing else — the
**mp4 and gif still come out of a screen capture** of the loop, so a colour
change lands in the SVGs immediately and leaves the video files behind until
someone recaptures them.

Note it emits the original hexes and the 8s `DUR`, because its job is the
standalone exports. The app's copy is the inline SMIL in `app.html` and is
retimed and tokenised separately — changing `gen.py` does not touch the
loading screen.

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

The app is **light by default and has a dark mode** — the Theme section below
covers how the choice is made. `:root` sets `color-scheme:light`, and the dark
values live in two places: a `prefers-color-scheme:dark` block and a
`:root[data-theme="dark"]` block, so both the system preference and the toggle
are served.

`html`, `body` and the `theme-color` meta **follow the active theme** rather
than being pinned white. `html{background:var(--surface)}` keeps the iOS
overscroll band in step with the page, and `paintTheme()` in `app.js` rewrites
`theme-color` on every toggle so the browser chrome doesn't sit on the other
scheme.

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

## Theme

The app **defaults to light**. The system preference does not decide — the
header toggle does, and until someone uses it the app stays white even on a
phone in dark mode. The choice is stored under `myadhd.theme` and a saved
choice always wins.

The default is stamped on `<html>` by an inline script in `<head>`, before
first paint. That placement is load-bearing: `data-theme="light"` is what
beats the `prefers-color-scheme:dark` block in the stylesheet, and doing it
later would show a flash of dark first.

Because that script always stamps *something*, the `prefers-color-scheme:dark`
block is guarded by `:root:not([data-theme="light"])` and in practice only
wins when the script never ran — i.e. with JavaScript disabled. It is the
no-JS fallback, not dead code. Deleting it means a no-JS visitor on a dark
phone gets the light app; deleting the guard instead means a dark phone
overrides a saved light choice.

## Clearing

**Clear everything** sits at the foot of the lists, quiet until armed. It
takes two confirmations, and the armed state times out after 20s so a
half-pressed confirm can't wait around for a stray tap. There is no undo and
no backup — tasks live only in this browser's `localStorage`, and clearing is
final. `--danger` is reserved for this; it is never decoration.

## Deliberately not in v1

Timers, streaks, XP, calendars, notifications, sub-projects, tags, accounts.
Every one of those is a reason for the app to feel like homework.
