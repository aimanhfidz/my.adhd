/**
 * Shared bits for the routes that talk to Supabase with the service role.
 *
 * The service key bypasses RLS entirely, so every function in here exists
 * to make sure a request is doing something on behalf of the user who
 * actually sent it, and nothing else.
 */

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function configured() {
  return !!URL_BASE && !!SERVICE;
}

/**
 * Who sent this request.
 *
 * The access token is checked by handing it back to Supabase rather than
 * by verifying the JWT here. It costs one hop, and it means this file
 * holds no signing keys, no clock-skew rules, and no chance of my getting
 * the verification subtly wrong — the party that issued the token is the
 * one that says whether it is still good.
 *
 * Returns the user id, or null. Never throws on a bad token; a caller
 * that gets null must answer 401.
 */
export async function userFromRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  try {
    const res = await fetch(`${URL_BASE}/auth/v1/user`, {
      headers: { apikey: SERVICE, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user.id : null;
  } catch (_) {
    return null;
  }
}

/** A PostgREST call as the service role. RLS does not apply — be careful. */
export async function db(path, opts = {}) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method: opts.method || 'GET',
    headers: Object.assign(
      {
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
        'Content-Type': 'application/json',
      },
      opts.headers || {}
    ),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`supabase ${res.status}: ${detail.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json().catch(() => null);
}
