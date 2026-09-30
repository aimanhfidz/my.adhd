/* ============================================================
   my.adhd — reminders on the web

   The iOS app has always rung at a task's time, because the times are on
   the phone and iOS will schedule a notification locally. A browser will
   not: there is no way for a page to say "show this at 16:30" and go to
   sleep. What a browser can do is receive a Web Push, so the schedule has
   to live somewhere that is awake at 16:30 — /api/push holds it and
   /api/push-send, called every minute by pg_cron, sends what is due.

   On an iPhone that only works from a Home Screen copy (iOS 16.4+), never
   from a Safari tab. The card says so rather than showing a button that
   cannot work.

   ---- what goes to the server ----

   Times and tags. Nothing else. A tag is `t.<task id>` or
   `n.<note id>.<time>`, both already random, so a row reads as "something
   at 16:30" and nothing more. The words — the title and the first step —
   are written into a Cache Storage entry beside the service worker, and
   sw.js looks the tag up there when the push arrives. The push itself
   carries only the tag.

   So "your tasks live in this browser only" stays true of the tasks. What
   the server learns is when you have something on, per device, for the
   next fortnight.

   ---- which things ring ----

   The same rules the iOS app uses (MyADHD/Bridge/ReminderPlan.swift and
   NoteReminderPlan.swift), so a person with both hears the same things:

   - an open task with a day rings at its time, or nine in the morning when
     it has none. The title is the title; the body is the first step,
     because that is the part that gets you moving.
   - a note's bell rings on its day and time, and again on its repeat.

   One difference: the iOS app "rescues" an untimed task dated today whose
   nine o'clock has passed by ringing an hour later. That rule needs the
   device to remember the hour it first gave, and a server rebuilt on every
   save cannot, so here the task simply does not ring. Explicit times are
   the same on both.

   The schedule runs a fortnight ahead and is rebuilt on every save and on
   every open, so a daily note repeats for as long as the app gets opened
   at least once every two weeks.

   ---- where "on" lives ----

   Nowhere of ours. The browser's own push subscription is the switch: if
   it exists and permission is granted, reminders are on. That keeps this
   out of `myadhd.v1` (which the iOS app reads) without adding a key of our
   own for Reset to have to know about.
   ============================================================ */

(function () {
  const VAPID = (window.MYADHD_VAPID_PUBLIC_KEY || '').trim();

  /* Must match PLAN_CACHE in sw.js, which reads it, and which keeps it
     when it clears its own old caches. */
  const PLAN_CACHE = 'myadhd-reminders';
  const PLAN_URL = '/__reminders.json';

  const HORIZON = 14 * 24 * 60 * 60 * 1000;
  const LIMIT = 60;          // the server refuses more than this per device
  const NOTE_LIMIT = 6;      // as on iOS: notes are not where the day lives
  const DEFAULT_HOUR = 9;
  const DEBOUNCE = 2000;

  const IN_SHELL = /MyADHD-iOS\//.test(navigator.userAgent);
  const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const STANDALONE = (window.matchMedia && matchMedia('(display-mode: standalone)').matches)
    || navigator.standalone === true;

  function supported() {
    return !!VAPID && !IN_SHELL
      && 'serviceWorker' in navigator
      && 'PushManager' in window
      && 'Notification' in window;
  }

  /* An iPhone in a Safari tab has no PushManager at all, so supported()
     is false there — but "unsupported" would be the wrong thing to tell
     someone who is one Add to Home Screen away from it. */
  function needsHomeScreen() {
    return !!VAPID && !IN_SHELL && IOS && !STANDALONE;
  }

  async function subscription() {
    if (!supported()) return null;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? await reg.pushManager.getSubscription() : null;
    } catch (_) { return null; }
  }

  /* ---------------- the plan ---------------- */

  function parseDay(day, at) {
    const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day || '');
    if (!d) return null;
    const t = /^(\d{2}):(\d{2})$/.exec(at || '');
    const h = t ? Number(t[1]) : DEFAULT_HOUR;
    const m = t ? Number(t[2]) : 0;
    return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), h, m, 0, 0);
  }

  function clip(s, n) {
    s = String(s || '').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function noteWords(n) {
    const lines = String(n.body || '').split('\n').map(l => l.trim()).filter(Boolean);
    const title = String(n.title || '').trim();
    if (title) return { title: clip(title, 80), body: clip(lines[0] || '', 140) };
    if (lines[0]) return { title: clip(lines[0], 80), body: '' };
    return { title: 'Reminder', body: '' };
  }

  /* Every time a note rings between now and the horizon. Months past the
     28th are clamped to the month's last day, as on iOS. */
  function noteTimes(n, now, end) {
    const first = parseDay(n.remindOn, n.remindAt);
    if (!first) return [];
    const out = [];
    const rule = n.repeat || '';
    /* A daily note set a year ago starts counting near today, not on its
       first day — a day short of it, so DST cannot skip the next one. */
    const step = rule === 'daily' ? 1 : rule === 'weekly' ? 7 : 0;
    const skip = step ? Math.max(0, Math.floor((now - first) / (step * 864e5)) - 1) : 0;
    for (let i = skip; out.length < 16 && i < skip + 400; i++) {
      let at;
      if (rule === 'daily' || rule === 'weekly') {
        at = new Date(first);
        at.setDate(first.getDate() + i * (rule === 'daily' ? 1 : 7));
      } else if (rule === 'monthly') {
        const y = first.getFullYear(), mo = first.getMonth() + i;
        const last = new Date(y, mo + 1, 0).getDate();
        at = new Date(y, mo, Math.min(first.getDate(), last), first.getHours(), first.getMinutes());
      } else {
        at = first;
      }
      if (at.getTime() > end) break;
      if (at.getTime() > now) out.push(at.getTime());
      if (!rule) break;
    }
    return out;
  }

  /** [{ tag, at, title, body }], soonest first. Pure — the tests call it. */
  function plan(state, now = Date.now()) {
    const end = now + HORIZON;
    const out = [];

    for (const t of (state && state.tasks) || []) {
      if (!t || t.done || t.skipped || !t.id || !t.title) continue;
      const at = parseDay(t.when, t.at);
      if (!at || at.getTime() <= now || at.getTime() > end) continue;
      out.push({
        tag: 't.' + t.id,
        at: at.getTime(),
        title: clip(t.title, 80),
        body: clip(t.firstStep || '', 140),
      });
    }

    const notes = [];
    for (const n of (state && state.notes) || []) {
      if (!n || !n.id || !n.remindOn) continue;
      const words = noteWords(n);
      for (const at of noteTimes(n, now, end)) {
        notes.push({ tag: `n.${n.id}.${at}`, at, title: words.title, body: words.body, note: n.id });
      }
    }
    /* Six notes, not six rings: a daily note is one of the six. */
    const kept = new Set(
      notes.slice().sort((a, b) => a.at - b.at).map(x => x.note)
        .filter((id, i, all) => all.indexOf(id) === i).slice(0, NOTE_LIMIT)
    );
    for (const x of notes) {
      if (kept.has(x.note)) out.push({ tag: x.tag, at: x.at, title: x.title, body: x.body });
    }

    return out.sort((a, b) => a.at - b.at).slice(0, LIMIT);
  }

  /* ---------------- sending it ---------------- */

  let latest = null;         // the state to plan from, set by soon()
  let sentSig = '';          // what the server last accepted this session
  let timer = null;

  function soon(state) {
    if (!supported()) return;
    latest = state;
    clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE);
  }

  async function writeWords(items) {
    const words = {};
    for (const x of items) words[x.tag] = { title: x.title, body: x.body };
    try {
      const c = await caches.open(PLAN_CACHE);
      await c.put(PLAN_URL, new Response(JSON.stringify(words), {
        headers: { 'Content-Type': 'application/json' },
      }));
    } catch (_) { /* the push still shows, with a plainer line — see sw.js */ }
  }

  async function flush() {
    const sub = await subscription();
    if (!sub || Notification.permission !== 'granted' || !latest) return;

    const items = plan(latest);
    /* The words first: a push that lands between the two writes should
       find the new wording rather than miss it. */
    await writeWords(items);

    const fires = items.map(x => ({ tag: x.tag, at: x.at }));
    const sig = sub.endpoint + '|' + JSON.stringify(fires);
    if (sig === sentSig) return;

    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub: sub.toJSON(), fires }),
      });
      if (res.ok) sentSig = sig;
    } catch (_) { /* offline: the next save or open tries again */ }
  }

  /* ---------------- the switch ---------------- */

  function keyBytes(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }

  /* Must be called from a tap. iOS refuses a permission prompt that is
     not the direct result of one, and says so by quietly returning
     'denied' — which then sticks. */
  async function enable() {
    if (!supported()) return 'unsupported';
    const asked = await Notification.requestPermission();
    if (asked !== 'granted') return asked;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription())
        || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) });
      if (!sub) return 'failed';
    } catch (_) { return 'failed'; }

    sentSig = '';
    await flush();
    return 'on';
  }

  async function disable() {
    const sub = await subscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    try { await sub.unsubscribe(); } catch (_) {}
    try {
      await fetch('/api/push', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
    } catch (_) { /* the sender drops it on the first 410 anyway */ }
    sentSig = '';
    try { await caches.delete(PLAN_CACHE); } catch (_) {}
  }

  /** 'hidden' | 'install' | 'blocked' | 'on' | 'off' */
  async function status() {
    if (needsHomeScreen()) return 'install';
    if (!supported()) return 'hidden';
    if (Notification.permission === 'denied') return 'blocked';
    const sub = await subscription();
    return sub && Notification.permission === 'granted' ? 'on' : 'off';
  }

  /* ---------------- the card on Settings ----------------
     Painted from here rather than app.js so the whole feature is one file
     to read. textContent only, as everywhere. */

  const COPY = {
    off: {
      state: 'Off',
      note: 'A nudge at the time you gave a task, with its first step. Only the times reach our server — the words stay on this device.',
      btn: 'Turn on reminders',
    },
    on: {
      state: 'On for this device',
      note: 'Tasks with a day ring at their time, or at nine when they have none. Notes ring when their bell says.',
      btn: '',
    },
    blocked: {
      state: 'Blocked',
      note: 'Notifications are switched off for my.adhd. Turn them on in your settings for this app or site, then come back.',
      btn: '',
    },
    install: {
      state: 'Needs the Home Screen',
      note: 'On iPhone, reminders only work from my.adhd on your Home Screen. Tap Share, then Add to Home Screen, and open it from there.',
      btn: 'Show me how',
    },
  };

  function $(id) { return document.getElementById(id); }

  async function paint() {
    const card = $('push-card');
    if (!card) return;
    const s = await status();
    const section = card.closest('.settings-section') || card;
    section.classList.toggle('is-hidden', s === 'hidden');
    if (s === 'hidden') return;

    const c = COPY[s];
    card.classList.toggle('is-on', s === 'on');
    card.classList.toggle('is-stale', s === 'blocked');
    $('push-state').textContent = c.state;
    $('push-note').textContent = c.note;
    const btn = $('push-btn');
    btn.textContent = c.btn;
    btn.classList.toggle('is-hidden', !c.btn);
    btn.disabled = false;
    $('push-off').classList.toggle('is-hidden', s !== 'on');
  }

  function wire(toast) {
    const btn = $('push-btn');
    const off = $('push-off');
    if (!btn || !off) return;
    const say = typeof toast === 'function' ? toast : () => {};

    btn.addEventListener('click', async () => {
      if (needsHomeScreen()) { location.href = '/install'; return; }
      btn.disabled = true;
      const r = await enable();
      if (r === 'on') say('Reminders are on.');
      else if (r === 'denied') say('Notifications were turned down. You can allow them in settings.');
      else if (r === 'failed') say('Could not turn reminders on. Try again in a moment.');
      paint();
    });

    off.addEventListener('click', async () => {
      off.disabled = true;
      await disable();
      off.disabled = false;
      say('Reminders are off on this device.');
      paint();
    });
  }

  /* A permission turned off in iOS Settings while the app was away leaves
     the subscription behind; this is where it is noticed. */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && latest) soon(latest);
  });

  window.reminders = { supported, status, enable, disable, soon, paint, wire, plan };
})();
