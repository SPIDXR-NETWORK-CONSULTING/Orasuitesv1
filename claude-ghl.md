# GHL Setup Instructions — ORÁ Suites
**For Claude Cowork | GHL Dashboard: app.gohighlevel.com**
**Location: ORÁ Suites (nFzNDCibe0pfcMIhnkgT)**

---

## Context

The ORÁ Suites website is live at www.orasuites.com. The booking system uses GHL calendars. A full API audit was done and revealed the following problems that can only be fixed manually in the GHL dashboard. Complete every task below in order.

---

## Team Members (for reference throughout)

| Name | Email | Role |
|---|---|---|
| Meg Cauli | meg@orasuites.com | Aesthetics |
| Daniela Mehmeti | daniela@orasuites.com | Aesthetics |
| Soheila Nails | soheila@orasuites.com | Nails |
| Ruslana Stupina | ruslana@orasuites.com | Nails |
| Diana Ann | diana@orasuites.com | Nails |
| asma AK | spidxr253@gmail.com | Admin |

---

## TASK 1 — Fix the Calendars

Go to **Settings → Calendars**.

You will see 10 calendars. Here is what each one is and what to do:

| Calendar Name | Calendar ID | Action |
|---|---|---|
| ORÁ Suites — Book a Treatment | k9RONq5BHZakjhuytyNn | **KEEP — this is the Aesthetics booking calendar** |
| Nails & Nail Art | tBhcLZKehdPCusO9gAM2 | **KEEP — this is the Nails booking calendar** |
| ORA suites - Treatments | J95LT7cIJEbpDRncaDeL | Deactivate or delete — duplicate, only has Meg |
| Aesthetics & Medical | YAMvJXoKHTcZdpGvBYdw | Deactivate or delete — wrong type (set to Personal, not Service Booking) |
| Meg Cauli's Personal Calendar | PKQUQyM9Hp85HwwEJ8B5 | Leave as-is — personal only |
| Daniela Mehmeti's Personal Calendar | ic8C2HyZQVDkzCR8A3zQ | Leave as-is — personal only |
| Soheila Nails's Personal Calendar | MpXCOzSRshXSPJoh0WIH | Leave as-is — personal only |
| Ruslana Stupina's Personal Calendar | g85FsKE5Lc3vVnPMHBkP | Leave as-is — personal only |
| Diana Ann's Personal Calendar | VN4D6bYabiULXzDPBRZU | Leave as-is — personal only |
| asma AK's Personal Calendar | nVz11aNyOCuFTomEehHN | Leave as-is — personal only |

### 1a — Fix "ORÁ Suites — Book a Treatment" team members

Click on **ORÁ Suites — Book a Treatment** → Edit.

Current members: Meg, Ruslana, Diana
**Add: Daniela Mehmeti**
Remove: Ruslana and Diana (they do nails, not aesthetics — they were added to the wrong calendar)

Final members should be: **Meg + Daniela only**

Set event type to: **Round Robin (Equal Distribution)**

### 1b — Verify "Nails & Nail Art" team members

Click on **Nails & Nail Art** → Edit.

Current members: Ruslana, Diana, Soheila — this is correct, leave as-is.
Set event type to: **Round Robin (Equal Distribution)**

### 1c — Set opening hours on both calendars

For both **ORÁ Suites — Book a Treatment** and **Nails & Nail Art**:
- Go to Availability tab inside the calendar settings
- Set hours: Monday–Saturday, 9:00 AM – 7:00 PM
- Sunday: Closed
- Slot duration: 60 mins (aesthetics), 30 mins (nails)
- Buffer between appointments: 15 mins

---

## TASK 2 — Set Up the Service Menu

Go to **Settings → Calendars → Service menu tab**.

You will see "Add new service". The services were created via API but are not visible in the UI. You need to create them fresh here.

First, create two **Categories**:
1. **Aesthetics**
2. **Nails & Nail Art**

### Aesthetics Services (assign Meg + Daniela to each)

Create each of the following under the **Aesthetics** category:

| Service Name | Duration |
|---|---|
| Anti-Wrinkle Injections (Botox) | 45 mins |
| Facial Fillers | 60 mins |
| Polynucleotide Therapy | 45 mins |
| Skin Booster | 45 mins |
| Skin Pen Microneedling | 60 mins |
| Hydrofacial | 60 mins |
| Relaxing Facial | 60 mins |
| Endopulse Laser Lifting | 60 mins |
| PRP Treatment | 60 mins |
| IV Drip Therapy | 60 mins |
| Anti-Cellulite Treatment | 60 mins |
| Sclerotherapy (Spider Veins) | 45 mins |
| B12 Vitamin Injection | 15 mins |

For each service: toggle **Active/Available = ON** and assign **Meg + Daniela**.

### Nails Services (assign Soheila + Ruslana + Diana to each)

Create each of the following under the **Nails & Nail Art** category:

| Service Name | Duration |
|---|---|
| Manicure | 45 mins |
| Pedicure | 60 mins |
| Full Pedicure (incl. Heel Care & Callus Removal) | 75 mins |
| Nail Extensions (Sculpted Lower Forms) | 90 mins |
| Simple Nail Art | 60 mins |
| 3D Flower Nail Art | 90 mins |

For each service: toggle **Active/Available = ON** and assign **Soheila + Ruslana + Diana**.

### Link services to the correct calendars

After creating services, inside each calendar's settings there should be a **Services** or **Service Menu** section. Link:
- All Aesthetics services → **ORÁ Suites — Book a Treatment**
- All Nails services → **Nails & Nail Art**

---

## TASK 3 — Create Pipelines

Go to **Opportunities → Pipelines → + New Pipeline**.

Create the following two pipelines exactly:

**Pipeline 1: Online Bookings**
Stages in order:
1. Booked
2. Service Due
3. Completed
4. Cancelled

**Pipeline 2: Room Rentals**
Stages in order:
1. Enquiry
2. Confirmed
3. Cancelled

After creating them, **copy the Pipeline IDs** for both — you'll need to paste them into this file so the developer can update the website contact form integration.

> Paste Pipeline IDs here:
> - Online Bookings Pipeline ID: _______________
> - Room Rentals Pipeline ID: _______________

---

## TASK 4 — Fix Soheila's Last Name

Go to **Settings → Team → find Soheila**.
Her display name shows incorrectly. Change it to: **Soheila [confirm correct surname with Abdul]**

---

## TASK 5 — Get the Booking Widget Embed Codes

After Tasks 1–2 are complete, get the embed snippet for both booking calendars.

For each calendar:
1. Go to Settings → Calendars
2. Click the calendar
3. Look for "Booking Widget" or "Share" or "Embed"
4. Copy the full embed code or iframe URL

> Paste here:
> - Aesthetics calendar embed URL: https://api.leadconnectorhq.com/widget/booking/k9RONq5BHZakjhuytyNn
> - Nails calendar embed URL: https://api.leadconnectorhq.com/widget/booking/tBhcLZKehdPCusO9gAM2

The format will likely be:
`https://api.leadconnectorhq.com/widget/booking/k9RONq5BHZakjhuytyNn`
`https://api.leadconnectorhq.com/widget/booking/tBhcLZKehdPCusO9gAM2`

Confirm these URLs load the correct booking widget in the browser.

> ✅ VERIFIED 2026-07-14 (Claude): Both widget URLs load correctly in-browser.
> - Aesthetics ("ORÁ Suites — Book a Treatment"): loads, 1 hr slots, Mon–Sat availability, Sundays closed, GMT+1 Europe/London.
> - Nails ("Nails & Nail Art"): loads, 30-min slots (09:00, 09:30, 10:00…), Mon–Sat availability, Sundays closed, GMT+1 Europe/London.
> These two are ready to embed on the website booking page as-is.

---

## TASK 6 — Set Up Automation Workflows (3 required)

Go to **Automation → Workflows → + New Workflow**.

**Workflow 1: New Booking Confirmation**
- Trigger: Appointment Created
- Action 1: Send Email to contact (template: booking confirmation with date/time/service)
- Action 2: Send internal SMS/email to the assigned practitioner

**Workflow 2: Booking Reminder**
- Trigger: Appointment Reminder (24 hours before)
- Action: Send SMS to contact with appointment details and address (45 Deansgate, Manchester, M3 2AY)

**Workflow 3: Contact Form Enquiry**
- Trigger: Contact Created with tag = "website-enquiry"
- Action: Add to Online Bookings pipeline → stage "Booked"
- Action 2: Notify Asma by email

---

## What to Send Back to Claude Code

Once all tasks above are complete, reply with:

1. Both pipeline IDs (Online Bookings + Room Rentals)
2. Both calendar embed URLs (Aesthetics + Nails)
3. Confirmation that services are visible and active in the service menu
4. Confirmation that Daniela is now on the Aesthetics calendar only

Claude Code will then:
- Update the website booking page to embed the GHL calendar widgets
- Wire the pipeline IDs into the contact form so enquiries land in the right pipeline
- Deploy the final version of the site
