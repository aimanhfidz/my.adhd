"""Turn a post file into a Claude Design canvas: one artboard per slide.

    python3 docs/carousel/build_canvas.py posts/example-en.json

Writes docs/carousel/out/canvas/<slug>/{Main,Point01…,Outro}.dc.html and a
canvas.json, then seeds the canvas page with the design helper if the
DESIGN_SKILL_DIR environment variable points at it (Claude sets this; run
without it and you get just the artboards).

The markup here is the twin of carousel.js — same classes, same structure —
so the canvas looks like the PNGs. carousel.css is inlined as-is except the
@font-face block, which becomes a Google Fonts link: DM Sans, DM Mono and
Baloo 2 all live there, and the canvas iframe can load fonts from nowhere
else. PNG export from the canvas shows the fallback face; the real files
come from render.swift.
"""

import json
import os
import pathlib
import re
import subprocess
import sys
from html import escape

HERE = pathlib.Path(__file__).parent
W, H, GAP = 1080, 1350, 80

FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Baloo+2:wght@400..800&family=DM+Mono&family=DM+Sans:wght@100..900&display=swap">')

MARK = '''<svg viewBox="0 0 100 100" aria-hidden="true">
  <g class="lg-star">
    <rect x="46.5" y="18" width="7" height="64"></rect>
    <rect x="46.5" y="18" width="7" height="64" transform="rotate(90 50 50)"></rect>
    <rect x="46.5" y="18" width="7" height="64" transform="rotate(45 50 50)"></rect>
    <rect x="46.5" y="18" width="7" height="32" transform="rotate(-45 50 50)"></rect>
  </g>
  <path class="lg-pill" d="M64.5 64.5l7 7" stroke-width="7" stroke-linecap="round" fill="none"></path>
</svg>'''

ICONS = {
    'heart': '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"></path>',
    'comment': '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"></path>',
    'send': '<path d="M22 2 11 13"></path><path d="M22 2 15 22l-4-9-9-4z"></path>',
    'save': '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>',
    'arrow': '<path d="M5 12h13M12 5l7 7-7 7"></path>',
}


def icon(name):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>')


def rich(s):
    s = escape(str(s), quote=False)
    s = re.sub(r'\[\[(.+?)\]\]', r'<em class="ac">\1</em>', s)
    return s.replace('\n', '<br>')


def css_for_canvas():
    css = (HERE / 'carousel.css').read_text()
    css = re.sub(r'@font-face\{.*?\}\n', '', css, flags=re.S)       # Google Fonts instead
    css = css.replace('body{\n  background:#8E8CA0;', 'body{\n  background:transparent;')
    return css


def artboard(post, s, i, total, point_no):
    label = post.get('label') or 'myadhd.my'
    org = post.get('footer') or 'MYADHD'
    if s['type'] == 'cover':
        body = ((f'<p class="kicker">{escape(s["kicker"], quote=False)}</p>' if s.get('kicker') else '')
                + f'<h1 class="title">{rich(s["title"])}</h1>'
                + (f'<p class="copy sub">{rich(s["sub"])}</p>' if s.get('sub') else ''))
    elif s['type'] == 'point':
        body = (f'<p class="num">{point_no:02d}.</p>'
                + f'<h2 class="title">{rich(s["title"])}</h2>'
                + (f'<p class="copy">{rich(s["body"])}</p>' if s.get('body') else ''))
    else:
        cta = s.get('cta') or {}
        body = (f'<h2 class="title">{rich(s["title"])}</h2>'
                + (f'<p class="copy">{rich(s["body"])}</p>' if s.get('body') else '')
                + ('' if s.get('react') is False else
                   '<div class="react">' + ''.join(icon(n) for n in ('heart', 'comment', 'send', 'save')) + '</div>')
                + (f'<span class="arrow-cta">{escape(cta["label"], quote=False)} <i>{icon("arrow")}</i></span>'
                   if cta.get('label') else ''))
    theme = 'dark' if post.get('theme') == 'dark' else 'light'
    return f'''<!doctype html>
<html data-theme="{theme}">
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  {FONTS}
  <style>
{css_for_canvas()}
    html{{width:{W}px; height:{H}px; overflow:hidden}}
    body{{display:block; padding:0}}
    a{{color:#7B3FE4}} a:hover{{color:#3A1C86}}
  </style>
</helmet>
<section class="slide is-{s['type']}" data-index="{i + 1}" data-blob="{(i % 3) + 1}" style="width:{W}px; height:{H}px">
  <header class="head">
    <span class="lockup">
      {MARK}
      <span class="wordmark">my<span class="accent">.adhd</span></span>
    </span>
    <span class="label">{escape(label, quote=False)}</span>
  </header>
  <div class="body">{body}</div>
  <footer class="foot">
    <span class="org">{escape(org, quote=False)}</span>
    <span class="count">{i + 1:02d} / {total:02d}</span>
  </footer>
</section>
</x-dc>
</body>
</html>
'''


def main(path):
    post = json.loads(pathlib.Path(path).read_text())
    slug = post.get('slug') or pathlib.Path(path).stem
    out = HERE / 'out' / 'canvas' / slug
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.dc.html'):
        old.unlink()

    slides = post['slides']
    total = len(slides)
    names, boards, point_no = [], [], 0
    for i, s in enumerate(slides):
        if s['type'] == 'cover':
            name = 'Main'
        elif s['type'] == 'point':
            point_no += 1
            name = f'Point{point_no:02d}'
        else:
            name = 'Outro'
        (out / f'{name}.dc.html').write_text(artboard(post, s, i, total, point_no))
        names.append(name)
        boards.append({'file': f'{name}.dc.html', 'title': f'{i + 1:02d} {s["type"]}',
                       'x': i * (W + GAP), 'y': 0, 'w': W, 'h': H})
    (out / 'canvas.json').write_text(json.dumps(
        {'artboards': boards, 'launch': {'view': 'canvas'}}, indent=2))
    print(f'{len(names)} artboards → {out}')

    skill = os.environ.get('DESIGN_SKILL_DIR')
    if not skill:
        return
    page = out / f'myadhd-carousel-{slug}.html'
    cmd = ['node', f'{skill}/seed-canvas.mjs', '--template', f'{skill}/payload.template.html',
           '--out', str(page), '--title', f'my.adhd carousel — {slug}', '--canvas', str(out / 'canvas.json')]
    for n in names:
        cmd += ['--artboard', str(out / f'{n}.dc.html')]
    subprocess.run(cmd, check=True, cwd=out)
    subprocess.run(['node', f'{skill}/seed-canvas.mjs', '--check', str(page)], check=True)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else HERE / 'posts' / 'example-en.json')
