/**
 * ORÁ — Admin floor dashboard API (single dynamic function; Vercel Hobby cap).
 * Actions via ?action= :
 *   · today    → every appointment across all practitioners for a day, merged.
 *   · staff    → who's working today (per practitioner).
 *   · services → bookable service list for the walk-in picker.
 *   · slots    → free times today for a service (walk-in time picker).
 *   · walkin   → (POST) create a walk-in: auto-assign, alert practitioner,
 *                land in the pipeline. Admin can book ANY live service.
 *
 * Reads/writes GHL (the current engine). On the future custom-backend migration,
 * only this file changes — the dashboard page stays the same.
 *
 * Admin-only: requires ADMIN_KEY (?key= or x-admin-key). Exposes client data.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ghlFetch } from "../_lib/ghl.js";
import { TEAM_BY_USER_ID, TEAM_EMAIL_BY_USER_ID, mirrorAppointmentSafe } from "../_lib/google-calendar.js";
import { allServices, findService } from "../_lib/catalogue.js";
import { resolveContact, createBookingOpportunity } from "../_lib/ghl-contacts.js";
import { notifyBooking } from "../_lib/booking-notify.js";

const LOC = process.env.GHL_LOCATION_ID || "";

const SERVICE_NAMES: string[] = allServices().map((s) => s.name).sort((a, b) => b.length - a.length);

function splitTitle(title: string): { client: string; service: string } {
  const t = (title || "").trim();
  for (const s of SERVICE_NAMES) {
    if (t.endsWith(` — ${s}`)) return { client: t.slice(0, -(s.length + 3)).trim(), service: s };
    if (t.startsWith(`${s} — `)) return { client: t.slice(s.length + 3).trim(), service: s };
    if (t === s) return { client: "—", service: s };
  }
  const i = t.indexOf(" — ");
  return i > 0 ? { client: t.slice(0, i).trim(), service: t.slice(i + 3).trim() } : { client: t || "—", service: "—" };
}

function dayRange(dateStr: string): { dateStr: string; start: number; end: number } {
  const start = Date.parse(`${dateStr}T00:00:00Z`);
  return { dateStr, start, end: start + 86_400_000 - 1 };
}
function todayStr(): string { return new Date().toISOString().slice(0, 10); }

function authorised(req: VercelRequest): boolean {
  const key = process.env.ADMIN_KEY;
  const given = (req.query.key as string) || (req.headers["x-admin-key"] as string) || "";
  return Boolean(key) && given === key;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!authorised(req)) return res.status(401).json({ error: "Unauthorised" });
  switch (String(req.query.action || "")) {
    case "today": return today(req, res);
    case "range": return range(req, res);
    case "staff": return staff(req, res);
    case "services": return services(req, res);
    case "slots": return slots(req, res);
    case "walkin": return walkin(req, res);
    default: return res.status(404).json({ error: `Unknown action` });
  }
}

/** friendly label for where an appointment came from */
function sourceLabel(ev: any): string {
  const s = ev?.createdBy?.source || "";
  if (s === "calendar_page") return "Added in GHL";
  if (s.includes("widget") || s.includes("booking")) return "Online";
  if (s === "integration" || s === "api") return "Online / app";
  return s ? String(s) : "—";
}

/** Fetch appointments across [start,end] (epoch ms), merged across all staff. */
async function fetchRange(start: number, end: number): Promise<{ appointments: any[]; errors: number }> {
  const seen = new Set<string>();
  const appointments: any[] = [];
  let errors = 0;
  for (const [uid, uname] of Array.from(TEAM_BY_USER_ID.entries())) {
    const r = await ghlFetch<any>(`/calendars/events?locationId=${LOC}&userId=${uid}&startTime=${start}&endTime=${end}`, { version: "2021-04-15" }).catch(() => ({ ok: false } as any));
    if (!r.ok) { errors++; continue; }
    for (const ev of r.body?.events || []) {
      const id = String(ev.id || "");
      if (!id || seen.has(id)) continue;
      const startMs = Date.parse(ev.startTime);
      if (Number.isNaN(startMs) || startMs < start || startMs > end) continue;
      seen.add(id);
      const { client, service } = splitTitle(String(ev.title || ""));
      const assigned = ev.assignedUserId || uid;
      appointments.push({ id, startTime: ev.startTime, endTime: ev.endTime, client, service, practitioner: TEAM_BY_USER_ID.get(assigned) || uname, status: ev.appointmentStatus || ev.appoinmentStatus || "confirmed", contactId: ev.contactId || null, source: sourceLabel(ev) });
    }
  }
  appointments.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  return { appointments, errors };
}

/** Appointments across a date range (week/month). ?start=YYYY-MM-DD&end=YYYY-MM-DD */
async function range(req: VercelRequest, res: VercelResponse) {
  const s = (req.query.start as string) || todayStr();
  const e = (req.query.end as string) || s;
  const start = Date.parse(`${s}T00:00:00Z`);
  const end = Date.parse(`${e}T00:00:00Z`) + 86_400_000 - 1;
  if (Number.isNaN(start) || Number.isNaN(end)) return res.status(400).json({ error: "Bad date range" });
  const { appointments, errors } = await fetchRange(start, end);
  res.json({ start: s, end: e, count: appointments.length, errors, appointments });
}

/** Every appointment for a day, across all practitioners, merged + sorted. */
async function today(req: VercelRequest, res: VercelResponse) {
  const dateStr = (req.query.date as string) || todayStr();
  if (Number.isNaN(Date.parse(`${dateStr}T00:00:00Z`))) return res.status(400).json({ error: "Bad date" });
  const { start, end } = dayRange(dateStr);
  const { appointments, errors } = await fetchRange(start, end);
  res.json({ date: dateStr, count: appointments.length, errors, appointments });
}

/**
 * The team roster (so the strip lists everyone, incl. those with no appts).
 * Note: GHL can't reliably report "scheduled/off today" via API, so the
 * dashboard derives who's in from appointment counts, not a false off/on flag.
 */
async function staff(_req: VercelRequest, res: VercelResponse) {
  const out = Array.from(TEAM_BY_USER_ID.entries()).map(([userId, name]) => ({ userId, name }));
  res.json({ staff: out });
}

/** Live services the admin can book as a walk-in (includes enquire-only ones). */
async function services(_req: VercelRequest, res: VercelResponse) {
  const list = allServices()
    .filter((s) => s.live && s.ghlCalendarId)
    .map((s) => ({ id: s.id, name: s.name, price: s.price, duration: s.duration, category: s.categoryId }));
  res.json({ services: list });
}

/** Free times today for a service (walk-in time picker). */
async function slots(req: VercelRequest, res: VercelResponse) {
  const service = findService((req.query.serviceId as string) || "");
  if (!service?.ghlCalendarId) return res.status(400).json({ error: "Unknown service" });
  const dateStr = (req.query.date as string) || todayStr();
  const { start, end } = dayRange(dateStr);
  const r = await ghlFetch<any>(`/calendars/${service.ghlCalendarId}/free-slots?startDate=${start}&endDate=${end}`, { version: "2021-04-15" }).catch(() => ({ body: {} } as any));
  res.json({ slots: ((r.body || {})[dateStr] || {}).slots || [] });
}

/** Create a walk-in. Auto-assigns, alerts the practitioner, lands in pipeline. */
async function walkin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const service = findService(body.serviceId);
  if (!service?.ghlCalendarId) return res.status(400).json({ error: "Unknown or unbookable service" });

  const name = String(body.clientName || "Walk-in").trim() || "Walk-in";
  const email = typeof body.email === "string" && body.email.includes("@") ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  // Time: use the given slot, else the next free slot today.
  let start: string | undefined = typeof body.startTime === "string" ? body.startTime : undefined;
  if (!start) {
    const { start: ds, end } = dayRange(todayStr());
    const r = await ghlFetch<any>(`/calendars/${service.ghlCalendarId}/free-slots?startDate=${ds}&endDate=${end}`, { version: "2021-04-15" }).catch(() => ({ body: {} } as any));
    const list: string[] = ((r.body || {})[todayStr()] || {}).slots || [];
    const now = Date.now();
    start = list.find((s) => Date.parse(s) >= now) || list[0];
    if (!start) return res.status(409).json({ error: "No availability today for this service." });
  }
  const end = new Date(Date.parse(start) + service.duration * 60_000).toISOString();

  const [firstName, ...rest] = name.split(/\s+/);
  const lastName = rest.join(" ");
  let contactId: string | undefined;
  if (email) {
    const c = await resolveContact({ email, firstName, lastName, phone, tags: ["walk-in"] });
    contactId = c?.id || undefined;
  } else {
    const c = await ghlFetch<any>(`/contacts/`, { method: "POST", body: JSON.stringify({ locationId: LOC, firstName, lastName, phone: phone || undefined, tags: ["walk-in"] }) }).catch(() => ({ body: null } as any));
    contactId = c.body?.contact?.id;
  }
  if (!contactId) return res.status(500).json({ error: "Could not create the client record. Add an email or phone." });

  const appt = await ghlFetch<any>(`/calendars/events/appointments`, {
    method: "POST",
    body: JSON.stringify({ calendarId: service.ghlCalendarId, locationId: LOC, contactId, startTime: start, endTime: end, title: `${service.name} — ${name}`, appointmentStatus: "confirmed", toNotify: true, timezone: "Europe/London", notes: "Walk-in (added at reception)" }),
  }).catch(() => ({ body: null } as any));
  const appointmentId = appt.body?.id || appt.body?.event?.id;
  if (!appointmentId) return res.status(502).json({ error: "GHL rejected the appointment", detail: appt.body });

  const assignedUserId = appt.body?.assignedUserId || appt.body?.event?.assignedUserId || null;
  const practitioner = assignedUserId ? TEAM_BY_USER_ID.get(assignedUserId) || null : null;

  // Fire-and-forget: alert practitioner + admin (+ client if email), pipeline, mirror.
  notifyBooking({ contactId, appointmentId, clientName: name, clientEmail: email, clientPhone: phone, serviceName: service.name, startTime: start, practitioner, practitionerEmail: assignedUserId ? TEAM_EMAIL_BY_USER_ID.get(assignedUserId) || null : null, durationMins: service.duration, price: service.price, depositPence: null } as any).catch(() => {});
  createBookingOpportunity({ contactId, clientName: name, serviceName: service.name, price: service.price, startTime: start } as any).catch(() => null);
  mirrorAppointmentSafe({ ghlId: appointmentId, ghlCalendarId: service.ghlCalendarId, assignedUserId, serviceName: service.name, clientName: name, clientEmail: email, clientPhone: phone, practitioner, notes: "Walk-in", startTime: start, endTime: end, status: "confirmed" } as any).catch(() => {});

  res.json({ appointmentId, practitioner, startTime: start, endTime: end, price: service.price, service: service.name });
}

function safeJson(s: string): any { try { return JSON.parse(s); } catch { return {}; } }
