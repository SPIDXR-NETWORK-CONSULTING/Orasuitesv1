# ORÁ Suites — Booking Operations Runbook
_Last verified end-to-end on production: 20 Aug 2026._

## 1. What happens when a customer books

1. Customer picks **service → day → time → details** on orasuites.com/book.
2. Times shown are only slots where a practitioner qualified for **that exact service** is free
   (each service has its own GHL calendar; 15-min reset buffer between appointments).
3. On confirm, in order:
   - **Contact** — matched by email. Existing customer → reused. New → created. *Never overwrites anyone.*
   - **Appointment** — created `confirmed`, auto-assigned round-robin to an available qualified practitioner.
   - **Client email** — subject `Booking confirmed — <Service> on <date/time>`; body has treatment, date & time, duration, practitioner name, price, address.
   - **Practitioner email** — client name, treatment, time, duration, notes.
   - **Google Calendar** — event on the admin "ORÁ — All Appointments" calendar, with the practitioner invited as an attendee (so it appears on *their* Google Calendar too).
   - **Opportunity** — created in **Online Bookings → Booked** with the price, so every customer is captured for marketing.
4. **1 hour before** — GHL emails the client a reminder.

## 2. Who is notified

| Who | What | Sent by |
|---|---|---|
| Customer | Booking confirmed email (instant) | Our code |
| Customer | 1-hour reminder email | GHL |
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
| Cancel / reschedule | Open appointment → Cancel or edit time (client is emailed) |
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

## 8. Reliability

- **`npm run deploy` is the only way to deploy.** It type-checks, deploys, health-checks production and **auto-rolls back** if anything is wrong.
- **`/api/health`** proves the pipeline works right now (GHL write access, calendars, slots, Google). 200 = fine, 503 = broken.
- **If the booking API ever fails**, the customer sees a one-tap "Email this booking request" button that sends their exact request to admin@orasuites.com — no booking is ever lost.
- **Nightly reconcile (03:00)** re-syncs everything to Google, catching phone/walk-in bookings.
- **Recommended:** a free UptimeRobot monitor on `https://www.orasuites.com/api/health`, keyword `"ok":true`, 5-minute interval, alerts to your email. This is the only piece that needs an account in your name.
