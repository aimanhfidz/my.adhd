/* ============================================================
   my.adhd — the lists, on every device

   The account card has been promising this since accounts landed: "your
   lists sync to every device you sign in on". The table was there, the
   policies were there, and nothing ever wrote a row — so two phones
   signed into the same account each kept their own separate list and the
   promise was a lie. This file is the half that was missing.

   ---- the shape of it ----

   localStorage stays the source of truth. The app opens instantly, works
   with no signal, and works with no account at all; none of that is
   allowed to change. Supabase is a second copy that the devices meet in,
   not a database the app reads from. So this is a reconcile, the same
   shape as the Google Calendar push next door: work out the difference
   between what is here and what is there, fix it, and be safe to run
   again at any moment.

   ---- how a conflict is settled ----

   Last write wins, per task, on `updatedAt`. Whole-store versioning was
   the other option and it is wrong here: two devices that both add a task
   between syncs would make one of them lose an entire list. Per task,
   they both keep theirs. The only thing that can be lost is one edit to
   one task that was edited on two devices at once, which is the rare case
   and the cheap one.

   `updatedAt` is stamped from the device clock, so a phone that is badly
   wrong about the time will win or lose arguments it should not. The
   alternative is server time, which cannot be had without a round trip
   per write, and a round trip per write is exactly what an offline-first
   app must not need.

   ---- deletes ----

   A delete has to travel, and an absent row cannot say anything. So a
   removed task leaves a tombstone: the row stays, `deleted` goes true,
   and the other devices remove their copy when they see it. Undo works
   because putting the task back stamps it later than the tombstone, and
   later wins.

   ---- what does not sync ----

   The profile name and face, the energy setting, and the calendar link
   are per device on purpose and stay that way. Only the lists cross.
   ============================================================ */

(function () {
  const URL_BASE = (window.MYADHD_SUPABASE_URL || '').replace(/\/+$/, '');
  const ANON = window.MYADHD_SUPABASE_KEY || '';

  const STORE_KEY = 'myadhd.cloud.v1';

  /* Long enough to swallow a burst — a triage lands eight tasks with eight
     save() calls — short enough that an edit is on the other device before
     you have picked it up. */
  const DEBOUNCE = 1500;

  /* While the app is in front, ask for other devices' changes on a timer.
     Postgres can push changes over a websocket instead, which would be
     faster still, but it is another connection to keep alive and another
     failure mode on a phone that sleeps. A poll cannot get stuck.

     Twelve seconds because a minute is long enough to sit looking at a
     list you know is wrong. What makes that affordable is the probe
     below: most of these ticks never fetch a task at all, so the cost of
     asking five times a minute is a few hundred bytes. */
  const POLL = 12_000;

  /* How long a tombstone is kept. Past this the row is still on the
     server; this is only about how long *this* device argues for a delete
     it made. A device that was off for longer than this gets its copy of
     the task back, which is the failure everyone's sync has and the
     harmless direction to fail in. */
  const GRAVE_TTL = 90 * 24 * 60 * 60 * 1000;

  /* ---------------- the bookkeeping half ----------------
     Two maps, kept beside the tasks rather than inside them.

     sigs: what each task looked like the last time we stamped it. This is
     what turns "save() was called" into "task t_abc123 actually changed",
     so re-rendering, ticking a different task or renaming yourself
     generates no traffic and, more importantly, does not bump timestamps
     and beat a real edit made on the other device.

     graves: ids this device deleted, and when. */

  let book = { user: null, sigs: {}, graves: {} };

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) book = Object.assign(book, JSON.parse(raw));
  } catch (_) { /* corrupt — rebuilt on the next stamp */ }

  function persistBook() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(book)); } catch (_) {}
  }

  /* FNV-1a over the task's JSON. A hash rather than the JSON itself
     because the JSON is most of a second copy of the store, and this map
     is written on every save. */
  function sigOf(t) {
    const s = JSON.stringify(t, (k, v) => (k === 'updatedAt' ? undefined : v));
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(36) + '.' + s.length;
  }

  /* ---------------- what app.js lends us ---------------- */

  let host = null;   // { read, write, persist, repaint }

  const tasks = () => (host ? host.read() : []);

  /* ---------------- state reported back to the card ---------------- */

  let phase = 'idle';    // idle | working | error
  let lastError = null;
  let lastPullAt = 0;
  const watchers = [];

  /* The two things the cheap poll reasons from.

     newestSeen is the highest updated_at this device has seen on the
     account. If the server's highest still matches it, no device has
     written anything since we last looked and there is nothing to come
     down.

     dirty is the other half of the question: whether there is anything to
     go up. It starts true because a page that has just loaded cannot know
     — a task edited offline yesterday is still owed a push. */
  let newestSeen = '';
  let dirty = true;

  function setPhase(next, err) {
    lastError = next === 'error' ? err || 'could not reach the server' : null;
    if (phase === next && next !== 'error') return;
    phase = next;
    watchers.forEach(fn => { try { fn(); } catch (_) {} });
  }

  /* ---------------- stamping ----------------
     Called by save(), before the store is written, on every single write.
     It has to be free for the signed-out majority, and it is: one hash per
     task and no network.

     It also runs when signed out, which is deliberate. A task edited
     offline yesterday and an account added today must arrive carrying
     yesterday's real timestamps, not a flat row of "now" that would beat
     everything already on the server. */

  function stamp() {
    const list = tasks();
    const now = Date.now();
    const seen = new Set();
    let moved = false;

    for (const t of list) {
      if (!t || !t.id) continue;
      seen.add(t.id);
      const sig = sigOf(t);
      /* The missing-timestamp half matters exactly once per device: the
         first run after this file shipped, over a store full of tasks that
         predate it. Their content has not changed, so the signature alone
         would wave them through with nothing to compare against. */
      if (book.sigs[t.id] === sig && t.updatedAt) continue;

      /* Two saves inside the same millisecond would otherwise be a tie,
         and a tie is settled by whoever is asked last. Never go backwards
         and never repeat. */
      t.updatedAt = Math.max(now, (t.updatedAt || 0) + 1);
      book.sigs[t.id] = sig;
      moved = true;

      /* Back from the dead — an undo, or the same id pulled down again. */
      if (book.graves[t.id]) { delete book.graves[t.id]; }
    }

    for (const id of Object.keys(book.sigs)) {
      if (seen.has(id)) continue;
      delete book.sigs[id];
      book.graves[id] = now;
      moved = true;
    }

    for (const [id, at] of Object.entries(book.graves)) {
      if (now - at > GRAVE_TTL) { delete book.graves[id]; moved = true; }
    }

    if (moved) { dirty = true; persistBook(); }
    return moved;
  }

  /** Re-record every task as-is, without touching a timestamp. Run after a
      pull, so the copies that just came down are not read as local edits
      and pushed straight back. */
  function reseal() {
    book.sigs = {};
    for (const t of tasks()) if (t && t.id) book.sigs[t.id] = sigOf(t);
    persistBook();
  }

  /* ---------------- talking to postgrest ---------------- */

  async function rest(path, opts = {}) {
    const token = await auth.token();
    if (!token) throw new Error('signed out');

    const res = await fetch(URL_BASE + '/rest/v1/' + path, {
      method: opts.method || 'GET',
      headers: Object.assign({
        apikey: ANON,
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      }, opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      /* The detail goes to the console and no further. A PostgREST error
         body is a JSON object with a Postgres error code in it, which is
         the right thing to have when debugging and the wrong thing to put
         on a card someone reads on their phone. */
      const detail = await res.text().catch(() => '');
      if (detail) console.warn('list sync, in full:', detail.slice(0, 300));
      throw new Error(`the server answered ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json().catch(() => null);
  }

  /* ---------------- the merge ----------------
     Pure decision-making over the rows that came down. Returns whether
     anything on screen changed. */

  function merge(rows) {
    const list = tasks();
    const byId = new Map(list.map(t => [t.id, t]));
    const keep = new Set(byId.keys());
    const arrivals = [];
    let changed = false;

    for (const row of rows) {
      const rts = Date.parse(row.updated_at) || 0;
      const mine = byId.get(row.id);

      if (row.deleted) {
        /* Removed somewhere else. Unless this device has touched it since,
           in which case the task is alive again and the push will say so.

           Nothing is done about the Google event here on purpose: the
           calendar belongs to the account, not the device, so the device
           that did the deleting is already clearing it. Orphaning it a
           second time would only earn a 404. */
        if (mine && (mine.updatedAt || 0) <= rts) {
          keep.delete(row.id);
          delete book.sigs[row.id];
          book.graves[row.id] = rts;
          changed = true;
        }
        continue;
      }

      if (!mine) {
        /* Not here. Either it is new to this device, or this device is the
           one that deleted it — and a tombstone we have not managed to
           push yet must not be undone by the row it is about to overwrite. */
        const grave = book.graves[row.id] || 0;
        if (grave >= rts) continue;
        const t = Object.assign({}, row.payload, { id: row.id, updatedAt: rts });
        delete book.graves[row.id];
        arrivals.push(t);
        changed = true;
        continue;
      }

      if (rts > (mine.updatedAt || 0)) {
        /* Edited elsewhere, more recently. Replace the fields rather than
           the object so anything holding a reference to this task — an
           open detail row, a half-finished rename — is still pointing at
           the thing it was pointing at. */
        for (const k of Object.keys(mine)) delete mine[k];
        Object.assign(mine, row.payload, { id: row.id, updatedAt: rts });
        changed = true;
      }
    }

    if (changed) {
      host.write(list.filter(t => keep.has(t.id)).concat(arrivals));
    }
    return changed;
  }

  /** What the server has not got, or has got an older copy of. */
  function outbound(rows) {
    const remote = new Map(rows.map(r => [r.id, r]));
    const userId = auth.user().id;
    const out = [];

    for (const t of tasks()) {
      const r = remote.get(t.id);
      const rts = r ? (Date.parse(r.updated_at) || 0) : -1;
      const lts = t.updatedAt || 0;
      if (r && !r.deleted && rts >= lts) continue;
      out.push({
        id: t.id,
        user_id: userId,
        payload: t,
        updated_at: new Date(lts || Date.now()).toISOString(),
        deleted: false,
      });
    }

    for (const [id, at] of Object.entries(book.graves)) {
      const r = remote.get(id);
      if (r && r.deleted && (Date.parse(r.updated_at) || 0) >= at) continue;
      out.push({
        id,
        user_id: userId,
        payload: {},          // the column is NOT NULL; a tombstone has nothing to say
        updated_at: new Date(at).toISOString(),
        deleted: true,
      });
    }

    return out;
  }

  /* ---------------- a pass ---------------- */

  let timer = null;
  let running = false;
  let again = false;
  let muted = false;

  function soon() {
    if (!ready() || muted) return;
    if (running) { again = true; return; }
    clearTimeout(timer);
    timer = setTimeout(run, DEBOUNCE);
  }

  function ready() {
    return !!URL_BASE && !!ANON && !!window.auth && auth.configured() && auth.signedIn() && !!host;
  }

  async function run() {
    if (running || !ready()) return;
    running = true;
    again = false;
    setPhase('working');

    try {
      const user = auth.user();
      if (!user || !user.id) throw new Error('signed out');

      /* A store written before this file existed has tasks with no
         timestamp at all, and a pass must never send one of those up as
         "now" while treating it as "the beginning of time" here. save()
         normally does this; doing it again on the way in means the first
         pass after an upgrade cannot be the one that gets it wrong. */
      if (stamp()) host.persist();

      if (book.user !== user.id) {
        /* A different account on this device. The bookkeeping describes
           the old one's rows and means nothing here; the tasks stay put
           and get pushed up as this account's, which is what signing in on
           a device that already had a list is asking for. */
        book = { user: user.id, sigs: {}, graves: {} };
        reseal();
      }

      const rows = await rest('tasks?select=id,payload,updated_at,deleted') || [];

      /* What the cheap poll compares against from here on. Taken before
         the merge, because the merge is allowed to change our copy but
         not what the server currently holds. */
      for (const r of rows) if (r.updated_at > newestSeen) newestSeen = r.updated_at;

      const touched = merge(rows);
      if (touched) {
        host.persist();     // the merged store, written without re-stamping
        reseal();
      }

      const out = outbound(rows);
      if (out.length) {
        /* One upsert for the lot. on_conflict names the composite key, so
           a row we already have is updated rather than rejected. */
        await rest('tasks?on_conflict=id,user_id', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: out,
        });
        /* Our own writes are now the newest thing on the account. Saying
           so here is what stops the next probe seeing them as somebody
           else's news and pulling the whole list back down. */
        for (const r of out) if (r.updated_at > newestSeen) newestSeen = r.updated_at;
      }

      /* Everything owed is now sent. Anything written from here on goes
         through stamp(), which sets this again. */
      dirty = false;

      lastPullAt = Date.now();
      setPhase('idle');

      /* Last, and with the scheduler held shut. Redrawing the lists runs
         through goToNext(), which calls save(), which would otherwise book
         a whole extra pass for changes this one has just finished
         reconciling. */
      if (touched) {
        muted = true;
        try { host.repaint(); } finally { muted = false; }
      }
    } catch (err) {
      if (String(err.message) === 'signed out') setPhase('idle');
      else {
        console.warn('list sync:', err.message);
        setPhase('error', err.message);
      }
    } finally {
      running = false;
      if (again) soon();
    }
  }

  /* ---------------- when to run ----------------
     A write schedules a pass. Coming back to the app runs one, because
     that is the moment the other device's changes matter.

     There are more events here than looks necessary, and each one is a
     way a device gets left sitting on a stale list while another device
     is doing the work:

       visibilitychange - the tab was behind something and is now not.
       pageshow         - restored from the back/forward cache, which is
                          how a desktop tab that has been open for hours
                          comes back. It fires instead of load, and it can
                          fire without visibilitychange.
       focus            - clicked into, on a desktop where the window was
                          visible the whole time and so never went hidden.
       online           - the connection came back.

     None of them is reliable on its own. Together they cover it, and the
     timer below covers the case where none of them ever fires. */

  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  window.addEventListener('pageshow', wake);
  window.addEventListener('focus', wake);
  window.addEventListener('online', wake);

  /** A pass, but only if one is actually due. Safe to call on any event. */
  function wake() {
    schedulePoll();   // the timer chain may have been frozen while we were away
    if (document.hidden || !ready()) return;
    if (Date.now() - lastPullAt < 2000) return;   // several of these fire together
    soon();
  }

  /** Has anybody written anything since we last looked?

      A few dozen bytes: one column, one row, newest first. Polling four
      times a minute would otherwise mean dragging the whole list down
      four times a minute for the rare tick that has news in it, which on
      a phone is somebody's data allowance. */
  async function anythingNew() {
    const rows = await rest('tasks?select=updated_at&order=updated_at.desc&limit=1');
    const newest = (rows && rows[0] && rows[0].updated_at) || '';
    return newest !== newestSeen;
  }

  /* The timer ticks well inside POLL rather than exactly on it. A browser
     throttles timers in a background tab to roughly once a minute, so an
     interval of exactly POLL drifts and a device can go minutes past due
     without noticing. Ticking often and deciding from the clock instead
     means the pass lands on time whatever the browser did to the timer. */
  async function poll() {
    if (document.hidden || !ready() || running) return;
    if (Date.now() - lastPullAt < POLL) return;

    /* Something of ours is owed either way, so there is nothing to ask. */
    if (dirty) { soon(); return; }

    try {
      /* run() rather than soon(): the debounce exists to collapse a burst
         of save() calls, and a probe that has already confirmed there is
         something waiting has nothing to collapse. Skipping it is a
         second and a half off every pickup. */
      if (await anythingNew()) await run();
      else lastPullAt = Date.now();   // asked, nothing there, clock restarts
    } catch (_) {
      /* Not worth reporting a probe that failed — the next tick asks
         again, and a real pass is what earns the error on the card. */
    }
  }

  /* A self-rescheduling timeout rather than setInterval, and every wake
     event re-arms it.

     This is not style. A single long-lived interval is exactly what left
     a desktop sitting on a stale list: a browser freezes a background
     tab's timers, and an interval registered once at load can stop firing
     and never come back on its own. Measured in a backgrounded tab, the
     load-time interval ticked zero times in fifteen seconds while a
     timeout armed during those same fifteen seconds ticked five.

     A chain that re-arms after every tick, and that any of the four wake
     events can restart from cold, cannot get permanently stuck: the worst
     a freeze costs is the ticks it slept through. */
  let pollTimer = null;

  function schedulePoll() {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(async () => {
      try { await poll(); } finally { schedulePoll(); }
    }, 3_000);
  }

  schedulePoll();

  /* ---------------- what app.js sees ---------------- */

  window.cloud = {
    configured: () => !!URL_BASE && !!ANON,

    /** app.js hands over the four things this needs to do its job. */
    attach(h) { host = h; },

    stamp,
    soon,
    now: run,

    /** Signing out here leaves this device's copy alone — including the
        bookkeeping, so signing back in is a merge and not a re-upload of
        everything as if it were new. */
    forget() { setPhase('idle'); },

    state: () => phase,
    error: () => lastError,
    onChange(fn) { watchers.push(fn); },
  };
})();
