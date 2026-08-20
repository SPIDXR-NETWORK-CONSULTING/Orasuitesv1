# ORÁ Suites — Booking Operations Runbook
_Last verified end-to-end on production: 20 Aug 2026._

## 1. What happens when a customer books

1. Customer picks **service → day → time → details** on orasuites.com/book.
2. Times shown are only slots where a practitioner qualified for **that exact service** is free
   (each service has its own GHL calendar; 15-min reset buffer between appointments).
3. On confirm, in order:
   - **Deposit held** — 20% of the menu price is *held* on the card (authorised, not taken) before anything is created. Free consultations skip this entirely. (See §8.)
   - **Contact** — matched by email. Existing customer → reused. New → created. *Never overwrites anyone.*
   - **Appointment** — created `confirmed`, auto-assigned round-robin to an available qualified practitioner.
   - **Deposit taken** — only now, with the appointment in place, is the held deposit actually charged. If the appointment could not be created, the hold is released instead and the customer is never charged.
   - **Client email** — subject `Booking confirmed — <Service> on <date/time>`; body has treatment, date & time, duration, practitioner name, price, deposit taken, balance due, address, a cancel link and the 24-hour refund policy.
   - **Practitioner email** — client name, treatment, time, duration, notes.
   - **Google Calendar** — event on the admin "ORÁ — All Appointments" calendar, with the practitioner invited as an attendee (so it appears on *their* Google Calendar too).
   - **Opportunity** — created in **Online Bookings → Booked** with the price, so every customer is captured for marketing.
4. **1 hour before** — GHL emails the client a reminder.

## 2. Who is notified

| Who | What | Sent by |
|---|---|---|
| Customer | Booking confirmed email (instant) | Our code |
| Customer | 1-hour reminder email | GHL |
| Customer | Cancellation email — states whether the deposit was refunded or retained | Our code |
| Practitioner | New-booking email + Google Calendar invite | Our code |
| Practitioner | In-app GHL notification | GHL |
| Admin | Every website enquiry → admin@orasuites.com | Our code |

SMS is **off** — the GHL location has no phone number. Buy an LC Phone number in GHL → Settings → Phone Numbers, then re-enable in `script/ghl-sync-notifications.py`.

## 3. Practitioner day-to-day

- **See their day:** GHL web or the **LeadConnector** mobile app → Calendars. Also in their Google Calendar via the invite.
- **Block time off:** two options —
  1. GHL → Calendars → their service calendars → Availability (recurring hours), or
  2. connect their Google Calendar in GHL (My Profile → Calendar Settings) and block time there.
  Either way blocked time removes those slots from the website.

## 4. Admin / receptionist (admin@orasuites.com)

Everything is done in GHL as an **Admin** user:

| Task | Where |
|---|---|
| See every practitioner's day | Calendars → filter by user |
| Reassign a booking | Open appointment → change assigned user |
| Reschedule | Open appointment → edit time (client is emailed). **The deposit moves with it — never cancel-and-rebook.** |
| Cancel with a full refund | Use the clinic cancel call in `STRIPE_SETUP.md` (refunds, cancels, clears the calendar and emails the client in one step) |
| Cancel without refunding | Open appointment → Cancel in GHL (no refund is issued) |
| Add a phone/walk-in booking | Calendars → + Add appointment (mirrors to Google nightly) |
| See all customers | Contacts |
| See all bookings as deals | Opportunities → Online Bookings |
| Move a booking through stages | Booked → Service Due → Completed / Cancelled |

**Give the receptionist an Admin seat:** GHL → Settings → My Staff → Add Employee → role **Admin**.

## 5. Adding a practitioner (one command)

1. GHL → Settings → My Staff → **Add Employee**. The email **must be exactly** their Google Workspace address.
2. Then:
```bash
python3 script/onboard-practitioner.py --name "Jane Doe" --email jane@orasuites.com --category nails --apply
npm run deploy
```
This adds them to every service calendar in that category (round-robin) and to `shared/catalogue.json`.
Categories: `aesthetics`, `nails`.

**Removing someone:** `python3 script/onboard-practitioner.py --remove --email jane@orasuites.com --apply` then `npm run deploy`. Past appointments are untouched.

## 6. Changing prices, durations or services

`shared/catalogue.json` is the single source of truth for the website **and** GHL.
```bash
python3 script/ghl-sync-services.py --apply     # push changes to GHL
npm run deploy                                   # push to the website
```

## 7. Opening / closing online booking

```bash
# open
sed -i '' 's/BOOKING_ENABLED = false/BOOKING_ENABLED = true/' client/src/config/booking.ts
printf 'true' | npx vercel env add BOOKING_ENABLED production --force
npm run deploy
```
Set both to `false` to close. While closed, /book shows "Booking opens soon" and the API refuses bookings.

## 8. Deposits & refunds

A **20% deposit** is taken at the moment of booking; the balance is paid at the clinic.

**Held, then taken.** When the customer confirms, the deposit is *held* on their card —
authorised, not charged. The appointment is created next, and only then is the deposit
actually taken, a second or two later. If the appointment can't be created, the hold is
**released**: the customer is never charged, so there is nothing to refund and nothing
lands on their statement. Nobody is ever charged for a booking that doesn't exist.

**Free consultations take no deposit and never ask for a card.**

The four rules, in full:

| Situation | Deposit |
|---|---|
| Customer cancels **more than 24 hours** before the appointment | **Full refund, automatic** |
| Customer cancels **within 24 hours** | **Retained** — they're told plainly before they confirm |
| **Clinic** cancels, whatever the timing | **Full refund, automatic** |
| **Reschedule** | **Kept and carried to the new time** — never refunded, never re-charged |

- Customers cancel themselves via the **"Cancel this appointment"** link in their confirmation email.
  The page tells them whether they'll be refunded *before* they confirm.
- In the rare case where a cancellation arrives before the deposit was taken, it is **released**
  rather than refunded — Stripe shows it as **Canceled**, and the customer has nothing to wait
  for because they were never charged. The rules above are unaffected.
- **Reschedule in GHL as usual** — do NOT use the cancel link for a reschedule, or the deposit
  will be refunded and you'd have to take it again.
- **Cancelling for the clinic** (always refunds in full) — see "Cancelling as the clinic" in `STRIPE_SETUP.md`.
- Refunds appear in Stripe within seconds and on the customer's statement in 5–10 working days.
- **Check for stuck holds now and then** — Stripe → Payments → filter **Status: Uncaptured**.
  That list should be empty. A payment sitting there means the appointment was created but
  the deposit was never taken (search the Vercel logs for `CRITICAL` and that `pi_…` id).
  **Capture it by hand within 7 days** — after roughly a week Stripe releases an uncaptured
  hold by itself and the deposit is gone for good. Alternatively take it at the clinic.
- `/api/health` reports a `stripe` check. `"not connected — optional"` means deposits aren't
  switched on and booking works exactly as it did before — that is not a fault.

Setup, keys, webhook and test-mode instructions: **`STRIPE_SETUP.md`**.

## 9. Reliability

- **`npm run deploy` is the only way to deploy.** It type-checks, deploys, health-checks production and **auto-rolls back** if anything is wrong.
- **`/api/health`** proves the pipeline works right now (GHL write access, calendars, slots, Google). 200 = fine, 503 = broken.
- **If the booking API ever fails**, the customer sees a one-tap "Email this booking request" button that sends their exact request to admin@orasuites.com — no booking is ever lost.
- **Nightly reconcile (03:00)** re-syncs everything to Google, catching phone/walk-in bookings.
- **Recommended:** a free UptimeRobot monitor on `https://www.orasuites.com/api/health`, keyword `"ok":true`, 5-minute interval, alerts to your email. This is the only piece that needs an account in your name.
