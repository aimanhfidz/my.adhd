# my.adhd

Two things live in this repo and they are not the same project.

- **The web app** — the repo root. `app.html`, `app.js`, `auth.js`,
  `config.js`, `styles.css`, `api/`, and everything beside them. This is
  what deploys to myadhd.my.
- **The iOS shell** — `ios/`. A `WKWebView` that opens
  `https://myadhd.my/app` and adds what a browser tab cannot do on an
  iPhone. It is a case around the web app, not a copy of it.

Each half has a file of standing rules beside this one, and a README with the
whole picture. This file is only what is true of both.

| | standing rules | the whole picture |
|---|---|---|
| **web app** | `CLAUDE.web.md` | `README.md` |
| **iOS shell** | `CLAUDE.ios.md` | `ios/README.md` |

## Focus: iOS

<!-- THE SWITCH. One surface's rules load per session, and this is where it is
     chosen. An @import is skipped when it sits inside backticks, so the parked
     line below reads as a path and does not load. To swap focus, move the
     backticks from one line to the other and say so in your first reply.
     `/context` lists the memory files that actually loaded, if in doubt. -->

@CLAUDE.ios.md

Parked: `@CLAUDE.web.md` — open it by hand if a question crosses the line.

**The web app is still the one that ships.** myadhd.my is the public surface
and the iOS shell is not on a release track, so when the two compete for the
same hour the web app wins. Focus says what this session is *doing*, not which
half matters more.

## Right now

**The app is held behind `/soon`.** `app.html` carries an inline hold in its
`<head>` that sends everyone to `/soon` before first paint, except `localhost`
and a browser that has been given the dev key. The block comment in `app.html`
lists everything to undo when it opens again.

**That hold reaches the iOS shell too, and nobody has fixed it.**
`AppConfig.home` is `https://myadhd.my/app`; the `WKWebView` is not localhost
and carries no dev key, so the shell currently loads `/soon` rather than the
app. The fix belongs on the iOS side — inject the key from `BridgeScript`
before the page runs — and it is not done.

## The boundary, which is what this file is really for

**Work on the iOS shell stays inside `ios/`.** The shell reaches the page two
ways, and neither is a licence to edit the site:

- **Injection.** `ios/MyADHD/BridgeScript.swift` pushes JavaScript into the
  page at load, so the shell works against whatever is deployed — including a
  version that has never heard of it. That property is the point.
- **The snapshot.** Anything running headless — a widget's timeline provider,
  the wallpaper intent — has no web view to ask, so the app writes a keychain
  snapshot (`ios/Shared/TaskSnapshot.swift`) for them to read. That is a second
  coupling to the web app's store, by field name.

**If an iOS change looks like it needs a file outside `ios/` edited, stop and
ask first.** Say what the web change would be and why neither route above will
do it. Changing the website is a decision about the website, not a step in an
iOS task — even when the iOS task is blocked without it.

**The reverse holds too: a change to the web app must not assume the shell
exists.** `ios/README.md` lists the values the shell treats as promises about
the page, and they break quietly when either side moves. Read the list there
rather than trusting a summary — it has grown, and a count written down in
prose goes stale. Grep `ios/` before renaming anything it might name.

## Both halves

- **Never stage whole files.** Unfinished work lives in the same files as
  finished work here; `git add <file>` and `commit -am` have shipped something
  broken twice. Stage hunks.
- **Commits go straight to `main`** — that is what deploys, and a branch here
  only gets merged back.
- `AGENTS.md` is a symlink to this file. One set of house rules, two names.
