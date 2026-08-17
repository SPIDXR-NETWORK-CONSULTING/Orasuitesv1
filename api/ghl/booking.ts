import type { VercelRequest, VercelResponse } from "@vercel/node";
import { mirrorAppointmentSafe, TEAM_BY_USER_ID, TEAM_EMAIL_BY_USER_ID } from "../_lib/google-calendar";
import { notifyBooking } from "../_lib/booking-notify";

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

  const { name, email, phone, notes, calendarId, serviceName, startTime, endTime } = req.body;

  if (!name || !email || !phone || !calendarId || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }

  try {
    const nameParts = (name as string).trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    const contactRes = await ghlFetch("/contacts/upsert", {
      method: "POST",
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        firstName,
        lastName,
        email,
        phone,
        tags: ["website-booking"],
        customFields: notes ? [{ key: "booking_notes", field_value: notes }] : [],
      }),
    });

    const contactId = contactRes?.contact?.id || contactRes?.meta?.contactId;
    if (!contactId) {
      console.error("GHL contact creation failed:", JSON.stringify(contactRes));
      return res.status(500).json({ error: "Failed to create contact in GHL" });
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
        notes: notes || "",
      }),
    });

    const appointmentId = apptRes?.id || apptRes?.event?.id;
    if (!appointmentId) {
      console.error("GHL appointment creation failed:", JSON.stringify(apptRes));
      return res.status(500).json({ error: "Failed to create appointment", detail: apptRes });
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
      clientName: name,
      serviceName: serviceName || "Appointment",
      startTime,
      practitioner: (assignedUserId && TEAM_BY_USER_ID.get(assignedUserId)) || null,
      practitionerEmail: (assignedUserId && TEAM_EMAIL_BY_USER_ID.get(assignedUserId)) || null,
      notes: notes || null,
    }).catch(() => {});

    return res.json({ success: true, appointmentId, contactId });
  } catch (err) {
    console.error("Booking error:", err);
    return res.status(500).json({ error: "Booking failed" });
  }
}
