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

  // ── Booking, bundle page, app menu: run the REAL Vercel functions (one copy of the
  // booking logic — this used to be a hand-kept twin that drifted).
  const vercel = (mod: Promise<{ default: (req: any, res: any) => unknown }>, query: (req: any) => Record<string, unknown> = () => ({})) =>
    async (req: any, res: any) => (await mod).default({ method: req.method, headers: req.headers, body: req.body, query: { ...req.query, ...query(req) } }, res);
  app.post("/api/ghl/booking", vercel(import("../api/ghl/booking.js")));
  app.get("/api/booking/bundle", vercel(import("../api/booking/bundle.js")));
  app.post("/api/booking/bundle", vercel(import("../api/booking/bundle.js")));
  app.get("/api/catalogue", vercel(import("../api/catalogue.js")));

  // ── Local dev only: run the REAL Vercel dashboard function so /admin works on
  // localhost with live data (production serves api/admin/[action].ts on Vercel).
  // Note: it talks to the real GHL + ORÁ database — a walk-in made locally is real.
  if (process.env.NODE_ENV !== "production") {
    try { process.loadEnvFile(".env"); } catch { /* no .env — admin calls will 401/503 */ }
    const { default: adminHandler } = await import("../api/admin/[action].js");
    app.all("/api/admin/:action", (req, res) => {
      const vreq = { method: req.method, headers: req.headers, body: req.body, query: { ...req.query, action: req.params.action } };
      adminHandler(vreq as any, res as any);
    });
  }

  return httpServer;
}
