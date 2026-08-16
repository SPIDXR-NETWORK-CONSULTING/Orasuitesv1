# ORÁ Suites — GHL Manual Setup Checklist

**Do these in the GHL dashboard: app.gohighlevel.com → make sure you're in the "ora suites" sub-account (Manchester, England).**
Task 5 (booking widget URLs) is already done and verified — see bottom.

Team members (for reference):
- Meg Cauli — meg@orasuites.com — Aesthetics
- Daniela Mehmeti — daniela@orasuites.com — Aesthetics
- Soheila Sadhagat — soheila@orasuites.com — Nails
- Ruslana Stupina — ruslana@orasuites.com — Nails
- Diana Ann — diana@orasuites.com — Nails
- Asma AK — spidxr253@gmail.com — Admin

---

## TASK 1 — Fix the calendars

Go to **Settings (bottom-left gear) → Calendars → Calendars tab**.

### 1a. Turn off the two junk calendars
1. [ ] Find **"ORA suites - Treatments"** (Id starts J95LT7…). Click the **⋯** (three dots) on its row → **Deactivate** (or Delete if you prefer). This one is a duplicate.
2. [ ] Find **"Aesthetics & Medical"** (Id starts YAMvJXo…). Click **⋯ → Deactivate** (or Delete). It's the wrong type.
   - Leave all 6 "…Personal Calendar" ones exactly as they are.

### 1b. Fix the Aesthetics booking calendar
3. [ ] Click **"ORÁ Suites — Book a Treatment"** (Id starts k9RONq5…) → **Edit**.
4. [ ] Under **Team members**: **remove Ruslana** and **remove Diana** (they do nails). **Add Daniela Mehmeti.**
   - Final team should be **Meg + Daniela only**.
5. [ ] Set **Meeting/Event type = Round Robin (Equal Distribution)**.
6. [ ] Open the **Availability** tab inside this calendar:
   - Monday–Saturday: **9:00 AM – 7:00 PM**
   - Sunday: **Closed / unchecked**
   - **Slot duration: 60 mins**
   - **Buffer between appointments: 15 mins**
7. [ ] **Save.**

### 1c. Check the Nails booking calendar
8. [ ] Click **"Nails & Nail Art"** (Id starts tBhcLZK…) → **Edit**.
9. [ ] Confirm **Team members = Ruslana + Diana + Soheila** (leave as-is if correct).
10. [ ] Set **Event type = Round Robin (Equal Distribution)**.
11. [ ] **Availability** tab:
    - Monday–Saturday: **9:00 AM – 7:00 PM**
    - Sunday: **Closed**
    - **Slot duration: 30 mins**
    - **Buffer between appointments: 15 mins**
12. [ ] **Save.**

---

## TASK 2 — Set up the service menu

Go to **Settings → Calendars → Service menu tab**.

### 2a. Create two categories
1. [ ] Create category **Aesthetics**
2. [ ] Create category **Nails & Nail Art**

### 2b. Add Aesthetics services (each: Active = ON, assign **Meg + Daniela**)
Create under the **Aesthetics** category:

- [ ] Anti-Wrinkle Injections (Botox) — 45 mins
- [ ] Facial Fillers — 60 mins
- [ ] Polynucleotide Therapy — 45 mins
- [ ] Skin Booster — 45 mins
- [ ] Skin Pen Microneedling — 60 mins
- [ ] Hydrofacial — 60 mins
- [ ] Relaxing Facial — 60 mins
- [ ] Endopulse Laser Lifting — 60 mins
- [ ] PRP Treatment — 60 mins
- [ ] IV Drip Therapy — 60 mins
- [ ] Anti-Cellulite Treatment — 60 mins
- [ ] Sclerotherapy (Spider Veins) — 45 mins
- [ ] B12 Vitamin Injection — 15 mins

### 2c. Add Nails services (each: Active = ON, assign **Soheila + Ruslana + Diana**)
Create under the **Nails & Nail Art** category:

- [ ] Manicure — 45 mins
- [ ] Pedicure — 60 mins
- [ ] Full Pedicure (incl. Heel Care & Callus Removal) — 75 mins
- [ ] Nail Extensions (Sculpted Lower Forms) — 90 mins
- [ ] Simple Nail Art — 60 mins
- [ ] 3D Flower Nail Art — 90 mins

### 2d. Link services to the right calendars
- [ ] Link all **Aesthetics** services → **ORÁ Suites — Book a Treatment**
- [ ] Link all **Nails** services → **Nails & Nail Art**

---

## TASK 3 — Create two pipelines

Go to **Opportunities → Pipelines → + New Pipeline** (or Settings → Opportunities & Pipelines).

1. [ ] **Pipeline: Online Bookings** — stages in this order:
   1. Booked
   2. Service Due
   3. Completed
   4. Cancelled
2. [ ] **Pipeline: Room Rentals** — stages in this order:
   1. Enquiry
   2. Confirmed
   3. Cancelled
3. [ ] Copy both **Pipeline IDs** and send them back to me:
   - Online Bookings Pipeline ID: ________________
   - Room Rentals Pipeline ID: ________________
   - (The ID is in the browser URL when you open a pipeline, or in the pipeline settings.)

---

## TASK 4 — Fix Soheila's name

Go to **Settings → My Staff (Team)**.

1. [ ] Find **Soheila** → Edit.
2. [ ] Set her last name / display name to **Soheila Sadhagat**.
3. [ ] **Save.**

---

## TASK 6 — Create three automation workflows

Go to **Automation → Workflows → + Create Workflow → Start from scratch**.

### Workflow 1 — New Booking Confirmation
- [ ] Trigger: **Appointment Created** (Customer Booked Appointment)
- [ ] Action 1: **Send Email** to the contact — booking confirmation with date / time / service
- [ ] Action 2: **Send internal notification** (email or SMS) to the assigned practitioner
- [ ] Publish (toggle from Draft to Publish)

### Workflow 2 — Booking Reminder
- [ ] Trigger: **Appointment** → reminder **24 hours before** the appointment
- [ ] Action: **Send SMS** to the contact with appointment details + address: **45 Deansgate, Manchester, M3 2AY**
- [ ] Publish

### Workflow 3 — Contact Form Enquiry
- [ ] Trigger: **Contact Created** with tag = **website-enquiry**
- [ ] Action 1: **Add to pipeline** → Online Bookings → stage **Booked**
- [ ] Action 2: **Notify Asma** by email (spidxr253@gmail.com)
- [ ] Publish

---

## TASK 5 — Booking widget URLs ✅ DONE (verified 2026-07-14)

Both load and work correctly:
- Aesthetics: `https://api.leadconnectorhq.com/widget/booking/k9RONq5BHZakjhuytyNn` (1 hr slots, Mon–Sat, Sun closed)
- Nails: `https://api.leadconnectorhq.com/widget/booking/tBhcLZKehdPCusO9gAM2` (30-min slots, Mon–Sat, Sun closed)

---

## When you're done, send me:
1. Online Bookings Pipeline ID + Room Rentals Pipeline ID
2. A quick "services are live" confirmation
3. Confirmation Daniela is now on the Aesthetics calendar only

Then I'll embed the two widgets on the site, wire the pipeline IDs into the contact form, and deploy.
