> **Superseded in part, 2026-09-10.** The PESTA framework page and every
> reference to it were removed at the user's request; the bar carries four
> links now. The home scene is no longer a scroll track (see README), the
> wave field is the page ground rather than a framed picture, display
> headings are set in Baloo 2, and the decode intro on /about is gone.
> Where this plan and the README disagree, the README is current.

# myadhd.my in the shape of loudsrl.com — the plan

This is a build plan for another model to execute. It was written after
reading loudsrl.com live (home, /manifesto) and the six print-to-PDF captures
in `loudsrl_website_screenshots/`, and revised the same day when the user
supplied the copy for the About and Activities pages (`docs/content/`).
Read this whole file before touching a file in the repo. Every section
below is a decision already made; the work is carrying it out, not
re-deciding it. §11 lists the few decisions that are still the user's —
do not guess at those; build around them as the plan says.

## 0. Ground rules — read these before anything else

1. **What the site is.** It is **MyADHD Malaysia** — an organisation that
   makes ADHD recognisable in everyday Malaysian life — and the my.adhd
   app is one of five things it offers (offer 5, "Tools"). Until today the
   site was the app's landing page. That page survives verbatim at
   `/landing-page`; the app's own product page is `/tools`. Everything
   else on the site speaks for the organisation.
2. **The copy is fixed, and there are exactly two sources of it.**
   - `docs/content/about.md` and `docs/content/activities.md` — the
     user's text for those two pages, word for word.
   - Today's `index.html` — every sentence on it is reused somewhere
     (§3), never rewritten.
   If a page in this plan needs a sentence that is in neither place, the
   plan says so and marks it `data-placeholder`. **You do not write copy.**
   The only new strings allowed are the ones this plan spells out in
   quotes (labels, kickers, button labels, section names).
3. **The current landing page survives, verbatim, at `/landing-page`.** It
   is moved, not rebuilt. `landing.css` is never edited; the new site gets
   `site.css`.
4. **`/` becomes the LOUD-style scene**, one pinned screen, nothing below
   it but the footer. Reading content lives on sub-pages.
5. **Do not touch:** `app.html`, `app.js`, `auth.js`, `cloud.js`, `gcal.js`,
   `voice.js`, `api/`, `ios/`, `theme.js`, existing `theme.css` tokens (you
   may append tokens; never rename or re-value one), `serve.py`,
   `vercel.json` routing, the `#logo-mark` sprite geometry, `clock.js`,
   `waves.js` internals.
6. **No build step, no node, no npm, no framework, no external JS.** Static
   HTML + CSS + vanilla JS on Vercel with `cleanUrls: true` (`/about` serves
   `about.html`). Everything LOUD does with Next.js/GSAP you do with
   `position: sticky`, `IntersectionObserver`, CSS transitions and small
   inline scripts — all three already exist in today's `index.html`; copy
   them.
7. **Promises the rest of the repo relies on:** every link into the app
   carries `data-app-link` and `href="/install"` (an inline script rewrites
   it to `/app` for installed users — copy that script into every page);
   `.theme-toggle` markup stays exactly as it is (theme.js binds to it);
   `.nav-clock` with `.nc-place`/`.nc-time` stays (clock.js fills it); the
   `<svg class="sprite">` with `#logo-mark` is copied to the top of every
   page's `<body>`.
8. **Nothing invented.** No fake testimonials, no client logos, no stock
   photos, no book titles, no questionnaire items, no blog posts, no habit
   explanations, no contact form, no cookie banner. Where LOUD has a
   photo, use a wave field (§4.7). Where a page needs content the user has
   not supplied, build the frame and mark the hole `data-placeholder`.
9. **Run it with** `python3 serve.py 8150` (bump the port each session — a
   reused port serves stale files) and open `http://localhost:8150/`. Check
   both themes (the moon button) and both widths (1440, 390).
10. **Commit only when the user asks.** Stage by hunk (`git add -p`), never
    whole files — the user's unfinished work lives in these files.
11. **Do not deploy** until the questionnaire decision in §11 is made. The
    site's main call to action leads to the self-check.

---

## 1. What loudsrl.com actually is (the analysis)

### 1.1 Structure

| URL | What it is | Template |
|---|---|---|
| `/` | One pinned, scroll-driven scene. Nothing below it. | Scene |
| `/pillars/think`, `/pillars/design`, `/pillars/develop` | Long reading pages, one per service pillar, with a "Next →" pager between them | Pillar |
| `/manifesto` | Scroll-gated "decoding" headline, then values, deliverables grid, services grid, work, statement, footer | Manifesto |
| `/studio` | Mono h1, "What we do", numbered list, icon grid, 01–06 grid, work cards, statement | Studio |
| `/contact-us` | Back-arrow nav, tabbed heading, bordered form grid, "Hate contact forms? email", what's next | Contact |

The **nav** is the same on every page: lockup + tagline ("LOUD. Digital
Product Company."), five centre links, right side "SINGAPORE 9:26 PM" + a
round theme toggle. On sub-pages the lockup becomes a **circled back arrow +
tagline**, and the non-current links are dimmed. A **fixed pill** sits bottom
right on every page ("Are you the next?"). myadhd.my already has the clock,
the toggle and the wave field — LOUD is clearly where those came from, so
this is a homecoming, not a transplant.

### 1.2 The home scene (the thing people remember)

- Black ground, full-bleed **liquid-chrome shader** — a dark, glossy,
  slow-moving fluid. Our `waves.js` `flow` preset on the dark ramp is the
  same idea and already exists.
- A **preloader**: a single white blob morphing on black for ~1.5s, then
  the scene fades in. Ours: the logo morph (`animation/`, README "The
  loading animation").
- Headline in **monospace**, centred, ~56px, white, **typed in word by
  word as you scroll**: "We make digital products." Already-typed words are
  white; the word arriving is grey.
- Above it a tiny mono kicker: `I • VI PILLARS` — a roman-numeral index that
  advances as you scroll.
- Bottom-left, a vertical list of small uppercase mono labels (the
  pillars); the current one is bright, the rest dim.
- The page **does not scroll** (`scrollHeight == viewport`); wheel input
  drives the typewriter and the index. We implement this with a tall
  scroll track and a sticky stage (§5.1) — same feel, no scroll hijacking,
  works with keyboards and reduced motion.

### 1.3 Type

| Role | LOUD | Value measured |
|---|---|---|
| Body / headings | DM Sans | 400 weight, tight leading (1.05–1.15 on display sizes), `-0.02em` on statements |
| Labels, kickers, hero headline, section h1 on pillar pages | DM Mono | 400 (300 for big grey lines), uppercase labels 11–13px with `0.12em` tracking |
| Display statements ("We think, design and develop…") | DM Sans | 64–96px, weight 400 — *light*, never bold |
| Pillar-page h1 ("Making something that people want.") | DM Mono | ~56–64px, grey (`#9a9a9a`) on white |
| Home pillar list | DM Mono | 12px uppercase, 0.1em tracking |
| Nav links | DM Sans | 15px, 500 |
| Nav tagline | DM Sans | 13px, grey, `0.06em` tracking |

The whole personality is **light-weight sans at huge sizes + mono for
anything that is a label**. No bold anywhere except the lockup.

### 1.4 Colour

Near-monochrome. Black `#000` / white `#fff` grounds, greys `#9a9a9a`,
`#c9c9c9`, hairlines `#e5e5e5` (light) / `rgba(255,255,255,.14)` (dark).
Colour appears only on the **circle-arrow buttons**: purple `#9B7FE0`
("Build with Us"), blue `#4F6BFF` ("Consult with a Founder Expert", and
the `01 02 03` numerals on /studio), black ("Be the next"). One orange
arrow on /studio. That is all.

### 1.5 Layout

- Full-bleed; content gutter ≈ 64px at 1440; inner max ≈ 1300px.
- A **1px vertical hairline down the left gutter** of every sub-page, from
  under the nav to the footer. It is the page's spine.
- **Bordered grids**: 1px hairlines on all sides, cells with ~40px padding,
  2 columns on desktop, 1 on phones. Used for deliverables, services, the
  contact form.
- **Project cards**: portrait image (4:5), then a mono uppercase grey label,
  then a sans title. Two across.
- **Statement block**: one huge centred sans sentence, then a logo row, then
  a "label + circle-arrow" CTA. Closes every page.
- **Numbered grid**: `01 02 03` in blue mono, huge gap, then short sans
  lines. Three across.
- Generous vertical space: sections are separated by 160–240px of nothing.

### 1.6 Motion

- Preloader blob → fade to page.
- Home: typewriter tied to scroll; pillar list highlight; shader always on.
- Manifesto intro: a **scramble-decode** — the headline shows random glyphs
  that resolve left-to-right into the real sentence as you scroll; behind
  it a mosaic of translucent purple tiles; a circled chevron at the bottom.
- Horizontal **marquee** of a giant sans sentence between sections.
- Everything else: fade-up on enter.

---

## 2. Target site map

| URL | File | Template (§5) | In the bar? | What it carries |
|---|---|---|---|---|
| `/` | `index.html` (rewritten) | Scene | — | Six beat headlines (§5.1); the pill |
| `/activities` | `activities.html` | Pillar | **Activities** | "What We Offer" — the five offers, each with its arrow link (`docs/content/activities.md`) |
| `/about` | `about.html` | Manifesto | **About us** | "About Us" (`docs/content/about.md`) |
| `/pesta` | `pesta.html` | Studio | **PESTA framework** | The five beats with their lines and jump links |
| `/testimonials` | `testimonials.html` | Pillar (short) | **Testimonials** | The three placeholder quote slots |
| `/contact` | `contact.html` | Contact | **Contact us** | Email / Threads / Instagram / "Worth writing about" |
| `/tools` | `tools.html` | Pillar | — (offer 5) | **The app's product page**: Problem + Emotion beats, the three "How" cards, the six activities, the four "Why" findings, the app's Ask |
| `/self-check` | `self-check.html` | Pillar (short) | — (offer 1) | Offer 1's copy + the questionnaire (placeholder until §11.1) |
| `/blog` | `blog.html` | Pillar (short) | — (offer 2) | Offer 2's copy + an empty post index (placeholder) |
| `/habits` | `habits.html` | Pillar (short) | — (offer 3) | Offer 3's copy + the five habit names as a grid (explanations placeholder) |
| `/reading-list` | `reading-list.html` | Pillar (short) | — (offer 4) | Offer 4's copy + an empty shelf (placeholder) |
| `/landing-page` | `landing-page.html` | untouched | — (footer) | Today's whole page, verbatim |
| `/app`, `/install`, `/privacy`, `/terms` | existing | — | — | unchanged |

Bar order, left to right: **Activities · About us · PESTA framework ·
Testimonials · Contact us**. The five offer pages are reached from
`/activities` (their arrow links), from the footer, and from each other's
pager. Every sub-page ends with a pager (§4.6) to the next page in this
sequence, which loops:

`/activities → /self-check → /blog → /habits → /reading-list → /tools →
/about → /pesta → /testimonials → /contact → /activities`

---

## 3. Content map — where every existing block goes

Source = today's `index.html` (soon `landing-page.html`), or the two files
in `docs/content/`. "Kept" means the same HTML moved, only wrapper classes
changed.

| Source | Goes to | Rendered as |
|---|---|---|
| `.hero-title` "We make sure what's on your mind never slips away." | `/` beat 0 | Mono typewriter headline |
| `docs/content/about.md`, line "Your mind is in six places at once, and none of them is the one you need it in." | `/` beat I (Problem) | Typewriter headline |
| `docs/content/about.md`, line "Malas. Tak fokus. Tak matang. Tak reti jaga barang." | `/` beat II (Emotion) | Typewriter headline |
| `docs/content/activities.md` title "What We Offer" | `/` beat III (Solution) | Typewriter headline |
| `#testimonials` title "What people say" | `/` beat IV | Typewriter headline |
| `docs/content/about.md`, closing line "If any of this sounds familiar, it doesn't mean you have ADHD. But it might mean it's worth finding out." | `/` beat V (Action) **and** the org Ask (§4.6) on every org page | Typewriter headline; statement block |
| `docs/content/about.md`, all of it | `/about` | §5.3 |
| `docs/content/activities.md`, all of it | `/activities` (the whole page) and each offer page (that offer's block repeated as the page's opener) | §5.2, §5.7 |
| `#problem` head (kicker, title, lede) + `.symptoms` (6 lines) | `/tools` §B | Mono h2 + lede + hairline list (kept) |
| `#emotion` kicker, `.beat-title`, `.beat-body`, `.beat-turn` | `/tools` §A | Big sans statement |
| `.how-head` + three `.card` (with their `.cfig` SVGs) | `/tools` §C | Numbered `01 02 03` grid; the SVG in the icon slot |
| `#activities` six `.act` items | `/tools` §D | Bordered 2-col grid |
| `.why-head` + four `.panel` (h3, p, `.cite`, `.fig`) | `/tools` §E | Bordered 2-col grid; `.fig` as the cell icon |
| `.why-foot` text | `/tools` §E foot | Mono 12px line |
| `#pesta` head + five `.pesta-step` | `/pesta` | §5.4 |
| `#testimonials` head + three `.quote[data-placeholder]` | `/testimonials` | Project-card layout, placeholders kept |
| `.close` (`.close-title`, `.close-lede`, `.cta`, `.close-assure`) | `/tools` and `/landing-page` only | The **app Ask** (§4.6) |
| `#contact` head + three `.cway` + `.contact-note` list + `.contact-small` | `/contact` | §5.5 |
| `.site-foot` blurb, columns, disclaimer, © | Every page | §4.5 |
| Nav links, clock, toggle, `.nav-sheet` | Every page | §4.2 |
| `#about` (today's app-centred About: title, three paragraphs, six facts) | `/landing-page` only | It stays there; the org's About replaces it on the new site |

Nothing above is optional. When the build is done, run §7 step 7.

---

## 4. Design tokens and shared shell

### 4.1 Fonts

Self-host, like Baloo 2 is. Get the OFL files from
`https://github.com/google/fonts/tree/main/ofl/dmsans` (`DMSans[opsz,wght].ttf`)
and `https://github.com/google/fonts/tree/main/ofl/dmmono` (`DMMono-Light.ttf`,
`DMMono-Regular.ttf`). Put them in `fonts/`. If fetching is blocked, use
`<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&family=DM+Sans:opsz,wght@9..40,300..600&display=swap" rel="stylesheet">`
for now and leave a `TODO self-host` comment in `site.css`.

Append to `theme.css` `:root` (append; do not edit existing lines):

```css
--sans:"DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
--mono:"DM Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
```

`--display` (Baloo 2) stays and is used **only** by `.wordmark` and the
app. Everything else on the new pages is `--sans` or `--mono`.

### 4.2 The bar (`.bar`)

Same slots as today's `.nav`, restyled:

- Left: lockup (`#logo-mark` + `.wordmark` in Baloo) **followed by the
  tagline "MyADHD Malaysia"** in `--sans` 13px, `--faint`,
  `letter-spacing:.06em` — the organisation's name, exactly as it appears
  in the user's copy, in the slot where LOUD says "Digital Product
  Company.". On sub-pages the lockup is replaced by a 34px circled `←`
  linking to `/` (LOUD's back arrow); the tagline stays.
- Centre: the five links, `--sans` 15px weight 500. The current page's link
  is `--ink`; the others `--faint`. On the five offer pages and `/tools`,
  **Activities** is the current link (they are its children).
- Right: `.nav-clock` (unchanged markup), `.theme-toggle` (unchanged
  markup). Keep the rule that hides the city below 520px.
- Below 1024: the links collapse into the existing `.nav-toggle` +
  `.nav-sheet` — copy that markup and its script from today's `index.html`
  verbatim; only the hrefs change to page URLs.
- Fixed, transparent, no ground band (LOUD's bar floats over the page; the
  page's own top padding keeps content clear of it). `--bar-h` exists in
  `landing.css`; redefine it in `site.css` the same way.

### 4.3 The pill (`.pill`)

Fixed bottom-right, `right:40px; bottom:40px` (20px on phones). One line
of `--sans` 13px, 1px border `--line-strong`, radius 999px, padding
`10px 18px`, transparent ground; hover fills `--wash`. On every page.

- On `/tools` and `/landing-page` (the app's pages): **"Clear my head"**,
  `href="/install"`, `data-app-link`.
- Everywhere else: **"Take the self-check"**, `href="/self-check"`. (That
  label is offer 1's own arrow text.)

### 4.4 The spine

Every sub-page's `<main>` gets `border-left:1px solid var(--line)` and
`margin-left:clamp(20px,4.4vw,64px)`; content inside sits
`clamp(20px,2.2vw,32px)` right of that line. Not on `/`.

### 4.5 The footer (`.foot`)

Ground `--surface`. In order:

1. `.foot-line` — `--mono` 300, `clamp(24px,3.4vw,40px)`, `--faint`: the
   existing blurb **"A brain dump that answers back. No account, nothing
   to set up, and your lists stay on your device."**
2. Four columns, mono uppercase 12px `--faint` label over sans 16px
   `--muted` links:
   - `WHAT WE OFFER` → Self-check (`/self-check`), Blog (`/blog`), Habits
     (`/habits`), Reading list (`/reading-list`), Tools (`/tools`)
   - `MY.ADHD` → Open my.adhd (`/app`), Add to home screen (`/install`),
     The long version (`/landing-page`)
   - `SOCIAL` → Threads, Instagram (the existing hrefs)
   - `THE SMALL PRINT` → Privacy, Terms
3. Base row: the disclaimer sentence and `© <span data-year>2026</span>
   my.adhd`, 13px `--faint`. Copy the `data-year` script.

### 4.6 The statement block (`.ask`) and the pager

LOUD ends every page with the same huge sentence + CTA. We have two,
because the site has two voices:

**`.ask-org`** — on `/activities`, `/about`, `/pesta`, `/testimonials`,
`/contact`, `/self-check`, `/blog`, `/habits`, `/reading-list`:

```
[huge sans, centred, 400, clamp(36px,5.6vw,72px), lh 1.08, ls -.02em, max 26ch]
If any of this sounds familiar, it doesn't mean you have ADHD. But it might mean it's worth finding out.
[.arrow-cta]  Take the self-check  (●→)     href="/self-check"
```

**`.ask-app`** — on `/tools` only (and `/landing-page` keeps its own):

```
[huge sans, centred, 400, clamp(40px,6.8vw,88px), lh 1.05, ls -.02em]
All day, your head has been the list.
[sans lede, --muted, clamp(17px,2vw,22px), max 46ch]
Give it somewhere else to live. One box in, a sorted list back — with the first step already picked.
[.arrow-cta]  Clear my head  (●→)     href="/install" data-app-link
[mono 12px uppercase --faint, centred, joined by " • "]
No account • Nothing to set up • Your lists stay on your device
```

`.arrow-cta` = LOUD's "label + circle" button: sans 22px label, 16px gap,
then a 56px circle filled `--blue` (the only place the brand blue is used
as a fill on the new site) with a white `→`. Hover: circle grows to 60px.

**Pager** (`.pager`) sits under the Ask on every sub-page: centred row of
sans 22px "Next", a 48px outlined circle `→`, and the next page's name,
linking per the sequence in §2. Names: Activities, Self-check, Blog,
Habits, Reading list, Tools, About us, PESTA framework, Testimonials,
Contact us.

### 4.7 Wave fields as photography

Where the template calls for an image (Pillar §B image band), mount a wave
field in a bordered frame:

```html
<div class="frame frame-16x9"><div class="panel-wave" data-wave="silk" aria-hidden="true"></div></div>
```

Copy the mount script (the `document.querySelectorAll('.panel-wave')`
block) from today's `index.html`. Patterns available: `flow`, `swell`,
`ripple`, `silk`. `silk` for frames, `flow` on the home scene. At most
**two** fields per page.

### 4.8 Grids

```css
.grid{display:grid; gap:1px; background:var(--line); border:1px solid var(--line)}
.grid > *{background:var(--surface); padding:clamp(24px,3vw,40px)}
@media (min-width:760px){ .grid-2{grid-template-columns:1fr 1fr} .grid-3{grid-template-columns:repeat(3,1fr)} }
```

Cell anatomy: icon slot (48px tall; an existing SVG or empty), 64px gap,
mono uppercase 13px label, sans 22–24px text. Square corners (LOUD has
none).

### 4.9 Kickers, labels, numerals

- Kicker: `--mono` 12px, `--faint`, uppercase, `letter-spacing:.12em`,
  trailing full stop where LOUD has one (`WHAT WE OFFER.`).
- Numerals `01 02 03`: `--mono` 20px, `--blue` (light) / `--accent` (dark).
- Roman index on home: `--mono` 11px uppercase, `.1em`; current numeral
  `--ink`, the rest `--faint`.

### 4.10 Themes

Both themes work on every page; the toggle is global (theme.js) and stays
light-by-default. Do **not** force `/` dark. Never write a hex in
`site.css` except inside the `[data-placeholder]` block (copy it from
`landing.css`).

### 4.11 Placeholders

Any block this plan marks *placeholder* carries `data-placeholder` and the
dashed treatment from `landing.css`. It is how the site says out loud that
it is waiting. Four pages ship with one (§5.7); `/testimonials` keeps its
three. Delete the attribute only when the real thing goes in.

### 4.12 Motion vocabulary (`site.js`, all behind `prefers-reduced-motion: no-preference`)

- `reveal`: the `[data-anim]`/`[data-in]` IntersectionObserver from
  today's `index.html`, copied. Every section gets `data-reveal`; opacity
  0→1 over `.7s`, no translate.
- `decode`: scramble-to-text (§5.3).
- `type`: scroll-driven typewriter (§5.1).
- `marquee`: CSS `@keyframes` translateX of a duplicated line, `60s linear
  infinite`, paused on hover.
- Reduced motion: reveal → visible, decode → final text, type → final
  text, marquee → static, waves → still frame (waves.js already does this).

---

## 5. Page specs

### 5.1 `/` — the scene (`index.html`, rewritten)

```html
<div class="scene" style="height:600vh">          <!-- scroll track -->
  <div class="stage">                              <!-- position:sticky; top:0; height:100dvh -->
    <div class="hero-waves" aria-hidden="true"></div>   <!-- exactly as today; waves.js mounts it -->
    <div class="hero-glow" aria-hidden="true"></div>
    <nav class="bar">…</nav>
    <p class="index"><b data-cur>I</b> • VI BEATS</p>
    <h1 class="type" aria-label="We make sure what's on your mind never slips away."></h1>
    <ol class="beats">
      <li data-beat="0">THE PROMISE</li>
      <li data-beat="1">PROBLEM</li>
      <li data-beat="2">EMOTION</li>
      <li data-beat="3">SOLUTION</li>
      <li data-beat="4">TESTIMONIALS</li>
      <li data-beat="5">ACTION</li>
    </ol>
    <a class="pill" href="/self-check">Take the self-check</a>
  </div>
</div>
<footer class="foot">…</footer>
```

Behaviour (`site.js`, `scene()`):

- `p = scrollY / (track.offsetHeight - innerHeight)`, clamped 0–1. Six
  beats, each `1/6` of `p`. The headline string table — every string is in
  §3, none is new:
  0. "We make sure what's on your mind never slips away."
  1. "Your mind is in six places at once, and none of them is the one you need it in."
  2. "Malas. Tak fokus. Tak matang. Tak reti jaga barang."
  3. "What We Offer"
  4. "What people say"
  5. "If any of this sounds familiar, it doesn't mean you have ADHD. But it might mean it's worth finding out."
- Within a beat, the first 70% types the string **word by word**
  (`words.slice(0, Math.floor(local*words.length))` joined with spaces; the
  arriving word wrapped in `<span class="dim">`); the last 30% holds it.
  Words, not characters — LOUD types by word.
- `.beats li[data-beat=k]` gets `aria-current` for the active beat. The
  index reads `I • VI BEATS` … `VI • VI BEATS`. "THE PROMISE" is the one
  label in the list that is not already a section name; it is allowed
  because this plan spells it out here.
- Every `.beats li` is a button: clicking scrolls the track to that beat's
  start (`track.offsetTop + k/6 * (track.offsetHeight - innerHeight)`). The
  list is navigation *within the scene*; the pill and the footer are how
  you leave it. Do not turn the beats into page links.
- Pause the wave field when `p === 1` and the footer is on screen (reuse
  the `w.pause()/w.play()` scroll handler from today's file).
- Reduced motion or no JS: the track collapses to `height:auto`, the stage
  is `position:relative`, the headline is beat 0 fully typed, all six
  `.beats` bright. The page is then hero + footer.
- Typography: `.type` is `--mono` 400, `clamp(26px,4.2vw,56px)`, `--ink`,
  centred, max `28ch` (beat 5 is long; it wraps to three lines at 1440 and
  that is fine — LOUD's Manifesto headline is two lines); `.dim` is
  `--faint`. `.beats` bottom-left at `left:40px; bottom:40px`, mono 12px
  uppercase, 14px row gap. `.index` sits 28px above `.type`.
- The bar on `/` keeps the lockup (no back arrow).

### 5.2 `/activities` — "What We Offer" (Pillar template)

The page is `docs/content/activities.md`, top to bottom, in this layout.
Each `<section data-reveal>` inside `<main class="spine">`:

**A. Opener** — kicker `WHAT WE OFFER.`; mono h1 `clamp(36px,5.2vw,64px)`
400 `--muted` = **"What We Offer"**; sans lede `clamp(18px,2.2vw,24px)`
`--muted` max `56ch` = the lede paragraph ("Understanding ADHD shouldn't
require…"). Padding-top `calc(var(--bar-h) + 120px)`.

**B. Frame** — one `.frame-16x9` wave field (`silk`).

**C. The five offers** — five `<article class="offer" id="…">` blocks
stacked, hairline between, each laid out as LOUD's Think-page service
rows ("PRODUCT VISION / Define a sharp…" with the ⌜⌝ expand mark top
right):

```
[mono 20px --blue numeral]  01
[sans clamp(28px,3.4vw,44px) 400 --ink]  Start With a Free Self-Check
[mono 13px --faint, sentence case as given]  Based on the screening questionnaire used by Malaysian health services
[sans 18px --muted, max 62ch]  paragraph 1
[sans 18px --muted, max 62ch]  paragraph 2
[.arrow-link]  → Take the self-check
```

`.arrow-link` = sans 18px `--ink`, the `→` rendered as a 40px outlined
circle to the left of the label (LOUD's "Next consulting way" circle),
whole row is the link. ids and hrefs:

| # | id | arrow link | href |
|---|---|---|---|
| 01 | `self-check` | Take the self-check | `/self-check` |
| 02 | `blog` | Read the blog | `/blog` |
| 03 | `habits` | Explore the habits | `/habits` |
| 04 | `reading-list` | See the reading list | `/reading-list` |
| 05 | `tools` | Browse the tools | `/tools` |

Titles, subtitles and paragraphs: **exactly** the text in
`docs/content/activities.md`, including the quoted Malay sentence in 01
and the em-dashes. Do not add a colon after the numerals.

**D. Marquee** — "What We Offer — " repeated. Sans `clamp(64px,12vw,160px)`
400 `--ink`.

**E. `.ask-org`. F. Pager** → Self-check. **G. Footer.**

### 5.3 `/about` — "About Us" (Manifesto template)

The page is `docs/content/about.md`, in order.

**A. Decode intro** — a `100dvh` pinned stage, ground `--wash`, a mosaic
of 8×5 tiles behind (`div`s, `background:var(--blue)` at random opacity
`.04–.18`, generated by `site.js`; no images). Centred `--mono` 400
`clamp(32px,5vw,60px)` `--ink` headline that **decodes on scroll**: target
= **"You lose your keys. Again."** — at `p=0` every letter is a random
lowercase glyph; as `p` rises, characters left of `p*length` are real.
Under it a 44px circled `⌄` that scrolls to section B. Track `height:250vh`;
same mechanics as §5.1. Reduced motion: final text, no track.

**B. The body** — kicker `ABOUT US.` then the paragraphs, in order, sized
like LOUD's Manifesto:

- "You meant to start that assignment…" → sans `clamp(28px,3.6vw,48px)`
  400 `--ink` (the big statement slot).
- "In Malaysia, we have names for this. Malas. Tak fokus. Tak matang. Tak
  reti jaga barang." → `--mono` 400 `clamp(24px,3vw,40px)` `--ink`. Mono
  because it is the page's list of labels, and the whole site sets labels
  in mono. No italics on the Malay.
- "We don't often have the other name for it: ADHD." → sans
  `clamp(28px,3.6vw,48px)` `--ink`.
- "That's the gap MyADHD Malaysia exists to close…" and "We're here to
  change that…" → sans lede size `clamp(18px,2.2vw,24px)` `--muted`, max
  `62ch`, left-aligned against the spine.
- "If any of this sounds familiar…" → **not here** — it is the page's Ask
  (§4.6), so the page closes on it rather than saying it twice.

**C. Signature** — mono 13px `--faint`, two lines: `Aiman Hafidz` /
`Founder, MyADHD Malaysia`, with a 1px hairline above, left-aligned.

**D. `.ask-org`** (this page's closing line **is** the About closer, so
the sequence reads: signature, then the sentence as the ask). **E. Pager**
→ PESTA framework. **F. Footer.**

### 5.4 `/pesta` (Studio template)

**A. Opener** — kicker `THE METHOD.`; mono h1 `clamp(36px,5.2vw,64px)`
**`--ink`** (Studio's h1 is black) = "The PESTA framework"; sans lede =
"Five beats, in the order they have to arrive. This page is built out of
them — each one below links to where it sits."

**B. Numbered list** — `<ol>` in sans `clamp(22px,2.6vw,32px)` `--faint`:
`1. Problem` … `5. Action`.

**C. The 01–05 grid** — `.grid-3` (last row two cells): numeral in blue
mono, gap, sans 22px = `.ps-name`, sans 16px `--muted` = `.ps-line`, then
the `.ps-jump` link (sans 14px `--accent`). **Re-point the jumps** — the
beats live on the home scene and the org pages now:

| Beat | href | Why |
|---|---|---|
| Problem | `/about` | the Problem beat's sentence is on About |
| Emotion | `/about` | same page, second beat |
| Solution | `/activities` | "What We Offer" |
| Testimonials | `/testimonials` | |
| Action | `/self-check` | the org's action |

**D. `.ask-org`. E. Pager** → Testimonials. **F. Footer.**

### 5.5 `/contact` (Contact template)

Bar shows the back arrow.

**A.** Kicker `CONTACT US.`; heading "Say hello" in mono
`clamp(36px,5.2vw,64px)`; lede "A beta is only as good as what comes back
from it. Tell us what broke."

**B. `.grid-2`**:

| cell | mono label | content |
|---|---|---|
| 1 | `EMAIL` | `hello@myadhd.my` as a sans 24px link |
| 2 | `THREADS` | `@myadhd.my` (existing href) |
| 3 | `INSTAGRAM` | `@myadhd.my` (existing href) |
| 4 | `WORTH WRITING ABOUT` | the four `.contact-note li` lines, sans 18px |

Keep the three SVG icons from today's `.cw-ico` in the icon slots.

**C.** Centred: sans 16px `--ink` **"There is no ticket system behind any
of this. Mail goes to a person."** then `hello@myadhd.my` in mono
`clamp(22px,3vw,34px)`.

**D. `.ask-org`. E. Pager** → Activities. **F. Footer.** No form.

### 5.6 `/testimonials` (Pillar, short)

**A.** Kicker `TESTIMONIALS.`; mono h1 `--muted` "What people say"; lede
"Three slots, waiting on three real ones." **B.** `.grid-3` (1 column
under 760px): cell = blockquote (sans 20px `--ink-soft`) + `.q-by`, each
cell keeping `data-placeholder`. **C. `.ask-org`. D. Pager** → Contact us.
**E. Footer.**

### 5.7 The five offer pages

All five open the same way, then differ in one section. Bar shows the
back arrow; **Activities** is the current nav link.

**Shared opener** — kicker `WHAT WE OFFER · 0N.` (N = the offer number);
mono h1 `--muted` = the offer's title; mono 13px `--faint` = the subtitle;
the two paragraphs at lede size. This is the offer's block from
`docs/content/activities.md` again, verbatim — the page says what the
list said, then delivers it.

Then:

- **`/self-check`** — section B is the questionnaire. Build the frame:
  kicker `THE SELF-CHECK.`, a `.grid` of question rows (each a sans 20px
  question and a row of five radio pills), a result block, and a mono
  line "This is a screening tool, not a diagnosis — only a psychiatrist
  or clinical psychologist can give you that." (that sentence is in the
  copy). The **questions, options, scoring and result wording are
  `data-placeholder`** until §11.1 is decided — one dashed block with the
  marker, no invented items. No submission anywhere; when it is real it
  scores in the browser and stores nothing.
- **`/blog`** — section B is the post index: kicker `THE BLOG.`, a
  `.grid-2` of post cards (mono date, sans title, sans excerpt). Ship it
  **empty with one `data-placeholder` cell**. No posts are written. The
  copy promises English and Bahasa Malaysia; leave a two-pill language
  switch (`EN` / `BM`) in the opener, disabled, `data-placeholder`.
- **`/habits`** — section B: kicker `THE HABITS.`, a `.grid-2` of five
  cells whose labels are the five habits **named in the copy**: `EXTERNAL
  STRUCTURE`, `BODY DOUBLING`, `BREAKING THE WALL OF TASKS`, `MANAGING
  TIME WHEN TIME DOESN'T FEEL REAL`, `GETTING THROUGH THE DAY`. Each
  cell's body is `data-placeholder` — the explanations do not exist yet.
  Under the grid, sans 18px `--ink`: "Small, testable changes. Start with
  one." (from the copy).
- **`/reading-list`** — section B: kicker `THE SHELF.`, a `.grid-2` of book
  cards (a 2:3 empty frame, mono "WHO IT'S FOR" label, sans title, sans
  note). Ship **one `data-placeholder` card**. No titles.
- **`/tools`** — this is the **app's product page** and carries the app's
  content from today's landing page. After the shared opener:
  - **§A** the Emotion beat: `.beat-title` "Busy all day. Nothing
    finished." as the big sans statement, `.beat-body` as lede,
    `.beat-turn` as a sans 22px `--ink` line with a hairline above.
  - **§B** kicker `THE PROBLEM.`, the Problem lede as a sans
    `clamp(28px,3.6vw,48px)` statement, the six `.symptoms` lines (kept),
    then a `.frame-16x9` wave field.
  - **§C** kicker `WHAT ACTUALLY HAPPENS.`, h2 "From a head with too much
    in it to one thing you can start.", `.grid-3` with `01 02 03`, each
    card's `.cfig` SVG in the icon slot, mono label = `.card-step`, sans
    22px = card h3, sans 16px `--muted` = card p.
  - **§D** kicker `ACTIVITIES.`, h2 "What you can actually do in it", lede
    "Six things, and no settings screen between you and any of them.",
    `.grid-2` of the six `.act` items (numeral = `.act-n`, sans 22px = h3,
    sans 16px = p).
  - **§E** kicker `WHY A BOX HELPS.`, h2 "Four things that are true about a
    head with too much in it.", `.grid-2` of the four panels (`.fig` icon,
    mono label = h3, sans 18px = p, 12px `--faint` = `.cite`), then the
    `.why-foot` sentence as a mono 12px centred line.
  - **§F** marquee "Your head is not a list, but it is being used as one — ".
  - **§G `.ask-app`** (§4.6) — and the pill on this page is "Clear my
    head". This is where the site sells the app; "buy the product" in the
    user's note means this CTA — see §11.2 before changing its label or
    target.
  - Pager → About us. Footer.

Every offer page's pager follows the §2 sequence.

### 5.8 `/landing-page`

`git mv index.html landing-page.html`. Then in the new file only:

1. `<title>` → "my.adhd — the long version"; `og:url` →
   `https://myadhd.my/landing-page`.
2. Add `<link rel="canonical" href="https://myadhd.my/">`.
3. Nothing else. Do not "improve" it. Its lockup already links to `/`.

Then write the **new** `index.html` per §5.1. Both files share `theme.css`,
`theme.js`, `clock.js`, `waves.js`; only the new pages load
`site.css`/`site.js`.

---

## 6. Files

| File | Action |
|---|---|
| `landing-page.html` | `git mv` from `index.html`, two edits (§5.8) |
| `index.html` | new — scene |
| `activities.html`, `about.html`, `pesta.html`, `testimonials.html`, `contact.html` | new |
| `self-check.html`, `blog.html`, `habits.html`, `reading-list.html`, `tools.html` | new |
| `site.css` | new — everything in §4 and §5, in the same voice as `landing.css`: a comment per rule saying *why* |
| `site.js` | new — `scene()`, `decode()`, `mosaic()`, `reveal()`, the sheet/menu script, the `data-app-link` rewrite, the wave mount, the year. One IIFE per job |
| `theme.css` | append the two font tokens and the `@font-face` blocks |
| `fonts/` | add the DM files |
| `docs/content/*.md` | the copy; read-only |
| `sw.js` | add `/site.css`, `/site.js`, the new pages and font files to the precache list; **bump `CACHE`** (`myadhd-v41` → `v42`) or nobody sees the new site until the old cache dies |
| `README.md` | rewrite "## Pages" (§8) |
| `landing.css` | **do not edit** |

---

## 7. Order of work and the check after each step

Do not start a step until the previous one's check passes.

1. **Move.** §5.8. Check: `curl -s -o /dev/null -w '%{http_code}'
   localhost:8150/landing-page` → 200 and the page is pixel-identical to
   before.
2. **Shell.** Fonts, tokens, `site.css` with §4, `site.js` with reveal +
   sheet + app-link + year. Build `contact.html` first — smallest page,
   exercises the whole shell. Check: both themes, 1440 and 390, no console
   errors, back arrow works, pill visible, footer's four columns correct,
   every link resolves (404s are the usual failure — `curl` every href).
3. **About.** §5.3 — the decode intro is the hardest motion piece; get it
   right here once. Check: the text decodes left to right, the chevron
   scrolls to B, reduced motion shows the final line, every paragraph from
   `docs/content/about.md` is present in order (`grep` the first five
   words of each).
4. **Activities and the five offer pages.** §5.2, §5.7. Check: the five
   arrow links land on the five pages; each page's opener repeats its
   block verbatim; the placeholders are dashed and say "placeholder";
   `/tools` carries every row of §3 that names it.
5. **Scene.** §5.1. Check: six beats type word by word; the index and the
   list follow; reduced motion gives hero + footer; keyboard scrolling
   works; the wave pauses when the footer is up.
6. **PESTA, Testimonials.** Jump links land with the bar clear of the
   heading (`scroll-padding-top` — copy the rule from `landing.css`).
7. **Content check.** For every quoted string in §3 and §5 run
   `grep -l "<string>" *.html` and confirm it is on the page the map says.
   Then `grep -c "data-placeholder" *.html` — expected: `testimonials` 3,
   `self-check` 1, `blog` 2 (index cell + language switch), `habits` 5,
   `reading-list` 1, everything else 0.
8. **sw.js**, README, then screenshots of all twelve pages in both themes
   at 1440 and 390 for the user. Do not commit. Do not deploy (§0.11).

---

## 8. README "## Pages" — what it has to say afterwards

Replace the section with the truth: the site is MyADHD Malaysia; `/` is a
pinned scene (§5.1); the bar's five pages and the five offer pages with
their templates (the table in §2); `/tools` is the app's product page;
`/landing-page` is the one-page arc kept verbatim (move the current "The
arc / The bands / The bar" text under a `### /landing-page` heading rather
than deleting it); the shared shell (§4); the placeholder rule (§4.11) and
where the copy lives (`docs/content/`). Keep the paragraph about
`data-app-link`; it is still true.

---

## 9. Things that will look like bugs and are not

- The wave field does not run in a backgrounded tab or an offscreen
  window; transitions freeze there too. Judge motion in a foreground tab.
- Baloo 2 appears **only** in the wordmark. If a heading comes out rounded
  and bold, it is inheriting `--display`; the new pages set
  `font-family:var(--sans)` on `body`.
- The scene's track is 600vh tall on purpose. A long scrollbar while the
  picture does not move is the LOUD behaviour.
- The theme toggle is light-by-default and global; the home is dark only
  when the reader has chosen dark (§4.10).
- Dashed "placeholder" blocks on five pages are meant to be there (§4.11).
- The Malay words on About are not italic and not glossed. Leave them.

## 10. Things this plan deliberately leaves out

- LOUD's cookie banner, client logo rows, project photography, contact
  form, the "POINT YOUR FINGER TO DISCOVER" hover reveals, the Studio 3D
  marquee.
- Any change to type or colour tokens the app reads.
- Any copywriting — including questionnaire items, blog posts, habit
  explanations and book titles.

## 11. Decisions the user still owns (build around them; do not guess)

1. **Which screening questionnaire.** Offer 1 says "the screening
   questionnaire used by Malaysian health services". The likely instrument
   is the WHO **ASRS v1.1 Part A** (six items, public, with a published
   scoring rule); it is also the one that fits "ten minutes". The user
   confirms the instrument and supplies the wording (English and BM); until
   then `/self-check` ships with the questionnaire block as a placeholder
   and **the site is not deployed** (§0.11), because the pill on every page
   leads there.
2. **What "buy the product" means.** The app is free, has no account
   requirement and no prices anywhere. The plan keeps the app's existing
   CTA ("Clear my head" → `/install`) on `/tools`. If the user introduces a
   paid tier, the label, the target and the footer's `MY.ADHD` column all
   change — ask before touching them.
3. **Blog posts, habit explanations, book titles.** None supplied; all
   three pages ship as frames with placeholders. The user said the blog is
   to be written with student and researcher collaborators — the frame
   should therefore expect an author line and a date on each post.
4. **The About page's second beat on the home scene** is the Malay line
   ("Malas. Tak fokus…"). It is the strongest sentence on the site and it
   is in the user's own copy, but it is also the one line a non-Malaysian
   reader will not parse. If the user would rather the home stayed in
   English, swap beat II for "You're late even when you leave early." —
   also from the About copy. Nothing else changes.
