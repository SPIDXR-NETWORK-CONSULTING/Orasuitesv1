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
   - **Admin email** — the same booking, in full, to admin@orasuites.com so reception can run the floor.
   - **Contact note** — anything the client typed in the notes box is written onto their GHL **contact** record. (GHL does not keep notes attached to an API-created appointment, so this is where to look for them.)
   - **Opportunity** — created in **Online Bookings → Booked** with the price, so every customer is captured for marketing. A returning customer already has an opportunity in that pipeline — GHL allows only one open per contact — so theirs is updated to the new booking and moved back to **Booked** rather than duplicated.
4. **1 hour before** — GHL emails the client a reminder.

## 2. Who is notified

| Who | What | Sent by |
|---|---|---|
| Customer | Booking confirmed email (instant) | Our code |
| Customer | 1-hour reminder email | GHL |
| Customer | Cancellation email — states whether the deposit was refunded, retained, released, or is being checked by hand | Our code |
| Practitioner | New-booking email + Google Calendar invite | Our code |
| **Practitioner** | **Cancellation email — `Cancelled — <Service>, <when>`, with the client, treatment, date & time, duration and a plain line that the slot is now free.** Added 20 Aug 2026, so nobody comes in for a client who cancelled | Our code |
| Practitioner | In-app GHL notification | GHL |
| **Admin / reception** | **Every booking → admin@orasuites.com, instantly.** Client name, email, phone, treatment, date & time, duration, practitioner, price, deposit taken (or "none"), the client's notes and the appointment id | Our code |
| **Admin / reception** | **Every cancellation → admin@orasuites.com.** Says who cancelled and whether the deposit was refunded, retained, released or NOT FOUND | Our code |
| **Admin / reception** | **`ACTION NEEDED — manual refund check`** → admin@orasuites.com, **only** when a deposit was due but no payment could be found. Carries the client's name, email and phone, the appointment id, the expected deposit, and what to do in Stripe | Our code |
| Customer | **Reschedule email — `Booking moved — <Service>, <new time>`.** New time, old time, practitioner, and a plain line that the deposit moved with the booking | Our code |
| **Practitioner** | **`Rescheduled — <Service>, <new time>`.** Says explicitly that the OLD slot is now free and the NEW one is booked. If GHL hands the booking to a colleague, the original practitioner gets `Moved out of your diary — …` instead | Our code |
| **Admin / reception** | **`Rescheduled — <Service> — <old> → <new>`** → admin@orasuites.com, with which slot freed up and which filled | Our code |
| **Admin / reception** | **`No-show — <Client> — <Service> <when>`** → admin@orasuites.com, within the hour. Client's name, email and phone, what happened to the deposit, the Stripe payment id and the appointment id | Our code |
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
| Reschedule (exceptions only) | Open appointment → edit time. **The deposit moves with it — never cancel-and-rebook.** Customers move their own bookings from the email link — see §9 |
| Mark a no-show | Open appointment → status **No-show**. That is the whole job; the rest is automatic — see §10 |
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
- **Reschedules never touch the money** — customers move their own bookings from their
  confirmation email (§9). Do NOT use the cancel link for a reschedule, or the deposit
  will be refunded and you'd have to take it again.
- **A no-show KEEPS the deposit**, automatically, within the hour of reception marking it (§10).
- **Cancelling for the clinic** (always refunds in full) — see "Cancelling as the clinic" in `STRIPE_SETUP.md`.
- **How a refund finds its payment:** each deposit carries the GHL appointment id in its Stripe
  metadata (`ghlAppointmentId`), written the moment the appointment is created. Cancelling looks
  the payment up by that. Bookings made **before 20 Aug 2026** have no such link — if one of those
  needs refunding, find it in Stripe → Payments by the customer's name or card and refund it by hand.
- **When the payment cannot be found, nobody is told they didn't pay.** The customer sees "your £X
  deposit isn't showing against this booking automatically — we'll check it by hand and refund you
  if it's due", the appointment is still cancelled, and an **ACTION NEEDED — manual refund check**
  email lands at admin@orasuites.com. Act on those the same day. The phrase *"there's no deposit on
  this booking"* is now used **only** for services that genuinely carry no deposit (complimentary
  consultations) — never because a lookup came back empty.
- Refunds appear in Stripe within seconds and on the customer's statement in 5–10 working days.
- **Check for stuck holds now and then** — Stripe → Payments → filter **Status: Uncaptured**.
  That list should be empty. A payment sitting there means the appointment was created but
  the deposit was never taken (search the Vercel logs for `CRITICAL` and that `pi_…` id).
  **Capture it by hand within 7 days** — after roughly a week Stripe releases an uncaptured
  hold by itself and the deposit is gone for good. Alternatively take it at the clinic.
- `/api/health` reports a `stripe` check. `"not connected — optional"` means deposits aren't
  switched on and booking works exactly as it did before — that is not a fault.

Setup, keys, webhook and test-mode instructions: **`STRIPE_SETUP.md`**.

## 9. Rescheduling

Customers move their own bookings. The confirmation email carries a **"Move this appointment"**
link next to the cancel link; it opens a page listing every free time for **that same treatment**
over the next 14 days, and one tap moves it.

**The rules the page enforces (customers cannot get round them):**

| Rule | Why |
|---|---|
| **Time only — never the treatment** | A different treatment is a different price and a different deposit. That is a cancel and a rebook, done by a human. |
| **New slot within 14 days** | Keeps the diary real. Further out, reception books it. |
| **Must be more than 24 hours before the current appointment** | Same cliff as the refund rule: inside a day the chair cannot be re-sold. |
| **Unlimited moves** | Someone who keeps moving a booking still intends to come. |
| **Deposit carries over — never refunded, never re-charged** | The reschedule route makes no Stripe calls at all. The money cannot move. |

**What happens on a move:** the GHL appointment time is updated → the Google calendar event moves
(the same event, so it never duplicates) → the client, the practitioner and admin@orasuites.com are
all emailed. If GHL reassigns the booking to a different practitioner because of availability at the
new time, the *original* practitioner is emailed too, so nobody comes in for a client who isn't theirs.

**If GHL refuses the move, nothing changes** — the original appointment stands and the customer is
told to reply to their email.

**What reception does — the exceptions:**

| Customer says | Do this |
|---|---|
| "It's tomorrow and I need to move it" (inside 24h) | Open the appointment in GHL → edit the time. The deposit stays put. Do **not** cancel and rebook. |
| "I want a date next month" (beyond 14 days) | Same — edit the time in GHL. |
| "I want a different treatment" | Cancel via the clinic cancel call in `STRIPE_SETUP.md` (full refund), then take a fresh booking. |
| "The link says it isn't valid" | Move it in GHL by hand. The link only breaks if `BOOKING_CANCEL_SECRET` changed. |
| "There were no times" | Nothing was free in the 14-day window for that service. Offer a time from the practitioner's diary and edit it in GHL. |

## 10. No-shows

**Reception's whole job:** GHL → Calendars → open the appointment → set status **No-show**.
Nothing else. Do not cancel it, and do not touch Stripe.

**Within the hour**, `/api/cron/check-noshows` finds it and:

1. **Keeps the deposit.** It is never refunded. If the money was somehow still only *held* rather
   than taken, it is **captured** now — an uncaptured hold expires after about seven days and the
   clinic would end up with nothing.
2. **Removes the Google calendar event**, so the day sheet stops showing someone who didn't come.
3. **Writes it onto the client's contact record** in GHL, with what happened to their deposit.
   That is where to look for a client's no-show history — Contacts → the client → Notes.
4. **Emails admin@orasuites.com**: `No-show — <Client> — <Service> <when>`, with their name, email
   and phone, the deposit outcome, the Stripe payment id and the appointment id.

The sweep looks back **7 days**, so marking a no-show late — or the job failing overnight — still
catches it. It is safe to re-run and cannot charge anyone twice.

**The client is NOT emailed.** A no-show is a conversation, not an automated message. Ring them if
you want them back; a new booking takes a new deposit.

**When the alert says ACTION NEEDED**, the deposit could not be settled automatically — either no
Stripe payment could be found for that appointment (bookings before 20 Aug 2026 have no link), or
capturing a held deposit failed. Open Stripe → Payments, search the customer by name or date, and
capture it by hand **within 7 days**. Never assume the customer paid nothing.

## 11. Reliability

- **`npm run deploy` is the only way to deploy.** It type-checks, deploys, health-checks production and **auto-rolls back** if anything is wrong.
- **`/api/health`** proves the pipeline works right now (GHL write access, calendars, slots, Google). 200 = fine, 503 = broken.
- **If the booking API ever fails**, the customer sees a one-tap "Email this booking request" button that sends their exact request to admin@orasuites.com — no booking is ever lost.
- **Nightly reconcile (03:00)** re-syncs everything to Google, catching phone/walk-in bookings.
- **Hourly no-show sweep** picks up anything reception marked as a no-show and keeps the deposit (§10).
  Both cron jobs need `CRON_SECRET` set in Vercel — without it they refuse to run rather than
  exposing an unauthenticated write path.
- **Recommended:** a free UptimeRobot monitor on `https://www.orasuites.com/api/health`, keyword `"ok":true`, 5-minute interval, alerts to your email. This is the only piece that needs an account in your name.
