/* ============ my.adhd — billing, client side ============
   Loaded by any page that needs to know whether this account is paid.
   Depends on auth.js and on config.js's Supabase values.

   What this file is NOT allowed to do: decide entitlement. It reads the
   `billing` row that /api/stripe-webhook wrote and reports it. RLS lets
   an account read its own row and write nothing, so the worst a tampered
   browser can do is lie to itself — the server never asks the client
   whether it has paid.

   That distinction is the whole design. Every gate added later must call
   the API for anything that costs money (triage, transcription) and check
   the token server-side. `entitled()` here is for showing and hiding UI,
   which is a convenience, not a lock. */
(function () {
  'use strict';

  var URL_BASE = (window.MYADHD_SUPABASE_URL || '').replace(/\/+$/, '');
  var ANON = window.MYADHD_SUPABASE_KEY || '';

  /* The shape a signed-out account has. Also what a failed read falls back
     to: unknown means not entitled, never the other way round. */
  var NONE = {
    plan: null,
    status: 'none',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    entitled: false,
    loaded: false,
  };

  var state = Object.assign({}, NONE);
  var listeners = [];

  function announce() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (_) {}
    });
  }

  /** The one rule, and it has to match is_entitled() in sql/001_billing.sql. */
  function computeEntitled(row) {
    if (!row) return false;
    if (row.status !== 'active' && row.status !== 'trialing') return false;
    if (!row.current_period_end) return true;      // lifetime
    return new Date(row.current_period_end).getTime() > Date.now();
  }

  /** The access token, or null.
      auth.token is freshToken() — it refreshes an expired one and returns
      null when the session is genuinely gone, which is exactly the
      contract cloud.js already relies on. Nothing here caches it. */
  async function token() {
    if (!window.auth || !window.auth.signedIn()) return null;
    return window.auth.token();
  }

  async function refresh() {
    if (!URL_BASE || !ANON || !window.auth || !window.auth.signedIn()) {
      state = Object.assign({}, NONE, { loaded: true });
      announce();
      return state;
    }

    var access = await token();
    if (!access) {
      state = Object.assign({}, NONE, { loaded: true });
      announce();
      return state;
    }

    try {
      /* RLS does the filtering. The `user_id=eq.` is not a security
         boundary — the policy is — it just keeps the response to one row. */
      var res = await fetch(
        URL_BASE + '/rest/v1/billing?select=plan,status,current_period_end,cancel_at_period_end&limit=1',
        { headers: { apikey: ANON, Authorization: 'Bearer ' + access } }
      );
      if (!res.ok) throw new Error('billing ' + res.status);
      var rows = await res.json();
      var row = Array.isArray(rows) && rows[0] ? rows[0] : null;

      state = {
        plan: row ? row.plan : null,
        status: row ? row.status : 'none',
        currentPeriodEnd: row && row.current_period_end ? new Date(row.current_period_end) : null,
        cancelAtPeriodEnd: !!(row && row.cancel_at_period_end),
        entitled: computeEntitled(row),
        loaded: true,
      };
    } catch (e) {
      /* Never upgrade on a failed read. An account that cannot be checked
         is an account that is not entitled, and the UI should say so
         rather than flicker into a paid state and back out of it. */
      state = Object.assign({}, NONE, { loaded: true });
    }
    announce();
    return state;
  }

  /** Send the browser to Stripe. Nothing is charged in this app. */
  async function checkout(plan) {
    var access = await token();
    if (!access) { if (window.auth) window.auth.signIn(); return; }

    var res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + access },
      body: JSON.stringify({ plan: plan }),
    });
    var data = await res.json().catch(function () { return null; });
    if (!res.ok || !data || !data.url) {
      throw new Error((data && data.error) || 'could not start checkout');
    }
    location.href = data.url;
  }

  /** Stripe's own portal: card, invoices, cancel. */
  async function portal() {
    var access = await token();
    if (!access) { if (window.auth) window.auth.signIn(); return; }

    var res = await fetch('/api/portal', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + access },
    });
    var data = await res.json().catch(function () { return null; });
    if (!res.ok || !data || !data.url) {
      throw new Error((data && data.error) || 'nothing to manage');
    }
    location.href = data.url;
  }

  window.billing = {
    state: function () { return state; },
    entitled: function () { return state.entitled; },
    refresh: refresh,
    checkout: checkout,
    portal: portal,
    onChange: function (fn) { listeners.push(fn); if (state.loaded) fn(state); },
  };

  /* Read once the account is known, and again whenever it changes. The
     webhook can take a second or two after checkout, so the page that
     Stripe returns to should call refresh() again rather than trusting
     the first read — see /billing. */
  if (window.auth && window.auth.onChange) window.auth.onChange(function () { refresh(); });
  document.addEventListener('DOMContentLoaded', function () { refresh(); });
})();
