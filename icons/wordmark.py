"""Draw the my.adhd wordmark and lockup as outlined SVG.

The word is set in Baloo 2 at 700 with -0.03em tracking — the same face,
weight and tracking `.wordmark` carries in theme.css — and then converted to
paths. Outlines rather than a <text> element, because these files travel:
a printer, a slide deck, someone else's laptop. A <text> wordmark silently
becomes Helvetica the moment it leaves this repo.

`my` wears --ink, `.adhd` wears --wordmark-accent, which theme.css pins to
--violet in BOTH themes: the lockup only reads as one object while the word
and the mark's capsule are the same purple.

The mark is the same four bars and capsule as icon-source.svg and render.py,
drawn here without a ground. Change one and change the others, or they drift.

    python3 icons/wordmark.py

Needs fontTools. Writes icons/wordmark*.svg. For the PNGs beside them:

    swiftc -O icons/snap.swift -o icons/out/snap
    icons/out/snap icons/wordmark.svg icons/wordmark-1024.png 1024
"""

import pathlib

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent

WORD, ACCENT_AT = "my.adhd", 2      # everything from index 2 on is the accent
WEIGHT, TRACKING = 700, -0.03       # theme.css .wordmark
UPEM, ASC, DESC = 1000, 1078, -524  # Baloo2-Variable

INK, VIOLET, ORANGE = "#101018", "#7B3FE4", "#F75C03"
PAPER = "#FFFFFF"                   # the word on a dark ground

# .wordmark is 16px beside a 26px .logo with a 10px gap (theme.css), so the
# lockup is written in multiples of the font size and scales as one thing.
FONT = 100.0
MARK_H = FONT * 26 / 16
GAP = FONT * 10 / 16
PAD = FONT * 0.12                   # breathing room so nothing clips at 16px

# The mark's ink runs 18..82 inside its 100-unit box, so a third of that box
# is air. Spacing measures from the ink, or the gap reads as double.
INK_SPAN, INK_LEFT = 0.64, 0.18

# The mark in its own 100-unit box, centred on (50,50) — icon-source.svg.
BARS = [(0, 64), (90, 64), (45, 64), (-45, 32)]   # rotation, length
PILL = 'M64.5 64.5l7 7'


def glyph_paths(text):
    """Every glyph as (svg path data, x offset), in font units, plus the
       total advance and the ink bounds. Tracking is added after each glyph,
       as CSS does."""
    font = instantiateVariableFont(TTFont(ROOT / "fonts/Baloo2-Variable.ttf"),
                                   {"wght": WEIGHT}, updateFontNames=False)
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    out, x, box = [], 0.0, [None] * 4
    for ch in text:
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        bounds = BoundsPen(glyphs)
        glyphs[name].draw(bounds)
        if bounds.bounds:
            x0, y0, x1, y1 = bounds.bounds
            box = [min(box[0], x + x0) if box[0] is not None else x + x0,
                   min(box[1], y0) if box[1] is not None else y0,
                   max(box[2], x + x1) if box[2] is not None else x + x1,
                   max(box[3], y1) if box[3] is not None else y1]
        out.append((pen.getCommands(), x))
        x += glyphs[name].width + TRACKING * UPEM
    return out, x - TRACKING * UPEM, box   # no tracking after the last glyph


def word_svg(paths, width, ink, accent, scale):
    """The word, baseline at y=0, y flipped into SVG's direction. Every
       offset inside the group is in font units — the group scales them."""
    def group(items, fill):
        inner = "".join(
            f'<path transform="translate({x:.1f} 0)" d="{d}"/>'
            for d, x in items if d)
        return f'<g fill="{fill}">{inner}</g>'
    body = (group(paths[:ACCENT_AT], ink) + group(paths[ACCENT_AT:], accent))
    return f'<g transform="scale({scale:.6f} {-scale:.6f})">{body}</g>', width * scale


def mark_svg(size, star, pill):
    bars = "".join(
        f'<rect x="46.5" y="18" width="7" height="{h}"'
        + (f' transform="rotate({r} 50 50)"' if r else "") + "/>"
        for r, h in BARS)
    return (f'<g transform="scale({size / 100:.6f})">'
            f'<g fill="{star}">{bars}</g>'
            f'<path d="{PILL}" stroke="{pill}" stroke-width="7"'
            f' stroke-linecap="round" fill="none"/></g>')


def build(name, ink, accent, star, pill, mark=True, ground=None):
    paths, _advance, box = glyph_paths(WORD)
    scale = FONT / UPEM
    word, _ = word_svg(paths, 0, ink, accent, scale)
    x0, y0, x1, y1 = (v * scale for v in box)   # word ink, baseline at 0, y up

    # Flex centres the mark on the text's line box, not on its ink: the box
    # runs ascender to descender, so its middle sits above the baseline.
    mid = (ASC + DESC) / 2 * scale
    mark_w = MARK_H * INK_SPAN if mark else 0.0
    word_x = mark_w + GAP if mark else 0.0       # where the word's ink starts

    # Everything relative to the baseline, y down, then shifted into the box.
    mark_top = -mid - mark_w / 2 if mark else 0.0
    top = min(mark_top, -y1) if mark else -y1
    bottom = max(mark_top + mark_w, -y0) if mark else -y0
    base, w, h = PAD - top, word_x + (x1 - x0) + 2 * PAD, bottom - top + 2 * PAD

    parts = []
    if ground:
        parts.append(f'<rect width="{w:.2f}" height="{h:.2f}" fill="{ground}"/>')
    if mark:
        # back out the mark box's own air so the gap is measured ink to ink
        parts.append(f'<g transform="translate({PAD - MARK_H * INK_LEFT:.2f} '
                     f'{base + mark_top - MARK_H * INK_LEFT:.2f})">'
                     + mark_svg(MARK_H, star, pill) + "</g>")
    parts.append(f'<g transform="translate({PAD + word_x - x0:.2f} {base:.2f})">'
                 f'{word}</g>')

    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}"'
           f' width="{w:.0f}" height="{h:.0f}" role="img"'
           f' aria-label="my.adhd">\n  ' + "\n  ".join(parts) + "\n</svg>\n")
    (HERE / name).write_text(svg)
    print(f'  {name:26} {w:.0f}x{h:.0f}')


if __name__ == "__main__":
    build("wordmark.svg", INK, VIOLET, ORANGE, VIOLET)
    build("wordmark-dark.svg", PAPER, VIOLET, ORANGE, VIOLET)
    build("wordmark-text.svg", INK, VIOLET, ORANGE, VIOLET, mark=False)
    build("wordmark-text-dark.svg", PAPER, VIOLET, ORANGE, VIOLET, mark=False)
    build("wordmark-mono.svg", "currentColor", "currentColor",
          "currentColor", "currentColor")
