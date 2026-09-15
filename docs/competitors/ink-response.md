# What to build after the Ink teardown

Companion to [`ink.md`](ink.md). Written 2026-09-15, against the working tree —
which already has `screen-notes`, `screen-plans` and `screen-settings` in
flight, and the app held behind `/soon`.

## The one-line read

**Ink competes on how your day looks. We compete on what you do next.**
Their whole feature list is a display layer with no triage in it, and ours is a
triage engine with almost no display surface. The move is not to grow a
template gallery — it is to put *our* output on *their* surface, where we can
do it natively and they cannot.

## Decide before `/soon` comes down

### 1. Stop matching Ink's price exactly

RM9.90 weekly / RM49.90 annual / RM99.90 lifetime is Ink's card, digit for
digit. A buyer who sees both learns nothing from the price, and they got there
first with a cheaper product to run — they have no per-use API cost and we have
two (`api/triage.js`, `api/transcribe.js`).

Either move the numbers or make the numbers mean something different. The
second is better, and it is the next item.

### 2. Gate volume, never the funnel

Ink gates **features**: templates, colours, calendar count. Copying that here
would mean an ADHD app that refuses to sort your head until you pay, which is
the one thing it cannot do and stay itself.

So: **dump → triage → one task stays free for ever**, with a daily cap on the
calls that actually cost money, and Pro buys the cap away plus the surfaces
(widgets, Google Calendar, cloud sync across devices). That inverts Ink's
model and it is defensible in a sentence: *we never charge you to think
straight, we charge you to keep it everywhere.*

`billing.entitled()` is already truthful and read by nothing. The cap is the
first thing that should read it, server-side, per `README.md`'s own rule.

## Build: the lock screen, natively

This is the whole opportunity in the teardown. Ink proved Malaysians will
install a **Shortcuts automation** to get content onto a lock screen. That is
an extraordinary amount of friction to accept, and it tells you how much people
want that surface.

We can have the good half without the fragile half. Ink renders a *picture*
because a wallpaper is the only way to get arbitrary layout onto a lock screen
— and the price is a manual automation, a stale image, and a permanent "finish
setting up" banner. A widget and a Live Activity are **live, native, and need
no automation at all**.

### 3. The "one task" widget — lock screen and home screen

`ios/README.md` already calls this out: *"One task is a home-screen widget
waiting to happen."* It is the single highest-leverage thing on this list,
because the widget *is* the product statement:

> **Next: Renew passport**
> *Open the browser and search "passport renewal Malaysia"*

Ink's best widget is an agenda list. Ours would be one task and a 2-minute
first step. There is no contest on an ADHD lock screen — a list is the thing
that caused the freeze.

**It needs no web change.** `BridgeScript.swift` already reads the page;
it can mirror the next task into the shared keychain drawer `DumpShare` already
uses, and the widget reads that. Honest limitation: the mirror only refreshes
while the shell has been opened, so the widget shows last-known state. That is
still fresher than Ink, whose wallpaper is by their own admission *"not the
second your calendar changes."*

### 4. A Live Activity for the task you are on — not a Pomodoro

Ink's only "doing" feature is a Pomodoro live activity, and timers are on our
deliberately-not-in-the-beta list for good reason. But a Live Activity that
carries **the current task and its first step**, with a done button, is not a
timer — it is the one-task screen, pinned where you cannot lose it. No
countdown, no pressure, no streak.

## Build: capture, where they have nothing

Ink has **no capture surface at all**. Every task costs six decisions —
title, date, time, repeat, colour, quadrant. That is our entire thesis about
why people don't write things down, demonstrated by a competitor.

### 5. Control Centre control + Action Button for "dump a thought"

We already have the share sheet, Siri and hold-to-talk. The missing entry is
the cheapest one: an iOS Control Centre control and an Action Button target
that opens straight into the composer, already recording. `DumpIntent.swift`
exists; this is mostly wiring.

The argument `voice.js` makes about the bus, carried one step further back
again — Siri still needs a phrase, the Action Button needs a press.

### 6. Finish the share extension

It is marked a proof of concept in `ios/README.md` and it shows: the button
still says **Post**, and a shared page arrives as `Title — url`. It is the only
way a thought that arrives inside somebody else's app reaches us. Worth the
polish now that we know no competitor has an equivalent.

## Build: make triage know what Ink can only draw

### 7. Read the calendar back, for busy-awareness

`README.md` lists this under *Still not in it*: **"Reading events back out, so
the app never knows you are busy."** That is the most valuable missing input in
the app. "One task" handing someone a 45-minute job when they have a meeting in
ten is the failure that makes them stop trusting it.

Ink shows you four calendar views and cannot do anything with them, because it
has no triage. We have the triage and not the data. Close that and we get
something they structurally cannot answer.

**Do it through EventKit on the shell side, not by escalating the Google
scope.** `calendar.readonly` is sensitive and drags verification behind it;
EventKit is a local permission, and the shell can inject free/busy into the
page the same way it injects everything else. `calendar.app.created` stays
exactly as it is — which is a promise in the privacy page we should not
reopen.

### 8. Offer to import what is already on the phone

Ink's **SUGGESTED calendars** row (Class Schedule, Dates, Travel, one tap to
add) is a neat cold-start trick, and their empty states are otherwise dead —
three tabs that say "nothing yet" and offer no first move.

Ours should offer to read existing **Reminders** and hand them to triage as a
first dump. An app that is useful before you have typed anything beats one that
waits.

## Do not build

Each of these is on Ink's list and each would cost us more than it returns.

| Not this | Why |
|---|---|
| **A wallpaper generator** | It is their liability, not their asset — a manual Shortcuts automation, a stale picture, and a permanent "finish setting up" banner. A widget beats it on every axis. |
| **The Eisenhower matrix** | It asks the user to classify what the model is supposed to classify for them. Our ordering is deadline-first and argued for in the README; a 2×2 that asks "is this important?" is the freeze, drawn as a grid. |
| **A Pomodoro** | Already on *deliberately not in the beta*, with timers and streaks and XP. Nothing in this teardown changes that argument. |
| **A template / font / colour gallery** | 39 lockscreens, 96 widgets, six fonts. That is Ink's actual business and it is a content treadmill. Vivid Orange means *act now* and nothing else — a colour picker ends that rule. |
| **A second task model** | Ink syncs Apple Reminders *and* keeps its own store, with a filter to tell them apart. Two sources of truth is a support burden; `localStorage` stays ours. Reading Reminders once, as import (#8), is not the same thing. |

## Two things we have that they cannot copy quickly

Worth saying out loud, because both are currently invisible to anyone who
hasn't used the app.

**Rojak capture.** The voice pipeline handles a Malay sentence with English
words in it, carries your proper nouns up as vocabulary, and comes back with
*"ring Aunty Siti about the kenduri"* instead of *"ring Wanty City about the
Kendari."* Ink has no capture at all, so there is nothing for them to localise.
Their BM is sample content on a wallpaper; ours is in the part that has to
understand you. **The demo is the marketing** — a rojak paragraph going in and
clean tasks coming out is a thing no competitor can answer this year.

**Accounts and cross-device sync.** Ink has no account, no login, no cloud
surface anywhere — it is device-local plus whatever calendars you connect.
Change your phone and it is gone. `cloud.js` is a genuine advantage and nothing
on our marketing says so.

## Order

Before `/soon` comes down:

1. Pricing decision (#1) and the free-tier cap (#2) — the billing rail is
   finished and reads nothing, so reopening without this either burns API
   budget or gates the wrong thing.

After, in this order:

3. One-task widget (#3) — highest leverage, and `ios/` can do it alone.
4. EventKit busy-awareness (#7) — makes the core better rather than wider.
5. Control Centre / Action Button capture (#5).
6. Live Activity (#4).
7. Share extension polish (#6), Reminders import (#8).

## One caution on notes

`screen-notes` is in the working tree and Ink's Notes tab is its weakest,
most scope-crept surface — rich text, fonts, colours, attachments, templates,
reminders, three template variants. A note in our app earns its place only if
it feeds the funnel: something you can dump *from*, or a place a first step can
grow into a checklist. A second writing surface that does not feed triage is
the beginning of a different app.
