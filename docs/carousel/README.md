# Carousel

Instagram carousel slides in the my.adhd brand, in the layout of the INVT /
Dakreativ reference: floating header, footer rule with a counter, and a
left-aligned body block in the lower-middle of a 1080 × 1350 slide. Three
slide types do everything — **cover**, **point**, **outro** — and one post
file drives both outputs.

Nothing here is part of the web app. It is marketing collateral that happens
to live in the repo so it can use `fonts/` and the brand tokens.

## Write a post

Copy `posts/example-en.json` and edit. Fields:

| key | what |
|---|---|
| `slug` | file name and output folder |
| `lang` | `en` or `ms` — the copy's language, nothing else changes |
| `theme` | `light` (default) or `dark` — only matters with the `gradient` style |
| `style` | `gradient` (default), `violet`, `orange`, `night-orange` or `night-violet` — see *Styles* |
| `label` | tracked caps label top-right, default `myadhd.my` |
| `footer` | caps name bottom-left, default `MYADHD` |
| `slides[]` | in order: one `cover`, N `point`, one `outro` |

Per slide: `kicker` (cover, keep the trailing full stop), `title`, `sub`
(cover), `body` (point/outro), `cta.label` (outro, optional),
`react: false` (outro, hides the icon row).

A `ms` post is written in Malay, not translated into it, in the baku
register of `../bahasa-melayu-reference.md`: `anda` and a sapaan, `tidak`
not `tak`, full spellings, no pasar. The deck follows the four-step
structure there — the cover's `kicker` is the sapaan and its `sub` the line
of empathy, the early points are prinsip, the later ones ikhtiar, and the
outro is the khatimah with its hope and Insya-Allah. An `en` and an `ms`
post of the same idea are two posts, and their slides will not match line
for line.

In a `title`, `[[word]]` turns violet and `\n` forces a line break. Point
numbers and the `01 / 07` counter are computed — never type them. Titles
fit best at three lines or fewer; body copy at three lines.

## Preview

```
python3 serve.py 8131            # from the repo root
open http://localhost:8131/docs/carousel/carousel.html?post=example-en
```

## Render PNGs and a PDF

```
swiftc -O docs/carousel/render.swift -o docs/carousel/out/render
docs/carousel/out/render 'http://localhost:8131/docs/carousel/carousel.html?post=example-en&render=1' docs/carousel/out/example-en
```

Writes `01.png … NN.png` at 1080 × 1350 and `example-en.pdf` (one page per
slide, text selectable). Add a trailing `2` for 2160 × 2700 files. Bump the
server port between rounds if a CSS edit does not show — the server sends
`no-store` but the renderer is belt-and-braces about it anyway.

## Once it is posted

Move the rendered folder into `out/Posted/` (`out/Posted/<slug>/`) when the
deck has gone up on Instagram. Do it for both languages once the topic is up, since
the `ms` deck of a posted topic would be the same post twice. A deck held
back on purpose goes to `out/Later/` instead (Distracted is there because
it repeats the posted Focus deck). The post JSON stays in `posts/` — it is the
source, and a re-render writes back to `out/<slug>/`, so a folder in
`Posted/` is the exact set of files that went live.

## Hand-tweak in a canvas

```
python3 docs/carousel/build_canvas.py docs/carousel/posts/example-en.json
```

Writes one artboard per slide under `out/canvas/<slug>/`. Ask Claude to
open it as a design canvas: the helper that seeds the canvas page ships
with Claude Code, not with this repo. In the canvas you can retype copy and
nudge styles by hand and export PNG/PDF from the toolbar; note those
exports fall back to system fonts, so for the final files come back to
`render.swift`.

## Styles

Five grounds, same layout, faces and mark. A style covers the whole deck,
and an `en` and `ms` post of one topic share it.

| `style` | ground | type | accent |
|---|---|---|---|
| `gradient` | the site's lilac wash as three soft blobs | ink | violet |
| `violet` | solid brand violet + grain | white | pale violet; the mark's pill goes white |
| `orange` | solid brand orange + grain | ink | white; star, counter dot and CTA go ink |
| `night-orange` | near-black, orange glow + grain | white | orange |
| `night-violet` | near-black, violet glow + grain | white | light violet |

Preview any post in any style with `&style=…` on the preview or render URL;
the post's own `style` is ignored while it is there.

**Grid rhythm.** The profile grid went flat when every deck was `gradient`.
Never post two decks of the same style back to back. The queued posts carry
a rotation — violet, orange, night-violet, night-orange, gradient — that
holds if they go up in alphabetical order; post out of order and check the
neighbours.

## Brand rules baked in

- Headings are Baloo 2 at 600, body is DM Sans 400, every label is DM Mono
  in tracked caps. No other faces, no other weights.
- The reference's navy accent is `--violet` here. Orange appears only on
  the counter dot and the CTA circle — never on a heading or a rule — in
  `gradient`, `violet` and `night-violet`. `orange` and `night-orange` are
  the deliberate exceptions, and the mark, dot and CTA re-colour so nothing
  orange sits on orange.
- No photos. Grain is an SVG turbulence layer in `carousel.css`, not an image.
