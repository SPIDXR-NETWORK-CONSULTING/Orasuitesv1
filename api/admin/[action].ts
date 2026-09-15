/**
 * ORÁ — Admin floor dashboard API (single dynamic function to respect the
 * Vercel Hobby 12-function cap). Actions via ?action=:
 *   · today   → every appointment across all practitioners for a day, merged
 *               into one list (no "select each member" like GHL forces).
 *
 * Reads GHL (the current booking engine). When we migrate to a custom backend,
 * only this file changes — the dashboard page stays the same.
 *
 * Admin-only: requires ADMIN_KEY (?key= or x-admin-key header). It exposes
 * client names, so it must never be open.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ghlFetch } from "../_lib/ghl.js";
import { TEAM_BY_USER_ID } from "../_lib/google-calendar.js";

const LOC = process.env.GHL_LOCATION_ID || "";

function authorised(req: VercelRequest): boolean {
  const key = process.env.ADMIN_KEY;
  const given = (req.query.key as string) || (req.headers["x-admin-key"] as string) || "";
  return Boolean(key) && given === key;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!authorised(req)) return res.status(401).json({ error: "Unauthorised" });

  const action = String(req.query.action || "");
  if (action === "today") return today(req, res);
  return res.status(404).json({ error: `Unknown action: ${action}` });
}

/** Every appointment for a day, across all practitioners, in one sorted list. */
async function today(req: VercelRequest, res: VercelResponse) {
  // Day window. Clinic hours (10:00–19:30 London) sit safely inside a UTC
  // calendar day, so UTC boundaries are fine here.
  // ponytail: UTC-day window; if the clinic ever runs past midnight, switch to a real London-tz range.
  const dateStr = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const start = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(start)) return res.status(400).json({ error: "Bad date (use YYYY-MM-DD)" });
  const end = start + 86_400_000 - 1;

  const seen = new Set<string>();
  const appointments: any[] = [];
  let errors = 0;

  for (const [uid, uname] of Array.from(TEAM_BY_USER_ID.entries())) {
    const r = await ghlFetch<any>(
      `/calendars/events?locationId=${LOC}&userId=${uid}&startTime=${start}&endTime=${end}`,
      { version: "2021-04-15" },
    ).catch(() => ({ ok: false, status: 0, body: null }) as const);
    if (!r.ok) { errors++; continue; }

    for (const ev of r.body?.events || []) {
      const id = String(ev.id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);

      // GHL titles are "{client} — {service}"; the service itself can contain
      // " — " (e.g. "Straight Blow Dry — Short"), so split on the FIRST one only.
      const title = String(ev.title || "");
      const i = title.indexOf(" — ");
      const client = i > 0 ? title.slice(0, i).trim() : (ev.contactName || "—");
      const service = i > 0 ? title.slice(i + 3).trim() : title || "—";
      const assigned = ev.assignedUserId || uid;

      appointments.push({
        id,
        startTime: ev.startTime,
        endTime: ev.endTime,
        client,
        service,
        practitioner: TEAM_BY_USER_ID.get(assigned) || uname,
        status: ev.appointmentStatus || "confirmed",
        contactId: ev.contactId || null,
      });
    }
  }

  appointments.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  res.json({ date: dateStr, count: appointments.length, staffQueried: TEAM_BY_USER_ID.size, errors, appointments });
}
