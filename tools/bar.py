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
         'blog','habits','reading-list','tools','soon','living-with-adhd',
         'community','find-help']
# The topic pages under living-with-adhd/ carry this bar too, but they are
# written whole by tools/topics.py, which imports build() from here.

# Not the bare <i aria-hidden="true"> that site.js's ICON_RE rescues — this
# one is classed, and it lives outside the translated <span> rather than
# inside it, so it is never in an innerHTML the language switch rewrites.
CHEV = ('<i class="bar-chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M6 9l6 6 6-6"/></svg></i>')

# (href, key, label). An href of None is a placeholder: a page that is
# planned and not written. It is listed, tagged "Soon", and is not a link —
# a menu item that 404s, or that lands on a page saying nothing, costs the
# reader more than one that says out loud it is not there yet. Give it an
# href when the page exists and the tag goes with it.
LEARN = [('/self-check','i050c897','Self-check'),
         ('/living-with-adhd','ic729436','Living with ADHD'),
         ('/habits','i45ab397','Habits'),
         ('/blog','i0b9d2b2','Blog')]
SUPPORT = [('/tools','i4fa8cc8','Tools'),
           ('/find-help','ifd3ef12','Find professional help'),
           (None,'ic8eddc1','For family and partners')]
COMMUNITY = [('/testimonials','i2c2cd2a','Testimonials'),
             ('/community','ibae7c4c','WhatsApp group'),
             (None,'ic5497bc','Events')]
ABOUT = [('/about','i3ffb811','About us'),
         ('/contact','i4832e45','Contact us')]

SOON = ('i32d3b26', 'Soon')

# (slug, key, label, items). A group with items is a dropdown; one whose
# items is a string is a plain link to that href, with no chevron.
# No hub href and no aria-label on a dropdown: the whole control is the
# toggle, and a button's visible text is its own accessible name.
GROUPS = [('learn', 'ib048378', 'Learn', LEARN),
          ('support', 'if32d5a3', 'Support', SUPPORT),
          ('community', 'ibfd58ee', 'Community', COMMUNITY),
          ('library', 'if958f19', 'Digital library', '/reading-list'),
          ('about', 'i6b21fb7', 'About', ABOUT)]


def cur(href, route):
    return ' aria-current="page"' if href == route else ''


def item(h, k, t, route, i):
    # A placeholder's label and its tag are two strings, so the tag is
    # translated once and the label keeps its own key for when it is a link.
    if h is None:
        return ('%s      <li><span class="bar-soon"><span data-i18n="%s">%s</span>'
                ' <em data-i18n="%s">%s</em></span></li>' % (i, k, t, SOON[0], SOON[1]))
    return '%s      <li><a href="%s"%s data-i18n="%s">%s</a></li>' % (i, h, cur(h, route), k, t)


def group(slug, prefix, route, indent):
    _, hubkey, hublabel, items = [g for g in GROUPS if g[0] == slug][0]
    i = ' ' * indent
    if isinstance(items, str):
        return '%s<a href="%s"%s data-i18n="%s">%s</a>' % (i, items, cur(items, route), hubkey, hublabel)
    pid = '%s-%s' % (prefix, slug)
    lis = '\n'.join(item(h, k, t, route, i) for h, k, t in items)
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


def li_class(slug):
    items = [g for g in GROUPS if g[0] == slug][0][3]
    return 'bar-link-item' if isinstance(items, str) else 'bar-group-item'


def build(route, has_back, back_html):
    row = '\n'.join(
        '    <li class="%s">\n%s\n    </li>' % (li_class(slug), group(slug, 'menu', route, 6))
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

    <!-- Five entries: four groups, each one button that opens the rest,
         and the digital library, which is one page and so one link.
         A group used to be a
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

    <!-- The same five entries again, stacked. They are generated from one
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


# ---------------------------------------------------------------- the footer
#
# The footer's columns are the bar's groups again, so a page added to the
# bar reaches the footer on the same run and the two cannot drift the way
# the hand-kept copies on 34 pages did ("What we offer" outlived the menu
# it named by a month). Differences from the bar, on purpose:
#   - only pages that exist: a footer is a sitemap, so no "Soon" rows;
#   - the digital library is a row under Learn, not an entry of its own;
#   - Support carries the app's own two links, Community the two places
#     the community lives, About the address and the legal pages.
# The app's links say /soon until the full opening (app.html's <head> has
# the list); change them here, not in the pages.
APP = [('/soon', 'ice21cc3', 'Open my.adhd'),
       ('/soon', 'i85773bc', 'Add to home screen')]
SOCIAL = [('https://www.instagram.com/myadhd.my/', None, 'Instagram'),
          ('https://www.threads.com/@myadhd.my', None, 'Threads')]
CONTACT = [('mailto:hello@myadhd.my', None, 'hello@myadhd.my'),
           ('/privacy', 'icf01481', 'Privacy'),
           ('/terms', 'ia55a275', 'Terms')]
FOOT = [('learn', LEARN + [('/reading-list', 'if958f19', 'Digital library')]),
        ('support', SUPPORT + APP),
        ('community', COMMUNITY + SOCIAL),
        ('about', ABOUT + CONTACT)]


def foot_cols():
    def li(h, k, t):
        attrs = ' rel="me noopener" target="_blank"' if h.startswith('https://') else ''
        key = ' data-i18n="%s"' % k if k else ''
        return '        <li><a href="%s"%s%s>%s</a></li>' % (h, attrs, key, t)
    cols = []
    for slug, items in FOOT:
        _, hk, hl, _ = [g for g in GROUPS if g[0] == slug][0]
        rows = '\n'.join(li(h, k, t) for h, k, t in items if h)
        cols.append('    <div class="foot-col">\n      <h2 data-i18n="%s">%s</h2>\n      <ul>\n%s\n      </ul>\n    </div>'
                    % (hk, hl, rows))
    return '<div class="foot-cols">\n' + '\n'.join(cols) + '\n  </div>'


def find_foot(s):
    start = s.index('<div class="foot-cols">')
    end = s.index('\n  </div>', start) + len('\n  </div>')
    assert s[start:end].count('<div class="foot-col">') == 4, 'foot-cols has drifted'
    return start, end


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


if __name__ == '__main__':
    for name in PAGES:
        p = name + '.html'
        s = open(p).read()
        a, b = find_bar(s)
        old = s[a:b]
        assert old.count('<nav') == 3, '%s: expected 3 navs in the bar, found %d' % (p, old.count('<nav'))
        back = re.search(r'<a class="back".*?</a>', old, re.S)
        route = '/' if name == 'index' else '/' + name
        new = build(route, back is not None, back.group(0) if back else '')
        s = s[:a] + new + s[b:]
        foot = '<div class="foot-cols">' in s   # the home page has no full footer
        if foot:
            fa, fb = find_foot(s)
            s = s[:fa] + foot_cols() + s[fb:]
        open(p, 'w').write(s)
        print('  %-20s back=%-5s current=%-18s footer=%s' % (p, bool(back), route, foot))
    print('  then run tools/topics.py: the topic pages take their footer from habits.html')
