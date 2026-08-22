/**
 * POST /api/ghl/booking — create the appointment, then take the deposit.
 *
 * ORDER OF OPERATIONS (mirrored exactly in the Express twin, server/routes.ts):
 *   1. verify the deposit AUTHORISATION (money held, not taken)
 *   2. create the contact and the GHL appointment
 *   3. only once the appointment exists → CAPTURE (the money is taken)
 *   4. appointment failed → RELEASE the hold; the customer is never charged
 *   5. capture failed after the appointment was created → KEEP the booking,
 *      log CRITICAL, still return success. Never lose a booking over a capture.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { mirrorAppointmentSafe, TEAM_BY_USER_ID, TEAM_EMAIL_BY_USER_ID } from "../_lib/google-calendar.js";
import { notifyBooking, serviceMetaForCalendar, disclaimerForCalendar } from "../_lib/booking-notify.js";
import { resolveContact, createBookingOpportunity } from "../_lib/ghl-contacts.js";
import { verifyDeposit, notesWithPayment, releaseAfterFailedBooking, captureDeposit } from "../_lib/deposit-guard.js";
import { updatePaymentIntent } from "../_lib/stripe.js";

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
  // Closed to the public, but a preview key lets the owner test the real flow.
  const previewOk = (req.body?.preview ?? req.query?.preview) === (process.env.BOOKING_PREVIEW_KEY || "ora-preview-2026");
  if (process.env.BOOKING_ENABLED === "false" && !previewOk) {
    return res.status(503).json({ error: "Online booking is temporarily closed. Please email admin@orasuites.com." });
  }

  const { name, email, phone, notes, calendarId, serviceId, serviceName, startTime, endTime, paymentIntentId } = req.body;

  if (!name || !email || !phone || !calendarId || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }

  // ── Deposit gate ────────────────────────────────────────────────────────
  // The deposit is HELD on the card before we get here, not taken. This checks
  // the hold is real, is for this treatment and is the right amount; if it is
  // not, nothing at all is created. Free consultations and an unconfigured
  // Stripe both pass straight through.
  const deposit = await verifyDeposit({ serviceId, calendarId, serviceName, paymentIntentId });
  if (!deposit.ok) {
    return res.status(deposit.status).json({ error: deposit.error });
  }
  const paidIntentId = deposit.paymentIntentId;
  const intentStatus = deposit.intentStatus;
  /** Set the moment the appointment exists. Once it does, the hold is NEVER released. */
  let bookedAppointmentId: string | null = null;

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
      await releaseAfterFailedBooking(paidIntentId, intentStatus, "could not create the GHL contact");
      return res.status(500).json({
        error: "Failed to create contact in GHL",
        ...(paidIntentId ? { deposit: "Your card has not been charged." } : {}),
      });
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
      const released = await releaseAfterFailedBooking(paidIntentId, intentStatus, "GHL rejected the appointment");
      return res.status(500).json({
        error: "Failed to create appointment",
        detail: apptRes,
        ...(paidIntentId ? { released, deposit: "Your card has not been charged." } : {}),
      });
    }

    bookedAppointmentId = appointmentId;

    // 2b. The appointment is real → TAKE the deposit that was being held.
    //     A capture failure must never undo a booking the customer already has:
    //     it is logged as CRITICAL with the pi_… id and the booking stands.
    const depositTaken = await captureDeposit(paidIntentId, intentStatus, `appointment ${appointmentId}`);

    // 2c. Link the payment to the appointment ON THE PAYMENT ITSELF.
    //     The `[stripe:…]` marker in the notes above is written for continuity
    //     but CANNOT be trusted: GHL discards appointment notes created through
    //     the API (verified 20 Aug 2026 — they read back as null), which silently
    //     broke automatic refunds. Stripe metadata is the durable index that
    //     api/booking/cancel.ts searches.
    if (paidIntentId) {
      const linked = await updatePaymentIntent(paidIntentId, {
        metadata: { ghlAppointmentId: appointmentId, ghlContactId: contactId },
      }).catch(() => ({ ok: false, error: "metadata update threw" }));
      if (!linked.ok) {
        console.error(
          `[booking] CRITICAL: appointment ${appointmentId} could not be linked to deposit ${paidIntentId} ` +
            `(${linked.error ?? "unknown"}). A later cancellation may not find the payment — refund by hand in Stripe.`,
        );
      }
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
    //    This also emails admin@orasuites.com and saves the client's message to
    //    their contact record — see notifyBooking().
    await notifyBooking({
      contactId,
      appointmentId,
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      serviceName: serviceName || "Appointment",
      startTime,
      practitioner: (assignedUserId && TEAM_BY_USER_ID.get(assignedUserId)) || null,
      practitionerEmail: (assignedUserId && TEAM_EMAIL_BY_USER_ID.get(assignedUserId)) || null,
      notes: notes || null,
      durationMins: serviceMetaForCalendar(calendarId)?.duration ?? null,
      price: deposit.service?.price ?? serviceMetaForCalendar(calendarId)?.price ?? null,
      // Only claim a deposit was taken if it actually was.
      depositPence: depositTaken ? deposit.depositPence : null,
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
      ...(paidIntentId ? { depositPence: deposit.depositPence, depositTaken } : {}),
    });
  } catch (err) {
    console.error("Booking error:", err);

    // If the appointment already exists, the customer IS booked — the error was
    // in the follow-up work (mirror, emails, opportunity). Never release the
    // deposit in that case; report success instead.
    if (bookedAppointmentId) {
      console.error(`[booking] appointment ${bookedAppointmentId} exists — post-booking step failed, deposit left alone.`);
      return res.json({
        success: true,
        appointmentId: bookedAppointmentId,
        ...(paidIntentId ? { depositPence: deposit.depositPence } : {}),
      });
    }

    const released = await releaseAfterFailedBooking(paidIntentId, intentStatus, "unexpected error during booking");
    return res.status(500).json({
      error: "Booking failed",
      ...(paidIntentId ? { released, deposit: "Your card has not been charged." } : {}),
    });
  }
}
