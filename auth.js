/* ============================================================
   my.adhd — signing in

   Optional, always. The app opens on the dump box for everyone and works
   with no account, offline, exactly as it did before this file existed.
   Signing in buys two things and nothing else: your lists follow you to
   another device, and the calendar link stops expiring.

   ---- why there is no SDK here ----

   The site has no build step and no dependencies; every script is a plain
   tag. Pulling in Supabase's JS client would mean a bundler or a CDN
   script, and the privacy page makes a specific promise about third-party
   scripts that a CDN would break. Supabase's auth API is plain HTTP, so
   this talks to it directly.

   ---- the flow ----

   Redirect to Supabase's /authorize, which sends the user to Google, which
   sends them back here with tokens in the URL fragment. A fragment never
   reaches a server -- not ours, not Vercel's logs -- which is the reason
   this flow uses one.

   Two different Googles are in play and it is worth keeping them straight:

     session token   - proves who you are to Supabase. Ours to refresh.
     provider token  - lets us write to Google Calendar. Google's, expires
                       hourly, and the refresh token that renews it is
                       posted straight to /api/link-google and never kept
                       in the browser.
   ============================================================ */

(function () {
  const URL_BASE = (window.MYADHD_SUPABASE_URL || '').replace(/\/+$/, '');
  const ANON = window.MYADHD_SUPABASE_KEY || '';

  /* The calendar scope, asked for during sign-in so there is one consent
     screen rather than two. access_type=offline is what makes Google issue
     a refresh token at all; prompt=consent forces it to issue a fresh one
     even for someone who has approved before, because Google hands out a
     refresh token once per grant and we would otherwise get nothing back
     on a second sign-in. */
  const SCOPES = 'https://www.googleapis.com/auth/calendar.app.created';

  const STORE_KEY = 'myadhd.auth.v1';

  let session = null;   // { access_token, refresh_token, expiresAt, user }
  const listeners = [];

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) session = JSON.parse(raw);
  } catch (_) { /* corrupt — signed out */ }

  function persist() {
    try {
      if (session) localStorage.setItem(STORE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORE_KEY);
    } catch (_) {}
  }

  function announce() {
    listeners.forEach(fn => { try { fn(session && session.user); } catch (_) {} });
  }

  const live = () => !!session && Date.now() < session.expiresAt - 60_000;

  /* ---------------- coming back from Google ----------------
     Supabase puts the tokens in the fragment. They are read once, acted
     on, and then scrubbed out of the address bar with replaceState so a
     screenshot or a shared URL cannot carry a live session. */

  async function absorbRedirect() {
    if (!location.hash || location.hash.indexOf('access_token=') === -1) return false;

    const p = new URLSearchParams(location.hash.slice(1));
    const access = p.get('access_token');
    if (!access) return false;

    session = {
      access_token: access,
      refresh_token: p.get('refresh_token'),
      expiresAt: Date.now() + (Number(p.get('expires_in')) || 3600) * 1000,
      user: null,
    };

    history.replaceState(null, '', location.pathname + location.search);

    try {
      session.user = await fetchUser(access);
      persist();
    } catch (_) {
      session = null;
      persist();
      return false;
    }

    /* The provider refresh token appears exactly once, here, and only
       because we asked for offline access. It goes straight to the server
       and is never written to this device -- a refresh token in
       localStorage would be a permanent credential sitting on a phone. */
    const provider = p.get('provider_refresh_token');
    if (provider) {
      try {
        await fetch('/api/link-google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + access,
          },
          body: JSON.stringify({ refreshToken: provider }),
        });
      } catch (err) {
        console.warn('could not hand the calendar token over:', err.message);
      }
    }

    announce();
    return true;
  }

  async function fetchUser(access) {
    const res = await fetch(URL_BASE + '/auth/v1/user', {
      headers: { apikey: ANON, Authorization: 'Bearer ' + access },
    });
    if (!res.ok) throw new Error('could not read the account');
    const u = await res.json();
    return { id: u.id, email: u.email, name: u.user_metadata?.full_name || null };
  }

  /* ---------------- keeping the session alive ----------------
     Supabase's own refresh token, unlike Google's, is safe to keep here:
     it is scoped to this app's data and RLS still stands behind it. */

  let refreshing = null;

  async function freshToken() {
    if (!session) return null;
    if (live()) return session.access_token;
    if (refreshing) return refreshing;

    refreshing = (async () => {
      try {
        const res = await fetch(URL_BASE + '/auth/v1/token?grant_type=refresh_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: ANON },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        if (!res.ok) throw new Error('refresh rejected');
        const d = await res.json();
        session = {
          access_token: d.access_token,
          refresh_token: d.refresh_token,
          expiresAt: Date.now() + (Number(d.expires_in) || 3600) * 1000,
          user: session.user,
        };
        persist();
        return session.access_token;
      } catch (_) {
        /* The session is genuinely gone -- signed out elsewhere, or
           revoked. Drop it rather than retrying forever. */
        session = null;
        persist();
        announce();
        return null;
      } finally {
        refreshing = null;
      }
    })();

    return refreshing;
  }

  /* ---------------- what app.js sees ---------------- */

  window.auth = {
    configured: () => !!URL_BASE && !!ANON,
    user: () => (session ? session.user : null),
    signedIn: () => !!session,

    /** Leaves the page. Comes back to wherever it was called from. */
    signIn() {
      const back = location.origin + location.pathname;
      const url = URL_BASE + '/auth/v1/authorize'
        + '?provider=google'
        + '&redirect_to=' + encodeURIComponent(back)
        + '&scopes=' + encodeURIComponent(SCOPES)
        + '&access_type=offline'
        + '&prompt=consent';
      location.href = url;
    },

    async signOut() {
      const access = session && session.access_token;
      session = null;
      persist();
      announce();
      if (access) {
        try {
          await fetch(URL_BASE + '/auth/v1/logout', {
            method: 'POST',
            headers: { apikey: ANON, Authorization: 'Bearer ' + access },
          });
        } catch (_) {}
      }
    },

    token: freshToken,
    absorbRedirect,
    onChange(fn) { listeners.push(fn); },
  };
})();
