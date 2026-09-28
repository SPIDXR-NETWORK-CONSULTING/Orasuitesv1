/**
 * /api/cron/team-sync — the frequent (every ~5 min) two-way sync between the booking
 * system and each practitioner's OWN Google Calendar.
 *
 *   OUT  GHL appointments (next 14 days) → "ORÁ — All Appointments", with the practitioner
 *        invited, so each booking lands on their personal calendar. Only new / moved /
 *        cancelled appointments are touched — never re-sent when unchanged (that emails them).
 *   IN   Busy time in each practitioner's own calendar (shared with admin@orasuites.com)
 *        → GHL "Busy (Google)" blocked slots for that person, so online booking, walk-ins and
 *        round-robin skip them. Reconciled by exact time; only blocks WE titled are ever removed.
 *
 * The daily /api/cron/sync-calendar remains the 90-day full reconcile.
 * AUTH: `x-cron-key: $CRON_SECRET` or `authorization: Bearer $CRON_SECRET` (as every job).
 * `?dryRun=1` works out every change and returns the plan WITHOUT writing anything.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ghlFetch } from "../ghl.js";
import {
  isGoogleCalendarConfigured, isCancelled, listManagedEventsDetailed, deleteEventById, upsertEvent, listBusy,
  teamUserIds, TEAM_BY_USER_ID, TEAM_EMAIL_BY_USER_ID, TEAM_BUSY_CALENDAR_BY_USER_ID, serviceNameForCalendar,
  type ExistingEvent, type MirrorAppointment,
} from "../google-calendar.js";
import { splitGhlTitle } from "../catalogue.js";

export const config = { maxDuration: 60 };

export const BLOCK_TITLE = "Busy (Google)";
const DAYS = 14;

interface GhlEvent { id?: string; title?: string; calendarId?: string; contactId?: string; assignedUserId?: string; appointmentStatus?: string; appoinmentStatus?: string; deleted?: boolean; startTime?: string; endTime?: string; }

/** CRON_SECRET (runs any job) or TEAM_SYNC_KEY (least privilege: can ONLY run this sync —
 *  it's the key the 5-minute database timer holds, so it can't trigger deposits or emails). */
function authorised(req: VercelRequest): boolean {
  const h = req.headers["x-cron-key"];
  const given = String(Array.isArray(h) ? h[0] : h || "");
  const cron = process.env.CRON_SECRET, team = process.env.TEAM_SYNC_KEY;
  if (cron && (given === cron || req.headers.authorization === `Bearer ${cron}`)) return true;
  return Boolean(team) && given === team;
}
/** Service for an appointment: its GHL calendar (one calendar = one treatment) beats parsing the title. */
const serviceOf = (ev: GhlEvent) => serviceNameForCalendar(ev.calendarId) || splitGhlTitle(ev.title).service;

/** Cheap "did anything the practitioner can see change?" — avoids a contact lookup per appointment. */
function unchangedCore(existing: ExistingEvent, ev: GhlEvent): boolean {
  const email = ev.assignedUserId ? (TEAM_EMAIL_BY_USER_ID.get(ev.assignedUserId) || "").toLowerCase() : "";
  const had = (existing.attendees || []).map((a) => (a.email || "").toLowerCase()).join(",");
  return Date.parse(existing.start?.dateTime || "") === Date.parse(ev.startTime || "")
    && Date.parse(existing.end?.dateTime || "") === Date.parse(ev.endTime || "")
    && had === email
    && (existing.summary || "").startsWith(`${serviceOf(ev)} — `);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.CRON_SECRET && !process.env.TEAM_SYNC_KEY) return res.status(503).json({ ok: false, error: "No sync key configured" });
  if (!authorised(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const LOC = process.env.GHL_LOCATION_ID;
  if (!process.env.GHL_API_KEY || !LOC) return res.status(503).json({ ok: false, error: "GHL not configured" });
  if (!isGoogleCalendarConfigured()) return res.status(200).json({ ok: true, skipped: "google calendar not connected" });

  const dry = String((req.query as Record<string, unknown>)?.dryRun || "") === "1";
  const plan: string[] = [];
  const started = Date.now();
  const from = new Date(started - 60 * 60_000);
  const to = new Date(started + DAYS * 86_400_000);
  const out = { created: 0, updated: 0, unchanged: 0, deleted: 0, failed: 0, deletionsSkipped: false };
  const inb = { shared: [] as string[], notShared: [] as string[], blocksCreated: 0, blocksRemoved: 0, failed: 0 };

  /* ── OUT: GHL → Google ─────────────────────────────────── */
  const live = new Map<string, GhlEvent>();
  let complete = true;
  for (const uid of teamUserIds()) {
    const r = await ghlFetch<{ events?: GhlEvent[] }>(`/calendars/events?locationId=${LOC}&userId=${uid}&startTime=${from.getTime()}&endTime=${to.getTime()}`, { version: "2021-04-15" }).catch(() => ({ ok: false } as any));
    if (!r.ok) { complete = false; continue; }
    for (const ev of r.body?.events ?? []) {
      if (!ev?.id || !ev.startTime || !ev.endTime) continue;
      if (ev.deleted || isCancelled(ev.appointmentStatus ?? ev.appoinmentStatus)) live.delete(ev.id);
      else live.set(ev.id, ev);
    }
  }
  const managed = await listManagedEventsDetailed(from, to);
  const contacts = new Map<string, any>();
  for (const [ghlId, ev] of Array.from(live.entries())) {
    const existing = managed.get(ghlId) ?? null;
    if (existing && unchangedCore(existing, ev)) { out.unchanged++; continue; }
    let c = ev.contactId ? contacts.get(ev.contactId) : undefined;
    if (ev.contactId && !c) {
      const r = await ghlFetch<any>(`/contacts/${encodeURIComponent(ev.contactId)}`, { version: "2021-07-28" }).catch(() => ({ body: null } as any));
      const k = r.body?.contact; c = { name: k?.contactName || [k?.firstName, k?.lastName].filter(Boolean).join(" ") || undefined, email: k?.email, phone: k?.phone };
      contacts.set(ev.contactId, c);
    }
    const appt: MirrorAppointment = {
      ghlId, ghlCalendarId: ev.calendarId ?? null, serviceName: serviceOf(ev) !== "—" ? serviceOf(ev) : null,
      clientName: c?.name ?? (splitGhlTitle(ev.title).client !== "—" ? splitGhlTitle(ev.title).client : null), clientEmail: c?.email ?? null, clientPhone: c?.phone ?? null,
      practitioner: (ev.assignedUserId && TEAM_BY_USER_ID.get(ev.assignedUserId)) || null, assignedUserId: ev.assignedUserId ?? null,
      startTime: ev.startTime!, endTime: ev.endTime!, status: ev.appointmentStatus ?? ev.appoinmentStatus ?? null,
    };
    if (dry) { plan.push(`${existing ? "update" : "create"} Google event: ${appt.serviceName} — ${appt.clientName ?? "?"} ${ev.startTime} (${appt.practitioner})`); existing ? out.updated++ : out.created++; continue; }
    const r = await upsertEvent(appt, existing);
    if (r.action === "created") out.created++; else if (r.action === "updated") out.updated++;
    else if (r.action === "skipped") out.unchanged++; else if (r.action === "failed") out.failed++;
  }
  // Only delete when EVERY practitioner's GHL read succeeded — a GHL hiccup must never
  // look like "all their bookings were cancelled" (that emails cancellations, then re-invites).
  if (complete) {
    for (const [ghlId, existing] of Array.from(managed.entries())) {
      if (live.has(ghlId)) continue;
      if (dry) { plan.push(`delete Google event: ${existing.summary} ${existing.start?.dateTime}`); out.deleted++; continue; }
      const r = await deleteEventById(existing.id);
      if (r.action === "deleted") out.deleted++; else if (r.action === "failed") out.failed++;
    }
  } else out.deletionsSkipped = true;

  /* ── IN: their Google → GHL blocks ─────────────────────── */
  for (const uid of teamUserIds()) {
    const name = TEAM_BY_USER_ID.get(uid) || uid;
    const cal = TEAM_BUSY_CALENDAR_BY_USER_ID.get(uid); // opt-in only
    if (!cal) { inb.notShared.push(name); continue; }
    const busy = await listBusy(cal, from, to);
    if (!busy.shared) { inb.notShared.push(name); continue; }
    inb.shared.push(name);
    const b = await ghlFetch<{ events?: any[] }>(`/calendars/blocked-slots?locationId=${LOC}&userId=${uid}&startTime=${from.getTime()}&endTime=${to.getTime()}`, { version: "2021-04-15" }).catch(() => ({ ok: false } as any));
    if (!b.ok) { inb.failed++; continue; } // can't see what exists → change nothing for this person
    const ours = new Map<string, string>(); // "start-end" → GHL block id (only blocks we created)
    for (const x of b.body?.events ?? []) {
      if (x.title === BLOCK_TITLE && (!x.assignedUserId || x.assignedUserId === uid) && Date.parse(x.endTime) > started) ours.set(`${Date.parse(x.startTime)}-${Date.parse(x.endTime)}`, x.id);
    }
    const want = new Set(busy.intervals.filter(([, e]) => e > started).map(([s, e]) => `${s}-${e}`));
    for (const key of Array.from(want)) {
      if (ours.has(key)) continue;
      const [s, e] = key.split("-").map(Number);
      if (dry) { plan.push(`block ${name}: ${new Date(s).toISOString()} → ${new Date(e).toISOString()}`); inb.blocksCreated++; continue; }
      const r = await ghlFetch<any>(`/calendars/events/block-slots`, { method: "POST", version: "2021-04-15", body: JSON.stringify({ locationId: LOC, assignedUserId: uid, title: BLOCK_TITLE, startTime: new Date(s).toISOString(), endTime: new Date(e).toISOString() }) }).catch(() => ({ ok: false } as any));
      if (r.ok) inb.blocksCreated++; else inb.failed++;
    }
    for (const [key, id] of Array.from(ours.entries())) {
      if (want.has(key)) continue;
      if (dry) { plan.push(`remove block ${name}: ${key}`); inb.blocksRemoved++; continue; }
      const r = await ghlFetch<any>(`/calendars/events/${encodeURIComponent(id)}`, { method: "DELETE", version: "2021-04-15" }).catch(() => ({ ok: false } as any));
      if (r.ok) inb.blocksRemoved++; else inb.failed++;
    }
  }

  const summary = { ok: out.failed + inb.failed === 0, service: "ora-team-sync", dryRun: dry, ...(dry ? { plan } : {}), windowDays: DAYS, durationMs: Date.now() - started, out, in: inb };
  console.log("[team-sync]", JSON.stringify(summary));
  return res.status(200).json(summary);
}
