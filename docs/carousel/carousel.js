/* Builds the deck from posts/<slug>.json.

   Post shape:
     { slug, lang, theme: "light"|"dark", label, footer,
       slides: [ {type:"cover", kicker, title, sub},
                 {type:"point", title, body},
                 {type:"outro", title, body, cta:{label}} ] }

   In a title, [[word]] is the accent word and \n is a forced line break.
   Point numbers and the NN / TT counter are computed here, never typed. */

(async function () {
  const q = new URLSearchParams(location.search);
  const slug = q.get('post') || 'example-en';
  if (q.get('render')) document.body.dataset.render = '1';

  const res = await fetch(`posts/${slug}.json`, { cache: 'no-store' });
  if (!res.ok) { document.body.textContent = `no post: posts/${slug}.json`; return; }
  const post = await res.json();

  document.documentElement.lang = post.lang || 'en';
  document.documentElement.dataset.theme = post.theme === 'dark' ? 'dark' : 'light';
  document.title = `${post.slug || slug} — my.adhd carousel`;

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rich = s => esc(s)
    .replace(/\[\[(.+?)\]\]/g, '<em class="ac">$1</em>')
    .replace(/\n/g, '<br>');
  const pad = n => String(n).padStart(2, '0');
  const icon = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#${id}"/></svg>`;

  const total = post.slides.length;
  const label = post.label || 'myadhd.my';
  const org = post.footer || 'MYADHD';
  let point = 0;

  const html = post.slides.map((s, i) => {
    let body = '';
    if (s.type === 'cover') {
      body = `${s.kicker ? `<p class="kicker">${esc(s.kicker)}</p>` : ''}
        <h1 class="title">${rich(s.title)}</h1>
        ${s.sub ? `<p class="copy sub">${rich(s.sub)}</p>` : ''}`;
    } else if (s.type === 'point') {
      point += 1;
      body = `<p class="num">${pad(point)}.</p>
        <h2 class="title">${rich(s.title)}</h2>
        ${s.body ? `<p class="copy">${rich(s.body)}</p>` : ''}`;
    } else {
      body = `<h2 class="title">${rich(s.title)}</h2>
        ${s.body ? `<p class="copy">${rich(s.body)}</p>` : ''}
        ${s.react === false ? '' : `<div class="react">${icon('i-heart')}${icon('i-comment')}${icon('i-send')}${icon('i-save')}</div>`}
        ${s.cta && s.cta.label ? `<span class="arrow-cta">${esc(s.cta.label)} <i>${icon('i-arrow')}</i></span>` : ''}`;
    }
    return `<section class="slide is-${esc(s.type)}" data-index="${i + 1}" data-blob="${(i % 3) + 1}">
      <header class="head">
        <span class="lockup">
          <svg viewBox="0 0 100 100" aria-hidden="true"><use href="#logo-mark"/></svg>
          <span class="wordmark">my<span class="accent">.adhd</span></span>
        </span>
        <span class="label">${esc(label)}</span>
      </header>
      <div class="body">${body}</div>
      <footer class="foot">
        <span class="org">${esc(org)}</span>
        <span class="count">${pad(i + 1)} / ${pad(total)}</span>
      </footer>
    </section>`;
  }).join('');

  document.getElementById('deck').innerHTML = html;
  document.body.dataset.count = total;

  await document.fonts.ready;
  window.__ready = true;
})();
