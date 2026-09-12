/* ============ MyADHD — the site's behaviour ============
   Loaded by every public page. (The app, /install and the two legal pages
   are their own surface and load none of this.) Deferred, so the DOM is
   up by the time any of this runs.

   Seven jobs, one closure each, in this order: the phone menu, the
   reveals, the home scene, the decode, the mosaic, the wave fields, and
   the two small housekeeping passes the whole site shares.

   Every one of them is progressive. Nothing here is required for the
   page to be readable: the sections start visible, the scene's track
   starts collapsed, the decode starts as its finished sentence. Script
   turns motion on; it never turns content on. That rule is why the flags
   below (data-anim, data-scene) are set from here rather than written
   into the markup. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- 1. the phone menu ----------
     Lifted from the old landing page. The sheet starts [hidden], so a
     page whose script never arrived has a button that does nothing
     rather than a menu stuck open over the content. */
  (function menu() {
    var bar = document.querySelector('.bar');
    if (!bar) return;
    var btn = bar.querySelector('.bar-toggle');
    var sheet = document.getElementById('bar-sheet');
    if (!btn || !sheet) return;

    function setOpen(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      sheet.toggleAttribute('hidden', !open);
      document.documentElement.toggleAttribute('data-nav-open', open);
    }
    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    /* Any link in the sheet closes it — the destination is behind the
       sheet, so leaving it up lands the reader on a covered page. */
    sheet.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setOpen(false); btn.focus();
      }
    });
    /* Widening past the breakpoint puts the row back and would otherwise
       leave the sheet covering a page that no longer needs it. */
    var wide = window.matchMedia('(min-width:1024px)');
    var onWide = function () { if (wide.matches) setOpen(false); };
    wide.addEventListener ? wide.addEventListener('change', onWide) : wide.addListener(onWide);
  })();


  /* ---------- 2. the reveals ----------
     One observer over every [data-reveal]. It latches rather than
     toggles: these are reading sections, not screens changing hands, and
     a paragraph that fades back out because you scrolled up to re-read it
     is a paragraph fighting its reader.

     The floor at the end matters. An IntersectionObserver can exist,
     accept an observe(), and never call back — measured, in a browser
     that is not running its rendering pipeline. So the test is not "does
     the API exist" but "has it ever spoken", and anything still waiting
     after three seconds is shown outright. */
  (function reveal() {
    var els = [].slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length || reduced) return;
    if (!('IntersectionObserver' in window)) return;

    var spoke = false;
    els.forEach(function (el) { el.setAttribute('data-anim', ''); });

    var io = new IntersectionObserver(function (entries) {
      spoke = true;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.setAttribute('data-in', '');
        io.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });

    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      if (spoke) return;
      els.forEach(function (el) { el.setAttribute('data-in', ''); });
    }, 3000);
  })();


  /* ---------- the track reader ----------
     The decode below is a tall track with a sticky stage inside it and a
     number between 0 and 1 saying how far through it the window has come.
     The home scene used to be one of these too; it is not any more (see
     scene() below for why), so this now has exactly one caller.

     The handler is passive and does its work synchronously rather than
     inside a requestAnimationFrame. That looks like the wrong call and is
     not: a passive scroll listener is already coalesced to roughly one
     call per frame, the measurement is four arithmetic operations, and the
     consumer memoises. What rAF buys here is nothing, and what it costs is
     a scene that does not move at all anywhere rAF is throttled — a
     backgrounded tab, an offscreen window — which is a hard class of bug
     to see and an easy one to ship. */
  function track(el, height, onProgress) {
    /* The height is set from HERE, not from a class the CSS keys off.
       That is the whole no-JS story in one line: the markup ships with no
       height, so the stage is a sticky box with nothing to travel inside
       and the page is a single screen. It cannot half-happen. */
    el.style.height = height;
    function tick() { onProgress(measure()); }
    function measure() {
      var span = el.offsetHeight - window.innerHeight;
      if (span <= 0) return 0;
      var p = (window.scrollY - el.offsetTop) / span;
      return p < 0 ? 0 : p > 1 ? 1 : p;
    }
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }


  /* ---------- 3. the home scene ----------
     Five things the organisation believes, written out one at a time, and
     the five things it offers lighting up in the corner beside them.

     This ran on the scroll position first — six viewports of track, the
     headline typing as you came down it. Two things were wrong with that
     and neither showed up until it was real. The page said nothing at all
     until you scrolled it, so the first thing a visitor met was a blank
     screen with a bar on top. And pressing an item in the corner jumped
     you to the scroll offset where that item began, which is the offset
     where its sentence is one word long — so the single interaction on
     the page reliably delivered an unfinished sentence.

     A timer fixes both. The writing starts on load, the corner list is
     links rather than scroll positions, and scrolling is left to do what
     it is for. */
  /* ---------- 0. the language ----------
     One switch, EN | BM, in the bar and again in the phone sheet. English
     is harvested from the markup at load — every element site.ms.js can
     translate carries a data-i18n id, a hash of its English HTML — so the
     HTML stays the only place English lives and can never drift from
     itself. Malay comes from site.ms.js by the same id; an id it does not
     know falls back to English rather than to nothing. The arrow icon
     inside a link is lifted out before matching and put back after, so
     the Malay file never carries SVG.

     The choice is one localStorage key, `myadhd.lang`, shared with the
     self-check so a reader who picks Malay on the site gets the screener
     in Malay too. <html lang> follows it, for screen readers and for
     hyphenation. */
  var LANG_KEY = 'myadhd.lang';
  var lang = 'en';
  try { if (localStorage.getItem(LANG_KEY) === 'ms') lang = 'ms'; } catch (_) {}
  var MSX = window.MYADHD_MS || { strings: {}, aria: {}, scene: null };
  var ICON_RE = /<i aria-hidden="true">[\s\S]*?<\/i>/;
  var EN = {}, ICONS = {}, EN_ARIA = {};
  var langListeners = [];
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var k = el.getAttribute('data-i18n'), h = el.innerHTML, m = h.match(ICON_RE);
    if (m) { ICONS[k] = m[0]; h = h.replace(ICON_RE, '{icon}'); }
    EN[k] = h;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
    EN_ARIA[el.getAttribute('data-i18n-aria')] = el.getAttribute('aria-label');
  });
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      var h = (lang === 'ms' && MSX.strings[k]) ? MSX.strings[k] : EN[k];
      if (h === undefined) return;
      if (ICONS[k]) h = h.replace('{icon}', ICONS[k]);
      if (el.innerHTML !== h) el.innerHTML = h;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', (lang === 'ms' && MSX.aria[k]) ? MSX.aria[k] : EN_ARIA[k]);
    });
    document.querySelectorAll('.bar-lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    langListeners.forEach(function (fn) { fn(lang); });
  }
  function setLang(l) {
    lang = l === 'ms' ? 'ms' : 'en';
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    applyLang();
  }
  document.querySelectorAll('.bar-lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });
  window.myadhdLang = { active: function () { return lang; }, set: setLang, onChange: function (fn) { langListeners.push(fn); } };
  if (lang !== 'en') applyLang();


  (function scene() {
    var el = document.querySelector('.scene');
    if (!el) return;
    var out = el.querySelector('.type');
    var idx = el.querySelector('[data-cur]');
    var items = [].slice.call(el.querySelectorAll('.acts-list li'));
    if (!out) return;

    /* The organisation's own sentences, lifted from docs/content/about.md
       — not written for this page. If these are ever replaced with proper
       value statements, this is the only place they live. */
    var LINES = [
      "Too many Malaysians grow up believing they're careless, lazy, or just not trying hard enough.",
      "What they're actually dealing with is a brain that's wired differently.",
      "Awareness here is still thin. Diagnosis is slow and expensive.",
      "Adult ADHD, especially, is barely discussed at all.",
      "We point people toward proper assessment instead of guesswork."
    ];
    var LINES_EN = LINES;
    var ROMAN = ['I', 'II', 'III', 'IV', 'V'];
    var N = LINES.length;
    var WORDS = LINES.map(function (l) { return l.split(' '); });
    /* The Malay set rides in site.ms.js. A switch mid-beat starts the
       current beat again in the other language rather than finishing an
       English sentence in Malay. */
    function useLang(l) {
      LINES = (l === 'ms' && MSX.scene && MSX.scene.length === N) ? MSX.scene : LINES_EN;
      WORDS = LINES.map(function (x) { return x.split(' '); });
    }
    useLang(lang);

    var WORD_MS = 105;   /* one word */
    /* The finished sentence, before it hands over. 2600 was a slideshow:
       a line lands, you begin it, it is gone. Seven seconds is the floor
       for reading one of these once and looking up — the typing is on
       top of it (a second or so), so each beat holds the screen for
       about eight, and the five come round in three quarters of a
       minute. */
    var HOLD_MS = 7000;

    function light(k) {
      if (idx) idx.textContent = ROMAN[k];
      items.forEach(function (li, i) {
        if (i === k) li.setAttribute('aria-current', 'true');
        else li.removeAttribute('aria-current');
      });
    }

    /* Reduced motion, or no timers: the first line whole, everything lit.
       The screen still says what it is for. */
    if (reduced) {
      out.textContent = LINES[0];
      light(0);
      window.myadhdLang.onChange(function (l) { useLang(l); out.textContent = LINES[0]; });
      return;
    }

    var k = 0, w = 0, timer;
    window.myadhdLang.onChange(function (l) {
      useLang(l);
      clearTimeout(timer); w = 0; step();
    });
    function step() {
      var words = WORDS[k];
      w++;
      out.textContent = words.slice(0, w - 1).join(' ') + (w > 1 ? ' ' : '');
      var tip = document.createElement('span');
      tip.className = 'dim';
      tip.textContent = words[w - 1];
      out.appendChild(tip);

      if (w < words.length) {
        timer = setTimeout(step, WORD_MS);
      } else {
        timer = setTimeout(function () {
          k = (k + 1) % N; w = 0; light(k); step();
        }, HOLD_MS);
      }
    }
    light(0);
    step();

    /* Stop writing to a page nobody is looking at — a tab in the
       background, or the scene scrolled off behind the funnel. Both save
       the same thing: a timer firing into a DOM nobody can see. */
    function pause() { clearTimeout(timer); }
    function resume() { pause(); step(); }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? pause() : resume();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? resume() : pause(); });
      }, { threshold: 0.15 }).observe(el);
    }

    /* The corner list pops in once, on load. */
    var list = el.querySelector('.acts-list');
    if (list) {
      list.setAttribute('data-anim', '');
      setTimeout(function () { list.setAttribute('data-in', ''); }, 260);
    }

    /* The field is behind a screen that never moves, so nothing takes it
       off the GPU on its own once the reader has gone past it. */
    window.addEventListener('scroll', function () {
      var W = window.myadhdWaves;
      if (W && W.pause) {
        (window.scrollY > window.innerHeight * 0.9) ? W.pause() : W.play();
      }
    }, { passive: true });
  })();


  /* ---------- 4. the decode ----------
     The headline resolves out of noise, left to right, as the track is
     scrolled. Characters left of the cursor are the real sentence;
     everything right of it is re-rolled on every frame, so the tail
     keeps churning while the head settles.

     Spaces are never scrambled — a line of noise with the word gaps
     still in it reads as a sentence you cannot make out yet, which is
     the whole effect. Scramble the spaces too and it reads as a wall. */
  (function decode() {
    var el = document.querySelector('.decode-track');
    if (!el) return;
    var out = el.querySelector('.decode');
    if (!out) return;

    var target = out.getAttribute('data-text') || out.textContent.trim();
    var GLYPHS = 'abcdefghijklmnopqrstuvwxyz';
    window.myadhdLang.onChange(function () { target = out.getAttribute('data-text') || out.textContent.trim(); });

    if (reduced) { out.textContent = target; return; }

    track(el, '250vh', function (p) {
      /* Resolved by 85% of the track, so the finished sentence gets a
         beat of its own before the reader scrolls past it. */
      var cut = Math.floor(Math.min(1, p / 0.85) * target.length);
      var head = target.slice(0, cut);
      var tail = '';
      for (var i = cut; i < target.length; i++) {
        tail += target[i] === ' ' || target[i] === '\n'
          ? target[i]
          : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      out.textContent = head;
      if (tail) {
        var raw = document.createElement('span');
        raw.className = 'raw';
        raw.textContent = tail;
        out.appendChild(raw);
      }
    });
  })();


  /* ---------- 5. the mosaic ----------
     Forty tiles at random opacities behind the decode. Generated rather
     than written out: forty empty divs in the markup is forty divs of
     nothing for a screen reader to walk past, and the randomness is the
     point — a fixed pattern reads as a texture, an uneven one reads as
     interference. */
  (function mosaic() {
    var host = document.querySelector('.mosaic');
    if (!host) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 40; i++) {
      var t = document.createElement('i');
      t.style.opacity = (0.04 + Math.random() * 0.14).toFixed(3);
      frag.appendChild(t);
    }
    host.appendChild(frag);
  })();


  /* ---------- 6. the wave fields ----------
     One per .panel-wave, the same mount the old landing page used. The
     jitter keeps two reloads from painting the identical field; it is
     skipped under reduced motion because waves.js tuned its still frame
     against each preset's own numbers, and a shifted warp is a shifted
     set of zero-crossings. */
  document.addEventListener('DOMContentLoaded', function () {
    var W = window.myadhdWaves;
    if (!W || !W.mount) return;
    var presets = W.presets ? W.presets() : {};

    function jitter(base, amount) {
      return base * (1 - amount + Math.random() * amount * 2);
    }

    document.querySelectorAll('.panel-wave').forEach(function (host) {
      var pattern = host.getAttribute('data-wave') || 'flow';
      var base = presets[pattern] || {};
      var opts = { pattern: pattern };
      var speed = parseFloat(host.getAttribute('data-wave-speed'));
      if (!isNaN(speed) && speed > 0) opts.speed = speed;
      if (!reduced) {
        if (typeof base.warp === 'number') opts.warp = jitter(base.warp, 0.12);
        if (typeof base.freqX === 'number') opts.freqX = jitter(base.freqX, 0.08);
        if (typeof base.freqY === 'number') opts.freqY = jitter(base.freqY, 0.08);
      }
      var field = W.mount(host, opts);
      if (!field) return;
      if (!reduced) field.seek(Math.random() * Math.PI * 2);

      /* Off the GPU when nowhere near the window. A frame is a full
         fragment shader; two of them running behind a page you are not
         looking at is real frames for nothing. */
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { e.isIntersecting ? field.play() : field.pause(); });
        }, { rootMargin: '25% 0px' });
        io.observe(host);
      }
    });
  });


  /* ---------- 7. housekeeping ----------
     The year, so the foot does not go stale on its own; and the install
     stop, which is a one-time thing — anyone already running from the
     home screen, or who has been shown the guide once, goes straight to
     the app. Both copied from the old page; both have to run on every
     page that carries a footer or an app link, which is all of them. */
  (function year() {
    var y = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = y; });
  })();

  (function appLinks() {
    var done = false;
    try {
      done = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true
        || localStorage.getItem('myadhd.installSeen') === '1';
    } catch (e) {}
    if (!done) return;
    document.querySelectorAll('[data-app-link]').forEach(function (a) { a.href = '/app'; });
  })();

  /* The service worker, so the home-screen copy opens without a
     connection and Chrome offers a real install rather than a shortcut. */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
