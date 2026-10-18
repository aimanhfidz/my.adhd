#!/usr/bin/env python3
"""Build the one file that gets uploaded to Bayarcash.

summit.html loads its two faces from ../../fonts/ so it previews from
the repo. A page uploaded on its own can't, and a page that asks a third
party for its type flashes the wrong one. So this subsets each face to
the Latin the page uses, compresses it to woff2, and inlines it, and
does the same for the speakers' cut-outs as WebP.

    python3 docs/summit/build.py

Writes docs/summit/out/summit-bayarcash.html. Needs fontTools, brotli and Pillow.
"""
import base64
import io
import re
from pathlib import Path

from fontTools import subset
from PIL import Image
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
SRC = HERE / "summit.html"
OUT = HERE / "out" / "summit-bayarcash.html"

# Basic Latin, Latin-1, the dashes, quotes and ellipsis, the bullet,
# and the arrows and minus a label might reach for.
UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) +
    list(range(0x2010, 0x2028)) + list(range(0x2030, 0x203B)) +
    [0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x00D7]
)


def woff2(path: Path) -> bytes:
    font = TTFont(path)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]       # keep kerning and ligatures
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    return buf.getvalue()


def main() -> None:
    html = SRC.read_text(encoding="utf-8")
    pattern = re.compile(r'url\("\.\./\.\./fonts/([A-Za-z0-9-]+\.ttf)"\) format\("truetype"\)')
    found = pattern.findall(html)
    if len(found) != 2:
        raise SystemExit(f"expected 2 font urls in summit.html, found {len(found)}")

    sizes = {}

    def inline(m: re.Match) -> str:
        data = woff2(REPO / "fonts" / m.group(1))
        sizes[m.group(1)] = len(data)
        return 'url(data:font/woff2;base64,%s) format("woff2")' % base64.b64encode(data).decode("ascii")

    html = pattern.sub(inline, html)

    # The speakers' cut-outs: each is named once, in the PHOTOS block, so
    # each goes in once. WebP keeps the transparency at a fraction of PNG.
    photo = re.compile(r'url\("photos/out/([a-z0-9-]+)\.png"\)')

    def inline_photo(m: re.Match) -> str:
        img = Image.open(HERE / "photos" / "out" / (m.group(1) + ".png")).convert("RGBA")
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=82, method=6)
        sizes["photo " + m.group(1)] = buf.tell()
        return 'url(data:image/webp;base64,%s)' % base64.b64encode(buf.getvalue()).decode("ascii")

    html, n = photo.subn(inline_photo, html)
    if n != len(set(photo.findall(SRC.read_text(encoding="utf-8")))):
        raise SystemExit("a photo is referenced more than once; name it once in the PHOTOS block")

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")

    for name, n in sizes.items():
        print(f"  {name:28} {n / 1024:6.1f} KB")
    print(f"wrote {OUT.relative_to(REPO)}  {OUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
