# my.adhd

Two things live in this repo and they are not the same project.

- **The web app** — the repo root. `app.html`, `app.js`, `auth.js`,
  `config.js`, `styles.css`, `api/`, and everything beside them. This is
  what deploys to myadhd.my.
- **The iOS shell** — `ios/`. A `WKWebView` that opens
  `https://myadhd.my/app` and adds what a browser tab cannot do on an
  iPhone. It is a case around the web app, not a copy of it.

## Where the focus is

**The web app is the public beta.** myadhd.my is open to anyone now, so the
root of this repo is the surface under active development — features, fixes,
and anything a user would notice belong there, and land there first.

**The iOS shell is not on a release track.** It builds and it works, but it
is a case around whatever is deployed, and it is the quieter half on purpose.
An iOS ambition is not a reason to move the web app; if the shell needs
something the page does not offer, that is a conversation about the website,
held separately — see below.

## iOS work does not edit the web app

Work on the iOS shell stays inside `ios/`. The shell gets what it needs by
injecting JavaScript into the page from `ios/MyADHD/BridgeScript.swift`, so
it works against whatever is deployed at myadhd.my — including a version
that has never heard of it. That property is the point, and editing web
files to make an iOS feature work is what breaks it.

**If an iOS change looks like it needs a file outside `ios/` edited, stop
and ask first.** Say what the web change would be and why the injection
route will not do it. Changing the website is a decision about the website,
not a step in an iOS task — even when the iOS task is blocked without it.

The reverse holds too: a change to the web app should not assume the shell
exists. `ios/README.md` lists the four values the shell treats as promises
about the page, and they break quietly when either side moves.
