"""Tile a folder of render stills into one contact sheet.

    python3 docs/promo/sheet.py docs/promo/out/v2-stills docs/promo/out/v2-sheet.png

Reads every still-*.png that render.swift wrote, four to a row, each
labelled with its time.
"""
import glob
import os
import sys

from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(os.path.join(src, 'still-*.png')))
w, h, cols, gap = 360, 640, 4, 16
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + gap) + gap, rows * (h + 44) + gap), (233, 231, 251))
draw = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = gap + (i % cols) * (w + gap), gap + (i // cols) * (h + 44)
    sheet.paste(im, (x, y))
    draw.text((x, y + h + 8), os.path.basename(f)[6:-4] + 's', fill=(16, 16, 24))
sheet.save(out)
print(f'wrote {out}')
