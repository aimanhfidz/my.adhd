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
bottom of every screen except the wait and the settings screens.

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

## SCREEN 1 — Home (and the cold start)

Where /app opens, always. **There is no dump box on this screen any more** —
the ＋ in the tab bar is the one way anything gets added, and Home is a
dashboard.

One thing does survive from the box: `#dump-input` is still in the DOM, off
screen, because it was never only a box. It is the staging area the whole
pipeline runs through — the composer writes into it on send and `triage()`
reads it — and it is what the iOS shell fills by id. Text arriving in it
from outside opens the composer over itself, so "Hey Siri, dump a thought"
still lands somewhere visible.

**A first visit** — no tasks and no notes — shows only the meme, the
question **"What's on your mind?"**, the line *"Everything gets sorted into
lists. Nothing is thrown away."* and one gradient **"Clear my head"** button
that opens the composer. The tab bar is up, because the ＋ in the middle of
it is now the only way in; it no longer hides on a cold start.

**On a return visit** the cold-start block is replaced by the widgets, in
this order:

1. Header: logo lockup at left; at the right a **gear** (the only one in the
   app — it opens Settings) then the theme toggle circle.
2. **Next up** card. A heading reading `2 late` in orange when anything is,
   else `Today`, else `Next up`; a quiet **All lists** button at its right;
   then up to three rows — late first, then today, then soonest. Each row is
   a title over a muted `when · minutes` line, with a short vertical rule
   down its left edge that turns orange when that row is late. Rows are
   signposts: no tick, no chips, no swipe. Tapping one goes to the lists.
3. **The five stat tiles** — `on your lists`, `done`, `lists`,
   `on the calendar`, and `overdue` (orange, across the foot). Two columns
   at every width, then overdue full width.
4. **Worth a look** card — four quiet links out to `/self-check`, `/tools`,
   `/activities` and `/about`, each a title over one muted line.

Mood: an empty, unhurried page on a first visit. On a return, a summary you
can read in one look and nothing asking to be typed into.

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

## SCREEN 5 — Notes

Tab bar visible on the index. Deliberately nothing like the lists: a note is a
thing you wrote down, and nothing sorts it, triages it, dates it or turns it
into a task. The ＋ stays pointed at the dump composer here too — it means
"sort this out for me", which is the one thing a note is for not doing.

**The index.** Compact header; the eyebrow *"Notes."*; a count line
(*"3 notes"*); a full-width gradient **"New note"** button; then a stack of
rounded note cards, newest edit first. Each card is a title — or the first
line of the body when there is no title — over a two-line clamped preview and
a footer carrying a relative time (`6.02pm`, `Yesterday`, `3 days ago`, then a
date) plus small tags for a picture count and a reminder when it has them.

**Empty index.** A centred block in the middle of the screen: the note glyph
in a violet rounded outline, **"Nothing written down yet."**, the line *"Notes
stay on this device. Nothing here gets sorted."*, and one gradient pill,
**"Write one"**. This is the app's only centred empty state — home and the
calendar keep their one-liners.

**The editor is its own screen, and the tab bar stands down for it.** A
three-slot bar: a back chevron at the left, the note's title in the middle,
and a filled dark circular tick at the right that saves and returns. The same
bar the composer uses.

Under it, a **sheet of paper** filling the screen down to the toolbar: the
Pale lavender ground, a faint dotted grain, a large bold **Title** line, then
the body. Body lines are blocks, one per line, each of which can be a
paragraph, a heading, a bullet, a numbered item or a **checkbox** with a
tappable box. Enter splits a line into two; Enter on an empty bullet ends the
list. Pictures sit as small rounded thumbnails under the writing. A quiet red
**Delete note** sits below the paper, and a reminder, once set, reads as one
accent line above it.

**The toolbar** floats where the tab bar would be, same pill and blur: four
buttons — **Aa** (text format), a checklist, a paperclip, and a bell that
lights up when a reminder is set.

**Two sheets** rise over the toolbar rather than over the writing, so you can
see what you are changing: *Text format* (line type, **B** *I* U S, and
alignment) and *Reminder* (day, time, repeat, with Clear and Save).

Design the index, the empty index, the editor, and the editor with the Text
format sheet open — in both themes.

---

## SCREEN 6 — Settings

**Not a tab.** Reached only by the gear at the top right of Home, and the
tab bar hides while it is open, so nothing in the bar is lit. The header is
a back chevron reading **Home** at the left, the title **Settings** centred,
and the theme toggle at the right — no logo lockup, because a back button
beside a link out of the app is two conflicting exits.

A **grouped list**, in the iOS shape: a small uppercase caption outside each
group, and a rounded card of rows inside it. A row is a 34px rounded glyph,
a title, an optional muted sub-label, and a chevron when it goes somewhere.
The rule between two rows starts where the text does, not at the card edge.

The long things are not on this screen. Your profile, the feedback box and
the plans each live one tap deeper — see Screens 6a–6c.

### SUBSCRIPTION
One card, and the only coloured object on the screen: the brand gradient,
a white circular badge holding a four-armed asterisk, **"Upgrade to Pro"**
over **"Annual plan for RM49.90/year"**, and a chevron. Opens Screen 6c.

Three states, and the middle one matters:
- **not known yet** — *"my.adhd Pro"* / *"Checking your plan…"*. The billing
  read fails closed, so a failed read looks exactly like a free account;
  nothing may say "Upgrade" until a read has actually landed.
- **no plan** — *"Upgrade to Pro"* / *"Annual plan for RM49.90/year"*.
- **on a plan** — the plan's name over *"Renews 14 Mar"*, *"Ends 14 Mar"* if
  it is cancelling, or *"Yours, for good."* for lifetime.

**The whole group is absent when billing is switched off**, which is how the
iOS shell will close it — the same "leave it empty and the ask never
renders" switch the donation tin uses.

### ACCOUNT
Two things, and they are deliberately not one card:
1. A **Profile** row — the chosen emoji face as its glyph, the greeting
   (*"Hey, Aiman."*) as its sub-label, a chevron. Opens Screen 6a.
2. The **account card**, unchanged: a person glyph beside *"Just this
   device"* and *"Not signed in"*, a note, a gradient **"Sign in with
   Google"**, and a footer row with a hint and a quiet **"Sign out"**. Signed
   in, it also carries a quiet **"Delete account"** behind a hairline, which
   opens a two-step red confirm. That stays here, beside the account it
   ends.

### SYNC CALENDARS
The **Google Calendar card**, unchanged — calendar glyph, *"Google
Calendar"*, a state line (*"Not linked"* / *"Linked"* / *"Needs
reconnecting"* in orange), a note, a gradient **"Link Google Calendar"**,
and a footer with soft **"Open in Google"** and quiet red **"Unlink"**. The
duplicate-calendar notice appears inside it, in orange, when it applies.

It gets a caption of its own rather than a row in Account. Both are Google
and they look alike on purpose, but one is who you are and the other is a
wiring decision.

### ABOUT
Four rows in one card:
1. **Send feedback** — heart glyph, *"Tell us what to fix."* → Screen 6b
2. **Share with friends** — a share glyph, *"Someone you know has this
   too."* Opens the system share sheet, or copies the link and says so.
3. **Privacy policy** — shield glyph → `/privacy`
4. **Terms** — document glyph → `/terms`

### The tail
Small and muted: the line about tasks living in this browser only, and a
version line **`v0.1.0`** with a small **`Beta`** tag. The old
`Privacy · Terms` link line is gone — they are rows now.

**The stat row is not here any more.** It moved to Home; see Screen 1.

---

## SCREEN 6a — Profile

One tap under Settings. Header: back chevron reading **Settings**, title
**Profile**, theme toggle.

The profile card, unchanged: a large emoji avatar face centred, a greeting
under it, a labelled text input *"What should I call you?"*, and a labelled
grid of 12 selectable emoji faces (*"Pick a face"*) with the chosen one
ringed in the accent. Under it, one muted line saying the name and face are
on this device only and do not travel with the lists.

Nothing that ends the account is here.

---

## SCREEN 6b — Feedback

One tap under Settings. Header: back chevron reading **Settings**, title
**Feedback**, theme toggle.

The same box it has always been, unchanged — the heart glyph, **"Tell us
what to fix"**, the lede, the labelled 5-row textarea, a `0 / 2000` counter
beside a gradient **"Send it"**, the *"One a day"* small print, and the
quiet **"Chip in"** ask. Sent, the form is replaced by the thanks card with
the filled **"Chip in"** on it.

Both donate asks render only when a donation link is configured. The iOS
shell pins that empty, so neither appears there.

---

## SCREEN 6c — my.adhd Pro

One tap under Settings, and unreachable when billing is switched off.
Header: back chevron reading **Settings**, title **my.adhd Pro**, theme
toggle.

A headline **"Keep it running."** and a short lede that says what is
honestly true today: sorting a dump costs money every time, nothing in the
app is locked behind a plan, and a plan pays for the part that has a bill.

Then three plan cards, each a name, a price at the right, one note, and a
button:
- **Weekly** — RM9.90/week, *"First 3 days free…"*, soft **"Start the
  trial"**
- **Annual** — RM49.90/year, a **BEST VALUE** pill beside the name, *"RM4.16
  a month. RM0.96 a week."*, gradient **"Choose annual"**. Accent border and
  a washed ground — the recommended one, and the one the Settings card
  names.
- **Lifetime** — RM99.90 once, *"One payment. No renewal to forget about."*,
  soft **"Buy lifetime"**

Under them, a muted line saying a plan needs an account and why, and that
Stripe handles the payment on its own page.

**On a plan**, the three cards are replaced by a single card carrying the
plan name, when it renews or ends, and a soft **"Manage billing"**.

---

## SCREEN 7 — The composer (overlay)

**The only way anything is added.** It used to be a shortcut around the box
on Home; the box is gone, so this is the box now — design it as the primary
surface it has become, not as an overlay on something more important.

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

## SCREEN 8 — The tab bar

A floating rounded pill bar hovering above the bottom edge, with a blur or
solid surface and a soft shadow. Present on Home, Calendar, Lists and Notes
— hidden on the wait, on Settings and the screens under it. It stays up on a
first visit now, because the ＋ is the only way to add anything. Five slots,
four of which are places:
1. **Home** — a house glyph, filled solid when current
2. **Calendar** — an outlined calendar, with a small count badge that turns
   orange when anything it counts is due today or past
3. **A raised centre `+` button** in the brand gradient — bigger than the
   rest, the visual anchor, and since the dump box came off Home the only
   way anything is added. It opens the composer, and never marks itself
   current because it is an action, not a place
4. **Lists** — an outlined checklist, with a small dot when anything is open
   that becomes an orange count when anything is late
5. **Notes** — a page with a folded corner, filled solid when current

**The emoji avatar is no longer in the bar** — it lives on the profile card
in Settings. Feedback and the profile no longer have slots at all.

Active tab sits on a soft slab and fills its glyph where the glyph can carry
a fill (home and notes); the calendar and the checklist stay outlined,
because filled they are unreadable slabs. The rest are muted.

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
