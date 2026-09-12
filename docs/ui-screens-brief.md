# my.adhd — UI screen brief for image generation

Paste the **Context** block once, then one **Screen** block per image.
Every element listed is real and already wired. A design may restyle
anything here; it may not remove a listed element or invent a new one,
or the design becomes unimplementable without touching behaviour.

---

## CONTEXT (give this to the image AI first)

**The product.** my.adhd is a web app (also runs as an installed
home-screen app / iOS shell) for people with ADHD. One loop: you dump
whatever is in your head as messy text, an AI sorts it into tasks, and
you get short scannable lists plus a calendar. Nothing is thrown away.
Free, no account required — sign-in is optional and offered late.

**Voice.** Calm, plain, slightly dry and human. Lowercase brand
`my.adhd`. Copy is short sentences, no exclamation marks, no
productivity-guru energy. The app should feel like relief, not pressure.

**Form factor.** Mobile-first single-column. Content column capped at
720px and centred; on desktop it is the same column with more air around
it, not a multi-pane dashboard. A floating pill tab bar hovers at the
bottom of every screen except the first two.

**Palette (fixed — do not invent new hues).**
- Vivid Blue `#4737FF` — the accent, primary buttons, active states
- Deep Blue `#3529BF`, Pale Blue `#ACA5FF`, Pale `#D1CDFF`
- Violet `#7B3FE4` — the logo capsule and the `.adhd` in the wordmark
- Navy `#202030`, Near-black `#101018` — text and dark surfaces
- Stone Gray `#5E5E6A` — secondary text
- Vivid Orange `#F75C03` — reserved for exactly two jobs: the asterisk
  in the logo mark, and anything late (urgent chip, overdue, stale sync).
  Nothing else on the page may use orange.
- Danger Red `#D92D20` — destructive actions only, never decoration
- Brand gradient `linear-gradient(103deg,#101018,#3529BF,#4737FF,#ACA5FF)`
- Light theme: paper white `#FFFFFF` surfaces on lavender-tinted
  backdrop `#E9E7FB`, washes `#F4F3FE`, hairlines `#E4E2F5`
- Dark theme: `#101018` surfaces on `#15151F` backdrop, washes `#1A1A26`,
  ink `#F3F2FB`, and the accent lifts to `#8B7DFF` with near-black text
  on top of it

**Type.**
- App UI + wordmark: **Baloo 2** (rounded, friendly, weights 400–800)
- Public marketing site only: **DM Sans** for sentences, **DM Mono** for
  small labels and eyebrows

**Shape language.** Generously rounded. Radii in use: 14px small,
22px large, 34px cards. Soft shadows, hairline borders, plenty of
vertical breathing room. Pills for chips and filters. No hard corners,
no dense tables, no heavy chrome.

**Logo.** An asterisk/star mark built from crossing rounded bars, with a
small pill stroke at the lower right, in violet with one orange arm.
Wordmark reads `my.adhd` — `my` in ink, `.adhd` in violet.

**Both themes.** Every screen must be designed for light and dark. A
theme toggle (moon/sun icon button) sits at the top right of every app
screen, beside the logo lockup.

**Ask for:** clean, realistic app UI mockups, flat, high fidelity,
device-frameless or in a plain iPhone frame, no marketing gloss, no
stock-photo people, no 3D, no isometric illustration.

---

## SCREEN 1 — Brain dump (the cold start)

The first thing anyone sees at /app. Full screen, no tab bar yet.

Top to bottom:
1. Header: logo lockup `my.adhd` at left, theme toggle circle at right.
2. A meme image in a rounded frame — a wide screenshot-style joke image
   (Morpheus / "what if I told you my ADHD thoughts have a group chat and
   everyone's typing"). It is a real 642×389 photo, treat it as a placed
   image with rounded corners.
3. Headline: **"What's on your mind?"** — large, Baloo 2, bold.
4. A big soft-edged multiline textarea, 4 rows, placeholder
   *"just tell me, i'll sort it out."* This is the hero object of the
   screen: it should look inviting to type a mess into.
5. *(conditional)* A "Heading for the calendar" strip: a tiny label and a
   row of small date chips (e.g. `Fri`, `tomorrow 3pm`) that appear live
   as the AI spots dates in what you type.
6. Primary button, full width, brand gradient: **"Clear my head"** with a
   small `⌘ ⏎` keyboard-shortcut badge tucked inside its right end.
7. Hint line, muted: *"Everything gets sorted into lists. Nothing is
   thrown away."*
8. *(returning users only)* A quieter secondary button: **"View my
   lists"** with a small count badge on the right.

Mood: an empty, unhurried page. One thing to do.

---

## SCREEN 2 — Thinking

A brief full-screen wait state while the AI sorts the dump. Nothing else
on screen — no header, no tab bar.

- Centred: a 400×400 looping animation of the logo mark morphing
  (draw it as the asterisk mark mid-transformation).
- One line of text underneath, muted, that cycles through phrases —
  first one is *"Untangling that…"*

Mood: quiet, warm, not a spinner-on-white loading screen.

---

## SCREEN 3 — The lists (the main screen)

Where people live. Tab bar visible.

Top to bottom:
1. Compact header: small logo lockup left, theme toggle right.
2. Eyebrow line: *"Sorted into lists."* (or *"Sorted, Aiman."*).
3. Summary line, muted: *"7 things · 3 lists · about 2.5 hr all in"*.
4. *(conditional)* An offline notice card: *"3 were sorted offline — the
   times and lists are rough guesses…"* with a soft button **"Sort these
   properly"**.
5. *(conditional, once)* A dismissible sign-in offer card with a small ×
   at its corner: title *"Keep these on your other devices?"*, a short
   paragraph, and a gradient button **"Sign in with Google"**.
6. **The filter row** — one horizontally scrolling line of pills, never
   stacked headings. First pill is `All`, then one per list:
   `Work`, `Admin`, `Money`, `Health`, `Home`, `Social`, `Errands`,
   `Everything else`. Each pill shows its name plus a small count. The
   selected pill is filled with the accent; the rest are outlined.
7. **The lists.** Tasks are grouped by *when*, not by category. Up to
   four sections in this fixed order, each with a small heading and a
   count beside it:
   - **Late**
   - **Today**
   - **Coming up**
   - **No date yet**
8. Below the lists: a collapsed **"4 done"** row with a chevron that
   expands into a list of finished task titles, each with a small
   **Undo** button on the right.
9. At the very bottom, quiet and small: **"Clear everything"** in danger
   red. Pressing it swaps in a confirmation box with warning text and two
   buttons: soft **Cancel** and red confirm.

### The task row (the most important component — design it carefully)
A rounded card, full width of the column:
- Left: a circular check button with a tick glyph — tapping it completes.
- Body: the task title on one line, bold-ish, and below it a row of small
  pill chips: a time estimate (`25 min` / `1.5 hr`), an energy chip
  (`low energy` / `high energy`), optionally a date/time chip (which
  turns **orange** when it is in the past), and optionally an orange
  **`urgent`** chip. Urgent rows get a subtle orange edge treatment.
- Tapping the card body expands a detail area inside it, containing:
  - a labelled block **"Start here — 2 minutes"** with one short sentence
  - *(after breaking down)* a **"Broken down"** numbered step list
  - a soft button **"Too big — break it down"**
  - a small row with two quiet text buttons: **Edit** and **Remove**
    (Remove in danger red)
- **Swipe:** dragging the card sideways reveals coloured rails behind it
  — swipe left uncovers a green-ish **Done** rail with a tick on the
  right edge; swipe right uncovers a red **Remove** rail with an icon on
  the left edge. The rail brightens when the swipe is far enough to fire.
  Design one frame showing a row mid-swipe.

### Empty state
When everything is ticked off: the lists vanish and one line remains —
**"Head's clear."** *Nothing left in the queue.* with a text-link
**"Dump again"**.

---

## SCREEN 4 — Calendar

Tab bar visible.

1. Compact header (logo + theme toggle).
2. Month bar: a left chevron button, the month name centred, a right
   chevron button.
3. A month grid, Monday-first. A single row of day letters
   `M T W T F S S` sits *inside* the grid pane, not above it. The grid
   scrolls sideways between months with a snap. Day cells are small
   rounded squares; a day with tasks carries a small dot or count; today
   is ringed; the selected day is filled with the accent.
4. *(conditional)* A quiet **"Back to today"** button under the grid.
5. A tip line, muted: *"Hold a row and drag it onto a day to move it.
   Swipe it left to finish, right to remove."*
6. **The agenda** for the selected day — one or two grouped sections:
   - *(on today only, if any)* a group headed **"2 overdue"**, styled in
     orange, sitting above today's own group
   - the day's group, headed with the day (`Today`, `Tomorrow`, `Fri 12`)
   Each agenda row is a rounded card: circular tick button on the left,
   then a time slot (`09:30`, or a faded **"any time"** when there is no
   time), then the task title with a small muted meta line under it
   (`25 min · low energy`).
7. Empty day: one muted line — *"Nothing on today. Say a day in the dump
   box and it lands here."*
8. A closing muted line counting undated tasks.

Also worth one frame: a task card **being dragged** over the month grid,
with the target day highlighted.

---

## SCREEN 5 — Feedback

Tab bar visible. Calm, centred, narrow.

1. Compact header.
2. A heart glyph in the accent, on its own.
3. Title: **"Tell us what to fix"**.
4. Lede paragraph: *"Your ADHD is already halfway through a list of
   things this app should do differently. We would genuinely like that
   list. No name, no account — just say it."*
5. A labelled textarea, 5 rows: label *"What would make this better?"*,
   placeholder *"the thing that annoyed you, the feature you keep
   reaching for, the bit that made no sense…"*
6. A footer row under it: a character counter `0 / 2000` on the left, a
   gradient **"Send it"** button on the right.
7. A small print note: *"**One a day.** Keeps the spam out…"*
8. A quiet outlined link-button **"Chip in"** with one line above it:
   *"Free, and staying free. If it has earned it, the tin is here."*

**Sent state** (design this too): the form is replaced by a thank-you
card — *"Got it. Thank you."*, a line saying the box opens again
tomorrow, and a filled **"Chip in"** button with a small note beneath.

---

## SCREEN 6 — Profile

Tab bar visible. A stack of rounded cards.

1. Compact header.
2. **Profile card:** a large emoji avatar face centred, a greeting under
   it (*"Hey there."* / *"Hey, Aiman."*), a labelled text input
   *"What should I call you?"*, then a labelled grid of 12 selectable
   emoji faces (*"Pick a face"*) — the chosen one ringed in the accent.
3. **Stat row:** five small stat tiles in a row that wraps — each a big
   number over a small label: `on your lists`, `done`, `lists`,
   `on the calendar`, and `overdue` (the overdue tile styled orange).
4. **Account card:** a small avatar/person glyph beside a title
   (*"Just this device"*) and a state line (*"Not signed in"*), a note
   paragraph, a gradient **"Sign in with Google"** button, and a footer
   row with a hint and a quiet **"Sign out"**. When signed in it also
   shows a quiet **"Delete account"** that opens the same two-step red
   confirmation box as Clear everything.
5. **Google Calendar card:** a calendar icon beside *"Google Calendar"*
   and a state line (*"Not linked"* / *"Linked"*), a note, a gradient
   **"Link Google Calendar"** button, and a footer row with soft
   **"Open in Google"** and quiet red **"Unlink"**.
6. Bottom hints, small and muted: a line about tasks living in this
   browser only, a `Privacy · Terms` link line, and a version line
   **`v0.1.0`** with a small **`Beta`** tag.

---

## SCREEN 7 — The composer (overlay)

A modal sheet that slides up over whichever screen you were on, so the
list stays visible behind a dimmed scrim. Rounded top corners.

1. Top bar: **Cancel** (left, plain text), title **"New dump"** (centre),
   **"Sort it"** (right, accent, disabled until you type).
2. Body laid out like a post box: the user's emoji avatar on the left,
   and to its right the name (`you`) above an auto-growing textarea with
   the same placeholder — *"just tell me, i'll sort it out."*
3. The same live date-chip strip appears here when dates are detected.
4. Pinned at the bottom of the sheet, never scrolling away: a large
   circular **microphone button** with a soft pulsing ring around it and
   an audio-level ring that responds while held, and a caption under it —
   *"hold to talk"*. Design both the idle and the recording state
   (recording = ring expanded, accent-lit).

---

## SCREEN 8 — The tab bar (present on screens 3–6)

A floating rounded pill bar hovering above the bottom edge, with a blur
or solid surface and a soft shadow. Five items:
1. Lists icon (with a small dot indicator when something changed)
2. Calendar icon (with a small count badge)
3. **A raised centre `+` button** in the brand gradient — bigger than the
   rest, the visual anchor; it opens the composer
4. Heart icon (feedback)
5. The user's emoji avatar as a small round face (profile)

Active tab is accent-coloured; the rest are muted.

Also: a **toast** — a small dark rounded pill of white text that slides
in near the bottom, above the tab bar, for confirmations and undo.

---

## Supporting pages (lower priority — say so if you want these designed)

- **Landing page** (`/`) — the public marketing site. Full-bleed hero
  with an animated wave field and two soft glows behind a sticky nav
  (logo, five links, a live local clock, theme toggle, hamburger on
  mobile), a huge three-line gradient headline, then bands for Problem,
  Emotion, How (three cards), Activities, Why, About, the PESTA
  framework, Testimonials, a full-screen close/CTA, Contact, footer.
  **This page is mid-redesign right now** — check before designing it.
- **Install** (`/install`) — eyebrow *"One-time setup · 20 seconds"*,
  headline *"Put it on your home screen first."*, a lede, a three-tab
  switcher (iPhone & iPad / Android / Desktop), a numbered step list per
  tab with inline icons, an **"Install my.adhd"** button, and a footer
  with a **Done** button and fine print.
- **Privacy** and **Terms** — plain long-form legal pages: nav, title,
  a date line, headed sections, and a back link.
- **Admin** (`/admin`, private) — a sign-in gate, then a list of
  feedback notes. Internal only.
- **Waves lab** (`/waves-lab`, private) — an internal parameter
  playground for the hero wave animation. Not part of the product.

---

## Rules for whatever comes back

1. Every screen needs a **light and a dark** version.
2. Orange only for late/urgent and the logo asterisk. Red only for
   destructive.
3. Keep the element inventory above — the code binds to all of it.
4. Mobile portrait first. A desktop frame is the same column, wider
   margins.
5. Rounded, soft, calm. If a mockup looks like a productivity dashboard,
   it is wrong.
