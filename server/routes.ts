import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { z } from "zod";
import { processEnquiry } from "./ghl-notify";

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
    const { name, email, phone, notes, calendarId, serviceId, serviceName, startTime, endTime } = req.body;

    if (!name || !email || !phone || !calendarId || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required booking fields" });
    }

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

      const contactRes = await ghlFetch("/contacts/upsert", {
        method: "POST",
        headers: { "Version": "2021-07-28" },
        body: JSON.stringify(contactPayload),
      });

      const contactId = contactRes?.contact?.id || contactRes?.meta?.contactId;
      if (!contactId) {
        console.error("GHL contact creation failed:", JSON.stringify(contactRes));
        return res.status(500).json({ error: "Failed to create contact in GHL" });
      }

      // 2. Create appointment
      const appointmentPayload = {
        calendarId,
        locationId: GHL_LOCATION_ID,
        contactId,
        startTime,
        endTime,
        title: `${serviceName} — ${name}`,
        appointmentStatus: "new",
        toNotify: true,
        timezone: "Europe/London",
        notes: notes || "",
      };

      const apptRes = await ghlFetch("/calendars/events/appointments", {
        method: "POST",
        body: JSON.stringify(appointmentPayload),
      });

      if (apptRes?.id || apptRes?.event?.id) {
        res.json({
          success: true,
          appointmentId: apptRes?.id || apptRes?.event?.id,
          contactId,
        });
      } else {
        console.error("GHL appointment creation failed:", JSON.stringify(apptRes));
        res.status(500).json({ error: "Failed to create appointment", detail: apptRes });
      }
    } catch (err) {
      console.error("Booking error:", err);
      res.status(500).json({ error: "Booking failed" });
    }
  });

  return httpServer;
}
