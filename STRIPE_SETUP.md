# ORÁ Suites — Stripe deposits: setup

Everything below is done **by you**, once. The code is already deployed-ready and
**does nothing until these variables exist** — no keys are in the repo and none
ever should be.

Until `STRIPE_SECRET_KEY` is set, the site behaves exactly as it does today:
bookings work, the deposit panel stays in "Payments launching soon" preview, and
`/api/health` reports `stripe: not connected — optional`.

> **Read this first — the deposit is HELD, then TAKEN.**
> When the customer confirms, the deposit is **authorised** on their card: the
> money is held, not taken. The appointment is created next, and only if that
> succeeds is the deposit **captured** (actually charged) — a second or two
> later. If the appointment can't be created, the hold is **released** and the
> customer is never charged at all. A release is not a refund: nothing reaches
> their statement, there is no 5–10 day wait, and it costs nothing.
> See "What happens if something goes wrong" at the bottom.

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

3. **Select events** — add these three:

   - `charge.refunded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled` — a released hold (booking failed, or an
     authorisation expired uncaptured). The customer was never charged.

   (Nothing else is needed. The booking itself does **not** depend on the
   webhook — deposits are verified synchronously when the booking is made.
   The webhook exists so refunds, released holds and declined cards are
   visible in the logs for reconciliation.)

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
   - the payment appears at <https://dashboard.stripe.com/test/payments> as
     **Succeeded**. It passes through *Uncaptured* on the way, usually too
     quickly to see. A payment still sitting on **Uncaptured** minutes later
     means the appointment was created but the capture failed — search the
     Vercel logs for `CRITICAL` and that `pi_…` id, and capture it by hand;
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
| Customer books a paid treatment | 20% of the menu price is **held** when they confirm and **taken** a second later, once the appointment exists. The balance is paid at the clinic. |
| Booking couldn't be created | The hold is **released**. The customer is never charged and there is nothing to refund. |
| Customer books a free consultation | Nothing held, nothing charged, no card asked for. |
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

A cancellation that lands before the deposit was captured — rare, because
capture runs seconds after booking — is **released** rather than refunded. It
shows in Stripe as **Canceled**, not Refunded, and there is nothing for the
customer to wait for because they were never charged. Some banks take a day or
two to drop the pending line from the customer's app; that is the bank, not us.

---

## What happens if something goes wrong

The exact order, every time:

1. **Verify** the deposit is held on the card, is for this treatment and is the
   right amount to the penny. If not, nothing is created.
2. **Create** the contact and the GHL appointment.
3. **Capture** — only now is the money actually taken.

Nothing can be charged for a booking that doesn't exist, and no booking can
exist without a verified hold behind it.

| Failure | What the customer sees | What happens to the money |
|---|---|---|
| Card declined | "We couldn't hold the deposit on your card…" on the confirm step | Nothing held, nothing charged. No appointment created. |
| Hold fine, but GHL rejects the appointment | "Your card has not been charged." | **Hold released.** Never charged — so no refund is needed. |
| Hold fine, appointment created, **capture fails** | Booking succeeds normally | Appointment **kept**. Logged as `CRITICAL` with the `pi_…` id — capture it by hand in Stripe (**within 7 days**, see below). The confirmation email omits the deposit line, so the customer is never told they paid something they didn't. |
| Everything fine, email fails | Booking succeeds | Deposit taken, as normal. Emails are non-fatal. |
| Appointment created, then a later step throws | Booking succeeds | Deposit left exactly as it is. A booking is never undone over follow-up work. |
| Hold released and the release itself fails | "Your card has not been charged." | Still never charged. The hold expires by itself in ~7 days; you can also cancel it in Stripe. |

Capture and release are **idempotent per payment** (`ora-capture-<pi id>`,
`ora-cancel-<pi id>`), as are refunds (`ora-refund-<pi id>`), so a retry or a
customer clicking cancel twice can never charge or refund twice.

### The 7-day limit on an uncaptured hold

Stripe releases an authorisation that has not been captured after about
**7 days** (the exact window depends on the card network and the card type — it
can be shorter for some cards). In this flow capture happens **within seconds**
of the appointment being created, so it only matters in one situation: a
capture that failed and was logged `CRITICAL`. If that hold is not captured
before it expires, the money is gone — the customer keeps their appointment and
the clinic never receives the deposit.

**So: act on a `CRITICAL` capture log the same week.** Find the payment in
Stripe, press **Capture**, or take the deposit at the clinic instead.

To check for stragglers: <https://dashboard.stripe.com/payments> → filter
**Status: Uncaptured**. In normal operation that list is empty.

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

*Last updated: 20 Aug 2026 — deposits are now authorised at booking and captured once the appointment exists.*
