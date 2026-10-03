"""Write the Living with ADHD hub and its topic pages from the carousel posts.

    python3 tools/topics.py

One source, three outputs, so none of them can drift from the others:

  living-with-adhd.html          the hub
  living-with-adhd/<slug>.html   one page per topic, EN in the markup
  topics.ms.js                   the Malay for every string on all of them,
                                 keyed the way site.js matches it

The pages are built from the site's own parts, laid out the way every
other sub-page is: an opener (kicker, page title, body copy), sections that
each open on a kicker and an h2, the ruled .grid for anything in a set
(with a .filler where a row does not divide), an .ask to end on, and the
pager. The sprite, the wave and the footer are lifted from habits.html,
and the bar is tools/bar.py's, so a change to any of those reaches these
pages on the next run.

The words are the carousels' own (docs/carousel/posts/<slug>-{en,ms}.json),
so a carousel edited and re-rendered is a page edited too: re-run this. The
Malay is the posts' Malay, which is written, not translated — so a Malay
post with a point fewer than its English one is allowed, and the points go
over as one grid per language rather than point by point.

Three things a carousel says that a web page should not, and which are
dropped here rather than in the posts: the cover's "Saudara-saudari
sekalian." salutation, the outro's title ("Save this for…", which is an
Instagram instruction), and "tell us in the comments".

Running it twice changes nothing.
"""
import hashlib, html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
os.chdir(ROOT)
from bar import build as build_bar  # noqa: E402  (bar.py writes nothing on import)

POSTS = 'docs/carousel/posts'
HUB = 'living-with-adhd.html'
OUT = 'living-with-adhd'
TEMPLATE = 'habits.html'   # where the sprite, the wave and the footer come from

# slug, group, English name, Malay name — in the order the hub shows them.
TOPICS = [
    ('time-blindness',  'time', 'Time blindness',        'Buta masa'),
    ('focus',           'time', 'Focus',                 'Fokus'),
    ('distracted',      'time', 'Distraction',           'Mudah terganggu'),
    ('hyperfocus',      'time', 'Hyperfocus',            'Hiperfokus'),
    ('procrastination', 'time', 'Procrastination',       'Menangguh'),
    ('forgetful',       'time', 'Forgetting',            'Mudah lupa'),
    ('rsd',             'feel', 'Rejection sensitivity', 'Sensitif terhadap penolakan'),
    ('big-feelings',    'feel', 'Big feelings',          'Emosi yang meluap'),
    ('masking',         'feel', 'Masking',               'Berlakon tenang'),
    ('conversations',   'feel', 'Conversations',         'Perbualan'),
    ('overstimulation', 'feel', 'Overstimulation',       'Rangsangan berlebihan'),
    ('adhd-morning',    'day',  'Mornings',              'Waktu pagi'),
    ('sleep',           'day',  'Sleep',                 'Tidur'),
    ('doom-piles',      'day',  'Doom piles',            'Timbunan barang'),
    ('adhd-tax',        'day',  'The ADHD tax',          'Cukai ADHD'),
    ('burnout',         'day',  'Burnout',               'Burnout'),
]

# id, nav label EN/MS, kicker EN/MS, heading EN/MS
GROUPS = [
    ('time', 'Time &amp; attention', 'Masa &amp; tumpuan',
     'Time and attention.', 'Masa dan tumpuan.',
     'Why time vanishes, focus slips, and starting is the hardest part.',
     'Mengapa masa hilang, tumpuan terlepas, dan memulakan sesuatu paling sukar.'),
    ('feel', 'Feelings &amp; people', 'Emosi &amp; orang lain',
     'Feelings and people.', 'Emosi dan orang sekeliling.',
     'Why small things land hard, and why people cost so much.',
     'Mengapa perkara kecil terasa berat, dan bersama orang lain begitu meletihkan.'),
    ('day', 'The everyday', 'Seharian',
     'The everyday.', 'Kehidupan seharian.',
     'Mornings, sleep, piles and late fees &mdash; and the crash after coping.',
     'Waktu pagi, tidur, timbunan barang dan denda lewat &mdash; serta rebah selepas lama bertahan.'),
]

ICON = ('<i aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" '
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M5 12h13M12 5l7 7-7 7"/></svg></i>')
BACK_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" '
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M19 12H6M12 19l-7-7 7-7"/></svg>')
INSTAGRAM = 'https://www.instagram.com/myadhd.my/'

MS = {}       # key -> Malay, for topics.ms.js
MS_ARIA = {}


def key(en):
    """The id site.js looks a string up by: sha1 of its English HTML, with
    the arrow icon standing in as {icon} (site.js does the same swap before
    it reads the Malay)."""
    return 'i' + hashlib.sha1(en.replace(ICON, '{icon}').strip().encode()).hexdigest()[:7]


def el(tag, cls, en, ms, attrs=''):
    k = key(en)
    if k in MS and MS[k] != ms:
        raise SystemExit('two Malay strings for one English one: %r' % en)
    MS[k] = ms
    c = ' class="%s"' % cls if cls else ''
    return '<%s%s%s data-i18n="%s">%s</%s>' % (tag, c, attrs, k, en, tag)


def esc(s):
    return html.escape(s, quote=False)


def flat(s):
    """A carousel line as one web line: no slide breaks, no highlights."""
    return esc(re.sub(r'\s*\n\s*', ' ', s).replace('[[', '').replace(']]', '').strip())


def marked(s):
    """The same, keeping the highlight as the accent <em>."""
    s = esc(re.sub(r'\s*\n\s*', ' ', s).strip())
    return re.sub(r'\[\[(.+?)\]\]', r'<em class="hl">\1</em>', s)


def closing(body):
    """The outro's body, without the carousel's invitation to comment."""
    body = re.sub(r'^(Tell us in the comments\.\s*Then\s+|Bagitahu kat komen\.\s*Lepas tu\s+)', '', body.strip())
    return esc(body[:1].upper() + body[1:])


def load(slug, lang):
    s = json.load(open('%s/%s-%s.json' % (POSTS, slug, lang)))['slides']
    assert s[0]['type'] == 'cover' and s[-1]['type'] == 'outro', slug
    return {'cover': s[0], 'points': [x for x in s if x['type'] == 'point'], 'outro': s[-1]}


DATA = {}
for slug, group, en_name, ms_name in TOPICS:
    DATA[slug] = {'en': load(slug, 'en'), 'ms': load(slug, 'ms'),
                  'group': group, 'en_name': en_name, 'ms_name': ms_name}

GROUP_OF = {g[0]: g for g in GROUPS}


# ---------------------------------------------------------------- shared pieces

tpl = open(TEMPLATE).read()
SPRITE_WAVE = tpl[tpl.index('<svg class="sprite"'):tpl.index('<nav class="bar">')]
FOOTER = tpl[tpl.index('<footer class="foot">'):]
HOME_BACK = re.search(r'<a class="back".*?</a>', tpl, re.S).group(0)
PILL = '<a class="pill" href="/self-check" data-i18n="i1d4d87b">Take the self-check</a>'

MS_ARIA['lwaback'] = 'Kembali ke Hidup dengan ADHD'
HUB_BACK = ('<a class="back" href="/living-with-adhd" aria-label="Back to Living with ADHD" '
            'data-i18n-aria="lwaback">%s</a>' % BACK_SVG)


def head(title, desc, url, kind):
    return '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>%(title)s</title>
<meta name="description" content="%(desc)s" />
<meta name="theme-color" content="#FFFFFF" />
<link rel="canonical" href="%(url)s" />
<link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml" />
<link rel="icon" href="/icons/favicon-32.png?v=3" sizes="32x32" type="image/png" />
<link rel="icon" href="/icons/favicon-16.png?v=3" sizes="16x16" type="image/png" />
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=3" />
<link rel="manifest" href="/site.webmanifest?v=3" />
<meta property="og:type" content="%(kind)s" />
<meta property="og:site_name" content="MyADHD" />
<meta property="og:title" content="%(title)s" />
<meta property="og:description" content="%(desc)s" />
<meta property="og:url" content="%(url)s" />
<meta property="og:image" content="https://myadhd.my/icons/og.png?v=3" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="preload" href="/fonts/DMSans-Variable.ttf" as="font" type="font/ttf" crossorigin />
<link rel="preload" href="/fonts/DMMono-Regular.ttf" as="font" type="font/ttf" crossorigin />
<!-- Written by tools/topics.py. Edit that script or the carousel post it
     reads, not this file, and re-run it. Every path starts with a slash,
     because the topic pages live one folder down. -->
<script src="/theme.js"></script>
<script src="/clock.js" defer></script>
<script src="/site.ms.js" defer></script>
<!-- after site.ms.js, before site.js: it adds to the table site.js reads -->
<script src="/topics.ms.js" defer></script>
<script src="/site.js" defer></script>
<link rel="stylesheet" href="/theme.css" />
<link rel="stylesheet" href="/site.css" />
</head>
<body>

''' % {'title': title, 'desc': desc, 'url': url, 'kind': kind}


# 24x24 line-and-dot marks, one per topic, in the site's .cfig hand:
# .w is an accent stroke, .d an accent dot. Decorative — aria-hidden — so
# the label beside each one is what a screen reader hears.
ICONS = {
    'time-blindness': '<circle class="w" cx="12" cy="12" r="8.5"/><path class="w" d="M12 7.5V12l3 2"/>',
    'focus': '<circle class="w" cx="12" cy="12" r="8.5"/><circle class="w" cx="12" cy="12" r="4.5"/><circle class="d" cx="12" cy="12" r="1.6"/>',
    'distracted': '<circle class="d" cx="6" cy="7" r="1.6"/><circle class="d" cx="17" cy="5.5" r="1.6"/><circle class="d" cx="18.5" cy="15" r="1.6"/><circle class="d" cx="8" cy="17.5" r="1.6"/><circle class="w" cx="12" cy="12" r="2.6"/>',
    'hyperfocus': '<rect class="w" x="3.5" y="5" width="17" height="14" rx="3"/><rect class="w" x="7.5" y="8.5" width="9" height="7" rx="2"/><circle class="d" cx="12" cy="12" r="1.5"/>',
    'procrastination': '<path class="w" d="M7 3.5h10M7 20.5h10M8 3.5c0 5 8 5.5 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 5.5-8 8.5s8 3.5 8 8.5"/>',
    'forgetful': '<circle class="w" cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/><circle class="d" cx="12" cy="12" r="1.8"/>',
    'rsd': '<path class="w" d="M12 19.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.3c0 5.4-7.5 10-7.5 10z"/><path class="w" d="M12 8.5l-1.5 3.5 3 1.5-1.5 3.5"/>',
    'big-feelings': '<path class="w" d="M3.5 13c2-5 4-5 6 0s4 5 6 0 3-4 5-2"/><circle class="d" cx="20" cy="9" r="1.4"/>',
    'masking': '<path class="w" d="M4 8c3-1.6 13-1.6 16 0 0 6-3.4 10-8 10S4 14 4 8z"/><circle class="d" cx="9" cy="10.8" r="1.4"/><circle class="d" cx="15" cy="10.8" r="1.4"/>',
    'conversations': '<path class="w" d="M4 5.5h10.5a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9l-3 2.5v-2.5H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/><path class="w" d="M18.5 9.5H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v2.2l-2.6-2.2H12"/>',
    'overstimulation': '<circle class="d" cx="6" cy="12" r="1.8"/><path class="w" d="M10 8.5a5 5 0 0 1 0 7M13.5 6a8.5 8.5 0 0 1 0 12M17 3.5a12 12 0 0 1 0 17"/>',
    'adhd-morning': '<path class="w" d="M3 17.5h18M7 17.5a5 5 0 0 1 10 0M12 6v2.5M5.5 9.5l1.6 1.6M18.5 9.5l-1.6 1.6"/>',
    'sleep': '<path class="w" d="M18.5 14.6A7.4 7.4 0 0 1 9.4 5.5a7.6 7.6 0 1 0 9.1 9.1z"/><circle class="d" cx="17" cy="6" r="1.3"/>',
    'doom-piles': '<rect class="w" x="5" y="15" width="14" height="5" rx="1.5"/><rect class="w" x="7" y="10" width="11" height="5" rx="1.5"/><rect class="w" x="6" y="5" width="9" height="5" rx="1.5"/>',
    'adhd-tax': '<path class="w" d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z"/><path class="w" d="M9 8.5h6M9 12h6"/><circle class="d" cx="15" cy="15.5" r="1.3"/>',
    'burnout': '<rect class="w" x="3" y="8" width="16" height="9" rx="2.2"/><path class="w" d="M21 11v3"/><rect class="d" x="5.5" y="10.5" width="3" height="4" rx="1"/>',
}
ARROW_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" '
             'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>')
# The orange circle on a card. Outside every translated element, so the
# language switch never has to carry it.
GO = '<i class="sc-arrow" aria-hidden="true">%s</i>' % ARROW_SVG

# The Start-here topic, and the three picks for somebody new.
START = 'time-blindness'
PICKS = ['rsd', 'burnout', 'masking']


def ico(slug):
    return ('<span class="sc-ico" aria-hidden="true"><svg class="cfig" viewBox="0 0 24 24">%s</svg></span>'
            % ICONS[slug])


def name_el(slug, cls):
    d = DATA[slug]
    return el('span', cls, esc(d['en_name']), esc(d['ms_name']))


def q_el(slug, cls):
    d = DATA[slug]
    return el('span', cls, flat(d['en']['cover']['title']), flat(d['ms']['cover']['title']))


def sub_el(slug, cls):
    d = DATA[slug]
    return el('span', cls, flat(d['en']['cover'].get('sub', '')), flat(d['ms']['cover'].get('sub', '')))


def row(slug):
    """A topic as a row: its mark, its name, its question, the arrow."""
    return ('<a class="sr" href="/living-with-adhd/%s">%s<span class="sr-body">%s%s</span>%s</a>'
            % (slug, ico(slug), name_el(slug, 'sc-label'), q_el(slug, 'sr-title'), GO))


def card(slug):
    """A topic as the standard card."""
    return ('<a class="sc" href="/living-with-adhd/%s">%s%s%s%s'
            '<span class="sc-go">%s%s</span></a>'
            % (slug, ico(slug), name_el(slug, 'sc-label'), q_el(slug, 'sc-title'), sub_el(slug, 'sc-text'),
               el('span', '', 'Read', 'Baca'), GO))


def ask():
    """The page's last word, as every sub-page has one: here, the people."""
    return '\n'.join([
        '<section class="ask" id="together" data-reveal>',
        '  ' + el('p', 'ask-line', 'You are not alone. Other people get it.',
                  'Anda tidak keseorangan. Ada orang lain yang faham.'),
        '  ' + el('p', 'ask-lede',
                  'The MyADHD community is adults who know exactly what you mean &mdash; '
                  'diagnosed, waiting, or still wondering, and parents too. The link to join is in '
                  'our Instagram bio.',
                  'Komuniti MyADHD ialah orang dewasa yang faham benar maksud anda &mdash; yang '
                  'sudah didiagnosis, yang sedang menunggu, yang masih tertanya-tanya, dan juga ibu '
                  'bapa. Pautan untuk menyertainya ada dalam bio Instagram kami.'),
        '  ' + el('a', 'arrow-cta', 'Find us on Instagram ' + ICON, 'Cari kami di Instagram {icon}',
                  ' href="%s" target="_blank" rel="noopener"' % INSTAGRAM),
        '  ' + el('a', 'arrow-link', 'Read three stories ' + ICON, 'Baca tiga kisah {icon}',
                  ' href="/testimonials"'),
        '</section>'])


def pager(href, en, ms):
    return '''<nav class="pager" aria-label="Next page" data-i18n-aria="4bfc194">
  <span class="p-label" data-i18n="ibc98198">Next</span>
  %s
</nav>''' % el('a', '', ICON + ' ' + en, '{icon} ' + ms, ' href="%s"' % href)


def tools_doors():
    """The two things for doing rather than reading, as the homepage's own
    solid doors — so the hub and the front page are visibly one place."""
    def door(cls, href, k, mk, t, mt, b, mb, go, mgo):
        return ('<article class="door %s">\n        %s\n        %s\n        %s\n        %s\n      </article>'
                % (cls, el('p', 'door-kicker', k, mk), el('h3', 'door-title', t, mt),
                   el('p', 'door-body', b, mb),
                   el('a', 'door-cta', go + ' ' + ICON, mgo + ' {icon}', ' href="%s"' % href)))
    return '''<section id="tools" data-reveal>
    %s
    %s
    <div class="doors-grid lwa-tools">
      %s
      %s
    </div>
  </section>''' % (
        el('p', 'kicker lwa-k', 'For the day.', 'Untuk hari-hari anda.'),
        el('h2', 'lwa-h2', 'Tools for getting through it', 'Alatan untuk melaluinya'),
        door('door--known', '/habits', 'Habits', 'Tabiat',
             'Systems that work with your brain', 'Sistem yang serasi dengan otak anda',
             'Five habits that still hold up on a bad day.',
             'Lima tabiat yang tetap bertahan pada hari yang sukar.',
             'See the habits', 'Lihat tabiat'),
        door('door--start', '/tools', 'The app', 'Aplikasi', 'my.adhd', 'my.adhd',
             'Empty everything in your head into one box. Get back the one thing to do next.',
             'Curahkan semua yang ada dalam kepala ke dalam satu kotak. Dapatkan kembali satu '
             'perkara untuk dibuat seterusnya.',
             'How my.adhd works', 'Cara my.adhd berfungsi'))


# ---------------------------------------------------------------- the hub

def hub():
    s = DATA[START]
    trio = '''<div class="lwa-trio">
      <article class="door door--known">
        %(k)s
        %(t)s
        %(b)s
        %(go)s
      </article>
      <div class="lwa-warm">
        %(wk)s
        %(wl)s
        %(wgo)s
      </div>
      <div class="sc lwa-picks">
        %(pk)s
        %(rows)s
      </div>
    </div>''' % {
        'k': el('p', 'door-kicker', 'Start here', 'Mula di sini'),
        't': el('h3', 'door-title', flat(s['en']['cover']['title']), flat(s['ms']['cover']['title'])),
        'b': el('p', 'door-body', flat(s['en']['cover'].get('sub', '')) + ' Two minutes to read.',
                flat(s['ms']['cover'].get('sub', '')) + ' Dua minit untuk dibaca.'),
        'go': el('a', 'door-cta', 'Read the guide ' + ICON, 'Baca panduan {icon}',
                 ' href="/living-with-adhd/%s"' % START),
        'wk': el('p', 'sc-label', 'Not sure it&rsquo;s ADHD?', 'Belum pasti ia ADHD?'),
        'wl': el('p', 'lwa-warm-line',
                 'Six questions, five minutes, and a result you can take to a doctor.',
                 'Enam soalan, lima minit, dan keputusan yang boleh anda bawa kepada doktor.'),
        'wgo': el('a', 'pill-go', 'Take the self-check', 'Buat semakan kendiri', ' href="/self-check"'),
        'pk': el('p', 'sc-label', 'New here? Then these.', 'Baru di sini? Mulakan dengan ini.'),
        'rows': '\n        '.join(
            '<a class="sr sr--compact" href="/living-with-adhd/%s">%s%s%s</a>'
            % (p, ico(p), name_el(p, ''), GO) for p in PICKS),
    }

    def n(g):
        return sum(1 for t in TOPICS if t[1] == g)
    chips = [('all', 'All', 'Semua', 16)] + [(g[0], g[1], g[2], n(g[0])) for g in GROUPS]
    chip_html = '\n      '.join(
        '<button class="chip" type="button" data-show="%s" aria-pressed="%s">%s <span class="chip-n">%d</span></button>'
        % (gid, 'true' if gid == 'all' else 'false', el('span', '', en, ms), cnt)
        for gid, en, ms, cnt in chips)
    groups = '\n    '.join(
        '<div class="lwa-group" data-group="%s">\n      <p class="lwa-group-h">%s <span>%d</span></p>\n'
        '      <div class="sr-list">\n        %s\n      </div>\n    </div>'
        % (g[0], el('span', '', g[1], g[2]), n(g[0]),
           '\n        '.join(row(t[0]) for t in TOPICS if t[1] == g[0]))
        for g in GROUPS)

    desc = ('For adults who already know they have ADHD: what it does to time, focus and '
            'feelings, what helps, and a community that gets it.')
    body = '''%(pill)s

<main class="spine">
  <!-- ============ the opener ============
       The page behind the homepage's second door, I ALREADY KNOW. It opens
       on the site's three kinds of card side by side — the homepage's door,
       the self-check's warm card, a standard card of picks — so the three
       places read as one, and then the whole list, filterable. -->
  <section class="lwa-open" data-reveal>
    %(kicker)s
    %(h1)s
    %(lead)s
  </section>

  <section class="lwa-first" data-reveal>
    %(trio)s
  </section>

  <section id="topics" data-reveal>
    %(allk)s
    <div class="chips lwa-chips" data-filter role="group" aria-label="Show topics" data-i18n-aria="lwafilter">
      %(chips)s
    </div>
    %(groups)s
  </section>

  %(tools)s

  %(ask)s

  %(pager)s
</main>

''' % {
        'pill': PILL,
        'kicker': el('p', 'kicker', 'I already know.', 'Saya memang sudah tahu.'),
        'h1': el('h1', 'page-title', 'Living with ADHD.', 'Hidup dengan ADHD.'),
        'lead': el('p', 'body-copy',
                   'What ADHD is actually doing to your day, and what helps. Sixteen short reads '
                   '&mdash; start with the one that sounds like your week.',
                   'Apa yang sebenarnya ADHD lakukan kepada hari anda, dan apa yang membantu. Enam '
                   'belas bacaan ringkas &mdash; mulakan dengan yang paling mirip minggu anda.'),
        'trio': trio,
        'allk': el('p', 'kicker lwa-k', 'All sixteen.', 'Kesemua enam belas.'),
        'chips': chip_html,
        'groups': groups,
        'tools': tools_doors(),
        'ask': ask(),
        'pager': pager('/habits', 'Habits', 'Tabiat'),
    }
    return (head('Living with ADHD — MyADHD', desc, 'https://myadhd.my/living-with-adhd', 'website')
            + SPRITE_WAVE + build_bar('/living-with-adhd', True, HOME_BACK) + '\n\n' + body + FOOTER)


MS_ARIA['lwafilter'] = 'Tunjukkan topik'


# ---------------------------------------------------------------- a topic

def page(i, slug):
    d = DATA[slug]
    en, ms = d['en'], d['ms']
    nxt = TOPICS[(i + 1) % len(TOPICS)]
    ring = [s for s, g, *_ in TOPICS if g == d['group']]
    k = ring.index(slug)
    # The three after this one in its group, wrapping, so every topic is
    # linked from three others and none is left out.
    more = [ring[(k + n) % len(ring)] for n in range(1, 4)]
    g = GROUP_OF[d['group']]

    def points(post):
        # Static cards: words you read, not things you open — no arrow, no
        # hover, so nothing here promises a click.
        return '\n      ' + '\n      '.join(
            '<div class="sc sc--static"><span class="num">%02d</span><p class="sc-title">%s</p>'
            '<p class="sc-text">%s</p></div>' % (n + 1, marked(p['title']), esc(p['body'].strip()))
            for n, p in enumerate(post['points'])) + '\n    '

    desc = flat(en['cover'].get('sub', '')).replace('"', '&quot;')
    body = '''%(pill)s

<main class="spine">
  <section data-reveal>
    <p class="kicker topic-crumb"><a href="/living-with-adhd" data-i18n="ic729436">Living with ADHD</a> <span aria-hidden="true">&middot;</span> %(name)s</p>
    %(h1)s
    %(lead)s
  </section>

  <section data-reveal>
    %(pk)s
    %(points)s
    %(close)s
    %(app)s
    %(note)s
  </section>

  <section data-reveal>
    %(mk)s
    <div class="sc-grid">
      %(more)s
    </div>
  </section>

  %(ask)s

  %(pager)s
</main>

''' % {
        'pill': PILL,
        'name': el('span', '', esc(d['en_name']), esc(d['ms_name'])),
        'h1': el('h1', 'page-title', marked(en['cover']['title']), marked(ms['cover']['title'])),
        'lead': el('p', 'body-copy topic-lead', flat(en['cover'].get('sub', '')), flat(ms['cover'].get('sub', ''))),
        'pk': el('p', 'kicker lwa-k', 'The short version.', 'Ringkasnya.'),
        'points': el('div', 'sc-grid sc-grid--2 topic-points', points(en), points(ms)),
        'close': el('p', 'topic-close', closing(en['outro'].get('body', '')), closing(ms['outro'].get('body', ''))),
        'app': el('a', 'arrow-link topic-app', 'How my.adhd helps ' + ICON, 'Bagaimana my.adhd membantu {icon}',
                  ' href="/tools"'),
        'note': el('p', 'grid-foot',
                   'Adapted from our carousel series. A starting point, not medical advice &mdash; '
                   'for that, talk to a psychiatrist or clinical psychologist.',
                   'Diadaptasi daripada siri karusel kami. Sebagai permulaan, bukan nasihat '
                   'perubatan &mdash; untuk itu, berbincanglah dengan pakar psikiatri atau ahli '
                   'psikologi klinikal.'),
        'mk': el('p', 'kicker lwa-k', 'More like this.', 'Topik berkaitan.'),
        'more': '\n      '.join(card(s) for s in more),
        'ask': ask(),
        'pager': pager('/living-with-adhd/' + nxt[0], esc(nxt[2]), esc(nxt[3])),
    }
    title = '%s — Living with ADHD — MyADHD' % d['en_name']
    url = 'https://myadhd.my/living-with-adhd/%s' % slug
    return (head(title, desc, url, 'article') + SPRITE_WAVE
            + build_bar('/living-with-adhd/' + slug, True, HUB_BACK) + '\n\n' + body + FOOTER)


open(HUB, 'w').write(hub())
os.makedirs(OUT, exist_ok=True)
for i, (slug, *_) in enumerate(TOPICS):
    open('%s/%s.html' % (OUT, slug), 'w').write(page(i, slug))


# ---------------------------------------------------------------- the Malay

def js(d):
    return ',\n'.join('    %s: %s' % (json.dumps(k), json.dumps(v, ensure_ascii=False))
                      for k, v in sorted(d.items()))


open('topics.ms.js', 'w').write('''/* ============ Living with ADHD — Bahasa Melayu ============
   WRITTEN BY tools/topics.py. Do not edit: change the carousel post or the
   tables in that script, and re-run it.

   The Malay for the hub and the topic pages, merged into the table
   site.ms.js sets up. Loaded after site.ms.js and before site.js, which
   reads the table once, at load. */
(function () {
  var M = window.MYADHD_MS;
  if (!M) return;
  var s = {
%s
  };
  var a = {
%s
  };
  for (var k in s) M.strings[k] = s[k];
  for (var j in a) M.aria[j] = a[j];
})();
''' % (js(MS), js(MS_ARIA)))

print('  hub + %d topic pages, %d Malay strings' % (len(TOPICS), len(MS)))
