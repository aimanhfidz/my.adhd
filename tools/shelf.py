"""Write the shelf on /reading-list from the BOOKS table below.

The page promises three things: only books we have read, a note on who
each is for, and an honest word on the audiobook and the length. So every
book here carries all three, and a book goes in only when somebody here
has finished it.

It rewrites two places and nothing else:
  reading-list.html   the section between the "the shelf" comment and its
                      </section>
  site.ms.js          the Malay between the two "shelf" marker comments

Facts (edition, pages, audiobook length) were checked on 2026-10-19
against the publisher's page or Open Library, and the Audible listing.
Re-check a book's line when you touch it. Titles and authors are not
translated, so they carry no data-i18n.

    python3 tools/shelf.py
"""
import hashlib, json

def key(en):
    """site.js's id for a string: sha1 of its English HTML."""
    return 'i' + hashlib.sha1(en.strip().encode()).hexdigest()[:7]

MS = {}

def el(tag, cls, en, ms, attrs=''):
    k = key(en)
    if k in MS and MS[k] != ms:
        raise SystemExit('two Malay strings for one English one: %r' % en)
    MS[k] = ms
    c = ' class="%s"' % cls if cls else ''
    return '<%s%s%s data-i18n="%s">%s</%s>' % (tag, c, attrs, k, en, tag)


# (slug, English, Malay). The chips filter by these.
GROUPS = [('start', 'Starting out', 'Mula-mula'),
          ('inner', 'Feelings &amp; identity', 'Perasaan &amp; diri'),
          ('home', 'Home &amp; family', 'Rumah &amp; keluarga')]

# (group, title, by, year, (note en, note ms), audio hours, read by the
# author?, pages). Pages are "about" unless the edition gives one figure.
BOOKS = [
    ('start', 'How to ADHD', 'Jessica McCabe', 2024,
     ('The best first book if you were just diagnosed or are still wondering. Warm and well researched. It is long, but the chapters stand alone, so dip in.',
      'Buku pertama yang paling sesuai kalau awak baru didiagnos atau masih tertanya-tanya. Mesra dan dikaji dengan teliti. Ia panjang, tapi setiap bab boleh dibaca sendiri, jadi baca ikut suka.'),
     9, True, 440),
    ('start', 'ADHD 2.0', 'Edward Hallowell &amp; John Ratey', 2021,
     ('Short and upbeat, the quickest read here, and a lift after a diagnosis. Light on depth, and the evidence behind its balance-board exercises is thin.',
      'Pendek dan positif, paling cepat habis dalam senarai ni, dan elok untuk naikkan semangat lepas diagnosis. Tapi tak mendalam, dan bukti untuk latihan papan imbangan dia nipis.'),
     5.5, False, 208),
    ('start', 'Driven to Distraction', 'Edward Hallowell &amp; John Ratey', 2011,
     ('The 1994 classic that got people talking about adult ADHD, revised. The stories still land. It is long, says ADD throughout, and the science has moved on.',
      'Buku klasik 1994 yang buat orang mula bercakap pasal ADHD dewasa, dah disemak semula. Kisah-kisahnya masih kena. Ia panjang, guna istilah ADD dari awal sampai akhir, dan sains dah bergerak ke depan.'),
     13.5, False, 380),
    ('start', 'Taking Charge of Adult ADHD', 'Russell Barkley', 2021,
     ('For the science, from one of the field&rsquo;s leading researchers: executive function, medication, time. Laid out like a workbook, and blunt. No &ldquo;superpower&rdquo; talk.',
      'Untuk sains, daripada salah seorang penyelidik utama bidang ni: fungsi eksekutif, ubat, masa. Disusun macam buku kerja, dan terus terang. Takde cakap pasal &ldquo;kuasa luar biasa&rdquo;.'),
     11, False, 300),
    ('inner', 'Your Brain&rsquo;s Not Broken', 'Tamara Rosier', 2021,
     ('The one on feelings: emotional intensity, shame, and why interest runs the engine. Practical and kind. Its publisher is Christian, and a few lines about prayer show it.',
      'Buku pasal perasaan: emosi yang kuat, rasa malu, dan kenapa minat yang gerakkan enjin. Praktikal dan lembut. Penerbitnya Kristian, dan ada beberapa baris pasal doa.'),
     6, False, 208),
    ('inner', 'Scattered Minds', 'Gabor Mat&eacute;', 1999,
     ('Beautifully written on shame and childhood. Read it for that, not for causes: it puts ADHD down to early stress and plays down genes, which later research does not back. Parents may feel blamed.',
      'Ditulis dengan indah pasal rasa malu dan zaman kanak-kanak. Baca untuk tu, bukan untuk punca: ia kaitkan ADHD dengan tekanan awal hidup dan kurangkan peranan genetik, yang kajian kemudian tak sokong. Ibu bapa mungkin rasa dipersalahkan.'),
     11, False, 360),
    ('inner', 'A Radical Guide for Women with ADHD', 'Sari Solden &amp; Michelle Frank', 2019,
     ('For women who have spent years masking. It is about shame and identity, not organising tips. A workbook, so read it on paper: the exercises do not work on audio.',
      'Untuk perempuan yang dah bertahun-tahun menyamar. Ia pasal rasa malu dan identiti, bukan tip mengemas. Ia buku kerja, jadi baca versi kertas: latihannya tak jalan dalam audio.'),
     6.5, False, 216),
    ('home', 'Order from Chaos', 'Jaclyn Paul', 2019,
     ('Home, laundry, paperwork and routines, from someone who lives with ADHD and writes for brains like hers. Small press, an American household, very practical.',
      'Rumah, baju kotor, kertas kerja dan rutin, daripada orang yang hidup dengan ADHD dan menulis untuk otak macam dia. Penerbit kecil, rumah tangga Amerika, sangat praktikal.'),
     6.5, False, 218),
    ('home', 'The ADHD Effect on Marriage', 'Melissa Orlov', 2010,
     ('For couples, and often read first by the partner without ADHD. Best at naming the parent-and-child pattern couples slide into. It mostly assumes the husband has ADHD, and it can feel heavy.',
      'Untuk pasangan, dan selalunya dibaca dulu oleh pasangan yang takde ADHD. Paling bagus bila namakan corak &ldquo;ibu bapa dan anak&rdquo; yang pasangan mudah tergelincir masuk. Kebanyakannya anggap suami yang ada ADHD, dan ia boleh rasa berat.'),
     8, False, 235),
    ('home', 'Smart but Scattered', 'Peg Dawson, Richard Guare &amp; Colin Guare', 2024,
     ('For parents: executive skills in children, with quizzes to find where your kid gets stuck. Not ADHD-specific. For yourself, the adult version is The Smart but Scattered Guide to Success (2016).',
      'Untuk ibu bapa: kemahiran eksekutif kanak-kanak, dengan kuiz untuk cari kat mana anak awak tersekat. Bukan khusus untuk ADHD. Untuk diri sendiri, versi dewasanya The Smart but Scattered Guide to Success (2016).'),
     13, False, 328),
]

# Headphones and an open book, so the two facts read at a glance.
EAR = ('<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" '
       'stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/>'
       '<path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/></svg>')
PAGE = ('<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" '
        'stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/>'
        '<path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>')


def hours(h):
    en = ('%g' % h).replace('.5', '&frac12;')
    return en


def book(g, title, by, year, note, audio, own, pages):
    h = hours(audio)
    a_en = 'Audiobook, %s hours%s' % (h, ', read by the author' if own else '')
    a_ms = 'Buku audio, %s jam%s' % (h, ', dibaca oleh penulis' if own else '')
    return '\n'.join([
        '        <div class="book">',
        '          <h3 class="cell-title">%s</h3>' % title,
        '          <p class="book-by">%s &middot; %d</p>' % (by, year),
        '          ' + el('p', 'cell-text', note[0], note[1]),
        '          <ul class="book-facts">',
        '            <li>%s%s</li>' % (EAR, el('span', '', a_en, a_ms)),
        '            <li>%s%s</li>' % (PAGE, el('span', '', 'About %d pages' % pages, 'Lebih kurang %d muka surat' % pages)),
        '          </ul>',
        '        </div>'])


def shelf():
    chips = ['      <button class="chip" type="button" data-show="all" aria-pressed="true">%s <span class="chip-n">%d</span></button>'
             % (el('span', '', 'All', 'Semua'), len(BOOKS))]
    groups = []
    for slug, en, ms in GROUPS:
        mine = [b for b in BOOKS if b[0] == slug]
        chips.append('      <button class="chip" type="button" data-show="%s" aria-pressed="false">%s <span class="chip-n">%d</span></button>'
                     % (slug, el('span', '', en, ms), len(mine)))
        groups.append('\n'.join(filter(None, [
            '    <div class="lwa-group" data-group="%s">' % slug,
            '      <p class="lwa-group-h">%s <span>%d</span></p>' % (el('span', '', en, ms), len(mine)),
            '      <div class="grid grid-2 shelf-grid">',
            '\n'.join(book(*b) for b in mine),
            # an odd group would leave the row's other half showing the
            # grid's ruled ground; the same filler /habits uses
            '        <div class="filler" aria-hidden="true"></div>' if len(mine) % 2 else '',
            '      </div>',
            '    </div>'])))
    return '\n'.join([
        '<!-- ============ the shelf ============',
        '       Written by tools/shelf.py from its BOOKS table: edit the',
        '       table and run it, not this markup. Each book says who it is',
        '       for, how long it is and whether it can be listened to,',
        '       because the opener above promises all three. -->',
        '  <section data-reveal>',
        '    ' + el('h2', 'section-h2', 'Only what we&rsquo;ve actually read.', 'Yang kami betul-betul dah baca je.'),
        '    <div class="chips lwa-chips shelf-chips" data-filter role="group" aria-label="Show books" data-i18n-aria="shelffilter">',
        '\n'.join(chips),
        '    </div>',
        '\n'.join(groups),
        '  </section>'])


if __name__ == '__main__':
    p = 'reading-list.html'
    s = open(p).read()
    a = s.index('<!-- ============ the shelf ============')
    b = s.index('</section>', a) + len('</section>')
    s = s[:a] + shelf() + s[b:]
    open(p, 'w').write(s)

    m = open('site.ms.js').read()
    START, END = '  /* shelf: written by tools/shelf.py */\n', '  /* end shelf */\n'
    a, b = m.index(START) + len(START), m.index(END)
    m = m[:a] + ''.join('  %s: %s,\n' % (json.dumps(k), json.dumps(v, ensure_ascii=False))
                        for k, v in MS.items()) + m[b:]
    open('site.ms.js', 'w').write(m)
    print('  %s: %d books in %d groups, %d Malay strings' % (p, len(BOOKS), len(GROUPS), len(MS)))
