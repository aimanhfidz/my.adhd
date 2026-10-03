# Poster

One 1080 × 1350 Instagram poster announcing the "what is adhd??" online
talk, in the carousel's look: same size, faces, header lockup, footer rule
and grain, from `../carousel/carousel.css`. `poster.css` holds only the
poster's body block, plus one twist on the `orange` style — accent words go deep violet
(`#4A1FB0`), not white. Keep violet on display-size type only; it is too low
contrast on orange for body copy.

The copy is inline in `poster.html`. The `[bracketed]` date, time, place and
speaker are placeholders until the talk is confirmed.

## The QR code

`qr.svg` is a stand-in that points at https://myadhd.my. Once the sign-up
link exists, regenerate it (CoreImage, nothing to install), then re-render:

    swiftc -O docs/poster/qr.swift -o docs/poster/out/qr
    docs/poster/out/qr 'https://the-signup-link' docs/poster/qr.svg

It sits on a white card on purpose: orange is too little contrast to scan.

## Preview

    python3 serve.py 8218            # from the repo root
    open http://localhost:8218/docs/poster/poster.html

## Render

    swiftc -O docs/poster/render.swift -o docs/poster/out/render
    docs/poster/out/render 'http://localhost:8218/docs/poster/poster.html?render=1' docs/poster/out      # 1080×1350
    docs/poster/out/render 'http://localhost:8218/docs/poster/poster.html?render=1' docs/poster/out 2    # 2160×2700

Writes `<slug>.png` (or `<slug>@2x.png`) and `<slug>.pdf`; the slug is the
page's `body[data-slug]`. `out/` is gitignored.
