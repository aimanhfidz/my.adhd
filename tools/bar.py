"""Rewrite <nav class="bar"> on every page that carries it.

The block is near-identical across the ten pages: the only differences are
.back (absent on index) and which link is the current page. So it is
generated from one source here rather than hand-edited ten times, which is
what the markup comment has been complaining about ("two lists, kept in
step by hand").

It asserts the old block matched before writing, so a page whose bar has
drifted fails loudly instead of being quietly overwritten.
"""
import re, sys, os

PAGES = ['index','about','testimonials','contact',
         'blog','habits','reading-list','tools','soon']

# Not the bare <i aria-hidden="true"> that site.js's ICON_RE rescues — this
# one is classed, and it lives outside the translated <span> rather than
# inside it, so it is never in an innerHTML the language switch rewrites.
CHEV = ('<i class="bar-chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M6 9l6 6 6-6"/></svg></i>')

OFFER = [('/self-check','i050c897','Self-check'),
         ('/habits','i45ab397','Habits'),
         ('/tools','i4fa8cc8','Tools'),
         ('/blog','i0b9d2b2','Blog'),
         ('/reading-list','id80f6ec','Reading list')]
ABOUT = [('/about','i3ffb811','About us'),
         ('/testimonials','i2c2cd2a','Testimonials'),
         ('/contact','i4832e45','Contact us')]

# No hub href and no aria-label: the whole control is the toggle now, and a
# button's visible text is its own accessible name.
GROUPS = [('offer', 'ib953849', 'What we offer', OFFER),
          ('about', 'i6b21fb7', 'About', ABOUT)]


def cur(href, route):
    return ' aria-current="page"' if href == route else ''


def group(slug, prefix, route, indent):
    _, hubkey, hublabel, items = [g for g in GROUPS if g[0] == slug][0]
    pid = '%s-%s' % (prefix, slug)
    i = ' ' * indent
    lis = '\n'.join(
        '%s      <li><a href="%s"%s data-i18n="%s">%s</a></li>' % (i, h, cur(h, route), k, t)
        for h, k, t in items)
    # The label keeps a <span> of its own with the chevron beside it, never
    # inside: the language switch rewrites a data-i18n element's innerHTML
    # whole, and a chevron caught in there would not come back.
    return (
        '%s<button class="bar-group" type="button" aria-expanded="false" aria-controls="%s">\n'
        '%s  <span data-i18n="%s">%s</span>%s\n'
        '%s</button>\n'
        '%s<div class="bar-menu" id="%s" hidden>\n'
        '%s  <ul>\n%s\n%s  </ul>\n'
        '%s</div>'
        % (i, pid,
           i, hubkey, hublabel, CHEV,
           i,
           i, pid, i, lis, i, i))


def build(route, has_back, back_html):
    row = '\n'.join(
        '    <li class="bar-group-item">\n%s\n    </li>' % group(slug, 'menu', route, 6)
        for slug, *_ in GROUPS)
    sheet = '\n'.join(
        '        <li class="bar-row">\n%s\n        </li>' % group(slug, 'sheet', route, 10)
        for slug, *_ in GROUPS)
    lang = ('<nav class="bar-lang" aria-label="Language" data-i18n-aria="89b86ab">\n'
            '      <button type="button" data-lang="en" aria-pressed="true" lang="en">EN</button>\n'
            '      <button type="button" data-lang="ms" aria-pressed="false" lang="ms">BM</button>\n'
            '    </nav>')
    return (
'''<nav class="bar">
''' + (('    ' + back_html + '\n') if has_back else '') +
'''    <a class="brand-lockup" href="/" aria-label="MyADHD home" data-i18n-aria="12f3e1f">
      <svg class="logo" viewBox="0 0 100 100" aria-hidden="true"><use href="#logo-mark"/></svg>
      <span class="wordmark">my<span class="accent">.adhd</span></span>
    </a>
    <p class="bar-org">MyADHD</p>

    <!-- Two groups, each one button that opens the rest. It used to be a
         link plus a separate chevron, because the label was a real
         destination and swallowing it into a button would have stranded
         the page it named. /activities is gone, so there is nothing left
         to strand and the whole control is the toggle — which is where
         everyone was pressing anyway.

         The label sits in a <span> of its own with the chevron beside it,
         never inside it: site.js rewrites a data-i18n element's innerHTML
         whole when the language changes, and its ICON_RE only rescues a
         bare <i aria-hidden="true">, not this classed one. -->
    <ul class="bar-links">
''' + row + '''
    </ul>

    <!-- filled in by clock.js, and hidden until it is -->
    <p class="nav-clock" hidden><span class="nc-place"></span><span class="nc-time"></span></p>

    ''' + lang + '''
    <button class="theme-toggle" type="button" aria-label="Switch to dark mode">
      <svg class="t-moon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.9 8.9 0 1 0 11.1 11.1z"/></svg>
      <svg class="t-sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2.4v2.4M12 19.2v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.4 12h2.4M19.2 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>
    </button>

    <button class="bar-toggle" type="button" aria-expanded="false" aria-controls="bar-sheet" aria-label="Open menu" data-i18n-aria="197101e">
      <span class="nt-bars" aria-hidden="true"><i></i><i></i></span>
    </button>

    <!-- The same two groups again, stacked. They are generated from one
         source in tools/bar.py, so the row and the sheet cannot drift the
         way the two hand-kept lists used to. -->
    <div class="bar-sheet" id="bar-sheet" hidden>
      <ul>
''' + sheet + '''
      </ul>
      <nav class="bar-lang sheet-lang" aria-label="Language" data-i18n-aria="89b86ab">
        <button type="button" data-lang="en" aria-pressed="true" lang="en">EN</button>
        <button type="button" data-lang="ms" aria-pressed="false" lang="ms">BM</button>
      </nav>
    </div>
  </nav>''')


def find_bar(s):
    start = s.index('<nav class="bar">')
    depth = 0
    for m in re.finditer(r'</?nav\b', s[start:]):
        if s[start + m.start() + 1] == '/':
            depth -= 1
            if depth == 0:
                return start, start + s[start:].index('>', m.start()) + 1
        else:
            depth += 1
    raise SystemExit('unbalanced <nav>')


for name in PAGES:
    p = name + '.html'
    s = open(p).read()
    a, b = find_bar(s)
    old = s[a:b]
    assert old.count('<nav') == 3, '%s: expected 3 navs in the bar, found %d' % (p, old.count('<nav'))
    back = re.search(r'<a class="back".*?</a>', old, re.S)
    route = '/' if name == 'index' else '/' + name
    new = build(route, back is not None, back.group(0) if back else '')
    open(p, 'w').write(s[:a] + new + s[b:])
    print('  %-20s back=%-5s current=%s' % (p, bool(back), route))
