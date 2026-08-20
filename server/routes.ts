import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { z } from "zod";
import { processEnquiry } from "./ghl-notify";
import { mirrorAppointmentSafe, TEAM_BY_USER_ID, TEAM_EMAIL_BY_USER_ID } from "./google-calendar";
import { notifyBooking, serviceMetaForCalendar } from "../api/_lib/booking-notify.js";
import { resolveContact, createBookingOpportunity } from "../api/_lib/ghl-contacts.js";
import { verifyDeposit, notesWithPayment, refundAfterFailedBooking } from "../api/_lib/deposit-guard.js";

const GHL_API_KEY = process.env.GHL_API_KEY!;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!;
const GHL_BASE = "https://services.leadconnectorhq.com";

async function ghlFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${GHL_API_KEY}`,
      "Version": "2021-04-15",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 ora-suites/1.0",
      ...(options.headers || {}),
    },
  });
  return res.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Contact form — saves locally AND creates GHL contact + opportunity ──
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContactSubmission(validatedData);

      // Respond first, then sync to GHL (contact → opportunity → admin email) without blocking.
      res.status(201).json({ success: true, id: contact.id });
      void processEnquiry(
        {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone ?? null,
          service: validatedData.service ?? null,
          message: validatedData.message,
        },
        "express",
      );
      return;
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid form data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to submit form" });
      }
    }
  });

  // ── Email list signup ───────────────────────────────────────────────────
  app.post("/api/email-list", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }
    try {
      await ghlFetch("/contacts/upsert", {
        method: "POST",
        headers: { "Version": "2021-07-28" },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          email,
          tags: ["email-list", "website-signup"],
          source: "website-email-list",
        }),
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Email list GHL error:", err);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.get("/api/contact", async (req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // ── GHL: Available slots ────────────────────────────────────────────────
  app.get("/api/ghl/slots", async (req, res) => {
    const { calendarId, startDate, endDate } = req.query;
    if (!calendarId || !startDate || !endDate) {
      return res.status(400).json({ error: "calendarId, startDate, endDate required" });
    }
    try {
      const data = await ghlFetch(
        `/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}&timezone=Europe%2FLondon`
      );
      res.json(data);
    } catch {
      res.status(500).json({ error: "Failed to fetch slots" });
    }
  });

  // ── GHL: Create booking (contact + appointment) ─────────────────────────
  app.post("/api/ghl/booking", async (req, res) => {
    if (process.env.BOOKING_ENABLED === "false") {
      return res.status(503).json({ error: "Online booking is temporarily closed. Please email admin@orasuites.com." });
    }
    const { name, email, phone, notes, calendarId, serviceId, serviceName, startTime, endTime, paymentIntentId } = req.body;

    if (!name || !email || !phone || !calendarId || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required booking fields" });
    }

    // ── Deposit gate ──────────────────────────────────────────────────────
    // Identical rule to api/ghl/booking.ts (both call the same guard). The card
    // is charged before the appointment exists, so an unverified deposit means
    // nothing is created at all.
    const deposit = await verifyDeposit({ serviceId, calendarId, serviceName, paymentIntentId });
    if (!deposit.ok) {
      return res.status(deposit.status).json({ error: deposit.error });
    }
    const paidIntentId = deposit.paymentIntentId;

    try {
      // 1. Create or update contact in GHL
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "";

      const contactPayload = {
        locationId: GHL_LOCATION_ID,
        firstName,
        lastName,
        email,
        phone,
        tags: ["website-booking"],
        customFields: notes ? [{ key: "booking_notes", field_value: notes }] : [],
      };

      const resolved = await resolveContact({ email, firstName, lastName, phone, tags: ["website-booking"] });
      if (!resolved) {
        await refundAfterFailedBooking(paidIntentId, "could not create the GHL contact");
        return res.status(500).json({ error: "Failed to create contact in GHL" });
      }
      const contactId = resolved.id;

      // 2. Create appointment
      const appointmentPayload = {
        calendarId,
        locationId: GHL_LOCATION_ID,
        contactId,
        startTime,
        endTime,
        title: `${serviceName} — ${name}`,
        appointmentStatus: "confirmed",
        toNotify: true,
        timezone: "Europe/London",
        // Payment marker rides along so a later cancellation can find and
        // refund the deposit. See api/booking/cancel.ts.
        notes: notesWithPayment(notes, paidIntentId),
      };

      const apptRes = await ghlFetch("/calendars/events/appointments", {
        method: "POST",
        body: JSON.stringify(appointmentPayload),
      });

      const appointmentId = apptRes?.id || apptRes?.event?.id;
      if (appointmentId) {
        res.json({
          success: true,
          appointmentId,
          contactId,
          ...(paidIntentId ? { depositPence: deposit.depositPence } : {}),
        });

        // Mirror into the clinic-wide "ORÁ — All Appointments" Google calendar,
        // after responding so the customer never waits on Google. Never throws;
        // /api/cron/sync-calendar reconciles anything that slips through.
        const assignedUserId = apptRes?.assignedUserId || apptRes?.event?.assignedUserId;
        void mirrorAppointmentSafe({
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

        void notifyBooking({
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

        // monetaryValue stays the FULL treatment price — the deposit is a
        // part-payment, not the value of the deal.
        void createBookingOpportunity({
          contactId,
          clientName: name,
          serviceName: serviceName || "Appointment",
          price: deposit.service?.price ?? serviceMetaForCalendar(calendarId)?.price ?? null,
          startTime,
        }).catch(() => null);
      } else {
        console.error("GHL appointment creation failed:", JSON.stringify(apptRes));
        const refunded = await refundAfterFailedBooking(paidIntentId, "GHL rejected the appointment");
        res.status(500).json({
          error: "Failed to create appointment",
          detail: apptRes,
          ...(paidIntentId ? { refunded, deposit: "Your deposit has not been kept — no appointment was created." } : {}),
        });
      }
    } catch (err) {
      console.error("Booking error:", err);
      const refunded = await refundAfterFailedBooking(paidIntentId, "unexpected error during booking");
      if (!res.headersSent) {
        res.status(500).json({
          error: "Booking failed",
          ...(paidIntentId ? { refunded, deposit: "Your deposit has not been kept — no appointment was created." } : {}),
        });
      }
    }
  });

  return httpServer;
}
