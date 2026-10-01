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
import { isBookableService } from "../_lib/catalogue.js";
import { bundleOfferFor, bundleSize, createBundle, bundleAction, bundleLink, countOnActiveBundle, visitNumber, type Bundle } from "../_lib/bundles.js";

const GHL_API_KEY = process.env.GHL_API_KEY!;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!;
const GHL_BASE = "https://services.leadconnectorhq.com";

/** This contact's live appointment on the same calendar at the same start, if any. Never throws. */
export async function existingBooking(contactId: string, calendarId: string, startTime: string): Promise<string | null> {
  try {
    const r = await ghlFetch(`/contacts/${encodeURIComponent(contactId)}/appointments`);
    const want = Date.parse(startTime);
    const hit = (r?.events || []).find((e: any) =>
      e?.calendarId === calendarId && Date.parse(e?.startTime) === want && !e?.deleted &&
      !["cancelled", "canceled", "noshow", "invalid"].includes(String(e?.appointmentStatus ?? e?.appoinmentStatus ?? "").toLowerCase()));
    return hit?.id ?? null;
  } catch { return null; } // a failed check must never block a real booking
}

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

  const { name, email, phone, notes, calendarId, serviceId, serviceName, startTime, endTime, paymentIntentId, bundle } = req.body;

  if (!name || !email || !phone || !calendarId || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }

  // ── Category gate ───────────────────────────────────────────────────────
  // Only categories marked live + bookable (and not hidden) in
  // shared/catalogue.json can be booked online. Checked here, not just in the UI, so a stale tab or a replayed
  // request cannot book a category the clinic has not opened. Fails CLOSED.
  if (!isBookableService(serviceId ?? calendarId ?? serviceName)) {
    return res.status(400).json({
      error: "That treatment isn't open for online booking yet — please call the clinic or send us an enquiry.",
    });
  }

  // ── Blow-dry bundle (optional) ─────────────────────────────────────────
  // The browser only says "4" or "6"; the price and which treatments qualify come
  // from shared/catalogue.json. Checked BEFORE anything is created. A bundle is paid
  // in full by card (verifyDeposit checks that payment instead of a deposit).
  const bundleOffer = bundle != null && bundle !== "" ? bundleOfferFor(calendarId) : undefined;
  const bundlePick = bundleOffer ? bundleSize(bundleOffer, bundle) : undefined;
  if (bundle != null && bundle !== "" && !bundlePick) {
    return res.status(400).json({ error: "That bundle isn't available for this treatment." });
  }

  // ── Deposit gate ────────────────────────────────────────────────────────
  // The deposit is HELD on the card before we get here, not taken. This checks
  // the hold is real, is for this treatment and is the right amount; if it is
  // not, nothing at all is created. Free consultations and an unconfigured
  // Stripe both pass straight through.
  const deposit = await verifyDeposit({ serviceId, calendarId, serviceName, paymentIntentId, bundle: bundlePick?.count });
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

    // Idempotency: an app retry after a timeout, a double tap or a double click must get
    // back the booking that already exists — never a second one. (The server can still be
    // finishing the first request when the client gives up and retries.)
    const dup = await existingBooking(contactId, calendarId, startTime);
    if (dup) {
      if (paidIntentId) await releaseAfterFailedBooking(paidIntentId, intentStatus, `duplicate of appointment ${dup}`);
      console.log(`[booking] duplicate request for contact ${contactId} → returning existing appointment ${dup}`);
      return res.json({ success: true, appointmentId: dup, contactId, duplicate: true });
    }

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
        // Never for a bundle: cancelling a visit gives the blow-dry back, not the money.
        notes: bundlePick ? notes : notesWithPayment(notes, paidIntentId),
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
      // A bundle payment is linked under a different key, so cancel / no-show code
      // (which looks up ghlAppointmentId) never refunds or re-captures it.
      const linked = await updatePaymentIntent(paidIntentId, {
        metadata: bundlePick ? { bundleFirstAppointmentId: appointmentId, ghlContactId: contactId } : { ghlAppointmentId: appointmentId, ghlContactId: contactId },
      }).catch(() => ({ ok: false, error: "metadata update threw" }));
      if (!linked.ok) {
        console.error(
          `[booking] CRITICAL: appointment ${appointmentId} could not be linked to deposit ${paidIntentId} ` +
            `(${linked.error ?? "unknown"}). A later cancellation may not find the payment — refund by hand in Stripe.`,
        );
      }
    }

    // 2d. Blow-dry bundles. A failure here must never lose the booking: admin sees it
    //     in the booking email and reception can fix it from the dashboard.
    //   · bought now → record it (paid if the card payment was taken) and count this
    //     visit as blow-dry 1
    //   · not buying, but they hold a paid bundle with blow-dries left → this visit
    //     goes on it, nothing to pay
    let bundleNote = "";
    let bundleHtml: string | null = null;
    let onBundle: Bundle | null = null;
    const visit = { appointment_id: appointmentId, visit_at: startTime, service: serviceName || null };
    if (bundleOffer && bundlePick) {
      const paid = Boolean(paidIntentId && depositTaken);
      const made = await createBundle({
        client_name: name, email, phone, contact_id: contactId, size: bundlePick.count, price: bundlePick.price,
        source: "online", paid, first_appointment_id: appointmentId, expiry_months: bundleOffer.expiryMonths,
        notes: paidIntentId ? `Paid online by card (Stripe ${paidIntentId})${paid ? "" : " — NOT captured yet: capture it in Stripe, then tap Paid"}` : null,
      });
      if (made.ok && paid) {
        const used = await bundleAction(made.data.id, "use", visit);
        onBundle = used.ok ? used.data : made.data;
        if (!used.ok) console.error(`[booking] bundle ${made.data.id}: first visit not counted:`, used.error);
      } else if (made.ok) onBundle = made.data;
      if (!made.ok) console.error(`[booking] CRITICAL: bundle not recorded for appointment ${appointmentId}:`, made.error);
      const how = paid ? `£${bundlePick.price} PAID ONLINE by card` : paidIntentId ? `£${bundlePick.price} card payment NOT taken (Stripe ${paidIntentId}) — capture it in Stripe` : `£${bundlePick.price} to pay at the clinic on this visit`;
      bundleNote = made.ok
        ? `BLOW-DRY BUNDLE OF ${bundlePick.count}: ${how}. This visit is 1 of ${bundlePick.count}.`
        : `BLOW-DRY BUNDLE OF ${bundlePick.count} bought (${how}) but it could NOT be recorded (${made.error}). Add it from the dashboard.`;
      bundleHtml = `<b>Blow-Dry Bundle of ${bundlePick.count}:</b> £${bundlePick.price}, ${paid ? "paid" : "paid at the clinic on this visit"}. This is blow-dry 1 of ${bundlePick.count}.` +
        (made.ok ? ` <a href="${bundleLink(made.data.token)}">See your bundle</a>` : "");
    } else if (bundleOfferFor(calendarId)) {
      onBundle = await countOnActiveBundle(email, appointmentId, startTime, serviceName || null);
      if (onBundle) {
        const n = visitNumber(onBundle, appointmentId);
        bundleNote = `ON BLOW-DRY BUNDLE: blow-dry ${n} of ${onBundle.size} — nothing to pay.`;
        bundleHtml = `<b>Covered by your Blow-Dry Bundle:</b> blow-dry ${n} of ${onBundle.size}, so there's nothing to pay. ${onBundle.size - onBundle.used} left after this. <a href="${bundleLink(onBundle.token)}">See your bundle</a>`;
      }
    }
    const staffNotes = [bundleNote, notes].filter(Boolean).join("\n") || null;

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
      notes: staffNotes,
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
      serviceName: `${serviceName || "Appointment"}${bundlePick ? ` · Blow-Dry Bundle of ${bundlePick.count}` : onBundle ? " · on their bundle" : ""}`,
      startTime,
      practitioner: (assignedUserId && TEAM_BY_USER_ID.get(assignedUserId)) || null,
      practitionerEmail: (assignedUserId && TEAM_EMAIL_BY_USER_ID.get(assignedUserId)) || null,
      notes: staffNotes,
      extraHtml: bundleHtml,
      durationMins: serviceMetaForCalendar(calendarId)?.duration ?? null,
      price: bundlePick?.price ?? (onBundle ? 0 : null) ?? deposit.service?.price ?? serviceMetaForCalendar(calendarId)?.price ?? null,
      // Only claim a deposit was taken if it actually was (a bundle payment isn't a deposit).
      depositPence: depositTaken && !bundlePick ? deposit.depositPence : null,
    }).catch(() => {});

    // 4. Every booking becomes an opportunity so the clinic can market to its
    //    customers (Online Bookings → Booked). monetaryValue stays the FULL
    //    treatment price — the deposit is a part-payment, not the deal value.
    await createBookingOpportunity({
      contactId,
      clientName: name,
      serviceName: `${serviceName || "Appointment"}${bundlePick ? ` · Blow-Dry Bundle of ${bundlePick.count}` : ""}`,
      price: bundlePick?.price ?? deposit.service?.price ?? serviceMetaForCalendar(calendarId)?.price ?? null,
      startTime,
    }).catch(() => null);

    return res.json({
      success: true,
      appointmentId,
      contactId,
      ...(paidIntentId ? { depositPence: deposit.depositPence, depositTaken } : {}),
      ...(onBundle ? { bundle: { size: onBundle.size, used: onBundle.used, left: Math.max(0, onBundle.size - onBundle.used), paid: Boolean(onBundle.paid_at), bought: Boolean(bundlePick) } } : {}),
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
