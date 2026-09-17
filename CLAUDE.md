# my.adhd

The web app. `app.html`, `app.js`, `auth.js`, `config.js`, `styles.css`,
`api/`, and everything beside them. This is what deploys to myadhd.my.

Standing rules are in **`CLAUDE.web.md`**; the whole picture is in
**`README.md`**. This file is what is true whatever you are doing in here.

## The iOS shell is a different repository now

It used to be `ios/`, in this tree. It is
**[aimanhfidz/myadhd.my_IOS](https://github.com/aimanhfidz/myadhd.my_IOS)**
as of 2026-09-18, and nothing about it is in this checkout any more.

That direction of the old boundary now enforces itself — there is no iOS code
here to edit for a web reason. **The reverse still needs saying, and needs it
more than before:**

> **A change to the web app must not assume the shell exists, and must not
> break the things it silently depends on.**

The shell reaches this app two ways, both of which work against whatever is
deployed rather than against this source:

- **Injection.** It pushes JavaScript into the page at load — the haptics hang
  off `.task-check`, `#btn-triage` and `#composer-mic`; the composer is found
  by `#dump-input`; the store is watched by patching `Storage.prototype.setItem`
  for `myadhd.v1`; ticking a task off a widget calls `window.markDone` and
  `window.repaintLists` by name, which only works because `app.js` is a classic
  script with no module wrapper.
- **The snapshot.** It reads `myadhd.v1` and mirrors a trimmed copy into the
  keychain for its widgets and wallpaper, picking task fields out **by name** —
  including `doneAt`, which `pruneDone()` ages on.

None of that is checkable from here. There is no build that fails and no test
that goes red: a rename lands, the deploy is green, and a widget on somebody's
home screen quietly draws a blank day.

**The full list lives in that repo's README, under the promises section.**
Read it there rather than trusting this summary — it has grown, and a count
written down in prose goes stale. Before renaming a selector, an id, a store
key, a task field or one of the two globals above, go and look.

Two files here are also copied into that repo and drift silently:
`fonts/Baloo2-Variable.ttf` (twice) and `icons/render.py`'s `draw_icon()`.
Change either and it changes in one place only until somebody does the other.

## Right now

**The app is held behind `/soon`.** `app.html` carries an inline hold in its
`<head>` that sends everyone to `/soon` before first paint, except `localhost`
and a browser that has been given the dev key. The block comment in `app.html`
lists everything to undo when it opens again.

## House rules

- **Never stage whole files.** Unfinished work lives in the same files as
  finished work here; `git add <file>` and `commit -am` have shipped something
  broken twice. Stage hunks.
- **Commits go straight to `main`** — that is what deploys, and a branch here
  only gets merged back.
- `AGENTS.md` is a symlink to this file. One set of house rules, two names.
