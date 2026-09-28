/**
 * GET /api/booking/mine — the signed-in customer's own appointments, for the ORÁ app
 * (ported from orasuites-web-dev PR #2, with a security fix).
 *
 * Identity comes ONLY from the caller's Supabase access token (validated with Supabase
 * Auth), never from anything the app sends. FIX vs the PR: the email must be CONFIRMED —
 * otherwise anyone could sign up with a stranger's email and read that person's
 * appointments. The verified email resolves the GHL contact by EXACT match; GHL stays
 * the source of truth. Read-only: never creates or updates a contact.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { findService, splitGhlTitle } from "../_lib/catalogue.js";
import { ghlFetch } from "../_lib/ghl.js";

interface GhlAppointment { id?: string; calendarId?: string; status?: string; appointmentStatus?: string; title?: string; startTime?: string; endTime?: string; deleted?: boolean; }

/** Supabase user for this bearer token, only if their email is confirmed. */
async function confirmedIdentity(req: VercelRequest): Promise<{ id: string; email: string } | null> {
  const header = req.headers.authorization;
  const authorization = Array.isArray(header) ? header[0] : header;
  if (!authorization?.startsWith("Bearer ")) return null;
  const base = process.env.ORA_SUPABASE_URL || process.env.ORA_DB_URL;
  const anon = process.env.ORA_SUPABASE_ANON_KEY || process.env.ORA_DB_ANON_KEY;
  if (!base || !anon) throw new Error("ORÁ app authentication is not configured");
  const r = await fetch(`${base.replace(/\/$/, "")}/auth/v1/user`, { headers: { apikey: anon, Authorization: authorization } });
  if (!r.ok) return null;
  const u = (await r.json()) as { id?: string; email?: string; email_confirmed_at?: string | null };
  if (!u.id || !u.email || !u.email_confirmed_at) return null; // unconfirmed email ≠ proof of ownership
  return { id: u.id, email: u.email.trim().toLowerCase() };
}

/** Exact-email contact lookup. Throws on GHL failure (a failure must not look like "no bookings"). */
async function contactIdByExactEmail(email: string): Promise<string | undefined> {
  const res = await ghlFetch<any>(`/contacts/?locationId=${process.env.GHL_LOCATION_ID}&query=${encodeURIComponent(email)}&limit=20`, { version: "2021-07-28" });
  if (!res.ok) throw new Error(`GHL contact lookup failed (${res.status})`);
  return res.body?.contacts?.find((c: any) => (c.email || "").trim().toLowerCase() === email)?.id;
}

export function toAppBooking(ev: GhlAppointment) {
  if (!ev.id || !ev.startTime || !ev.endTime || ev.deleted) return null;
  const service = findService(ev.calendarId) ?? findService(splitGhlTitle(ev.title).service);
  const name = service?.name ?? (splitGhlTitle(ev.title).service !== "—" ? splitGhlTitle(ev.title).service : "Appointment");
  const price = service?.price ?? 0;
  return {
    id: ev.id, reference: ev.id, status: ev.appointmentStatus ?? ev.status ?? "confirmed",
    services: [{ name, startTime: ev.startTime, endTime: ev.endTime, price }],
    startTime: ev.startTime, endTime: ev.endTime, totalPrice: price,
    createdAt: ev.startTime, // GHL's list doesn't return creation time; the app only needs a stable ISO date
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  let who: { id: string; email: string } | null;
  try { who = await confirmedIdentity(req); }
  catch (e) { console.error("[booking/mine] auth config:", e); return res.status(503).json({ error: "Appointments are temporarily unavailable" }); }
  if (!who) return res.status(401).json({ error: "Sign in with a confirmed email to see your appointments" });
  try {
    const contactId = await contactIdByExactEmail(who.email);
    if (!contactId) return res.status(200).json({ bookings: [] });
    const r = await ghlFetch<{ events?: GhlAppointment[] }>(`/contacts/${encodeURIComponent(contactId)}/appointments`, { version: "2021-07-28" });
    if (!r.ok) return res.status(502).json({ error: "We could not load your appointments" });
    const bookings = (r.body?.events ?? []).map(toAppBooking).filter((b): b is NonNullable<ReturnType<typeof toAppBooking>> => Boolean(b))
      .sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime));
    return res.status(200).json({ bookings });
  } catch (e) {
    console.error("[booking/mine] unexpected:", e);
    return res.status(502).json({ error: "We could not load your appointments" });
  }
}
