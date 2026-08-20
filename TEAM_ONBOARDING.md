# ORÁ Suites — Team Onboarding
_What each person downloads, where they go, what they do. Verified 20 Aug 2026._

---

## Do practitioners need the LeadConnector app?

**No — not for the calendar.** Their bookings land in their **Google Calendar** automatically, because every booking sends them a real Google Calendar invite. They can live entirely in Google Calendar.

**The app is optional and useful for two things only:**
- Messaging a client back (the client's replies land in GHL, not their inbox).
- Marking a client as arrived / no-show on the day.

**Recommendation:** Meg and the reception team install it. Nail and treatment staff don't have to — Google Calendar is enough. Nobody is blocked without it.

---

## How a practitioner blocks time off

This is the part worth getting right, because it decides whether **you** have to manage everyone's diary manually.

**Verified fact:** availability lives on the **calendar**, not the person. Clinic hours (Mon–Sat 9:00–7:00, Sundays closed, 15-min gap between appointments) are already set on all 56 service calendars centrally — you do **not** set hours per person in My Staff.

For personal time off there are two routes:

| Route | What they do | Who sets it up |
|---|---|---|
| **A — Google Calendar (recommended)** | They block time in their own Google Calendar like normal. Those hours stop being bookable on the website. | One-time: they connect Google to GHL (2 minutes, below) |
| **B — GHL** | They open GHL/LeadConnector and add a "blocked slot". | Nothing to set up |

Route A is what you want: after a single 2-minute setup they never open GHL again — they just use Google Calendar.

---

## Practitioner setup — 3 steps, once (~5 minutes)

1. **Accept the GHL invite** in their ORÁ email, set a password.
2. **Connect Google Calendar:** app.gohighlevel.com → click their avatar (bottom-left) → **My Profile** → **Calendar Settings** → **Connect Google** → sign in with their **@orasuites.com** account.
   - Under **"Check for conflicts" / linked calendars**, tick their main calendar. *This is the setting that makes their personal blocked time stop website bookings.*
   - (The "add appointments to" setting is optional — they already get an invite for every booking.)
3. **Optional:** install **LeadConnector** (App Store / Google Play), sign in with the same details.

**Their day-to-day after that:** look at Google Calendar. Block personal time in Google Calendar. That's it.

---

## Reception / admin setup (Bri, and anyone covering the desk)

Bri Cauli — `bricauli@orasuites.com` — is set up as **reception**: she can see and manage **everyone's** bookings, contacts and pipelines, but has no bookings assigned to her.

1. Accept the GHL invite, set a password.
2. Install **LeadConnector** on her phone *(recommended for reception — client messages and same-day changes)*.
3. Day-to-day in GHL:

| Task | Where |
|---|---|
| See the whole clinic's day | Calendars → filter by practitioner |
| Add a phone / walk-in booking | Calendars → + Add appointment |
| Reschedule | Open the appointment → change the time (deposit is kept) |
| Cancel | Open the appointment → Cancel (see refund rules) |
| Reassign to another practitioner | Open the appointment → change assigned user |
| Look a client up | Contacts |
| See all bookings as deals | Opportunities → Online Bookings |

---

## Adding a practitioner later

1. GHL → Settings → My Staff → **Add Employee**. The email **must exactly match** their Google Workspace mailbox.
2. Then run:
```bash
python3 script/onboard-practitioner.py --name "Jane Doe" --email jane@orasuites.com --category nails --apply
npm run deploy
```
3. Send them the 3 practitioner steps above.

Categories: `nails`, `aesthetics`. To remove someone: same command with `--remove`.

---

## Email addresses — the golden rule

The address in **GHL must be identical** to their **Google Workspace** mailbox. On 20 Aug two were wrong (`meg@` and `daniela@` instead of `megcauli@` and `danieladaniela@`), which meant their booking alerts and calendar invites went nowhere. Both are now corrected.

**Current, verified:**
- admin@orasuites.com — clinic inbox
- megcauli@orasuites.com — Meg Cauli (aesthetics)
- danieladaniela@orasuites.com — Daniela Mehmeti (aesthetics)
- soheila@orasuites.com — Soheila Sadhagat (nails)
- ruslana@orasuites.com — Ruslana Stupina (nails)
- diana@orasuites.com — Diana Ann (nails)
- bricauli@orasuites.com — Bri Cauli (reception)
