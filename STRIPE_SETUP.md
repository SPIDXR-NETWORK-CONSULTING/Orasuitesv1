# ORÁ Suites — Stripe deposits: setup

Everything below is done **by you**, once. The code is already deployed-ready and
**does nothing until these variables exist** — no keys are in the repo and none
ever should be.

Until `STRIPE_SECRET_KEY` is set, the site behaves exactly as it does today:
bookings work, the deposit panel stays in "Payments launching soon" preview, and
`/api/health` reports `stripe: not connected — optional`.

> **Read this first:** the card is charged **before** the appointment is created.
> If the card fails, no appointment exists and nothing is charged. If the card
> succeeds but the appointment then fails, the code **refunds the deposit
> automatically** and tells the customer. See "What happens if something goes
> wrong" at the bottom.

---

## 1. Get your keys from Stripe

1. Go to <https://dashboard.stripe.com/apikeys>.
2. Copy the **Secret key** (`sk_live_…`) and the **Publishable key** (`pk_live_…`).
3. Do this in **Test mode** first (`sk_test_…` / `pk_test_…`) — see section 5.

Never paste a secret key into a chat, a file in this repo, or a commit message.
If one is ever exposed, roll it immediately at that same page.

---

## 2. Generate the two secrets we own

Run these in Terminal and keep the output somewhere safe (a password manager):

```bash
openssl rand -hex 32     # → BOOKING_CANCEL_SECRET  (signs customer cancel links)
openssl rand -hex 32     # → ADMIN_CANCEL_SECRET    (staff-only "always refund" cancels)
```

They must be **different** from each other.

---

## 3. Add the environment variables to Vercel

Run from the project folder (`Ora-Suites/`). Each command pastes one value.

```bash
# Stripe — server side
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production        # from section 4, do this after

# Stripe — publishable key (safe to be public; needed twice)
npx vercel env add STRIPE_PUBLISHABLE_KEY production        # server/reference copy
npx vercel env add VITE_STRIPE_PUBLISHABLE_KEY production   # what the browser actually uses

# Cancellation links
npx vercel env add BOOKING_CANCEL_SECRET production
npx vercel env add ADMIN_CANCEL_SECRET production
```

Each command prompts `? What's the value of …` — paste, press Enter.

Non-interactive alternative (careful: this puts the value in your shell history):

```bash
printf 'pk_live_xxx' | npx vercel env add VITE_STRIPE_PUBLISHABLE_KEY production --force
```

> `VITE_STRIPE_PUBLISHABLE_KEY` is **baked into the JavaScript bundle at build
> time**. Adding it is not enough — you must redeploy (`npm run deploy`) for the
> browser to see it. Publishable keys are designed to be public; this is correct
> and safe. The **secret** key is only ever read on the server.

### The complete list

| Variable | Required? | Used by | What it is |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | to take deposits | server | `sk_live_…`. Absent = deposits off, everything else unchanged. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | to take deposits | browser | `pk_live_…`. Absent = deposit panel stays in preview. |
| `STRIPE_PUBLISHABLE_KEY` | optional | reference | Same `pk_live_…`, kept for parity/tooling. |
| `STRIPE_WEBHOOK_SECRET` | for reconciliation | server | `whsec_…` from section 4. Absent = webhook returns 503; bookings unaffected. |
| `BOOKING_CANCEL_SECRET` | for cancel links | server | Signs the "Need to cancel?" link in the confirmation email. Absent = the line is simply omitted. |
| `ADMIN_CANCEL_SECRET` | for staff cancels | server | Lets staff cancel-with-full-refund via `?clinic=1`. |
| `PUBLIC_BASE_URL` | optional | server | Defaults to `https://www.orasuites.com`. Only set it if the domain changes. |

Then deploy:

```bash
npm run deploy
npm run health          # expect "stripe":{"ok":true,"detail":"live mode key OK"}
```

---

## 4. Create the webhook endpoint in Stripe

1. Go to <https://dashboard.stripe.com/webhooks> → **Add endpoint**.
2. **Endpoint URL** — exactly:

   ```
   https://www.orasuites.com/api/webhooks/stripe
   ```

3. **Select events** — add these two:

   - `charge.refunded`
   - `payment_intent.payment_failed`

   (Nothing else is needed. The booking itself does **not** depend on the
   webhook — deposits are verified synchronously when the booking is made.
   The webhook exists so refunds and declined cards are visible in the logs
   for reconciliation.)

4. Click **Add endpoint**, then **Reveal** the *Signing secret* (`whsec_…`).
5. Add it:

   ```bash
   npx vercel env add STRIPE_WEBHOOK_SECRET production
   npm run deploy
   ```

6. Test it: on the endpoint page click **Send test webhook** → `charge.refunded`.
   You should get a `200` with `{"received":true,...}`. A `400` means the signing
   secret doesn't match what's in Vercel.

---

## 5. Test everything in Stripe test mode first

Do this before you switch to live keys.

1. Flip the Stripe dashboard to **Test mode** (toggle, top right) and use the
   `sk_test_…` / `pk_test_…` keys plus a **test-mode** webhook secret.
2. Deploy, then go to <https://www.orasuites.com/book> and book a **paid**
   treatment (a free consultation deliberately skips payment entirely).
3. Use Stripe's test cards:

   | Card number | What it does |
   |---|---|
   | `4242 4242 4242 4242` | succeeds |
   | `4000 0000 0000 9995` | declined — insufficient funds |
   | `4000 0025 0000 3155` | requires 3-D Secure authentication |

   Any future expiry date, any CVC, any postcode.

4. Check, in order:
   - the deposit shows the right figure (20% of the menu price, e.g. £125 → £25);
   - the charge appears at <https://dashboard.stripe.com/test/payments>;
   - the appointment exists in GHL and in the "ORÁ — All Appointments" Google calendar;
   - the confirmation email contains the deposit line, the **Cancel this appointment**
     link and the 24-hour policy sentence.
5. Click the cancel link in that email. You should see a confirmation page saying
   whether the deposit will be refunded, and only after you press the button does
   anything happen.
6. When you're satisfied, repeat section 3 with the **live** keys and redeploy.

---

## 6. How the money works

| Situation | Deposit |
|---|---|
| Customer books a paid treatment | 20% of the menu price is charged **now**; the balance is paid at the clinic. |
| Customer books a free consultation | Nothing charged, no card asked for. |
| Customer cancels **more than 24 h** before | **Refunded in full, automatically.** |
| Customer cancels **within 24 h** | **Retained.** They are told this plainly before they confirm. |
| **Clinic** cancels (any timing) | **Refunded in full, automatically.** |
| Reschedule | Deposit is **kept and carried to the new time.** Never refunded, never re-charged. |

**Rescheduling** is done the way it always has been — move the appointment in
GHL. Do **not** use the cancel link for a reschedule, or the deposit will be
refunded and you'd have to take it again.

### Cancelling as the clinic (always refunds)

```bash
curl -X POST "https://www.orasuites.com/api/booking/cancel?a=<APPOINTMENT_ID>&c=<CONTACT_ID>&clinic=1" \
  -H "x-admin-cancel-secret: <ADMIN_CANCEL_SECRET>"
```

The appointment id and contact id are on the appointment in GHL. This refunds in
full regardless of timing, cancels in GHL, removes the Google calendar event,
moves the opportunity to **Online Bookings → Cancelled**, and emails the customer.

### Where refunds show up

- **Stripe:** <https://dashboard.stripe.com/payments> → open the payment →
  "Refunded" with the amount and a `ora_reason` note saying why
  (e.g. `customer cancelled 72h before start`, `clinic-initiated cancellation`).
- **The customer's statement:** 5–10 working days, back to the original card.
  Stripe does not charge you a fee to refund, but the original processing fee is
  not returned.
- **Your logs:** Vercel → Project → Logs. Search `[stripe-webhook] charge.refunded`.

---

## What happens if something goes wrong

The card is charged **before** the appointment is created, so that a booking can
never exist unpaid. The failure cases are handled explicitly:

| Failure | What the customer sees | What happens to the money |
|---|---|---|
| Card declined | "Your card couldn't be charged…" on the confirm step | Nothing charged. No appointment created. |
| Card fine, but GHL rejects the appointment | "Your deposit has not been kept — no appointment was created." | **Automatically refunded.** |
| Card fine, appointment created, email fails | Booking succeeds | Deposit kept, as normal. Emails are non-fatal. |
| Card fine, appointment created, **automatic refund fails** | n/a | Logged as `CRITICAL` in Vercel logs with the `pi_…` id — refund it by hand in Stripe. |

Every refund is **idempotent per payment** (Stripe idempotency key
`ora-refund-<payment intent id>`), so a customer clicking the cancel link twice
cannot be refunded twice.

---

## Turning deposits off again

Remove the secret key and redeploy — nothing else changes:

```bash
npx vercel env rm STRIPE_SECRET_KEY production
npx vercel env rm VITE_STRIPE_PUBLISHABLE_KEY production
npm run deploy
```

Booking carries on working; the deposit panel returns to preview mode.

---

*Last updated: 20 Aug 2026.*
