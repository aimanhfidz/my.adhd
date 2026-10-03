# Promo video

A 30-second vertical promo (1080×1920, 30fps, silent) for the web app, drawn
in code in a hand-drawn editorial style: loose boiling ink, rough coral paint,
a white character with rosy cheeks.

- `promo.html` is the film. Every frame is `seek(t)`, a pure function of time.
- `render.swift` steps through it and writes an H.264 MP4 with AVFoundation.
  No ffmpeg is needed.
- `out/` holds the build output and is gitignored.

## Watch it live

    python3 serve.py 8770
    open http://localhost:8770/docs/promo/promo.html

Space pauses, ←/→ step by a second, and a click scrubs to where you clicked.
It has to be served, because it loads `/fonts/Baloo2-Variable.ttf`. Caveat, the
handwriting, comes from Google Fonts, so rendering needs a connection.

## Render

    swiftc -O docs/promo/render.swift -o docs/promo/out/render
    docs/promo/out/render "http://localhost:8770/docs/promo/promo.html?render=1" docs/promo/out/myadhd-promo.mp4

A full render takes roughly 10 to 15 minutes. To check single frames first:

    docs/promo/out/render "<same url>" docs/promo/out/stills --stills 1,8,14,21.3,28.5

## Storyboard

| Time | Caption | What happens |
|---|---|---|
| 0–6s | Your head, right now. | A worried character; to-dos orbit a scribbled thought cloud |
| 6–12s | Dump it all out. | A phone rises; the to-dos fly into it; tap on "Clear my head" |
| 12–18s | It sorts itself. | The same words slide into Today / Coming up / No date yet |
| 18–24s | Then, just one thing. | One card, "reply to boss"; the tick draws; the character jumps |
| 24–30s | (end card) | The mark draws itself; tagline; "Free on the web · myadhd.my" |

## Changing it

- **Captions:** `S.caps` in `build()`.
- **To-dos and their lists:** `TODO`.
- **Timing:** the numbers in `seek()`. Every time there is in seconds.
- **Colours:** `C`. It is kept to ink, coral and paper. The brand orange and
  violet appear on the logo only.
- **Font names with a digit** must be quoted inside the attribute
  (`'"Baloo 2"'`). Unquoted, `Baloo 2` is not a valid family name and the
  text silently falls back to serif.

## v2 — the app itself

`promo-v2.html` is a second film on the same pipeline: 30 seconds, 1080×1920,
30fps, silent. v1 is a cartoon; v2 is the app. Its screens are rebuilt in HTML
from `theme.css` and the rules in `styles.css`, with the copy taken from
`app.html` and `app.js`, inside a phone. The captions above it carry the story.
It uses only the brand's three faces (Baloo 2, DM Sans and DM Mono, all
self-hosted), so it renders offline.

    python3 serve.py 8770
    open "http://localhost:8770/docs/promo/promo-v2.html"          # plays
    open "http://localhost:8770/docs/promo/promo-v2.html?t=18.5"   # paused there

Space pauses, ←/→ step a second, `,`/`.` step a frame, and a click scrubs.

Render it with the same binary as v1:

    swiftc -O docs/promo/render.swift -o docs/promo/out/render
    docs/promo/out/render "http://localhost:8770/docs/promo/promo-v2.html?render=1" docs/promo/out/myadhd-promo-v2.mp4
    docs/promo/out/render "<same url>" docs/promo/out/v2-stills --stills 2,7,11,15,20,24,26,29
    python3 docs/promo/sheet.py docs/promo/out/v2-stills docs/promo/out/v2-sheet.png

A full render takes a few minutes. There are no SVG filters in this one, so it
is far quicker than v1.

| Time | Label · caption | What happens |
|---|---|---|
| 0–4s | Your head, right now. | The eight to-dos pile up in DM Sans, bigger and darker as they come |
| 4–9s | 01 · The dump — Type it. Say it. All of it. | The phone rises. Clear my head, then the composer; hold to talk fills it, and the date chips appear |
| 9–11.5s | 02 · The sort — It sorts itself. | Sort it; the mark thinks while the three loading lines turn over |
| 11.5–17s | 03 · The lists — Into lists. By day. | Late / Today / Coming up / No date yet; a push in on the late chip, then a scroll |
| 17–21s | 04 · First step — A first step you can't refuse. | Tax form opens to "Start here — 2 minutes", then Too big — break it down |
| 21–24s | 05 · Calendar — Dates go to your calendar. | October fills with the dentist and the birthday; the Google Calendar toast |
| 24–26s | 06 · Done — Tick it off. Head's clear. | Two ticks, Done. with Undo, then home: Head's clear. Nothing waiting. |
| 26–30s | (end card) | The mark draws arm by arm, the capsule last and still apart; my.adhd, "Understand Your Mind. Own Your Day." and myadhd.my |

Where it departs from the running app, it does so for the brand book:

- **One orange thing per frame.** The app paints Late orange four ways at
  once and rings the theme toggle in it. Here only the late chip carries
  orange, as a wash plus an edge, beside the mark. The toggle and the tab
  badges are left out.
- **No welcome meme.** It is someone else's picture, and the brand uses no
  borrowed imagery.
- **The film's today is Thursday 1 October 2026.** That makes the tax form
  (30 Sep) late, the dentist Tomorrow and the birthday Sun 4 Oct.
- **No NOW screen, matrix, habits or "free".** The web app has none of the
  first three, and Pro plans exist.

Changing it:

- **Timing:** `T` at the top of the script. Every time there is in seconds.
- **Captions:** `CAPS`. A `\n` forces a line break.
- **The dump text:** `DUMP`.
- **The cards:** `TASKS`.
- **The hook's words:** `ITEMS` in `build()`.
