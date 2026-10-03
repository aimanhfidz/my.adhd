/* ============ my.adhd focus ============
   One classic script, two halves.

   The top half is pure: timer arithmetic, streaks, the stats, and the
   sample generators behind the sounds. It touches no DOM and no clock it
   wasn't handed, so it runs under JavaScriptCore for the tests and is
   exported as window.FocusPure.

   The bottom half is the page. Rules it keeps:
   - Every user string reaches the DOM through textContent or
     createElement. Nothing here writes innerHTML.
   - Its whole state lives under one key, myadhd.focus.v1. Never
     myadhd.v1: on localhost this page shares an origin with /app, and the
     iOS shell watches that key.
   - The timer is timestamps, not ticks. A background tab throttles
     setInterval to once a second or worse; endAt does not care. */
(function (root) {
  'use strict';

  // ================================================================
  // pure
  // ================================================================
  const MIN = 60000;
  const DAY = 86400000;

  function clampInt(v, lo, hi, dflt) {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
  }

  /** Minutes in a pomodoro segment, from the settings. */
  function segMinutes(s, seg) {
    if (seg === 'short') return s.shortMin;
    if (seg === 'long') return s.longMin;
    return s.focusMin;
  }

  /** What comes after a finished segment. `round` counts focus segments
      finished in this set; the set closes with a long break. */
  function nextSeg(seg, round, longEvery) {
    if (seg === 'focus') {
      const r = round + 1;
      return r >= longEvery ? { seg: 'long', round: r } : { seg: 'short', round: r };
    }
    if (seg === 'long') return { seg: 'focus', round: 0 };
    return { seg: 'focus', round };
  }

  /** Milliseconds left on a counting-down timer. */
  function remaining(t, fullMs, now) {
    if (t.running) return Math.max(0, t.endAt - now);
    return t.left == null ? fullMs : t.left;
  }

  /** Milliseconds on a stopwatch. */
  function elapsed(t, now) {
    return t.running ? t.base + (now - t.startAt) : t.base;
  }

  /** 25:00, 4:59, 1:02:03. Counting down rounds up, so the last second
      reads 0:01 rather than 0:00 while there is still time on it. */
  function fmt(ms, up) {
    const total = up ? Math.floor(ms / 1000) : Math.ceil(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    const ss = String(sec).padStart(2, '0');
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + ss : String(m).padStart(2, '0') + ':' + ss;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function dayKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function startOfDay(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /** The day before, by the calendar rather than by 24 hours — a day with
      a clock change in it is 23 or 25 hours long. */
  function prevDay(ts) {
    const d = new Date(ts);
    d.setDate(d.getDate() - 1);
    return d.getTime();
  }

  /** Days in a row with at least one finished focus session. Today with
      nothing in it yet does not break the run: it is not over. */
  function streak(sessions, now) {
    const days = new Set(sessions.map((s) => dayKey(s.at)));
    let cur = 0;
    let d = startOfDay(now);
    if (!days.has(dayKey(d))) d = prevDay(d);
    while (days.has(dayKey(d))) { cur++; d = prevDay(d); }

    const sorted = [...days].sort();
    let longest = 0, run = 0, last = null;
    for (const k of sorted) {
      const [y, m, dd] = k.split('-').map(Number);
      const t = new Date(y, m - 1, dd).getTime();
      run = last != null && dayKey(prevDay(t)) === dayKey(last) ? run + 1 : 1;
      longest = Math.max(longest, run);
      last = t;
    }
    return { current: cur, longest: Math.max(longest, cur) };
  }

  function rangeStart(range, now) {
    const today = startOfDay(now);
    if (range === 'today') return today;
    let d = today;
    const back = range === 'week' ? 6 : range === 'month' ? 29 : -1;
    if (back < 0) return 0;
    for (let i = 0; i < back; i++) d = prevDay(d);
    return d;
  }

  function totals(sessions, doneLog, range, now) {
    const since = rangeStart(range, now);
    const ss = sessions.filter((s) => s.at >= since && s.at <= now);
    const minutes = ss.reduce((a, s) => a + s.min, 0);
    const activeDays = new Set(ss.map((s) => dayKey(s.at))).size;
    return {
      minutes,
      sessions: ss.length,
      done: doneLog.filter((t) => t >= since && t <= now).length,
      perDay: activeDays ? Math.round(minutes / activeDays) : 0,
    };
  }

  function level(min) {
    if (!min) return 0;
    if (min < 25) return 1;
    if (min < 60) return 2;
    if (min < 120) return 3;
    return 4;
  }

  /** `weeks` columns of Monday-to-Sunday, ending with this week. */
  function heat(sessions, now, weeks) {
    const per = {};
    for (const s of sessions) { const k = dayKey(s.at); per[k] = (per[k] || 0) + s.min; }
    const today = startOfDay(now);
    const dow = (new Date(today).getDay() + 6) % 7;       // Monday = 0
    let d = today;
    for (let i = 0; i < dow + (weeks - 1) * 7; i++) d = prevDay(d);
    const out = [];
    for (let i = 0; i < weeks * 7; i++) {
      const k = dayKey(d);
      out.push({ key: k, min: per[k] || 0, level: level(per[k] || 0), future: d > today });
      const n = new Date(d); n.setDate(n.getDate() + 1); d = n.getTime();
    }
    return out;
  }

  function fmtDuration(min) {
    if (min < 60) return min + 'm';
    const h = Math.floor(min / 60), m = min % 60;
    return m ? h + 'h ' + m + 'm' : h + 'h';
  }

  function wordCount(text) {
    const t = text.trim();
    return t ? t.split(/\s+/).length : 0;
  }

  const GREETINGS = {
    morning:   [['Good morning', '.'], ['Morning', '. Gently does it.']],
    afternoon: [['Good afternoon', '.'], ['Afternoon', '. One thing at a time.']],
    evening:   [['Good evening', '.'], ['Evening', '. Wind down when you’re ready.']],
    night:     [['Late one', '?'], ['Still up', '? Be kind to yourself.']],
  };
  function greeting(date, name, dynamic) {
    const h = date.getHours();
    const part = h >= 5 && h < 12 ? 'morning' : h < 17 && h >= 12 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'night';
    const doy = Math.floor((startOfDay(date.getTime()) - new Date(date.getFullYear(), 0, 1).getTime()) / DAY);
    const [lead, tail] = GREETINGS[part][dynamic ? doy % 2 : 0];
    return lead + (name ? ', ' + name : '') + tail;
  }

  // ---------- sound ----------
  function rng32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Fold the tail into the head with an equal-power crossfade, so a
      buffer of n samples loops with no click at the seam. `a` holds n+f. */
  function seamless(a, n, f) {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = a[i];
    for (let i = 0; i < f; i++) {
      const x = i / f;
      out[i] = a[i] * Math.sin(x * Math.PI / 2) + a[n + i] * Math.cos(x * Math.PI / 2);
    }
    return out;
  }

  function normalize(a, peak) {
    let m = 0;
    for (let i = 0; i < a.length; i++) { const v = Math.abs(a[i]); if (v > m) m = v; }
    if (m > 0) { const k = peak / m; for (let i = 0; i < a.length; i++) a[i] *= k; }
    return a;
  }

  function pinkInto(a, rnd) {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < a.length; i++) {
      const w = rnd() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
      a[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return a;
  }

  function brownInto(a, rnd) {
    let last = 0;
    for (let i = 0; i < a.length; i++) {
      last = (last + 0.02 * (rnd() * 2 - 1)) / 1.02;
      a[i] = last * 3.5;
    }
    return a;
  }

  /** A loopable buffer of `kind`, `seconds` long. Everything that should
      move slowly (wind gusts) is done live by the graph instead, so the
      buffer itself only needs to be texture. */
  function generate(kind, sr, seconds, seed) {
    const rnd = rng32(seed || 7);
    const n = Math.round(sr * seconds);
    const f = Math.round(sr * 0.5);
    const a = new Float32Array(n + f);
    if (kind === 'white') {
      for (let i = 0; i < a.length; i++) a[i] = rnd() * 2 - 1;
    } else if (kind === 'pink' || kind === 'wind') {
      pinkInto(a, rnd);
    } else if (kind === 'brown') {
      brownInto(a, rnd);
    } else if (kind === 'rain') {
      pinkInto(a, rnd);
      for (let i = 0; i < a.length; i++) a[i] *= 0.5;
      const drops = Math.round(seconds * 90);
      for (let d = 0; d < drops; d++) {
        const at = Math.floor(rnd() * n);
        const freq = 1800 + rnd() * 4200;
        const len = Math.floor(sr * (0.003 + rnd() * 0.01));
        const amp = 0.08 + rnd() * rnd() * 0.5;
        for (let j = 0; j < len && at + j < a.length; j++) {
          a[at + j] += Math.sin(2 * Math.PI * freq * j / sr) * amp * Math.exp(-j / (len / 4));
        }
      }
    } else if (kind === 'ocean') {
      brownInto(a, rnd);
      const period = n / 2;                       // two swells per loop
      for (let i = 0; i < a.length; i++) {
        const p = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / period);
        const env = 0.18 + 0.82 * p * p;
        a[i] = a[i] * env + (rnd() * 2 - 1) * 0.12 * env * env * env;
      }
    } else if (kind === 'fire') {
      brownInto(a, rnd);
      for (let i = 0; i < a.length; i++) a[i] *= 0.55;
      const pops = Math.round(seconds * 14);
      for (let p = 0; p < pops; p++) {
        const at = Math.floor(rnd() * n);
        const len = Math.floor(sr * (0.0015 + rnd() * 0.008));
        const amp = 0.15 + Math.pow(rnd(), 3) * 0.9;
        for (let j = 0; j < len && at + j < a.length; j++) {
          a[at + j] += (rnd() * 2 - 1) * amp * Math.exp(-j / (len / 3));
        }
      }
    }
    return normalize(seamless(a, n, f), 0.9);
  }

  const Pure = {
    MIN, clampInt, segMinutes, nextSeg, remaining, elapsed, fmt, dayKey, startOfDay,
    streak, totals, heat, level, fmtDuration, wordCount, greeting, generate, seamless, rng32,
  };
  root.FocusPure = Pure;
  if (typeof document === 'undefined') return;

  // ================================================================
  // the page
  // ================================================================
  const KEY = 'myadhd.focus.v1';
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => [...(el || document).querySelectorAll(sel)];
  const html = document.documentElement;

  // Eight scenes that do not look alike: three families of colour (violet,
  // orange, neutral) and four kinds of surface (mesh, moving light, a
  // horizon, a printed grid). Keep the ids in step with the list in
  // index.html's head script, which paints the first frame.
  const SCENES = [
    { id: 'indigo',   name: 'Indigo',   tone: 'dark' },
    { id: 'aurora',   name: 'Aurora',   tone: 'dark',  moving: true },
    { id: 'ember',    name: 'Ember',    tone: 'dark' },
    { id: 'horizon',  name: 'Horizon',  tone: 'dark' },
    { id: 'charcoal', name: 'Charcoal', tone: 'dark' },
    { id: 'apricot',  name: 'Apricot',  tone: 'light' },
    { id: 'lilac',    name: 'Lilac',    tone: 'light', moving: true },
    { id: 'paper',    name: 'Paper',    tone: 'light' },
  ];
  // scenes that were retired, and where a saved choice of one now lands
  const RETIRED = { midnight: 'charcoal', brand: 'indigo', tide: 'lilac' };
  const sceneById = (id) => SCENES.find((s) => s.id === (RETIRED[id] || id)) || SCENES[0];

  const SOUNDS = [
    { id: 'rain',  name: 'Rain',        cat: 'nature', icon: 's-rain',  gen: 'rain',  level: 0.7 },
    { id: 'ocean', name: 'Ocean',       cat: 'nature', icon: 's-ocean', gen: 'ocean', level: 0.8 },
    { id: 'wind',  name: 'Wind',        cat: 'nature', icon: 's-wind',  gen: 'wind',  level: 1.0 },
    { id: 'fire',  name: 'Fireplace',   cat: 'cosy',   icon: 's-fire',  gen: 'fire',  level: 0.75 },
    { id: 'white', name: 'White noise', cat: 'noise',  icon: 's-wave',  gen: 'white', level: 0.22 },
    { id: 'pink',  name: 'Pink noise',  cat: 'noise',  icon: 's-wave',  gen: 'pink',  level: 0.5 },
    { id: 'brown', name: 'Brown noise', cat: 'noise',  icon: 's-wave',  gen: 'brown', level: 0.8 },
  ];
  const SOUND_CATS = [['all', 'All'], ['nature', 'Nature'], ['cosy', 'Cosy'], ['noise', 'Noise']];

  const QUOTES = {
    gentle: [
      'Done is kinder than perfect.',
      'You don’t need the whole plan. Just the next step.',
      'Starting messy still counts as starting.',
      'Your brain isn’t broken. It’s busy.',
      'Small steps are still steps.',
      'Be as patient with yourself as you’d be with a friend.',
      'One thing at a time is plenty.',
      'Forgetting isn’t failing. Just come back.',
      'You got here. That was the hard part.',
      'Needing a reminder is fine. That’s what reminders are for.',
    ],
    momentum: [
      'Five minutes. You can do anything for five minutes.',
      'Just open the file.',
      'Make it so small you can’t say no.',
      'Momentum beats motivation.',
      'Start before you feel ready.',
      'The first step is the whole trick.',
      'Future you is cheering for this one.',
      'Pick one. Ignore the rest for now.',
      'Understand Your Mind. Own Your Day.',
      'Finish this one and the next gets easier.',
    ],
    rest: [
      'Breaks are part of the work.',
      'Rest counts too.',
      'Drink some water. Seriously.',
      'Stand up, stretch, come back.',
      'Your best focus comes after a real break.',
      'Unclench your jaw. Drop your shoulders.',
      'Look at something far away for a moment.',
      'Rest, then return.',
      'You’ve earned a pause.',
      'Slow is fine. Stopped is fine too.',
    ],
  };

  const DEFAULTS = {
    scenes: { home: 'indigo', focus: 'indigo', ambient: 'aurora' },
    randomScene: false,
    clock24: false, size: 'm', seconds: false, greeting: true, name: '',
    timerKind: 'pomodoro', focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4, countMin: 45,
    timerStyle: 'digits', bar: false, autoStart: false, chime: true, notify: false, showStreak: true,
    quoteCat: 'all', quoteHome: true, quoteFocus: true,
    autoHide: false, wake: false, still: false,
    soundVol: {}, soundOn: [],
    lastSec: 'scenes',
  };
  const NEW_TIMER = () => ({ seg: 'focus', round: 0, running: false, endAt: 0, left: null, startAt: 0, base: 0 });

  function load() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {}
    const settings = Object.assign({}, DEFAULTS, raw.settings || {});
    settings.scenes = Object.assign({}, DEFAULTS.scenes, settings.scenes || {});
    Object.keys(settings.scenes).forEach((m) => { settings.scenes[m] = sceneById(settings.scenes[m]).id; });
    return {
      settings,
      tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
      current: raw.current || null,
      notes: typeof raw.notes === 'string' ? raw.notes : '',
      sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
      doneLog: Array.isArray(raw.doneLog) ? raw.doneLog : [],
      timer: Object.assign(NEW_TIMER(), raw.timer || {}),
    };
  }

  const state = load();
  const S = state.settings;
  let saveTimer = 0;
  let erased = false;
  function save(now) {
    clearTimeout(saveTimer);
    if (erased) return;
    const write = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
    if (now) write(); else saveTimer = setTimeout(write, 300);
  }
  window.addEventListener('pagehide', () => save(true));

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function setIcon(btn, id) { const u = $('use', btn); if (u) u.setAttribute('href', '#' + id); }
  function uid() { return 't_' + Math.random().toString(36).slice(2, 9); }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function icon(id) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ic');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  // ================================================================
  // modes + scenes
  // ================================================================
  let mode = html.dataset.mode || 'home';
  // The scene each mode is wearing this visit. Normally the saved one; with
  // "random each visit" on, a pick made the first time the mode is shown.
  const visitScene = { [mode]: html.dataset.scene };

  function sceneFor(m) {
    if (!visitScene[m]) {
      visitScene[m] = S.randomScene ? SCENES[Math.floor(Math.random() * SCENES.length)].id : S.scenes[m];
    }
    return visitScene[m];
  }

  function paintScene() {
    const sc = sceneById(sceneFor(mode));
    html.dataset.scene = sc.id;
    html.dataset.theme = sc.tone;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', sc.tone === 'light' ? '#E9E7FB' : '#101018');
  }

  function setMode(m, fromHash) {
    if (!['home', 'focus', 'ambient'].includes(m)) m = 'home';
    mode = m;
    html.dataset.mode = m;
    paintScene();
    $$('.modes [data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
    if (!fromHash) history.replaceState(null, '', m === 'home' ? '#/' : '#/' + m);
    pickQuote();
    renderAll();
  }

  // ================================================================
  // clock + greeting + quote
  // ================================================================
  let lastClock = '';
  function renderClock(now) {
    const d = new Date(now);
    let h = d.getHours();
    if (!S.clock24) h = h % 12 || 12;
    let t = (S.clock24 ? pad2(h) : String(h)) + ':' + pad2(d.getMinutes());
    if (S.seconds) t += ':' + pad2(d.getSeconds());
    if (t !== lastClock) {
      lastClock = t;
      $('[data-bind="clock"]').textContent = t;
      $('#greeting').textContent = S.greeting ? greeting(d, S.name.trim(), true) : '';
    }
  }

  let quote = '';
  function pickQuote() {
    const onBreak = mode === 'focus' && S.timerKind === 'pomodoro' && state.timer.seg !== 'focus';
    const cat = onBreak ? 'rest' : S.quoteCat;
    const pool = cat === 'all' ? [].concat(QUOTES.gentle, QUOTES.momentum, QUOTES.rest) : QUOTES[cat];
    let q = quote;
    while (pool.length > 1 && q === quote) q = pool[Math.floor(Math.random() * pool.length)];
    quote = q;
    renderQuote();
  }
  function renderQuote() {
    const show = (mode === 'home' && S.quoteHome) || (mode === 'focus' && S.quoteFocus);
    $('#quote').textContent = show ? quote : '';
  }

  // ================================================================
  // timer
  // ================================================================
  const T = state.timer;
  const SEG_LABEL = { focus: 'Focus', short: 'Short break', long: 'Long break' };

  function fullMs() {
    if (S.timerKind === 'countdown') return S.countMin * MIN;
    return segMinutes(S, T.seg) * MIN;
  }
  function segLabel() {
    if (S.timerKind === 'countdown') return 'Countdown';
    if (S.timerKind === 'stopwatch') return 'Stopwatch';
    return SEG_LABEL[T.seg];
  }
  function isFocusTime() { return S.timerKind !== 'pomodoro' || T.seg === 'focus'; }

  function start() {
    const now = Date.now();
    if (S.timerKind === 'stopwatch') T.startAt = now;
    else T.endAt = now + (T.left == null ? fullMs() : T.left);
    T.running = true;
    audio.unlock();
    save();
    renderTimer();
  }
  function pause() {
    const now = Date.now();
    if (S.timerKind === 'stopwatch') T.base = elapsed(T, now);
    else T.left = remaining(T, fullMs(), now);
    T.running = false;
    save();
    renderTimer();
  }
  function toggle() { T.running ? pause() : start(); }

  function logSession(at, min) {
    if (min < 1) return;
    state.sessions.push({ at, min: Math.round(min), task: state.current ? state.current.title : '' });
    renderStreak();
  }

  function reset() {
    if (S.timerKind === 'stopwatch') {
      logSession(Date.now(), elapsed(T, Date.now()) / MIN);
      T.base = 0;
    }
    T.running = false;
    T.left = null;
    save();
    renderTimer();
  }

  function setSeg(seg) {
    if (S.timerKind !== 'pomodoro') return;
    T.seg = seg;
    T.running = false;
    T.left = null;
    save();
    pickQuote();
    renderTimer();
  }

  function skip() {
    if (S.timerKind !== 'pomodoro') return reset();
    // Skipping is not finishing: a skipped focus segment earns no dot and
    // logs nothing, it just moves you on to the break.
    if (T.seg === 'focus') T.seg = 'short';
    else { if (T.seg === 'long') T.round = 0; T.seg = 'focus'; }
    T.running = false;
    T.left = null;
    save();
    pickQuote();
    renderTimer();
  }

  function complete(now) {
    const late = now - T.endAt > 5000;      // finished while the tab was closed
    const wasFocus = isFocusTime();
    const label = segLabel();
    if (wasFocus) logSession(T.endAt, fullMs() / MIN);
    if (S.timerKind === 'pomodoro') {
      const n = nextSeg(T.seg, T.round, S.longEvery);
      T.seg = n.seg;
      T.round = n.round;
    }
    T.left = null;
    T.running = false;
    if (!late) {
      if (S.chime) audio.chime();
      notify(wasFocus ? label + ' done. Nice.' : 'Break’s over.', wasFocus ? 'Up next: ' + segLabel().toLowerCase() + '.' : 'Ready when you are.');
      toast(wasFocus ? 'That counts. ' + segLabel() + ' next.' : 'Break’s over. Back to it when you’re ready.');
      if (S.autoStart) { start(); }
    }
    save();
    pickQuote();
    renderTimer();
  }

  function notify(title, body) {
    if (!S.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible' && document.hasFocus()) return;
    try { new Notification(title, { body, icon: '/icons/icon-192.png', tag: 'myadhd-focus' }); } catch (_) {}
  }

  let lastTimerText = '';
  function renderTimer() {
    const now = Date.now();
    const stopwatch = S.timerKind === 'stopwatch';
    const ms = stopwatch ? elapsed(T, now) : remaining(T, fullMs(), now);
    const text = fmt(ms, stopwatch);
    if (text !== lastTimerText) {
      lastTimerText = text;
      $$('[data-bind="time"]').forEach((e) => { e.textContent = text; });
      if (pip.win) pip.time.textContent = text;
    }
    const pct = stopwatch ? (ms % (60 * MIN)) / (60 * MIN) : 1 - ms / fullMs();
    $('#ring-fill').style.strokeDashoffset = String(100 - Math.max(0, Math.min(1, pct)) * 100);
    $('#bar-fill').style.width = (Math.max(0, Math.min(1, pct)) * 100) + '%';

    const label = segLabel();
    $$('[data-bind="seg"]').forEach((e) => { e.textContent = label; });
    $$('[data-act="toggle"]').forEach((b) => {
      setIcon(b, T.running ? 'i-pause' : 'i-play');
      b.setAttribute('aria-label', T.running ? 'Pause' : 'Start');
    });
    const pomo = S.timerKind === 'pomodoro';
    $('#segs').hidden = !pomo;
    $('#segs-alt').hidden = pomo;
    $('#segs-alt').textContent = label;
    $$('#segs [data-seg]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.seg === T.seg)));
    $('[data-act="skip"]').hidden = !pomo;

    const dots = $('#dots');
    if (pomo) {
      if (dots.childElementCount !== S.longEvery) dots.replaceChildren(...Array.from({ length: S.longEvery }, () => el('i')));
      [...dots.children].forEach((d, i) => {
        d.className = i < T.round ? 'done' : i === T.round && T.seg === 'focus' ? 'now' : '';
      });
    } else dots.replaceChildren();

    document.title = T.running ? text + ' · ' + label + ' — my.adhd' : 'my.adhd focus';
    if (pip.win) {
      pip.seg.textContent = label;
      pip.task.textContent = state.current ? state.current.title : '';
      setIcon(pip.btn, T.running ? 'i-pause' : 'i-play');
    }
  }

  function tick() {
    const now = Date.now();
    if (T.running && S.timerKind !== 'stopwatch' && now >= T.endAt) complete(now);
    if (mode === 'home') renderClock(now);
    renderTimer();
  }

  // ================================================================
  // sound
  // ================================================================
  const audio = (() => {
    let ctx = null, master = null, playing = false;
    const live = {};          // id -> {src, gain, extra:[]}
    const buffers = {};

    // iPhone: Web Audio is filed as "ambient" sound, so the silent switch
    // mutes it — the page looked as if it played and nothing came out.
    // Safari 17+ lets a page ask for "playback" instead. Older iOS has no
    // such switch, but a playing <audio> element moves the whole page into
    // playback, and Web Audio rides along: so a second of silence, looped,
    // while the mix plays. Both have to happen inside a tap.
    let keepAlive = null;
    function silentWav() {
      const n = 8000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
      const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVEfmt ');
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
      str(36, 'data'); v.setUint32(40, n, true);
      for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
      return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    }
    function playbackSession(on) {
      try {
        if (navigator.audioSession) { navigator.audioSession.type = 'playback'; return; }
      } catch (_) {}
      if (!/iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) || !('ontouchend' in document)) return;
      if (!on) { if (keepAlive) keepAlive.pause(); return; }
      if (!keepAlive) {
        keepAlive = new Audio(silentWav());
        keepAlive.loop = true;
        keepAlive.setAttribute('playsinline', '');
      }
      keepAlive.play().catch(() => {});
    }

    function wake() {
      // "interrupted" is Safari's own state, after a call or a trip to the lock screen
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && playing) wake();
    });

    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      playbackSession(true);
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      return ctx;
    }

    function buffer(sound) {
      if (buffers[sound.id]) return buffers[sound.id];
      const sr = ctx.sampleRate;
      const secs = sound.gen === 'ocean' ? 16 : 10;
      const data = generate(sound.gen, sr, secs, sound.id.length * 97 + 13);
      const b = ctx.createBuffer(1, data.length, sr);
      b.getChannelData(0).set(data);
      return (buffers[sound.id] = b);
    }

    function volOf(id) { return S.soundVol[id] == null ? 0.6 : S.soundVol[id]; }

    function startOne(sound) {
      if (live[sound.id] || !ensure()) return;
      const src = ctx.createBufferSource();
      src.buffer = buffer(sound);
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const extra = [];
      let node = src;
      const filter = (type, freq, q) => {
        const f = ctx.createBiquadFilter();
        f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
        node.connect(f); node = f; return f;
      };
      if (sound.gen === 'rain') { filter('highpass', 350); filter('lowpass', 9000); }
      if (sound.gen === 'ocean') filter('lowpass', 1100);
      if (sound.gen === 'fire') filter('lowpass', 5200);
      if (sound.gen === 'white') filter('lowpass', 11000);
      if (sound.gen === 'wind') {
        // gusts: a slow wobble on the band's centre and on its loudness
        const bp = filter('bandpass', 520, 0.9);
        const lfo = ctx.createOscillator(), depth = ctx.createGain();
        lfo.frequency.value = 0.07; depth.gain.value = 320;
        lfo.connect(depth); depth.connect(bp.frequency); lfo.start();
        const lfo2 = ctx.createOscillator(), depth2 = ctx.createGain();
        lfo2.frequency.value = 0.113; depth2.gain.value = 0.3;
        lfo2.connect(depth2);
        const swell = ctx.createGain(); swell.gain.value = 0.7;
        depth2.connect(swell.gain); lfo2.start();
        node.connect(swell); node = swell;
        extra.push(lfo, lfo2);
      }
      node.connect(gain);
      gain.connect(master);
      src.start();
      gain.gain.setTargetAtTime(volOf(sound.id) * sound.level, ctx.currentTime, 0.4);
      live[sound.id] = { src, gain, extra, sound };
    }

    function stopOne(id) {
      const l = live[id];
      if (!l) return;
      delete live[id];
      l.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      setTimeout(() => { try { l.src.stop(); l.extra.forEach((o) => o.stop()); } catch (_) {} l.gain.disconnect(); }, 900);
    }

    return {
      unlock() { if (ensure()) wake(); },
      get playing() { return playing; },
      isOn(id) { return S.soundOn.includes(id); },
      toggleSound(id) {
        const sound = SOUNDS.find((x) => x.id === id);
        if (this.isOn(id)) {
          S.soundOn = S.soundOn.filter((x) => x !== id);
          stopOne(id);
          if (!S.soundOn.length) this.pause();
        } else {
          S.soundOn = S.soundOn.concat(id);
          this.play();
          startOne(sound);
        }
        save();
      },
      clearAll() {
        S.soundOn = [];
        this.pause();
        save();
      },
      setVol(id, v) {
        S.soundVol[id] = v;
        const l = live[id];
        if (l) l.gain.gain.setTargetAtTime(v * l.sound.level, ctx.currentTime, 0.08);
        save();
      },
      play() {
        if (!ensure()) return;
        playing = true;
        playbackSession(true);
        wake();
        S.soundOn.forEach((id) => startOne(SOUNDS.find((x) => x.id === id)));
      },
      pause() {
        playing = false;
        Object.keys(live).forEach(stopOne);
        playbackSession(false);
      },
      chime() {
        if (!ensure()) return;
        wake();
        const t0 = ctx.currentTime + 0.05;
        [[784, 0], [1175, 0.2], [784, 0.9], [1175, 1.1]].forEach(([f, dt]) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0, t0 + dt);
          g.gain.linearRampToValueAtTime(0.22, t0 + dt + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 1.3);
          o.connect(g); g.connect(ctx.destination);
          o.start(t0 + dt); o.stop(t0 + dt + 1.4);
        });
      },
    };
  })();

  let soundCat = 'all';
  function renderSounds() {
    const cats = $('#sound-cats');
    if (!cats.childElementCount) {
      SOUND_CATS.forEach(([id, name]) => {
        const b = el('button', '', name);
        b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.cat = id;
        cats.appendChild(b);
      });
    }
    $$('[data-cat]', cats).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.cat === soundCat)));
    const grid = $('#sounds');
    grid.replaceChildren(...SOUNDS.filter((s) => soundCat === 'all' || s.cat === soundCat).map((s) => {
      const on = audio.isOn(s.id);
      const tile = el('div', 'sound' + (on ? ' on' : ''));
      const btn = el('button');
      btn.type = 'button';
      btn.dataset.sound = s.id;
      btn.setAttribute('aria-pressed', String(on));
      btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;width:100%';
      btn.append(icon(s.icon), el('b', '', s.name));
      const range = document.createElement('input');
      range.type = 'range'; range.min = '0'; range.max = '1'; range.step = '0.01';
      range.value = String(S.soundVol[s.id] == null ? 0.6 : S.soundVol[s.id]);
      range.dataset.vol = s.id;
      range.setAttribute('aria-label', s.name + ' volume');
      tile.append(btn, range);
      return tile;
    }));
    const anyOn = S.soundOn.length > 0;
    const master = $('#sounds-master');
    setIcon(master, audio.playing && anyOn ? 'i-pause' : 'i-play');
    master.setAttribute('aria-label', audio.playing && anyOn ? 'Pause mix' : 'Play mix');
    master.disabled = !anyOn;
    master.style.opacity = anyOn ? '' : '.4';
    $('#sound-dot').hidden = !(audio.playing && anyOn);
    $('#sounds-clear').hidden = !anyOn;
    $('#sounds-meta').textContent = anyOn
      ? S.soundOn.length + ' in the mix' + (audio.playing ? '' : ' · paused')
      : 'Mix as many as you like';
  }

  // ================================================================
  // tasks + the one thing
  // ================================================================
  function openTasks() { return state.tasks.filter((t) => !t.done); }

  function setDone(task, done) {
    task.done = done;
    if (done) {
      task.doneAt = Date.now();
      state.doneLog.push(task.doneAt);
      if (state.current && state.current.id === task.id) state.current = null;
    } else {
      const i = state.doneLog.lastIndexOf(task.doneAt);
      if (i >= 0) state.doneLog.splice(i, 1);
      task.doneAt = null;
    }
  }

  function addTask(title, atTop) {
    const t = { id: uid(), title: title.trim().slice(0, 140), done: false, doneAt: null };
    if (!t.title) return null;
    if (atTop) state.tasks.unshift(t); else {
      const firstDone = state.tasks.findIndex((x) => x.done);
      firstDone < 0 ? state.tasks.push(t) : state.tasks.splice(firstDone, 0, t);
    }
    return t;
  }

  let dragId = null;
  function renderTasks() {
    const list = $('#tasks');
    const open = openTasks();
    const done = state.tasks.filter((t) => t.done);
    const rows = open.concat(done).map((t, i) => {
      const li = el('li', 'task' + (t.done ? ' done' : '') + (!t.done && i < 3 ? ' spot' : '') +
        (state.current && state.current.id === t.id ? ' current' : ''));
      li.dataset.id = t.id;
      li.draggable = !t.done;
      const check = el('button', 'task-check');
      check.type = 'button'; check.dataset.tact = 'check';
      check.setAttribute('aria-label', t.done ? 'Mark not done' : 'Mark done');
      check.appendChild(icon('i-check'));
      const title = el('span', 'task-title', t.title);
      title.dataset.tact = 'edit';
      title.title = 'Double-click to edit';
      const acts = el('span', 'task-act');
      if (!t.done) {
        const f = el('button'); f.type = 'button'; f.dataset.tact = 'focus';
        f.setAttribute('aria-label', 'Focus on this'); f.title = 'Focus on this';
        f.appendChild(icon('i-target'));
        acts.appendChild(f);
      }
      const del = el('button'); del.type = 'button'; del.dataset.tact = 'del';
      del.setAttribute('aria-label', 'Delete'); del.title = 'Delete';
      del.appendChild(icon('i-trash'));
      acts.appendChild(del);
      li.append(check, title, acts);
      return li;
    });
    if (!rows.length) rows.push(el('li', 'tasks-empty', 'Nothing here yet. Add the one thing you came to do.'));
    list.replaceChildren(...rows);
    $('#tasks-meta').textContent = state.tasks.length ? done.length + ' of ' + state.tasks.length + ' done' : '';
    $('#tasks-clear').hidden = !done.length;
  }

  function renderIntent() {
    const cur = state.current;
    $('#intent-ask').hidden = !!cur;
    $('#intent-set').hidden = !cur;
    if (cur) $('#intent-title').textContent = cur.title;
  }

  function openIntentEdit() {
    const box = $('#intent-edit');
    box.hidden = false;
    $('#intent').classList.add('editing');
    const input = $('#intent-input');
    input.value = state.current ? state.current.title : '';
    renderPicks();
    input.focus();
    input.select();
  }
  function closeIntentEdit() { $('#intent-edit').hidden = true; $('#intent').classList.remove('editing'); }
  function renderPicks() {
    const q = $('#intent-input').value.trim().toLowerCase();
    const picks = openTasks().filter((t) => (!state.current || t.id !== state.current.id) && (!q || t.title.toLowerCase().includes(q))).slice(0, 6);
    const ul = $('#intent-picks');
    if (!picks.length) { ul.replaceChildren(); return; }
    const head = el('li'); head.appendChild(el('small', '', 'From your tasks'));
    ul.replaceChildren(head, ...picks.map((t) => {
      const li = el('li');
      const b = el('button');
      b.type = 'button'; b.dataset.pick = t.id;
      b.append(icon('i-target'), document.createTextNode(t.title));
      li.appendChild(b);
      return li;
    }));
  }
  function chooseIntent(task) {
    state.current = { id: task.id, title: task.title };
    closeIntentEdit();
    save();
    renderIntent(); renderTasks(); renderTimer();
  }

  // ================================================================
  // notes
  // ================================================================
  function renderNotesMeta() {
    const v = $('#notes').value;
    const w = wordCount(v);
    $('#notes-meta').textContent = w + (w === 1 ? ' word' : ' words') + ' · ' + v.length + (v.length === 1 ? ' character' : ' characters');
  }

  // ================================================================
  // stats + streak
  // ================================================================
  let statsRange = 'week';
  function renderStreak() {
    const s = streak(state.sessions, Date.now());
    $('#streak-n').textContent = String(s.current);
    html.dataset.streak = S.showStreak ? '1' : '0';
    return s;
  }
  function renderStats() {
    const now = Date.now();
    const t = totals(state.sessions, state.doneLog, statsRange, now);
    const s = streak(state.sessions, now);
    const tile = (label, value, sub) => {
      const d = el('div', 'tile');
      d.append(el('small', '', label), el('b', '', value));
      if (sub) d.appendChild(el('em', '', sub));
      return d;
    };
    $('#stat-tiles').replaceChildren(
      tile('Focus time', fmtDuration(t.minutes)),
      tile('Sessions', String(t.sessions)),
      tile('Tasks done', String(t.done)),
      tile('Streak', s.current + (s.current === 1 ? ' day' : ' days'), 'Longest: ' + s.longest),
      tile('Per active day', fmtDuration(t.perDay)),
      tile('All-time focus', fmtDuration(state.sessions.reduce((a, x) => a + x.min, 0))),
    );
    $$('#stats-range [data-range]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.range === statsRange)));
    $('#heat').replaceChildren(...heat(state.sessions, now, 16).map((c) => {
      const i = el('i');
      i.dataset.l = String(c.level);
      if (c.future) i.className = 'future';
      i.title = c.key + ' · ' + fmtDuration(c.min);
      return i;
    }));
  }

  // ================================================================
  // settings
  // ================================================================
  let sceneTarget = 'home';
  function openSettings(sec) {
    closePops();
    $('#settings').hidden = false;
    $('#shade').hidden = false;
    showSec(sec || S.lastSec || 'scenes');
  }
  function closeSettings() {
    $('#settings').hidden = true;
    $('#shade').hidden = true;
  }
  function showSec(sec) {
    S.lastSec = sec;
    $$('.set-nav [data-sec]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.sec === sec)));
    $$('.set-sec').forEach((s) => { s.hidden = s.dataset.sec !== sec; });
    if (sec === 'scenes') { sceneTarget = mode; renderScenes(); }
    if (sec === 'stats') renderStats();
    syncSettings();
  }
  function renderScenes() {
    $$('#scene-for [data-for]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.for === sceneTarget)));
    $('#scene-grid').replaceChildren(...SCENES.map((sc) => {
      const b = el('button', 'thumb');
      b.type = 'button';
      b.dataset.pickScene = sc.id;
      b.dataset.tone = sc.tone;
      b.setAttribute('aria-pressed', String(S.scenes[sceneTarget] === sc.id));
      const art = el('span', 'thumb-art');
      art.dataset.scene = sc.id;
      art.appendChild(el('span', '', '12:00'));
      const name = el('b', '', sc.name);
      if (sc.moving) name.appendChild(el('small', '', 'moving'));
      b.append(art, name);
      return b;
    }));
  }
  function syncSettings() {
    $$('[data-set]').forEach((inp) => {
      const v = S[inp.dataset.set];
      if (inp.type === 'checkbox') inp.checked = !!v;
      else if (document.activeElement !== inp) inp.value = v;
    });
    $$('[data-choice]').forEach((g) => {
      const v = String(S[g.dataset.choice]);
      $$('button', g).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    });
    $('#len-pomo').hidden = S.timerKind !== 'pomodoro';
    $('#len-count').hidden = S.timerKind !== 'countdown';
  }

  const NUM_LIMITS = { focusMin: [1, 180], shortMin: [1, 60], longMin: [1, 90], longEvery: [2, 8], countMin: [1, 240] };
  function applySetting(key, value) {
    const prevKind = S.timerKind;
    if (NUM_LIMITS[key]) value = clampInt(value, NUM_LIMITS[key][0], NUM_LIMITS[key][1], DEFAULTS[key]);
    S[key] = value;
    if (key === 'timerKind' && value !== prevKind) {
      Object.assign(T, NEW_TIMER());
    }
    if (key === 'longEvery' && T.round >= value) T.round = 0;
    if (key === 'notify' && value && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((p) => {
        if (p !== 'granted') { S.notify = false; syncSettings(); save(); toast('Notifications are blocked for this site.'); }
      });
    }
    if (key === 'wake') wake.sync();
    if (key === 'autoHide') idle.poke();
    if (key === 'randomScene' && !value) { Object.keys(visitScene).forEach((m) => { visitScene[m] = S.scenes[m]; }); paintScene(); }
    applyLook();
    lastClock = '';
    save();
    syncSettings();
    renderAll();
  }
  function applyLook() {
    html.dataset.size = S.size;
    html.dataset.tstyle = S.timerStyle;
    html.dataset.bar = S.bar ? '1' : '0';
    html.classList.toggle('still', !!S.still);
  }

  // ================================================================
  // wake lock, idle, fullscreen, pip
  // ================================================================
  const wake = (() => {
    let lock = null;
    async function sync() {
      const want = S.wake && document.visibilityState === 'visible';
      if (want && !lock && 'wakeLock' in navigator) {
        try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch (_) {}
      } else if (!want && lock) { lock.release(); lock = null; }
    }
    document.addEventListener('visibilitychange', sync);
    return { sync };
  })();

  const idle = (() => {
    let t = 0;
    function busy() {
      return !$('#settings').hidden || !$('#intent-edit').hidden || $$('.pop').some((p) => !p.hidden);
    }
    function poke() {
      html.classList.remove('idle');
      clearTimeout(t);
      if (S.autoHide) t = setTimeout(() => { if (!busy()) html.classList.add('idle'); }, 4000);
    }
    ['pointermove', 'pointerdown', 'keydown', 'wheel'].forEach((e) => document.addEventListener(e, poke, { passive: true }));
    return { poke };
  })();

  // The phone keyboard. visualViewport is the part of the page still
  // showing above it; html.kb and two variables let the CSS pin the open
  // panel to exactly that. Nothing to do on desktop, where it never shrinks.
  (function keyboard() {
    const vv = window.visualViewport;
    if (!vv) return;
    const fit = () => {
      const covered = window.innerHeight - vv.height;
      const typing = /^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '');
      html.classList.toggle('kb', covered > 120 && typing && window.matchMedia('(max-width:720px)').matches);
      html.style.setProperty('--vv-top', vv.offsetTop + 'px');
      html.style.setProperty('--vv-h', vv.height + 'px');
    };
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
    document.addEventListener('focusin', () => setTimeout(fit, 50));
    document.addEventListener('focusout', () => setTimeout(() => {
      fit();
      // iOS leaves the page scrolled to where the field was; put it back
      if (!html.classList.contains('kb')) window.scrollTo(0, 0);
    }, 50));
  })();

  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (html.requestFullscreen) html.requestFullscreen().catch(() => {});
  }
  document.addEventListener('fullscreenchange', () => {
    const b = $('#btn-full');
    setIcon(b, document.fullscreenElement ? 'i-shrink' : 'i-expand');
    b.setAttribute('aria-label', document.fullscreenElement ? 'Leave full screen' : 'Full screen');
  });

  const pip = { win: null, time: null, seg: null, task: null, btn: null };
  async function openPip() {
    if (pip.win) { pip.win.close(); return; }
    const w = await window.documentPictureInPicture.requestWindow({ width: 300, height: 190 });
    const d = w.document;
    ['/theme.css', '/focus/focus.css'].forEach((href) => {
      const l = d.createElement('link'); l.rel = 'stylesheet'; l.href = new URL(href, location.href).href;
      d.head.appendChild(l);
    });
    d.documentElement.dataset.theme = html.dataset.theme;
    d.documentElement.dataset.scene = html.dataset.scene;
    d.body.className = 'pip';
    const make = (tag, cls) => { const e = d.createElement(tag); e.className = cls; return e; };
    const sprite = document.querySelector('svg[aria-hidden="true"]').cloneNode(true);
    const seg = make('span', 'pip-seg');
    const time = make('span', 'pip-time');
    const task = make('span', 'pip-task');
    const btn = make('button', 'icon-btn sm');
    btn.type = 'button';
    btn.appendChild(d.importNode(icon('i-play'), true));
    btn.addEventListener('click', toggle);
    d.body.append(sprite, seg, time, task, btn);
    Object.assign(pip, { win: w, time, seg, task, btn });
    lastTimerText = '';
    renderTimer();
    w.addEventListener('pagehide', () => { pip.win = null; });
  }

  // ================================================================
  // popovers
  // ================================================================
  function closePops() {
    $$('.pop').forEach((p) => { p.hidden = true; });
    $$('[data-pop]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
  function togglePop(name) {
    const pop = $('#pop-' + name);
    const open = pop.hidden;
    closePops();
    if (!open) return;
    pop.hidden = false;
    $('[data-pop="' + name + '"]').setAttribute('aria-expanded', 'true');
    if (name === 'tasks') { renderTasks(); $('#task-input').focus(); }
    if (name === 'sounds') renderSounds();
    if (name === 'notes') { renderNotesMeta(); $('#notes').focus(); }
  }

  // ================================================================
  // wiring
  // ================================================================
  function renderAll() {
    renderClock(Date.now());
    renderQuote();
    renderTimer();
    renderIntent();
    renderStreak();
  }

  function arm(btn, label, onConfirm) {
    if (btn.classList.contains('armed')) {
      btn.classList.remove('armed'); btn.textContent = btn.dataset.label; clearTimeout(btn._t);
      onConfirm();
      return;
    }
    btn.dataset.label = btn.textContent;
    btn.textContent = label;
    btn.classList.add('armed');
    btn._t = setTimeout(() => { btn.classList.remove('armed'); btn.textContent = btn.dataset.label; }, 3000);
  }

  function wire() {
    // modes
    $$('.modes [data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    window.addEventListener('hashchange', () => {
      const m = (location.hash.match(/^#\/(focus|ambient)/) || [, 'home'])[1];
      if (m !== mode) setMode(m, true);
    });

    // timer
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'toggle') toggle();
      if (act === 'reset') reset();
      if (act === 'skip') skip();
      if (act === 'pip') openPip().catch(() => toast('Couldn’t float the timer here.'));
    });
    $$('#segs [data-seg]').forEach((b) => b.addEventListener('click', () => setSeg(b.dataset.seg)));
    if ('documentPictureInPicture' in window) $('#btn-pip').hidden = false;

    // quote
    $('#quote').addEventListener('click', pickQuote);

    // the one thing
    $('#intent-ask').addEventListener('click', openIntentEdit);
    $('#intent-title').addEventListener('click', openIntentEdit);
    $('#intent-input').addEventListener('input', renderPicks);
    $('#intent-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = e.target.value.trim();
        if (!v) { state.current = null; closeIntentEdit(); save(); renderIntent(); renderTasks(); return; }
        const match = openTasks().find((t) => t.title.toLowerCase() === v.toLowerCase());
        chooseIntent(match || addTask(v, true));
      }
      if (e.key === 'Escape') { e.stopPropagation(); closeIntentEdit(); }
    });
    $('#intent-picks').addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      const t = state.tasks.find((x) => x.id === b.dataset.pick);
      if (t) chooseIntent(t);
    });
    $('#intent-done').addEventListener('click', () => {
      const cur = state.current;
      const t = cur && state.tasks.find((x) => x.id === cur.id);
      if (t) setDone(t, true); else { state.doneLog.push(Date.now()); state.current = null; }
      save();
      renderIntent(); renderTasks();
      toast('Done. That counts.');
    });

    // dock
    $$('[data-pop]').forEach((b) => b.addEventListener('click', () => togglePop(b.dataset.pop)));
    $$('[data-close]').forEach((b) => b.addEventListener('click', closePops));
    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('.pop, [data-pop]')) closePops();
      if (!e.target.closest('#intent')) closeIntentEdit();
    });

    // tasks
    $('#task-add').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#task-input');
      if (addTask(input.value)) { input.value = ''; save(); renderTasks(); }
    });
    const list = $('#tasks');
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tact]');
      const li = e.target.closest('.task');
      if (!btn || !li) return;
      const t = state.tasks.find((x) => x.id === li.dataset.id);
      if (!t) return;
      const act = btn.dataset.tact;
      if (act === 'check') setDone(t, !t.done);
      if (act === 'del') {
        state.tasks = state.tasks.filter((x) => x !== t);
        if (state.current && state.current.id === t.id) state.current = null;
      }
      if (act === 'focus') { chooseIntent(t); closePops(); setMode('focus'); }
      if (act === 'edit') return;
      save();
      renderTasks(); renderIntent();
    });
    list.addEventListener('dblclick', (e) => {
      const title = e.target.closest('.task-title');
      const li = e.target.closest('.task');
      if (!title || !li) return;
      const t = state.tasks.find((x) => x.id === li.dataset.id);
      const input = document.createElement('input');
      input.className = 'task-title';
      input.value = t.title;
      input.maxLength = 140;
      input.style.cssText = 'border:0;outline:0;background:transparent;padding:0';
      title.replaceWith(input);
      input.focus();
      const done = (keep) => {
        if (keep && input.value.trim()) {
          t.title = input.value.trim();
          if (state.current && state.current.id === t.id) state.current.title = t.title;
          save();
        }
        renderTasks(); renderIntent();
      };
      input.addEventListener('keydown', (k) => {
        if (k.key === 'Enter') done(true);
        if (k.key === 'Escape') { k.stopPropagation(); done(false); }
      });
      input.addEventListener('blur', () => done(true), { once: true });
    });
    list.addEventListener('dragstart', (e) => {
      const li = e.target.closest('.task');
      if (!li) return;
      dragId = li.dataset.id;
      li.classList.add('drag');
      e.dataTransfer.effectAllowed = 'move';
    });
    list.addEventListener('dragover', (e) => {
      const li = e.target.closest('.task');
      if (!dragId || !li || li.classList.contains('done')) return;
      e.preventDefault();
      $$('.task.over', list).forEach((x) => x.classList.remove('over'));
      li.classList.add('over');
    });
    list.addEventListener('drop', (e) => {
      const li = e.target.closest('.task');
      if (!dragId || !li) return;
      e.preventDefault();
      const from = state.tasks.findIndex((x) => x.id === dragId);
      const [moved] = state.tasks.splice(from, 1);
      const to = state.tasks.findIndex((x) => x.id === li.dataset.id);
      state.tasks.splice(to < 0 ? state.tasks.length : to, 0, moved);
      save();
    });
    list.addEventListener('dragend', () => { dragId = null; renderTasks(); });
    $('#tasks-clear').addEventListener('click', () => {
      state.tasks = state.tasks.filter((t) => !t.done);
      save(); renderTasks();
    });

    // sounds
    $('#sound-cats').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (b) { soundCat = b.dataset.cat; renderSounds(); }
    });
    $('#sounds').addEventListener('click', (e) => {
      const b = e.target.closest('[data-sound]');
      if (b) { audio.toggleSound(b.dataset.sound); renderSounds(); }
    });
    $('#sounds').addEventListener('input', (e) => {
      if (e.target.dataset.vol) audio.setVol(e.target.dataset.vol, Number(e.target.value));
    });
    $('#sounds-clear').addEventListener('click', () => { audio.clearAll(); renderSounds(); });
    $('#sounds-master').addEventListener('click', () => {
      audio.playing ? audio.pause() : audio.play();
      renderSounds();
    });

    // notes
    const notes = $('#notes');
    notes.value = state.notes;
    notes.addEventListener('input', () => { state.notes = notes.value; save(); renderNotesMeta(); });
    $('#notes-clear').addEventListener('click', (e) => arm(e.currentTarget, 'Sure? Clear', () => {
      notes.value = ''; state.notes = ''; save(); renderNotesMeta(); notes.focus();
    }));

    // settings
    $('#btn-settings').addEventListener('click', () => openSettings());
    $('#settings-close').addEventListener('click', closeSettings);
    $('#shade').addEventListener('click', closeSettings);
    $$('.set-nav [data-sec]').forEach((b) => b.addEventListener('click', () => showSec(b.dataset.sec)));
    $('#settings').addEventListener('change', (e) => {
      const inp = e.target.closest('[data-set]');
      if (!inp) return;
      applySetting(inp.dataset.set, inp.type === 'checkbox' ? inp.checked : inp.type === 'number' ? Number(inp.value) : inp.value);
    });
    $('#settings').addEventListener('input', (e) => {
      const inp = e.target.closest('input[type="text"][data-set]');
      if (inp) { S[inp.dataset.set] = inp.value; lastClock = ''; save(); renderClock(Date.now()); }
    });
    $('#settings').addEventListener('click', (e) => {
      const choice = e.target.closest('[data-choice] button');
      if (choice) {
        const key = choice.parentElement.dataset.choice;
        const v = choice.dataset.v;
        applySetting(key, v === 'true' ? true : v === 'false' ? false : v);
      }
      const forBtn = e.target.closest('[data-for]');
      if (forBtn) {
        // Show the mode being dressed. Picking for Ambient while the page sat
        // on Home changed nothing you could see, and read as broken.
        sceneTarget = forBtn.dataset.for;
        if (sceneTarget !== mode) setMode(sceneTarget);
        renderScenes();
      }
      const pick = e.target.closest('[data-pick-scene]');
      if (pick) {
        S.scenes[sceneTarget] = pick.dataset.pickScene;
        visitScene[sceneTarget] = pick.dataset.pickScene;
        save();
        renderScenes();
        if (sceneTarget === mode) paintScene();
      }
      const range = e.target.closest('[data-range]');
      if (range) { statsRange = range.dataset.range; renderStats(); }
    });
    $('#scene-shuffle').addEventListener('click', () => {
      const others = SCENES.filter((s) => s.id !== S.scenes[sceneTarget]);
      const pickId = others[Math.floor(Math.random() * others.length)].id;
      S.scenes[sceneTarget] = pickId;
      visitScene[sceneTarget] = pickId;
      save(); renderScenes();
      if (sceneTarget === mode) paintScene();
    });
    $('#data-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'myadhd-focus-' + dayKey(Date.now()) + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('#data-reset').addEventListener('click', (e) => arm(e.currentTarget, 'Sure? Erase all', () => {
      erased = true;
      clearTimeout(saveTimer);
      try { localStorage.removeItem(KEY); } catch (_) {}
      location.replace(location.pathname);
    }));

    // fullscreen
    if (!document.fullscreenEnabled) $('#btn-full').hidden = true;
    $('#btn-full').addEventListener('click', toggleFull);

    // keys
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!$('#settings').hidden) closeSettings();
        else { closePops(); closeIntentEdit(); }
        return;
      }
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!$('#settings').hidden) return;
      const k = e.key.toLowerCase();
      if (k === ' ' && tag === 'button') return;      // the button's own click handles it
      if (k === ' ') { e.preventDefault(); toggle(); }
      else if (k === 'r') reset();
      else if (k === 'f') toggleFull();
      else if (k === '1') setSeg('focus');
      else if (k === '2') setSeg('short');
      else if (k === '3') setSeg('long');
    });

    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
  }

  // ================================================================
  // go
  // ================================================================
  applyLook();
  wire();
  setMode(mode, true);
  if (!location.hash) history.replaceState(null, '', '#/');
  wake.sync();
  idle.poke();
  tick();
  setInterval(tick, 250);
})(typeof window !== 'undefined' ? window : globalThis);
