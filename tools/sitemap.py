"""Write sitemap.xml and robots.txt for myadhd.my.

    python3 tools/sitemap.py

The sitemap is every page a search engine should find: each .html at the
root and in living-with-adhd/, by the extensionless address cleanUrls
serves it at, "/" for the home page. Two kinds are left out:

  - anything carrying <meta name="robots" content="noindex…"> — admin,
    billing, soon, waves-lab — so a page that says "don't index me" is
    never also listed as one to index;
  - HELD below: pages that work but that nothing on the site points at yet.
    They come out of HELD with the full opening (the list is in app.html's
    <head>), not before.

focus.myadhd.my is its own host and not listed here; a sitemap only speaks
for the host it is served from.

<lastmod> is the date of the last commit to touch the file, so it moves
when a page ships, not when somebody saves it locally. Commit the page,
then run this, then commit what it wrote. Running it twice changes nothing.
"""
import os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SITE = 'https://myadhd.my'
DIRS = ['.', 'living-with-adhd']
HELD = {'app.html', 'install.html'}
NOINDEX = re.compile(r'<meta\s+name="robots"\s+content="[^"]*noindex', re.I)


def pages():
    for d in DIRS:
        for name in sorted(os.listdir(d), key=lambda n: (n != 'index.html', n)):
            path = os.path.normpath(os.path.join(d, name))
            if not name.endswith('.html') or path in HELD:
                continue
            with open(path, encoding='utf-8') as f:
                if NOINDEX.search(f.read()):
                    continue
            yield path


def url(path):
    slug = path[:-len('.html')]
    return SITE + ('/' if slug == 'index' else '/' + slug)


def lastmod(path):
    out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', path],
                         capture_output=True, text=True, check=True).stdout.strip()
    return out or None  # never committed: no date rather than a made-up one


def sitemap():
    rows = []
    for path in pages():
        when = lastmod(path)
        rows.append('  <url><loc>%s</loc>%s</url>' % (
            url(path), '<lastmod>%s</lastmod>' % when if when else ''))
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + '\n'.join(rows) + '\n</urlset>\n')


ROBOTS = """# Written by tools/sitemap.py. Edit it there.
User-agent: *
Disallow: /api/
Disallow: /admin
Disallow: /docs/
Disallow: /archive/

Sitemap: %s/sitemap.xml
""" % SITE


if __name__ == '__main__':
    for name, text in (('sitemap.xml', sitemap()), ('robots.txt', ROBOTS)):
        with open(name, 'w', encoding='utf-8') as f:
            f.write(text)
        print('wrote', name)
