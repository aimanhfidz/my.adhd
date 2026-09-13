# Supabase, the parts that are not in the repo

Everything here is a setting in the Supabase dashboard. None of it is in a
file, none of it is in the diff, and all of it has to be right or the thing it
governs fails in a way that looks like a bug in the code.

Two environment variables back all of it, and both are already set in Vercel:
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The browser side uses
`MYADHD_SUPABASE_URL` and `MYADHD_SUPABASE_KEY` from `config.js`, which are
public on purpose — RLS is the boundary, not the key.

---

## 1. Redirect URLs — the one that breaks sign-in

**Authentication → URL Configuration → Redirect URLs**

`auth.js` sends `redirect_to = location.origin + location.pathname`, so every
page that can start a sign-in needs its own entry. Supabase refuses any
`redirect_to` not on this list and sends the person to an error page instead,
which looks exactly like the feature being broken.

```
https://myadhd.my/app
https://myadhd.my/self-check
https://myadhd.my/billing
https://myadhd.my/admin
http://localhost:8000/app
http://localhost:8000/self-check
```

Note the paths have no `.html`. `vercel.json` sets `cleanUrls`, and `serve.py`
does the same locally, so the browser is on `/self-check` and that is the
string that gets sent.

**If sign-in returns to a Supabase error page, it is almost always this.**

## 2. Google as a provider

**Authentication → Providers → Google**

Client ID and secret come from the Google Cloud project. The authorised
redirect URI on the Google side is Supabase's own callback —
`https://<project>.supabase.co/auth/v1/callback` — not ours.

The calendar scope is requested by `auth.js` at sign-in, not configured here.
Since 2026-09-13 `signIn()` takes an options argument and the self-check calls
it with none: the screener asks for identity only, and a person taking a
mental-health questionnaire is never shown a Google Calendar permission
prompt. See the comment on `signIn()` in `auth.js` before changing that.

## 3. The tables

**SQL editor**, once per file, in order:

- `sql/001_billing.sql`
- `sql/002_self_check.sql`

`tasks`, `google_tokens` and `feedback` predate the `sql/` directory and were
made by hand; they are described in `README.md` but there is no migration for
them. If the project is ever rebuilt from scratch, that is the gap.

### Before running 002

**Database → Extensions → enable `pg_cron`.**

`002` ends by scheduling the retention job. Without the extension that block
raises a notice and everything else still applies — so the tables land, and
the 24-month deletion silently never runs. The notice says so in capitals.
Read the output rather than assuming a green tick means all of it worked.

### After running 002

```sql
-- the job exists
select jobname, schedule, active from cron.job;

-- tomorrow: it ran
select status, return_message, start_time
  from cron.job_run_details order by start_time desc limit 5;
```

Test the purge without waiting two years:

```sql
insert into public.self_check_profile
  (user_id, full_name, email, age, gender, last_seen_at)
values ('<a real auth.users id>', 'Test', 't@example.com', 30, 'male',
        now() - interval '25 months');

select public.purge_self_check();   -- returns the number of profiles deleted
```

### Then check the revoke actually took

`save_self_check` is `security definer`, which means PostgREST publishes it at
`/rest/v1/rpc/save_self_check` to anyone holding the publishable key — and
that key is in `config.js`, so it is in every browser that has ever opened the
site. The `revoke execute` at the foot of `002` is what stops a stranger
writing rows as any user id they type. It is silent when it works and silent
when the signature does not match.

From a browser console on myadhd.my:

```js
fetch(MYADHD_SUPABASE_URL + '/rest/v1/rpc/save_self_check', {
  method: 'POST',
  headers: { apikey: MYADHD_SUPABASE_KEY, 'Content-Type': 'application/json' },
  body: '{}'
}).then(r => console.log(r.status));
```

**Anything but 200 is correct.** A 200 means the revoke did not apply and the
table is writable by the public — stop and fix it before the page goes live.

## 4. Row-level security

Every table has RLS on, a `select` policy matching `auth.uid()`, and no
insert/update/delete policy at all. Writes go through the API with the service
key, which bypasses RLS; everything else is refused by default.

`google_tokens` goes further and has no policies whatsoever — not even select —
because a refresh token should not be readable by the browser that owns it.

## 5. What is deliberately not here

No `CRON_SECRET`, no deletion endpoint, no new environment variable. Retention
runs inside the database precisely so that it needs none of those: an HTTP
endpoint whose only job is deleting rows is an attack surface bought for
nothing.
