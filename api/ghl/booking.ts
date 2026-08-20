import type { VercelRequest, VercelResponse } from "@vercel/node";
import { mirrorAppointmentSafe, TEAM_BY_USER_ID, TEAM_EMAIL_BY_USER_ID } from "../_lib/google-calendar.js";
import { notifyBooking, serviceMetaForCalendar } from "../_lib/booking-notify.js";
import { resolveContact, createBookingOpportunity } from "../_lib/ghl-contacts.js";
import { verifyDeposit, notesWithPayment, refundAfterFailedBooking } from "../_lib/deposit-guard.js";

const GHL_API_KEY = process.env.GHL_API_KEY!;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!;
const GHL_BASE = "https://services.leadconnectorhq.com";

async function ghlFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Master switch — booking can be turned off without a code change (env BOOKING_ENABLED=false).
  if (process.env.BOOKING_ENABLED === "false") {
    return res.status(503).json({ error: "Online booking is temporarily closed. Please email admin@orasuites.com." });
  }

  const { name, email, phone, notes, calendarId, serviceId, serviceName, startTime, endTime, paymentIntentId } = req.body;

  if (!name || !email || !phone || !calendarId || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }

  // ── Deposit gate ────────────────────────────────────────────────────────
  // The card is charged BEFORE the appointment exists, so this runs first: if
  // the deposit isn't good, nothing at all is created. Free consultations and
  // an unconfigured Stripe both pass straight through.
  const deposit = await verifyDeposit({ serviceId, calendarId, serviceName, paymentIntentId });
  if (!deposit.ok) {
    return res.status(deposit.status).json({ error: deposit.error });
  }
  const paidIntentId = deposit.paymentIntentId;

  try {
    const nameParts = (name as string).trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    const resolved = await resolveContact({
      email,
      firstName,
      lastName,
      phone,
      tags: ["website-booking"],
    });
    if (!resolved) {
      await refundAfterFailedBooking(paidIntentId, "could not create the GHL contact");
      return res.status(500).json({ error: "Failed to create contact in GHL" });
    }
    const contactId = resolved.id;

    const apptRes = await ghlFetch("/calendars/events/appointments", {
      method: "POST",
      body: JSON.stringify({
        calendarId,
        locationId: GHL_LOCATION_ID,
        contactId,
        startTime,
        endTime,
        title: `${serviceName || "Booking"} — ${name}`,
        appointmentStatus: "confirmed",
        toNotify: true,
        timezone: "Europe/London",
        // The payment marker rides along in the notes so a later cancellation
        // can find the deposit and refund it. See api/booking/cancel.ts.
        notes: notesWithPayment(notes, paidIntentId),
      }),
    });

    const appointmentId = apptRes?.id || apptRes?.event?.id;
    if (!appointmentId) {
      console.error("GHL appointment creation failed:", JSON.stringify(apptRes));
      const refunded = await refundAfterFailedBooking(paidIntentId, "GHL rejected the appointment");
      return res.status(500).json({
        error: "Failed to create appointment",
        detail: apptRes,
        ...(paidIntentId ? { refunded, deposit: "Your deposit has not been kept — no appointment was created." } : {}),
      });
    }

    // 3. Mirror into the clinic-wide "ORÁ — All Appointments" Google calendar.
    //    Awaited (fire-and-forget work is killed once a serverless response is
    //    sent) but it can never throw or fail the booking — and the nightly
    //    reconciler at /api/cron/sync-calendar catches anything missed here.
    const assignedUserId = apptRes?.assignedUserId || apptRes?.event?.assignedUserId;
    await mirrorAppointmentSafe({
      ghlId: appointmentId,
      ghlCalendarId: calendarId,
      assignedUserId: assignedUserId ?? null,
      serviceName: serviceName || null,
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      practitioner: (assignedUserId && TEAM_BY_USER_ID.get(assignedUserId)) || null,
      notes: notes || null,
      startTime,
      endTime,
      status: "confirmed",
    });

    // 3. Notifications we own (GHL's native confirmation is unreliable for
    //    API-created appointments and its SMS channel is unprovisioned).
    await notifyBooking({
      contactId,
      appointmentId,
      clientName: name,
      serviceName: serviceName || "Appointment",
      startTime,
      practitioner: (assignedUserId && TEAM_BY_USER_ID.get(assignedUserId)) || null,
      practitionerEmail: (assignedUserId && TEAM_EMAIL_BY_USER_ID.get(assignedUserId)) || null,
      notes: notes || null,
      durationMins: serviceMetaForCalendar(calendarId)?.duration ?? null,
      price: deposit.service?.price ?? serviceMetaForCalendar(calendarId)?.price ?? null,
      depositPence: paidIntentId ? deposit.depositPence : null,
    }).catch(() => {});

    // 4. Every booking becomes an opportunity so the clinic can market to its
    //    customers (Online Bookings → Booked). monetaryValue stays the FULL
    //    treatment price — the deposit is a part-payment, not the deal value.
    await createBookingOpportunity({
      contactId,
      clientName: name,
      serviceName: serviceName || "Appointment",
      price: deposit.service?.price ?? serviceMetaForCalendar(calendarId)?.price ?? null,
      startTime,
    }).catch(() => null);

    return res.json({
      success: true,
      appointmentId,
      contactId,
      ...(paidIntentId ? { depositPence: deposit.depositPence } : {}),
    });
  } catch (err) {
    console.error("Booking error:", err);
    const refunded = await refundAfterFailedBooking(paidIntentId, "unexpected error during booking");
    return res.status(500).json({
      error: "Booking failed",
      ...(paidIntentId ? { refunded, deposit: "Your deposit has not been kept — no appointment was created." } : {}),
    });
  }
}
