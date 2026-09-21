# archive

Code that is not deleted and is not running. Nothing in here is loaded by a
page of the site, and nothing should start being loaded again without the
change being asked for.

## waves.js

The WebGL wave field. It mounted the hero on `index.html` and a `.panel-wave`
on every sub-page, and exposed `window.myadhdWaves` — `mount()` for a field of
your own, plus `pause`/`play` on the hero's.

Retired on 2026-09-21 in favour of four static radial gradients in
`site.css` ("the field"), which is the background the landing-page mockup
used. The shader cost a GL context and an animation frame on every page for a
texture almost nobody looked at directly.

**It still works.** `waves-lab.html` loads it from here and its sliders drive
it exactly as before — that page was always a workbench, never part of the
site, and it is not in the service worker's shell.

To put it back on a page:

1. `<script src="archive/waves.js" defer></script>` in that page's `<head>`
   (or move the file back to the repo root and drop the prefix).
2. Delete the `.hero-waves, .page-wave .panel-wave` background rule in
   `site.css` so the canvas is not painting over a ground it did not expect.
3. If it goes back site-wide, restore `'/waves.js'` in `sw.js`'s shell list.

Nothing else is needed. `site.js` never stopped looking for it: both call
sites — the hero's scroll pause and the `.panel-wave` mount loop — already
guard on `window.myadhdWaves` and simply do nothing while it is absent. That
is why archiving it took no JavaScript change at all.
