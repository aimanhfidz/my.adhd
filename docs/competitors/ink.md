# Ink — competitor teardown

Reviewed 2026-09-15 via iPhone Mirroring. Version **1.2.14 (46)** — young app, actively shipping.

## What it is

A **calendar/task/notes app whose real product is your lock screen**. Ink renders your
schedule, tasks and notes as a wallpaper image and swaps it in on a schedule. Everything
else in the app exists to feed that picture.

Positioning line, from the empty Notes tab: *"Create a note to turn it into a lock screen."*

**It is localised for Malaysia.** Designs use Malaysian landmarks (Jalur Gemilang, Sultan
Abdul Samad building), the sample content is in BM (*"Bermula hari ini. Bukan esok."*,
*"Barang dapur"*, *"Hari ini: Basuh baju, Belajar, Pergi pasar"*), and pricing is in RM.
Same market as my.adhd.

## The core mechanic — and its ceiling

Ink is unusually honest about this in an in-app explainer ("How updates work"):

> iOS won't let any app repaint the lock screen live. Ink draws a new picture instead,
> and it goes up on a schedule — not the second your calendar changes.

The pipeline is: you edit a calendar → Ink redraws the wallpaper → **a Shortcuts
automation sets it**, because only Shortcuts can change a wallpaper. Four refresh paths:

1. Automatically, every day (daily Shortcuts automation)
2. Automatically, when you edit (second automation, fires when you close your calendar app)
3. In the app, any time (floating Update button on Discover)
4. From Spotlight (App Intents: "Ink Refresh Lock Screen", "Refresh Lock Screen", "Today's Schedule")

**This is the weak point.** None of it works until the user hand-installs a Shortcuts
automation. The app admits it: *"Your shortcut isn't set up yet, so none of these work.
Setting it up takes about a minute."* The persistent Discover banner — "Finish setting up
your lock screen" — is there because a real share of users never finish.

## Structure

Four tabs: **Discover · Calendar · Tasks · Notes**. Discover is the design catalogue;
the other three are the data that fills the designs.

### Discover (design catalogue)

| Section | Count | What it is |
|---|---|---|
| Lockscreen | 39 | Full wallpaper designs. Filter chips: All, Quote, Activity grid, Month grid, Today… |
| Live Activities | 6 | Lock-screen live cards |
| Widgets | 96 | Home/lock-screen widgets + note-as-wallpaper templates |

Header also carries **Guide** (12-section how-to), a crown (paywall) and a gear (settings).

**Live Activities (all 6):** Weekly Schedule · Today Timeline · Today Events And Task ·
Calendar · List Task · **Pomodoro** (a focus timer as a live activity — the only feature
here that's about doing the work rather than displaying it).

**Widgets:** Calendar, Today Timeline, Tasks, Up Next, Agenda, Month & Tasks,
**Task Graph** (GitHub-contribution-style grid — "2026 · 124 tasks completed"), plus
sticky-note wallpaper templates (Starry Note, Little Things, Red Checklist, Denim Stars,
Happy Note, Little Joys, Happy Tomato). Some carry a **PRO** badge.

### Lock screen design editor

Tap any design → live preview with a crop control, a `···` overflow (Share only), and a
**Set as current** CTA. Four tabs:

- **Background** — add your own photo, or pick a preset; a *Darken* slider
- **Calendar** — which calendars feed this wallpaper (gated: free tier is limited, Pro is "unlimited calendars")
- **Quote** — an ordered list of quotes, *"the wallpaper shows one a day, in this order"*, with Add quote. A "Today" badge marks the active one.
- **Style** — font picker (Default, System, Caveat, Patrick Hand, Excalifont…) and Position (Scale, Horizontal, Vertical sliders)

### Calendar tab

- Month picker, week strip, **four view modes: List · Day · Week · Month**
- Week view is a real hour grid with a now-line and today tinted
- Second header button opens **Calendars** — a source manager grouped into
  DEFAULT (the user's own iOS calendars, colour-coded, toggleable), SUBSCRIBED
  (US Holidays), OTHER (Birthdays), and **SUGGESTED** (Class Schedule, Dates, Travel —
  one-tap add, a nice acquisition-of-data trick)
- A floating **Sync** button (animated Google/Outlook icon) → jumps to Settings
- `+` FAB to create an event

### Tasks tab

- Filters: **Today · To do · Completed · All**
- **Matrix** toggle → a full **Eisenhower matrix**: Do now (Important & Urgent) /
  Plan / Delegate / Drop, each quadrant with its own `+`
- Source filter: **All tasks · Apple Reminders · Created in Ink** — so Ink has its own
  store *and* two-way Apple Reminders integration. Empty state literally says "No reminders".
- Task composer: Title, Notes, Date, Time, Repeat, **Colour** (7 swatches + custom),
  **High priority** toggle, and a **Matrix quadrant picker**

### Notes tab

Sticky-note canvas (coloured, dotted paper). Toolbar:

- **Aa** → Text format sheet: Title/Body scope, pt-size stepper, B/I/U/S, bullet +
  numbered lists, alignment, text colour
- **Checklist**
- **Attachment** (paperclip)
- **Palette** → *Select template*, with **Lockscreen / Widget / Live noti** variants of the
  same note, a *View all*, and **Custom template** (font picker; more controls appear once
  a template is chosen)
- **Bell** → Reminder (Date, Time, Repeat)
- **Use** → push this note to the lock screen

## Integrations

- **iOS Calendar** (on by default, EventKit)
- **Google Calendar** (sign-in)
- **Outlook Calendar** — "Connect directly — no iOS Settings needed"
- **Apple Reminders** (tasks)
- **Shortcuts / App Intents** (the wallpaper-setting mechanism)

## Monetisation

Free with a **Pro** upgrade. Paywall headline: *"Unlock everything — make your lock screen
feel made just for you."*

| Plan | Price | Note |
|---|---|---|
| Weekly | **RM9.90** | 3-day free trial |
| **Lifetime** | **RM99.90** | marked BEST VALUE, pre-selected |
| Annual | **RM49.90** | RM4.16/month · "just RM0.96/week" |

Pro unlocks: **unlimited calendars**, **all premium templates**, **day colours & backgrounds**.

Worth noting: lifetime is pre-selected and priced at exactly 2× annual — they're pushing
one-time purchase over subscription, and weekly at RM9.90 is priced to make lifetime look
obvious.

## Settings (full)

Subscription · Sync calendars (iOS / Google / Outlook) · Set up shortcut ·
How updates work · **Lunar calendar** toggle · Rate the app · Share with friends ·
Privacy policy · Version 1.2.14 (46).

No account, no login, no cloud sync surface anywhere — it looks device-local plus
whatever calendar providers you connect.

## Read on it, vs my.adhd

**Where they're strong**

- The lock screen is a genuinely good distribution surface — it's the one screen an ADHD
  user looks at 80× a day without deciding to.
- Design catalogue is deep (39 + 6 + 96) and the BM/Malaysian art direction is real
  localisation, not a translated string file.
- Eisenhower matrix + Apple Reminders sync is a more complete task model than most
  wallpaper apps bother with.
- Lifetime pricing at RM99.90 is an easy yes for a Malaysian buyer who hates subscriptions.

**Where they're exposed**

- **The Shortcuts dependency is the whole business risk.** Setup is multi-step, easy to
  abandon, and silently broken when the automation is deleted. An app that needs a
  one-minute manual automation before it does anything is the opposite of an ADHD-friendly
  onboarding.
- **It's a display layer, not a decision layer.** Ink shows you everything you have to do.
  Nothing in it decides *what to do next* — no triage, no single-task focus, no "the app
  picks". The only doing-feature is a Pomodoro live activity.
- Empty-handed on an empty account: the three data tabs were all empty states with no
  suggested first action beyond "create one".
- No brain-dump/capture surface. Everything assumes you already know the task and will
  fill in Title/Date/Time/Repeat/Colour/Quadrant — six decisions to record one thing.

**The gap it leaves:** Ink competes on *how your day looks*. my.adhd competes on *what you
do next*. Those aren't the same product, and Ink's own feature list shows it has no answer
to triage. The thing worth stealing is the surface, not the model — the lock screen is
where "one task" would land hardest, and Ink has already proven users will install a
Shortcuts automation to get content there.
