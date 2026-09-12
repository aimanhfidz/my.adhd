# Stripe — setting it up

The code is written and tested. What is left is the part that needs your
account, and none of it should come through me: **never paste a secret key
into a chat, a file in this repo, or `config.js`.** Everything below is
done in your own dashboard and your own Vercel project settings.

Do it in **test mode** first. The whole thing works end to end with test
keys and a fake card, and nothing about the switch to live mode changes
the code — only four env vars.

---

## 1. The account

Stripe must be able to charge in **MYR**, which means a Stripe Malaysia
account (a business registered in Malaysia, with a Malaysian bank account
for payouts). If your account is in another country you can still *price*
in MYR, but settlement and available payment methods change — check
Dashboard → Settings → Payments before building on it.

Worth turning on while you are there: **FPX** and **GrabPay** under
Payment methods. In Malaysia those convert considerably better than cards
alone, and Checkout will show them automatically for MYR. Note FPX does
not support recurring charges — it will appear for Lifetime and not for
the two subscriptions, which is Stripe's behaviour, not a bug.

## 2. The three products

Dashboard → **Product catalogue** → Add product. Make three, and copy the
**price ID** (`price_…`, not the `prod_…`) out of each one.

| Product | Price | Billing | Price ID goes in |
|---|---|---|---|
| my.adhd Weekly | RM 9.90 | Recurring, every 1 week | `STRIPE_PRICE_WEEKLY` |
| my.adhd Annual | RM 49.90 | Recurring, every 1 year | `STRIPE_PRICE_ANNUAL` |
| my.adhd Lifetime | RM 99.90 | **One time** | `STRIPE_PRICE_LIFETIME` |

Two things that are easy to get wrong:

- **Lifetime must be a one-time price, not a subscription.** The code
  sends it to Checkout in `payment` mode; a recurring price there is
  rejected by Stripe. A "subscription that renews in 100 years" is the
  other way people build this and it leaves a renewal to go wrong later.
- **Do not set the trial on the product.** The 3 days are applied by
  `api/checkout.js` (`trial_period_days`), so the trial lives in code
  where you can see it, and only the weekly plan gets one. Setting it in
  both places gives you two trials stacked.

Or with the CLI, if you would rather not click:

```sh
stripe products create --name "my.adhd Weekly"   # then, with the prod_… it prints:
stripe prices create --product prod_XXX --currency myr --unit-amount 990  --recurring[interval]=week
stripe prices create --product prod_YYY --currency myr --unit-amount 4990 --recurring[interval]=year
stripe prices create --product prod_ZZZ --currency myr --unit-amount 9990
```

Amounts are in **sen** — 990 is RM 9.90. Getting this wrong by a factor of
100 is the classic first-day mistake in both directions.

## 3. The webhook

This is the only thing that grants access. Without it, people pay and
nothing happens.

**Live / preview:** Dashboard → Developers → Webhooks → Add endpoint.

- URL: `https://myadhd.my/api/stripe-webhook`
- Events — exactly these four, and no others:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Copy the **signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

**Locally:**

```sh
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

That prints its own `whsec_…`, different from the dashboard one. Use it
for local runs and keep them separate.

## 4. The database

Run `sql/001_billing.sql` once in the Supabase SQL editor. It creates the
`billing` table, the RLS policy that lets an account read its own row and
write nothing, and `is_entitled()`.

Check RLS took:

```sql
select * from public.billing;                    -- as service role: rows
-- then from the app, signed in as someone else: zero rows, not an error
```

## 5. The environment variables

Vercel → Project → Settings → Environment Variables. All four are secret
and none may ever appear in `config.js`.

| Variable | Where it comes from |
|---|---|
| `STRIPE_SECRET_KEY` | Developers → API keys → Secret key (`sk_test_…` / `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | The endpoint's signing secret (`whsec_…`) |
| `STRIPE_PRICE_WEEKLY` | Price ID from step 2 |
| `STRIPE_PRICE_ANNUAL` | Price ID from step 2 |
| `STRIPE_PRICE_LIFETIME` | Price ID from step 2 |
| `PUBLIC_SITE_URL` | Optional. `https://myadhd.my`. Only needed if the forwarded host is wrong |

Set them for **Preview** with test keys and **Production** with live keys.
Mixing them is what produces "no such price" in production.

## 6. Testing it

Open `/billing`, sign in, and buy each plan.

| Card | What it does |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 3220` | Forces 3D Secure |
| `4000 0000 0000 9995` | Declines — insufficient funds |

Any future expiry, any CVC, any postcode.

**What to actually check**, in order of how likely it is to be wrong:

1. **The row appears.** After checkout, `/billing` shows `entitled yes`
   within a second or two. If it never does, the webhook is not arriving —
   check Dashboard → Webhooks → the endpoint → recent deliveries.
2. **The trial does what you think.** Weekly should land as
   `status trialing` with `renews` three days out. Not `active`.
3. **Lifetime has no period end.** `plan lifetime`, `renews never`. If it
   shows a date, the price was created as recurring.
4. **Cancelling does not revoke immediately.** Cancel in the portal →
   `cancelling yes, at period end`, still `entitled yes`. Access should
   end at the date, not at the click. This is the one most people get
   wrong and it produces refund requests.
5. **A failed renewal actually lapses.** Use the declining card, then in
   the dashboard advance the test clock or wait for the retry to exhaust.
   Status goes `past_due` → `canceled`, and `is_entitled` goes false.
   `past_due` is deliberately *not* entitled in this code.

## 7. Before going live

- Switch the four vars to live values, redeploy, and buy one plan with a
  real card. Refund it from the dashboard afterwards.
- Fill in Stripe's **public business details** — name, support email,
  statement descriptor. The descriptor is what shows on a bank statement;
  if it is not recognisable you get chargebacks from your own customers.
- Write the refund policy and link it from the pricing page. Malaysian
  consumer law and Stripe's own rules both expect one, and "lifetime"
  especially needs a stated position.
- Decide what happens to a lifetime purchase if the app is ever
  discontinued. It is a promise with no end date; it is worth knowing what
  you mean by it before selling it.

---

## What is not built yet

**Nothing is gated.** The rail is complete — checkout, webhook,
entitlement, portal — and `window.billing.entitled()` returns a truthful
answer, but no feature anywhere reads it yet. The app behaves exactly as
it did. That was deliberate: what gets limited is a product decision, and
until it is made this ships without changing anything a user can see.

When you do decide, two rules:

- **UI hiding is not a lock.** `billing.entitled()` in the browser is for
  showing and hiding. Anything that costs real money — `api/triage.js`,
  `api/transcribe.js` — must check the token server-side and call
  `is_entitled()` itself. A gate that only exists in JavaScript is a gate.
- **The free tier has to keep the promise.** The site currently says
  "free", "no account", "your lists stay on your device" on several pages,
  and the README says signup friction is where ADHD users leave. Whatever
  is gated, those sentences either stay true or get rewritten — both are
  fine, but they cannot disagree with the app.

**iOS.** The shell in `ios/` is a `WKWebView` around myadhd.my. Apple's
Guideline 3.1.1 requires In-App Purchase for digital content unlocked
inside an app, so a Stripe paywall visible in that window is a rejection.
Before the shell goes to review, either hide all upgrade UI when running
inside it, or add StoreKit. The `source` column in `billing` exists so an
Apple receipt can grant the same entitlement later without a second table.
