/* ============================================================
   my.adhd — Google Calendar link

   What this file is for: the app has no accounts and no server-side
   store, and this feature does not get to change that. So the whole
   OAuth dance happens in the browser with Google Identity Services and
   an access token that lives in memory for an hour. There is no client
   secret, no refresh token, and nothing about your Google account is
   ever sent to our backend — the calls in here go straight from your
   browser to googleapis.com.

   The scope is calendar.app.created, which is the narrow one: it lets
   the app make its own secondary calendar and edit events on *that*.
   It cannot read, change or delete anything on the calendars you
   already had. That is deliberate — a task app has no business holding
   the keys to your real diary.

   app.js owns the tasks and decides what should exist; this file owns
   the connection and the three verbs (insert / patch / remove).
   ============================================================ */

(function () {
  const GIS_SRC = 'https://accounts.google.com/gsi/client';
  const SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';
  const API = 'https://www.googleapis.com/calendar/v3';

  const CAL_NAME = 'my.adhd';
  const STORE_KEY = 'myadhd.gcal.v1';

  /* The client ID is public by design — it is in every OAuth redirect and
     Google's own docs put it in the page. config.js sets it; if that file
     is missing or still on the placeholder, the feature stays invisible
     rather than showing a button that cannot work. */
  const CLIENT_ID = (window.MYADHD_GOOGLE_CLIENT_ID || '').trim();

  const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  /* ---------------- the stored half ----------------
     What has to survive a reload: whether we are linked, which calendar we
     made, and — see the long note below — the token, until it expires. */

  let link = { connected: false, calendarId: null, email: null, token: null };

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) link = Object.assign(link, JSON.parse(raw));
  } catch (_) { /* corrupt — start disconnected */ }

  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(link)); } catch (_) {}
  }

  /* ---------------- the token ----------------
     This was memory-only, which is the safer thing and was the right
     instinct: an access token on disk is a bearer credential that any
     script on this origin can read. It leaned on Google renewing silently,
     so the only cost of forgetting it was an invisible round-trip after a
     reload.

     On a phone that turned out to be wrong. The silent path needs Google's
     iframe on accounts.google.com to read its own session cookie, and iOS
     blocks precisely that: Safari's tracking prevention refuses
     third-party cookie access, and a home-screen install gets its own
     storage container with no Google session in it at all. So every reopen
     failed to renew and the app demanded a reconnect before it would save
     one dated task. A security property that nobody can use is not a
     security property; it is a broken feature with a good excuse.

     So it is kept, and only until it expires — an hour, Google's number.
     What that buys against what it costs: the scope is
     calendar.app.created, so the worst this token can do is edit the app's
     own calendar. It cannot read, change or delete anything on the
     calendars you already had. There is no XSS path to it today — every
     piece of task text reaches the DOM through textContent. Unlinking
     deletes it and asks Google to revoke it.

     Persisting a token that could reach a real diary would not be worth
     it. This one is. */

  let token = null;        // { value, expiresAt }, mirrored into `link`
  let tokenClient = null;
  let gisLoading = null;

  /* Half a minute of headroom, so a token that would die mid-request is
     never handed out in the first place. */
  const tokenLive = () => !!token && Date.now() < token.expiresAt - 30_000;
  const stillGood = (t) => !!t && Date.now() < t.expiresAt - 30_000;

  if (stillGood(link.token)) token = link.token;
  else if (link.token) { link.token = null; persist(); }

  /** Remember it, or forget it. Both have to reach disk. */
  function setToken(next) {
    token = next;
    link.token = next;
    persist();
  }

  function loadGIS() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    if (gisLoading) return gisLoading;

    gisLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GIS_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { gisLoading = null; reject(new Error('could not reach Google')); };
      document.head.appendChild(s);
    });
    return gisLoading;
  }

  /* One token client, reused. Its callback is swapped per request rather
     than the client being rebuilt, because GIS keeps internal state about
     the session and a fresh client each time loses the silent path. */
  let pending = null;

  async function ensureClient() {
    await loadGIS();
    if (tokenClient) return tokenClient;

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        const settle = pending; pending = null;
        if (!settle) return;
        if (resp.error) { settle.reject(new Error(resp.error)); return; }
        setToken({
          value: resp.access_token,
          expiresAt: Date.now() + (Number(resp.expires_in) || 3600) * 1000,
        });
        settle.resolve(token.value);
      },
      error_callback: (err) => {
        const settle = pending; pending = null;
        settle?.reject(new Error(err?.type || 'popup_closed'));
      },
    });
    return tokenClient;
  }

  /* `interactive` is the difference between "ask the user" and "renew
     quietly". The quiet one only works while Google still has a session in
     this browser and the grant is still there; when it does not, it fails
     fast and the profile card asks for a reconnect rather than throwing a
     popup at someone who was doing something else. */
  /* The signed-in path, and the reason accounts exist here at all.
     Our server holds a refresh token and spends it to mint a fresh access
     token, server to server. No popup, no iframe, no Google session
     needed in this browser — which is exactly what iOS would not give us.
     Returns null when there is no account or no link yet, so the caller
     can fall through to the browser flow below. */
  async function serverToken() {
    if (!window.auth || !auth.signedIn()) return null;

    const jwt = await auth.token();
    if (!jwt) return null;

    let res;
    try {
      res = await fetch('/api/gcal-token', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + jwt },
      });
    } catch (_) {
      return null;                     // offline; the pass will run again
    }

    if (res.status === 404) return null;   // signed in, calendar not linked
    if (res.status === 409) {
      /* The grant was revoked on Google's side. Forget the link so the
         card asks to link again rather than retrying a dead token. */
      link.connected = false;
      setToken(null);
      return null;
    }
    if (!res.ok) return null;

    const d = await res.json().catch(() => null);
    if (!d || !d.accessToken) return null;

    if (d.calendarId && !link.calendarId) { link.calendarId = d.calendarId; }
    setToken({
      value: d.accessToken,
      expiresAt: Date.now() + (Number(d.expiresIn) || 3600) * 1000,
    });
    return d.accessToken;
  }

  async function getToken(interactive) {
    if (tokenLive()) return token.value;

    /* Try the account first. When it works it is silent and reliable; the
       browser flow below is the fallback for anyone not signed in. */
    const minted = await serverToken();
    if (minted) return minted;

    const client = await ensureClient();
    if (pending) throw new Error('another sign-in is already open');

    return new Promise((resolve, reject) => {
      pending = { resolve, reject };

      /* A silent request that never comes back is the normal shape of
         failure — no session, third-party cookies off, iframe blocked.
         Without this it would hang the sync for ever. */
      if (!interactive) {
        setTimeout(() => {
          if (pending && pending.reject === reject) {
            pending = null;
            reject(new Error('interaction_required'));
          }
        }, 12_000);
      }

      try {
        client.requestAccessToken(interactive ? { prompt: 'consent' } : { prompt: '' });
      } catch (err) {
        pending = null;
        reject(err);
      }
    });
  }

  /* ---------------- talking to the API ----------------
     One 401 retry, because the only thing a 401 means here is that the
     token aged out mid-run. Anything else is surfaced with the message
     Google actually sent, which is far more use than "sync failed". */

  async function call(path, opts = {}, retried = false) {
    const access = await getToken(false);

    const res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers: Object.assign(
        { Authorization: 'Bearer ' + access },
        opts.body ? { 'Content-Type': 'application/json' } : {}
      ),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    if (res.status === 401 && !retried) {
      /* Rejected, so the stored copy is worthless too — drop it from disk
         rather than leaving a dead credential lying about. */
      setToken(null);
      return call(path, opts, true);
    }

    if (res.status === 204) return null;

    let data = null;
    try { data = await res.json(); } catch (_) {}

    if (!res.ok) {
      const err = new Error(data?.error?.message || `Google returned ${res.status}`);
      err.status = res.status;
      err.reason = data?.error?.errors?.[0]?.reason || null;
      throw err;
    }
    return data;
  }

  /* ---------------- our calendar ----------------
     Found before it is made. Clearing site data or opening the app on a
     second device loses the stored id but not the calendar itself, and
     creating a second "my.adhd" every time would leave a pile of them in
     someone's sidebar. The list call is allowed to fail — under this scope
     it only ever returns calendars this app made, and if it is refused
     outright we can still fall through and create one. */

  async function ensureCalendar() {
    if (link.calendarId) return link.calendarId;

    try {
      const list = await call('/users/me/calendarList?minAccessRole=owner&maxResults=250');
      const hit = (list?.items || []).find(c => c.summary === CAL_NAME);
      if (hit) {
        link.calendarId = hit.id;
        persist();
        return hit.id;
      }
    } catch (_) { /* not fatal — make one */ }

    const made = await call('/calendars', {
      method: 'POST',
      body: {
        summary: CAL_NAME,
        description: 'Dated tasks from my.adhd. Ticking one off in the app removes it here.',
        timeZone: TZ,
      },
    });

    link.calendarId = made.id;
    persist();

    /* Cosmetic and best-effort: give it a colour of its own so it reads as
       a separate layer in the Google grid instead of blending into the
       default one. A failure here changes nothing that matters. */
    try {
      await call('/users/me/calendarList/' + encodeURIComponent(made.id), {
        method: 'PUT',
        body: { id: made.id, colorId: '5', selected: true },
      });
    } catch (_) {}

    return made.id;
  }

  /* ---------------- events ---------------- */

  const path = (id) =>
    `/calendars/${encodeURIComponent(link.calendarId)}/events` +
    (id ? '/' + encodeURIComponent(id) : '');

  async function insert(event) {
    await ensureCalendar();
    const made = await call(path() + '?sendUpdates=none', { method: 'POST', body: event });
    return made.id;
  }

  /* PATCH rather than PUT: it only sends what changed, and it leaves alone
     anything the user edited on the Google side that we do not model. */
  async function patch(id, event) {
    await ensureCalendar();
    await call(path(id) + '?sendUpdates=none', { method: 'PATCH', body: event });
  }

  /* Already-gone is a success. Someone deleting the event in Google is a
     perfectly ordinary thing to do, and it should not wedge the sync. */
  async function remove(id) {
    if (!link.calendarId) return;
    try {
      await call(path(id) + '?sendUpdates=none', { method: 'DELETE' });
    } catch (err) {
      if (err.status === 404 || err.status === 410) return;
      throw err;
    }
  }

  /* ---------------- connect / disconnect ---------------- */

  async function connect() {
    if (!CLIENT_ID) throw new Error('no Google client ID is configured');

    await getToken(true);          // the consent screen, once
    await ensureCalendar();

    link.connected = true;
    persist();
    return link;
  }

  /* Local by default: forget the token and the link, leave the calendar
     and its events where they are. Deleting someone's data because they
     unplugged an integration is the wrong instinct — `wipe` is there for
     when they say so out loud. */
  async function disconnect(wipe = false) {
    if (wipe && link.calendarId && tokenLive()) {
      try {
        await call('/calendars/' + encodeURIComponent(link.calendarId), { method: 'DELETE' });
      } catch (_) {}
    }

    if (token) { try { google.accounts.oauth2.revoke(token.value, () => {}); } catch (_) {} }

    token = null;
    link = { connected: false, calendarId: null, email: null, token: null };
    persist();
  }

  /* ---------------- what app.js sees ---------------- */

  window.gcal = {
    configured: () => !!CLIENT_ID,
    connected:  () => !!link.connected,
    calendarId: () => link.calendarId,
    timeZone:   () => TZ,
    /** Renew quietly. Resolves true when a live token is in hand. */
    warm: async () => {
      if (!link.connected) return false;
      try { await getToken(false); return true; } catch (_) { return false; }
    },
    /* Called after a sign-in that carried the calendar scope. That sign-in
       already granted everything the old Link button used to ask for, so
       there is nothing to prompt for — just confirm the server can mint a
       token and make sure the calendar exists. */
    async adopt() {
      const minted = await serverToken();
      if (!minted) return false;
      link.connected = true;
      persist();
      try { await ensureCalendar(); } catch (_) { /* next pass retries */ }
      return true;
    },
    connect, disconnect, insert, patch, remove,
  };
})();
