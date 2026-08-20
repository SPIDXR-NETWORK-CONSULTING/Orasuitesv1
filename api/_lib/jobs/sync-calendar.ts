/**
 * GET|POST /api/cron/sync-calendar — reconcile GHL → "ORÁ — All Appointments".
 *
 * The booking route mirrors new bookings the moment they're made. This job is
 * the safety net that makes the Google calendar eventually correct no matter
 * what happened in between: appointments booked inside GHL (phone, walk-in,
 * practitioner-created), reschedules, cancellations, and anything the live
 * mirror missed because Google was briefly unreachable.
 *
 * What it does, for now → +90 days:
 *   1. pull every appointment for every practitioner in shared/catalogue.json
 *      (GET /calendars/events?locationId&userId&startTime&endTime, ms epochs)
 *   2. upsert each live appointment into the single Google calendar
 *   3. delete Google events whose GHL appointment is gone or cancelled
 *
 * Only events tagged `oraManaged=1` are ever considered for deletion, so
 * anything Abdul adds to that calendar by hand is untouchable.
 *
 * Fully idempotent — safe to run on a schedule and safe to re-run by hand.
 *
 * AUTH: requires `x-cron-key: $CRON_SECRET`, or Vercel Cron's
 * `authorization: Bearer $CRON_SECRET`. Anything else → 401. If CRON_SECRET
 * is not configured the endpoint refuses to run at all (503) rather than
 * exposing an unauthenticated write path.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {

  isGoogleCalendarConfigured,
  isCancelled,
  listManagedEvents,
  deleteEventById,
  upsertEvent,
  teamUserIds,
  TEAM_BY_USER_ID,
  type MirrorAppointment,
} from "../google-calendar.js";

/** Titles are "<Service> — <Client>"; service names may themselves contain " — ". */
function serviceFromTitle(title?: string | null): string | undefined {
  const t = (title || "").trim();
  const i = t.lastIndexOf(" — ");
  return (i > 0 ? t.slice(0, i) : t).trim() || undefined;
}


export const config = { maxDuration: 60 };

const GHL_BASE = "https://services.leadconnectorhq.com";
/** Cloudflare in front of GHL rejects the default Node UA. */
const GHL_USER_AGENT = "Mozilla/5.0 ora-suites-sync/1.0";

const WINDOW_DAYS = 90;
/** Bound the contact lookups so one run can't blow the function timeout. */
const MAX_CONTACT_LOOKUPS = 200;

/**
 * Verified against the live location on 2026-08-17. Note two GHL quirks:
 *   - `appoinmentStatus` is returned alongside `appointmentStatus` (their typo)
 *   - soft-deleted appointments come back with `deleted: true` and a still-live
 *     status, so the flag has to be checked separately
 *   - `notes` is NOT returned by this endpoint (only by the single-appointment
 *     read), so mirrored notes come from the booking path, not the reconciler
 */
interface GhlEvent {
  id?: string;
  title?: string;
  calendarId?: string;
  contactId?: string;
  assignedUserId?: string;
  appointmentStatus?: string;
  appoinmentStatus?: string;
  deleted?: boolean;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

/** True when GHL considers the appointment gone (status OR the deleted flag). */
function isGone(ev: GhlEvent): boolean {
  return ev.deleted === true || isCancelled(ev.appointmentStatus ?? ev.appoinmentStatus);
}

async function ghlFetch<T = any>(path: string, version = "2021-04-15"): Promise<{ ok: boolean; status: number; body: T | null }> {
  try {
    const res = await fetch(`${GHL_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        Version: version,
        Accept: "application/json",
        "User-Agent": GHL_USER_AGENT,
      },
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!res.ok) console.error(`[sync-calendar] GHL ${path.split("?")[0]} → HTTP ${res.status}`);
    return { ok: res.ok, status: res.status, body: body as T };
  } catch (err) {
    console.error(`[sync-calendar] GHL request error on ${path.split("?")[0]}:`, String(err).slice(0, 160));
    return { ok: false, status: 0, body: null };
  }
}

function authorised(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerKey = req.headers["x-cron-key"];
  const key = Array.isArray(headerKey) ? headerKey[0] : headerKey;
  if (key === secret) return true;
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth === `Bearer ${secret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.CRON_SECRET) {
    return res.status(503).json({ ok: false, error: "CRON_SECRET is not configured — refusing to run an unauthenticated sync." });
  }
  if (!authorised(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const locationId = process.env.GHL_LOCATION_ID;
  if (!process.env.GHL_API_KEY || !locationId) {
    return res.status(503).json({ ok: false, error: "GHL_API_KEY / GHL_LOCATION_ID missing" });
  }
  if (!isGoogleCalendarConfigured()) {
    // Not an error — Abdul simply hasn't run script/google-connect.mjs yet.
    return res.status(200).json({
      ok: true,
      skipped: "google calendar not connected — run `node script/google-connect.mjs`, then add the GOOGLE_* vars in Vercel",
    });
  }

  const startedAt = Date.now();
  const windowStart = new Date();
  const windowEnd = new Date(windowStart.getTime() + WINDOW_DAYS * 86_400_000);

  const stats = {
    practitioners: 0,
    ghlAppointments: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    failed: 0,
    cancelledSkipped: 0,
  };

  /* 1 ─ pull every appointment for every practitioner ------------------- */
  const live = new Map<string, GhlEvent>();
  const cancelled = new Set<string>();

  for (const userId of teamUserIds()) {
    stats.practitioners++;
    const qs = new URLSearchParams({
      locationId,
      userId,
      startTime: String(windowStart.getTime()),
      endTime: String(windowEnd.getTime()),
    });
    const r = await ghlFetch<{ events?: GhlEvent[] }>(`/calendars/events?${qs}`);
    for (const ev of r.body?.events ?? []) {
      if (!ev?.id) continue;
      stats.ghlAppointments++;
      if (isGone(ev)) {
        cancelled.add(ev.id);
        live.delete(ev.id);
      } else if (!cancelled.has(ev.id)) {
        live.set(ev.id, ev);
      }
    }
  }

  /* 2 ─ enrich with contact details (bounded + cached) ------------------ */
  const contactCache = new Map<string, { name?: string; email?: string; phone?: string }>();
  let lookups = 0;

  async function contactFor(contactId?: string) {
    if (!contactId) return undefined;
    const cached = contactCache.get(contactId);
    if (cached) return cached;
    if (lookups >= MAX_CONTACT_LOOKUPS) return undefined;
    lookups++;
    const r = await ghlFetch<{ contact?: { contactName?: string; firstName?: string; lastName?: string; email?: string; phone?: string } }>(
      `/contacts/${encodeURIComponent(contactId)}`,
      "2021-07-28",
    );
    const c = r.body?.contact;
    const value = {
      name: c?.contactName || [c?.firstName, c?.lastName].filter(Boolean).join(" ") || undefined,
      email: c?.email || undefined,
      phone: c?.phone || undefined,
    };
    contactCache.set(contactId, value);
    return value;
  }

  /* 3 ─ upsert every live appointment ----------------------------------- */
  for (const [ghlId, ev] of Array.from(live.entries())) {
    if (!ev.startTime || !ev.endTime) {
      stats.failed++;
      continue;
    }
    const contact = await contactFor(ev.contactId);
    // GHL titles are already "<Service> — <Client>" for website bookings; strip
    // the client half so the mirror rebuilds the summary consistently.
    const titleService = serviceFromTitle(ev.title);

    const appt: MirrorAppointment = {
      ghlId,
      ghlCalendarId: ev.calendarId ?? null,
      serviceName: titleService ?? null,
      clientName: contact?.name ?? null,
      clientEmail: contact?.email ?? null,
      clientPhone: contact?.phone ?? null,
      practitioner: (ev.assignedUserId && TEAM_BY_USER_ID.get(ev.assignedUserId)) || null,
      assignedUserId: ev.assignedUserId ?? null,
      notes: ev.notes ?? null,
      startTime: ev.startTime,
      endTime: ev.endTime,
      status: ev.appointmentStatus ?? ev.appoinmentStatus ?? null,
    };

    const result = await upsertEvent(appt);
    if (result.action === "created") stats.created++;
    else if (result.action === "updated") stats.updated++;
    else if (result.action === "deleted") stats.deleted++;
    else if (result.action === "failed") stats.failed++;
  }

  /* 4 ─ delete mirrors whose GHL appointment is gone or cancelled -------- */
  const managed = await listManagedEvents(windowStart, windowEnd);
  for (const [ghlId, eventId] of Array.from(managed.entries())) {
    if (live.has(ghlId)) continue;
    if (cancelled.has(ghlId)) stats.cancelledSkipped++;
    const result = await deleteEventById(eventId);
    if (result.action === "deleted") stats.deleted++;
    else if (result.action === "failed") stats.failed++;
  }

  const summary = {
    ok: stats.failed === 0,
    service: "ora-suites-calendar-sync",
    window: { from: windowStart.toISOString(), to: windowEnd.toISOString(), days: WINDOW_DAYS },
    contactLookups: lookups,
    contactLookupsCapped: lookups >= MAX_CONTACT_LOOKUPS,
    durationMs: Date.now() - startedAt,
    ...stats,
  };
  console.log("[sync-calendar]", JSON.stringify(summary));
  return res.status(200).json(summary);
}
