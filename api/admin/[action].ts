/**
 * ORÁ — Admin floor dashboard API (one dynamic function for every action).
 * Actions via ?action= :
 *   · today    → every appointment across all practitioners for a day, merged.
 *   · staff    → who's working today (per practitioner).
 *   · services → bookable service list for the walk-in picker.
 *   · slots    → free times today for a service (walk-in time picker).
 *   · walkin   → (POST) create a walk-in: auto-assign, alert practitioner,
 *                land in the pipeline. Admin can book ANY live service.
 *   · rota / rota-set → weekly hours; each save syncs to GHL availability.
 *   · renters / renter-set → room & chair renters (ORÁ Supabase, locked table).
 *   · block / unblock → (POST) block time for a practitioner (GHL + their Google Calendar).
 *   · clients  → search clients (GHL contacts) by name / phone / email.  client → one client
 *                + visits + notes.  note-add → (POST) add a note (allergies, preferences…).
 *   · move     → (POST) move a booking to another time and/or practitioner (drag & drop).
 *   · bundles / bundle-sell / bundle-act → blow-dry bundles: list, sell at the desk,
 *                mark paid, count a visit, undo, cancel (ORÁ Supabase, locked tables).
 *
 * Reads/writes GHL (the current engine). On the future custom-backend migration,
 * only this file changes — the dashboard page stays the same.
 *
 * Admin-only. The staff passcode (ADMIN_KEY, short by design) is checked ONLY by the
 * `login` action, which is rate-limited (5 wrong / IP / 15 min, 50 total). A correct login
 * returns a signed device token (90 days); every other action requires that token in
 * `x-admin-token`. Changing ADMIN_KEY signs every device out. Exposes client data.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ghlFetch } from "../_lib/ghl.js";
import { TEAM_BY_USER_ID, TEAM_EMAIL_BY_USER_ID, mirrorAppointmentSafe, deleteEvent, createBlockEvent, deleteBlockEvent } from "../_lib/google-calendar.js";
import { allServices, findService, splitGhlTitle, teamUserIds } from "../_lib/catalogue.js";
import { resolveContact, createBookingOpportunity, appendContactNote } from "../_lib/ghl-contacts.js";
import { notifyBooking } from "../_lib/booking-notify.js";
import { notifyReschedule, sendRescheduledPractitionerAlert, sendAdminRescheduleAlert } from "../_lib/booking-notify-2.js";
import { bundleOfferFor, bundleSize, createBundle, bundleAction, listBundles, sendBundleEmail, BUNDLE_EXPIRY_MONTHS } from "../_lib/bundles.js";

const LOC = process.env.GHL_LOCATION_ID || "";

const splitTitle = (title: string) => splitGhlTitle(title);

function dayRange(dateStr: string): { dateStr: string; start: number; end: number } {
  const start = Date.parse(`${dateStr}T00:00:00Z`);
  return { dateStr, start, end: start + 86_400_000 - 1 };
}
function todayStr(): string { return new Date().toISOString().slice(0, 10); }

/* ── auth: passcode → signed device token ───────────────── */
const TOKEN_DAYS = 90;
function sign(exp: number): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET, pass = process.env.ADMIN_KEY;
  if (!secret || !pass) return null;
  // passcode is part of the key → changing the passcode invalidates every token
  return createHmac("sha256", `${secret}:${pass}`).update(String(exp)).digest("base64url");
}
function authorised(req: VercelRequest): boolean {
  const token = String(req.headers["x-admin-token"] || "");
  const [expStr, mac] = token.split(".");
  const exp = Number(expStr);
  if (!exp || !mac || exp < Date.now()) return false;
  const want = sign(exp);
  if (!want || want.length !== mac.length) return false;
  return timingSafeEqual(Buffer.from(want), Buffer.from(mac));
}
const clientIp = (req: VercelRequest) => String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "?").split(",")[0].trim();

async function login(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.ADMIN_KEY || !process.env.ADMIN_SESSION_SECRET || !DB_URL || !RPC_SECRET) return res.status(503).json({ error: "Login is not configured" });
  const ip = clientIp(req);
  const locked = await dbFetch("rpc/ora_login_locked", { method: "POST", body: JSON.stringify({ p_secret: RPC_SECRET, p_ip: ip }) }).then((r) => (r.ok ? r.json() : true)).catch(() => true);
  if (locked === true) return res.status(429).json({ error: "Too many wrong attempts. Try again in 15 minutes." });
  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const given = String(body.passcode || "").trim(), pass = process.env.ADMIN_KEY;
  const ok = given.length === pass.length && timingSafeEqual(Buffer.from(given), Buffer.from(pass));
  if (!ok) {
    await dbFetch("rpc/ora_login_fail", { method: "POST", body: JSON.stringify({ p_secret: RPC_SECRET, p_ip: ip }) }).catch(() => null);
    return res.status(401).json({ error: "That passcode didn't work." });
  }
  const exp = Date.now() + TOKEN_DAYS * 86_400_000;
  res.json({ token: `${exp}.${sign(exp)}` });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (String(req.query.action || "") === "login") return login(req, res);
  if (!authorised(req)) return res.status(401).json({ error: "Unauthorised" });
  switch (String(req.query.action || "")) {
    case "today": return today(req, res);
    case "range": return range(req, res);
    case "staff": return staff(req, res);
    case "services": return services(req, res);
    case "slots": return slots(req, res);
    case "walkin": return walkin(req, res);
    case "status": return setStatus(req, res);
    case "move": return moveAppt(req, res);
    case "block": return blockTime(req, res);
    case "unblock": return unblockTime(req, res);
    case "client": return client(req, res);
    case "clients": return clientSearch(req, res);
    case "note-add": return noteAdd(req, res);
    case "enquiries": return enquiries(req, res);
    case "conversations": return conversations(req, res);
    case "thread": return thread(req, res);
    case "reply": return reply(req, res);
    case "rota": return rota(req, res);
    case "rota-set": return rotaSet(req, res);
    case "renters": return renters(req, res);
    case "renter-set": return renterSet(req, res);
    case "bundles": return bundles(req, res);
    case "bundle-sell": return bundleSell(req, res);
    case "bundle-act": return bundleAct(req, res);
    default: return res.status(404).json({ error: `Unknown action` });
  }
}

/** friendly label for where an appointment came from */
function sourceLabel(ev: any): string {
  const s = String(ev?.createdBy?.source || "");
  if (s === "calendar_page") return "Added at reception";
  if (s === "third_party" || s.includes("widget") || s.includes("booking")) return "Online booking";
  if (s === "integration" || s === "api") return "Online / app";
  return s ? s.replace(/_/g, " ") : "—";
}

/** Fetch appointments + blocked time across [start,end] (epoch ms), merged across all staff. */
async function fetchRange(start: number, end: number): Promise<{ appointments: any[]; blocks: any[]; errors: number }> {
  const seen = new Set<string>();
  const appointments: any[] = [];
  const blocks: any[] = [];
  let errors = 0;
  // Every practitioner's appointments + blocked time requested AT ONCE (was 12 calls in a row).
  const team = Array.from(TEAM_BY_USER_ID.entries());
  const results = await Promise.all(team.map(([uid]) => Promise.all([
    ghlFetch<any>(`/calendars/events?locationId=${LOC}&userId=${uid}&startTime=${start}&endTime=${end}`, { version: "2021-04-15" }).catch(() => ({ ok: false } as any)),
    ghlFetch<any>(`/calendars/blocked-slots?locationId=${LOC}&userId=${uid}&startTime=${start}&endTime=${end}`, { version: "2021-04-15" }).catch(() => ({ ok: false } as any)),
  ])));
  team.forEach(([uid, uname], i) => {
    const [r, b] = results[i];
    if (!r.ok) errors++;
    for (const ev of r.ok ? r.body?.events || [] : []) {
      const id = String(ev.id || "");
      if (!id || seen.has(id)) continue;
      const startMs = Date.parse(ev.startTime);
      if (Number.isNaN(startMs) || startMs < start || startMs > end) continue;
      seen.add(id);
      // treatment from the booking's GHL calendar (one calendar = one treatment) beats the title,
      // which staff often type freely ("Sogol BIAB") — that left a third of bookings unpriced
      const parsed = splitTitle(String(ev.title || ""));
      const byCal = ev.calendarId ? findService(ev.calendarId) : undefined;
      const service = byCal?.name ?? parsed.service;
      const client = parsed.client;
      const assigned = ev.assignedUserId || uid;
      appointments.push({ id, startTime: ev.startTime, endTime: ev.endTime, client, service, practitioner: TEAM_BY_USER_ID.get(assigned) || uname, status: ev.appointmentStatus || ev.appoinmentStatus || "confirmed", contactId: ev.contactId || null, calendarId: ev.calendarId || null, source: sourceLabel(ev) });
    }
    // blocked time (their own Google calendar via team-sync, team meetings, days off set in GHL)
    for (const x of b.ok ? b.body?.events || [] : []) {
      if (!x?.id || seen.has(x.id)) continue;
      seen.add(x.id);
      // Google-sourced blocks show only "Busy" (owner's choice: personal details stay private)
      blocks.push({ id: x.id, startTime: x.startTime, endTime: x.endTime, practitioner: TEAM_BY_USER_ID.get(x.assignedUserId) || uname, title: x.title === "Busy (Google)" ? "Busy" : x.title || "Blocked" });
    }
  });
  appointments.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  return { appointments, blocks, errors };
}

/** Appointments across a date range (week/month). ?start=YYYY-MM-DD&end=YYYY-MM-DD */
async function range(req: VercelRequest, res: VercelResponse) {
  const s = (req.query.start as string) || todayStr();
  const e = (req.query.end as string) || s;
  const start = Date.parse(`${s}T00:00:00Z`);
  const end = Date.parse(`${e}T00:00:00Z`) + 86_400_000 - 1;
  if (Number.isNaN(start) || Number.isNaN(end)) return res.status(400).json({ error: "Bad date range" });
  const { appointments, blocks, errors } = await fetchRange(start, end);
  res.json({ start: s, end: e, count: appointments.length, errors, appointments, blocks });
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
    .map((s) => ({ id: s.id, name: s.name, price: s.price, duration: s.duration, category: s.categoryId, team: teamUserIds(s.categoryId) }));
  res.json({ services: list });
}

/** Free times today for a service (walk-in time picker). */
async function slots(req: VercelRequest, res: VercelResponse) {
  const service = findService((req.query.serviceId as string) || "");
  if (!service?.ghlCalendarId) return res.status(400).json({ error: "Unknown service" });
  const dateStr = (req.query.date as string) || todayStr();
  const { start, end } = dayRange(dateStr);
  const uid = typeof req.query.userId === "string" && TEAM_BY_USER_ID.has(req.query.userId) ? `&userId=${req.query.userId}` : "";
  const r = await ghlFetch<any>(`/calendars/${service.ghlCalendarId}/free-slots?startDate=${start}&endDate=${end}${uid}`, { version: "2021-04-15" }).catch(() => ({ body: {} } as any));
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

  // Practitioner: "anyone" (GHL round-robin) or a named person who does this treatment.
  const wantUser = typeof body.userId === "string" && body.userId ? body.userId : "";
  if (wantUser && !teamUserIds(service.categoryId).includes(wantUser)) return res.status(400).json({ error: `${TEAM_BY_USER_ID.get(wantUser) || "That practitioner"} doesn't do this treatment.` });
  // Time: use the given slot, else the next free slot on the chosen day (default today).
  let start: string | undefined = typeof body.startTime === "string" ? body.startTime : undefined;
  if (start && (Number.isNaN(Date.parse(start)) || Date.parse(start) < Date.now() - 15 * 60_000)) return res.status(400).json({ error: "That time has already passed." });
  if (!start) {
    const day = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) && body.date >= todayStr() ? body.date : todayStr();
    const { start: ds, end } = dayRange(day);
    const r = await ghlFetch<any>(`/calendars/${service.ghlCalendarId}/free-slots?startDate=${ds}&endDate=${end}${wantUser ? `&userId=${wantUser}` : ""}`, { version: "2021-04-15" }).catch(() => ({ body: {} } as any));
    const list: string[] = ((r.body || {})[day] || {}).slots || [];
    const now = Date.now();
    start = list.find((s) => Date.parse(s) >= now);
    if (!start) return res.status(409).json({ error: day === todayStr() ? "No availability left today for this service." : "No availability that day for this service." });
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
    body: JSON.stringify({ calendarId: service.ghlCalendarId, locationId: LOC, contactId, startTime: start, endTime: end, title: `${service.name} — ${name}`, appointmentStatus: "confirmed", toNotify: true, timezone: "Europe/London", notes: "Walk-in (added at reception)", ...(wantUser ? { assignedUserId: wantUser } : {}) }),
  }).catch(() => ({ body: null } as any));
  const appointmentId = appt.body?.id || appt.body?.event?.id;
  if (!appointmentId) return res.status(502).json({ error: "GHL rejected the appointment", detail: appt.body });

  const assignedUserId = appt.body?.assignedUserId || appt.body?.event?.assignedUserId || null;
  const practitioner = assignedUserId ? TEAM_BY_USER_ID.get(assignedUserId) || null : null;

  // Alert practitioner + admin (+ client if email), pipeline, mirror — AWAITED: on Vercel,
  // work left running after the response is sent can be cut off. Each one swallows its own error.
  await Promise.all([
  notifyBooking({ contactId, appointmentId, clientName: name, clientEmail: email, clientPhone: phone, serviceName: service.name, startTime: start, practitioner, practitionerEmail: assignedUserId ? TEAM_EMAIL_BY_USER_ID.get(assignedUserId) || null : null, durationMins: service.duration, price: service.price, depositPence: null } as any).catch(() => {}),
  createBookingOpportunity({ contactId, clientName: name, serviceName: service.name, price: service.price, startTime: start } as any).catch(() => null),
  mirrorAppointmentSafe({ ghlId: appointmentId, ghlCalendarId: service.ghlCalendarId, assignedUserId, serviceName: service.name, clientName: name, clientEmail: email, clientPhone: phone, practitioner, notes: "Walk-in", startTime: start, endTime: end, status: "confirmed" } as any).catch(() => {}),
  ]);

  res.json({ appointmentId, practitioner, startTime: start, endTime: end, price: service.price, service: service.name });
}

/**
 * Mark a booking: showed (client arrived) · noshow · cancelled · confirmed (undo).
 * Same effect as changing it in GHL (GHL's own notifications/workflows behave as usual).
 * Cancelled / no-show bookings leave the practitioner's Google Calendar immediately.
 */
const STATUSES_ALLOWED = ["showed", "noshow", "cancelled", "confirmed"];
async function setStatus(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const id = String(body.id || ""), status = String(body.status || "");
  if (!/^[A-Za-z0-9]{8,40}$/.test(id)) return res.status(400).json({ error: "Bad appointment id" });
  if (!STATUSES_ALLOWED.includes(status)) return res.status(400).json({ error: "Unknown status" });
  const r = await ghlFetch<any>(`/calendars/events/appointments/${id}`, { method: "PUT", version: "2021-04-15", body: JSON.stringify({ appointmentStatus: status }) }).catch(() => ({ ok: false } as any));
  if (!r.ok) return res.status(502).json({ error: "GHL didn't accept the change — try again." });
  if (status === "cancelled" || status === "noshow") await deleteEvent(id).catch(() => null);
  // Arrived = the visit happened → if this client joined the ORÁ app with a friend's code,
  // the friend gets their second 100 points (the DB function awards it once, ever).
  const referralAwarded = status === "showed" ? await awardReferralFirstVisit(id) : false;
  res.json({ ok: true, id, status, referralAwarded });
}

/**
 * Move a booking (drag & drop / "Move" in the drawer): new start time and/or practitioner.
 * Checks the practitioner does that treatment (is on its GHL calendar) and is free, then
 * GHL → Google mirror → emails. The client is emailed only when the TIME changes.
 */
async function moveAppt(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const b = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const id = String(b.id || "");
  if (!/^[A-Za-z0-9]{8,40}$/.test(id)) return res.status(400).json({ error: "Bad appointment id" });
  const cur = await ghlFetch<any>(`/calendars/events/appointments/${id}`, { version: "2021-04-15" }).catch(() => ({ ok: false } as any));
  const appt = cur.ok ? cur.body?.appointment || cur.body : null;
  if (!appt?.startTime) return res.status(404).json({ error: "Couldn't find that booking." });
  const status = String(appt.appointmentStatus || appt.appoinmentStatus || "").toLowerCase();
  if (["cancelled", "canceled", "noshow", "invalid"].includes(status)) return res.status(409).json({ error: "That booking is cancelled or a no-show." });

  const oldStart = Date.parse(appt.startTime), dur = Date.parse(appt.endTime) - oldStart;
  const newStart = b.startTime ? Date.parse(String(b.startTime)) : oldStart;
  if (Number.isNaN(newStart) || !(dur > 0)) return res.status(400).json({ error: "Bad time" });
  if (newStart !== oldStart && newStart < Date.now() - 30 * 60_000) return res.status(400).json({ error: "That time has already passed." });
  const fromUser = String(appt.assignedUserId || "");
  const toUser = String(b.userId || fromUser);
  if (!TEAM_BY_USER_ID.has(toUser)) return res.status(400).json({ error: "Unknown practitioner" });
  if (newStart === oldStart && toUser === fromUser) return res.json({ ok: true, unchanged: true });

  // The new practitioner must do this treatment (be on its GHL calendar)…
  if (toUser !== fromUser) {
    const cal = await ghlFetch<any>(`/calendars/${appt.calendarId}`, { version: "2021-04-15" }).catch(() => ({ ok: false } as any));
    const onIt = (cal.body?.calendar?.teamMembers || []).some((m: any) => m.userId === toUser);
    if (!onIt) return res.status(409).json({ error: `${TEAM_BY_USER_ID.get(toUser)} doesn't do this treatment, so it can't be moved to them.` });
  }
  // …and be free then (other bookings or blocked time), unless reception says "move anyway".
  const newEnd = newStart + dur;
  if (!b.force) {
    const [ev, bl] = await Promise.all([
      ghlFetch<any>(`/calendars/events?locationId=${LOC}&userId=${toUser}&startTime=${newStart - 86_400_000}&endTime=${newEnd + 86_400_000}`, { version: "2021-04-15" }).catch(() => ({ body: {} } as any)),
      ghlFetch<any>(`/calendars/blocked-slots?locationId=${LOC}&userId=${toUser}&startTime=${newStart - 86_400_000}&endTime=${newEnd + 86_400_000}`, { version: "2021-04-15" }).catch(() => ({ body: {} } as any)),
    ]);
    const clash = [...(ev.body?.events || []), ...(bl.body?.events || [])].find((e: any) =>
      e.id !== id && !["cancelled", "canceled", "noshow", "invalid"].includes(String(e.appointmentStatus || e.appoinmentStatus || "").toLowerCase()) &&
      Date.parse(e.startTime) < newEnd && Date.parse(e.endTime) > newStart);
    if (clash) return res.status(409).json({ clash: true, error: `${TEAM_BY_USER_ID.get(toUser)} is busy then (${clash.title || "booked"}, ${new Date(clash.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}).` });
  }

  const put = await ghlFetch<any>(`/calendars/events/appointments/${id}`, {
    method: "PUT", version: "2021-04-15",
    body: JSON.stringify({ startTime: new Date(newStart).toISOString(), endTime: new Date(newEnd).toISOString(), assignedUserId: toUser, ignoreFreeSlotValidation: true }),
  }).catch(() => ({ ok: false } as any));
  if (!put.ok) return res.status(502).json({ error: "GHL didn't accept the move. Nothing has changed." });

  const after = (await ghlFetch<any>(`/calendars/events/appointments/${id}`, { version: "2021-04-15" }).catch(() => ({ body: {} } as any))).body;
  const a2 = after?.appointment || after || {};
  const parsed = splitTitle(String(appt.title || ""));
  const svc = appt.calendarId ? findService(appt.calendarId) : undefined;
  const serviceName = svc?.name ?? parsed.service;
  const startIso = a2.startTime || new Date(newStart).toISOString();
  const endIso = a2.endTime || new Date(newEnd).toISOString();
  const userNow = String(a2.assignedUserId || toUser);
  await mirrorAppointmentSafe({ ghlId: id, ghlCalendarId: appt.calendarId || null, assignedUserId: userNow, serviceName, clientName: parsed.client, practitioner: TEAM_BY_USER_ID.get(userNow) || null, notes: appt.notes || null, startTime: startIso, endTime: endIso, status: "confirmed" } as any).catch(() => null);

  const c = appt.contactId ? (await ghlFetch<any>(`/contacts/${appt.contactId}`, { version: "2021-07-28" }).catch(() => ({ body: {} } as any))).body?.contact || {} : {};
  const notice = {
    contactId: appt.contactId || "", appointmentId: id, clientName: parsed.client, clientEmail: c.email || null, clientPhone: c.phone || null,
    serviceName, oldStartTime: appt.startTime, newStartTime: startIso, durationMins: Math.round(dur / 60_000),
    practitioner: TEAM_BY_USER_ID.get(userNow) || null, practitionerEmail: TEAM_EMAIL_BY_USER_ID.get(userNow) || null,
    previousPractitioner: TEAM_BY_USER_ID.get(fromUser) || null, previousPractitionerEmail: TEAM_EMAIL_BY_USER_ID.get(fromUser) || null,
    expectedDepositPence: null,
  };
  if (newStart !== oldStart) await notifyReschedule(notice as any).catch(() => null);
  else await Promise.all([sendRescheduledPractitionerAlert(notice as any).catch(() => false), sendAdminRescheduleAlert(notice as any).catch(() => false)]);

  res.json({ ok: true, id, startTime: startIso, endTime: endIso, practitioner: TEAM_BY_USER_ID.get(userNow) || null, clientEmailed: newStart !== oldStart && Boolean(appt.contactId) });
}

/** Block time (lunch, training, day off): not bookable online, shown on the dashboard and
 *  in the practitioner's own Google Calendar. */
async function blockTime(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const b = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const uid = String(b.userId || "");
  if (!TEAM_BY_USER_ID.has(uid)) return res.status(400).json({ error: "Pick a practitioner." });
  const s = Date.parse(String(b.startTime || "")), e = Date.parse(String(b.endTime || ""));
  if (!(e > s)) return res.status(400).json({ error: "The end must be after the start." });
  if (e < Date.now()) return res.status(400).json({ error: "That time has already passed." });
  if (e - s > 14 * 86_400_000) return res.status(400).json({ error: "Block at most two weeks at a time." });
  const reason = (typeof b.reason === "string" && b.reason.trim() ? b.reason.trim() : "Blocked").slice(0, 60);
  const title = reason === "Blocked" ? "Blocked" : `Blocked: ${reason}`;
  const r = await ghlFetch<any>(`/calendars/events/block-slots`, { method: "POST", version: "2021-04-15", body: JSON.stringify({ locationId: LOC, assignedUserId: uid, title, startTime: new Date(s).toISOString(), endTime: new Date(e).toISOString() }) }).catch(() => ({ ok: false } as any));
  const id = r.body?.id || r.body?.event?.id;
  if (!r.ok || !id) return res.status(502).json({ error: "GHL didn't accept the blocked time. Nothing was saved." });
  const google = await createBlockEvent({ blockId: id, title, startTime: new Date(s).toISOString(), endTime: new Date(e).toISOString(), practitioner: TEAM_BY_USER_ID.get(uid) || null, practitionerEmail: TEAM_EMAIL_BY_USER_ID.get(uid) || null });
  res.json({ ok: true, block: { id, startTime: new Date(s).toISOString(), endTime: new Date(e).toISOString(), practitioner: TEAM_BY_USER_ID.get(uid), title }, google });
}

async function unblockTime(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const b = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const id = String(b.id || "");
  if (!/^[A-Za-z0-9]{8,40}$/.test(id)) return res.status(400).json({ error: "Bad block id" });
  const r = await ghlFetch<any>(`/calendars/events/${encodeURIComponent(id)}`, { method: "DELETE", version: "2021-04-15" }).catch(() => ({ ok: false } as any));
  if (!r.ok) return res.status(502).json({ error: "GHL didn't remove it. Try again." });
  await deleteBlockEvent(id);
  res.json({ ok: true });
}

/** Never throws and never blocks reception: a failure here only means no referral bonus. */
async function awardReferralFirstVisit(appointmentId: string): Promise<boolean> {
  const secret = process.env.ORA_REFERRAL_SECRET;
  if (!secret || !DB_URL) return false;
  try {
    const a = await ghlFetch<any>(`/calendars/events/appointments/${appointmentId}`, { version: "2021-04-15" });
    const contactId = a.body?.appointment?.contactId || a.body?.contactId;
    if (!contactId) return false;
    const c = await ghlFetch<any>(`/contacts/${encodeURIComponent(contactId)}`, { version: "2021-07-28" });
    const email = c.body?.contact?.email;
    if (!email) return false;
    const r = await dbFetch("rpc/award_referral_first_visit", { method: "POST", body: JSON.stringify({ p_secret: secret, p_email: email }) });
    return r.ok ? (await r.json()) === true : (console.error("[referral] award failed:", r.status, await r.text()), false);
  } catch (e) {
    console.error("[referral] award threw:", e);
    return false;
  }
}

/** One client: contact details + their full visit history. */
async function client(req: VercelRequest, res: VercelResponse) {
  const cid = (req.query.contactId as string) || "";
  if (!cid) return res.status(400).json({ error: "contactId required" });
  if (!/^[A-Za-z0-9]{8,40}$/.test(cid)) return res.status(400).json({ error: "Bad contactId" });
  const [cR, aR, nR] = await Promise.all([
    ghlFetch<any>(`/contacts/${cid}`, { version: "2021-07-28" }).catch(() => ({ body: {} } as any)),
    ghlFetch<any>(`/contacts/${cid}/appointments`, { version: "2021-07-28" }).catch(() => ({ body: {} } as any)),
    ghlFetch<any>(`/contacts/${cid}/notes`, { version: "2021-07-28" }).catch(() => ({ body: {} } as any)),
  ]);
  const notes = (nR.body?.notes || [])
    .map((n: any) => ({ id: n.id, text: String(n.bodyText || String(n.body || "").replace(/<[^>]+>/g, " ")).trim(), date: n.dateAdded || null }))
    .filter((n: any) => n.text)
    .sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)));
  const c = cR.body?.contact || {};
  const evs = aR.body?.events || aR.body?.appointments || [];
  const appointments = evs
    .map((ev: any) => ({ id: ev.id, startTime: ev.startTime, service: splitTitle(String(ev.title || "")).service, practitioner: TEAM_BY_USER_ID.get(ev.assignedUserId) || null, status: ev.appointmentStatus || ev.appoinmentStatus || "confirmed" }))
    .sort((a: any, b: any) => String(b.startTime).localeCompare(String(a.startTime)));
  res.json({
    contact: { name: c.contactName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "—", email: c.email || null, phone: c.phone || null, tags: c.tags || [], since: c.dateAdded || null },
    appointments,
    notes,
  });
}

/** Find a client in GHL by name, phone or email (min 2 characters). Staff records are hidden. */
async function clientSearch(req: VercelRequest, res: VercelResponse) {
  const q = String(req.query.q || "").trim().slice(0, 80);
  if (q.length < 2) return res.json({ clients: [] });
  const r = await ghlFetch<any>(`/contacts/?locationId=${LOC}&query=${encodeURIComponent(q)}&limit=20`, { version: "2021-07-28" }).catch(() => ({ ok: false, body: {} } as any));
  if (!r.ok) return res.status(502).json({ error: "Couldn't search GHL just now." });
  const clients = (r.body?.contacts || [])
    .filter((c: any) => !(c.tags || []).includes("internal-team"))
    .map((c: any) => ({ id: c.id, name: c.contactName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "—", email: c.email || null, phone: c.phone || null, since: c.dateAdded || null }));
  res.json({ clients });
}

async function noteAdd(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const b = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const cid = String(b.contactId || ""), text = String(b.text || "").trim().slice(0, 2000);
  if (!/^[A-Za-z0-9]{8,40}$/.test(cid) || !text) return res.status(400).json({ error: "Write a note first." });
  const ok = await appendContactNote(cid, text).catch(() => false);
  if (!ok) return res.status(502).json({ error: "GHL didn't save the note. Try again." });
  res.json({ ok: true });
}

/** Recent website enquiries (GHL contacts tagged website-enquiry). */
async function enquiries(_req: VercelRequest, res: VercelResponse) {
  const r = await ghlFetch<any>(`/contacts/?locationId=${LOC}&query=&limit=50`, { version: "2021-07-28" }).catch(() => ({ body: {} } as any));
  const list = (r.body?.contacts || [])
    .filter((c: any) => (c.tags || []).some((t: string) => String(t).toLowerCase().includes("enquiry") || String(t).toLowerCase().includes("website")))
    .map((c: any) => ({ id: c.id, name: c.contactName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "—", email: c.email || null, phone: c.phone || null, tags: c.tags || [], since: c.dateAdded || null }))
    .sort((a: any, b: any) => String(b.since).localeCompare(String(a.since)))
    .slice(0, 30);
  res.json({ enquiries: list });
}

/** Recent conversation threads. */
async function conversations(_req: VercelRequest, res: VercelResponse) {
  const r = await ghlFetch<any>(`/conversations/search?locationId=${LOC}&limit=30&sort=desc&sortBy=last_message_date`, { version: "2021-04-15" }).catch(() => ({ body: {} } as any));
  const list = (r.body?.conversations || []).map((c: any) => ({
    id: c.id, contactId: c.contactId, name: c.contactName || c.fullName || "—",
    lastType: String(c.lastMessageType || "").replace("TYPE_", ""), snippet: String(c.lastMessageBody || "").slice(0, 120),
    date: c.lastMessageDate || null, unread: c.unreadCount || 0,
  }));
  res.json({ conversations: list });
}

/** Messages in one thread (oldest→newest). */
async function thread(req: VercelRequest, res: VercelResponse) {
  const id = (req.query.id as string) || "";
  if (!id) return res.status(400).json({ error: "id required" });
  const r = await ghlFetch<any>(`/conversations/${id}/messages`, { version: "2021-04-15" }).catch(() => ({ body: {} } as any));
  const msgs = ((r.body?.messages || {}).messages || []).map((m: any) => ({
    id: m.id, direction: m.direction, type: String(m.messageType || "").replace("TYPE_", ""), body: m.body || "", date: m.dateAdded,
  })).reverse();
  res.json({ messages: msgs });
}

/** Reply to a client by email (sends via GHL as the clinic). */
async function reply(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const contactId = String(body.contactId || "");
  const message = String(body.message || "").trim();
  if (!contactId || !message) return res.status(400).json({ error: "contactId and message required" });
  const html = message.replace(/\n/g, "<br>");
  const r = await ghlFetch<any>(`/conversations/messages`, {
    method: "POST", version: "2021-04-15",
    // always send from the clinic inbox (GHL otherwise picks its default sender)
    body: JSON.stringify({ type: "Email", contactId, html, subject: String(body.subject || "ORÁ Suites"), emailFrom: "ORÁ Suites <admin@orasuites.com>" }),
  }).catch(() => ({ ok: false, body: null } as any));
  if (!r.ok) return res.status(502).json({ error: "Could not send", detail: r.body });
  res.json({ ok: true, id: r.body?.messageId || r.body?.id || null });
}

/* ── Rota (dedicated ORÁ Supabase, PostgREST) ──────────────
   Locked 2026-09-28: no public access; read/write only via ora_rota_list / ora_rota_upsert
   (secret-gated, like renters). */
const DB_URL = process.env.ORA_DB_URL || "";
const DB_KEY = process.env.ORA_DB_ANON_KEY || "";
function dbFetch(path: string, init: RequestInit = {}) {
  return fetch(`${DB_URL}/rest/v1/${path}`, { ...init, headers: { apikey: DB_KEY, Authorization: `Bearer ${DB_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) } });
}

/** The weekly rota: every practitioner + their saved working hours per weekday. */
async function rota(_req: VercelRequest, res: VercelResponse) {
  if (!DB_URL || !RPC_SECRET) return res.status(503).json({ error: "Rota database not configured" });
  const team = Array.from(TEAM_BY_USER_ID.entries()).map(([userId, name]) => ({ userId, name }));
  let rows = await rotaRows();
  // First use: import everyone's current GHL working hours so the rota starts from the truth.
  const missing = team.filter((t) => !rows.some((r: any) => r.practitioner_user_id === t.userId));
  if (missing.length) {
    for (const t of missing) await seedFromGhl(t.userId, t.name);
    rows = await rotaRows();
  }
  res.json({ team, rota: rows });
}

/* ── Rota ⇄ GHL. The dashboard rota is the source of truth for working hours:
   each save rewrites that person's GHL "Work Hours" schedule and attaches every
   booking calendar they're on, so online slots + round-robin follow the rota. ── */
const DAY_NAME = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMinutes = (t: string) => { const [h, m] = String(t).split(":").map(Number); return h * 60 + (m || 0); };

async function rotaRows(uid?: string): Promise<any[]> {
  const r = await dbFetch("rpc/ora_rota_list", { method: "POST", body: JSON.stringify({ p_secret: RPC_SECRET, p_uid: uid ?? null }) }).catch(() => null);
  return r && r.ok ? await r.json() : [];
}
/** Upsert rota rows through the secret-gated function (the table has no public access). */
function rotaUpsert(rows: unknown) {
  return dbFetch("rpc/ora_rota_upsert", { method: "POST", body: JSON.stringify({ p_secret: RPC_SECRET, p_rows: rows }) }).catch(() => null);
}
async function ghlSchedule(uid: string): Promise<any | null> {
  const r = await ghlFetch<any>(`/calendars/schedules/search?locationId=${LOC}&userId=${uid}`, { version: "2021-04-15" }).catch(() => ({ ok: false } as any));
  return r.ok ? (r.body?.schedules || []).find((s: any) => !s.deleted) || null : null;
}
/** Write 7 rota rows for one person from their GHL schedule (days with no rule = off). No GHL writes. */
async function seedFromGhl(uid: string, name: string) {
  const sched = await ghlSchedule(uid);
  const rows = DAY_NAME.map((day, weekday) => {
    const rule = (sched?.rules || []).find((r: any) => r.type === "wday" && r.day === day && r.intervals?.length);
    const iv = rule?.intervals || [];
    return { practitioner_user_id: uid, practitioner_name: name, weekday, start_min: iv.length ? toMinutes(iv[0].from) : null, end_min: iv.length ? toMinutes(iv[iv.length - 1].to) : null, updated_at: new Date().toISOString() };
  });
  await rotaUpsert(rows);
}
/** Push one person's rota to GHL: weekly rules + attach all their booking calendars. */
async function syncToGhl(uid: string): Promise<{ ok: boolean; error?: string }> {
  const rows = await rotaRows(uid);
  const rules = rows
    .filter((r) => r.start_min != null && r.end_min != null && r.end_min > r.start_min)
    .sort((a, b) => a.weekday - b.weekday)
    .map((r) => ({ day: DAY_NAME[r.weekday], type: "wday", intervals: [{ from: hhmm(r.start_min), to: hhmm(r.end_min) }] }));
  const cals = await ghlFetch<any>(`/calendars/?locationId=${LOC}`, { version: "2021-04-15" }).catch(() => ({ ok: false } as any));
  if (!cals.ok) return { ok: false, error: "Couldn't reach GHL calendars" };
  const theirs: string[] = (cals.body?.calendars || []).filter((c: any) => (c.teamMembers || []).some((m: any) => m.userId === uid)).map((c: any) => c.id);
  const sched = await ghlSchedule(uid);
  if (!sched) {
    const r = await ghlFetch<any>(`/calendars/schedules`, { method: "POST", version: "2021-04-15", body: JSON.stringify({ locationId: LOC, userId: uid, name: "Work Hours", timezone: "Europe/London", rules, calendarIds: theirs }) }).catch(() => ({ ok: false } as any));
    return r.ok ? { ok: true } : { ok: false, error: "GHL refused the new schedule" };
  }
  const keep = (sched.rules || []).filter((r: any) => r.type !== "wday"); // one-off date overrides (holidays etc.)
  const calendarIds = Array.from(new Set([...(sched.calendarIds || []), ...theirs]));
  const r = await ghlFetch<any>(`/calendars/schedules/${sched.id}`, { method: "PUT", version: "2021-04-15", body: JSON.stringify({ rules: [...keep, ...rules], calendarIds }) }).catch(() => ({ ok: false } as any));
  return r.ok ? { ok: true } : { ok: false, error: "GHL refused the schedule update" };
}

/** Set one practitioner's hours for one weekday (upsert; null start = OFF). */
async function rotaSet(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!DB_URL) return res.status(503).json({ error: "Rota database not configured" });
  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const uid = String(body.practitioner_user_id || "");
  const weekday = Number(body.weekday);
  if (!uid || !(weekday >= 0 && weekday <= 6)) return res.status(400).json({ error: "practitioner_user_id and weekday (0-6) required" });
  const row = {
    practitioner_user_id: uid,
    practitioner_name: body.practitioner_name || TEAM_BY_USER_ID.get(uid) || null,
    weekday,
    start_min: body.start_min == null ? null : Number(body.start_min),
    end_min: body.end_min == null ? null : Number(body.end_min),
    updated_at: new Date().toISOString(),
  };
  if (row.start_min != null && (row.end_min == null || row.end_min <= row.start_min)) return res.status(400).json({ error: "Finish time must be after the start time." });
  // never sync a half-known week: import this person's GHL hours first if they have no rota yet
  if (!(await rotaRows(uid)).length) await seedFromGhl(uid, row.practitioner_name || "");
  const r = await rotaUpsert(row);
  if (!r || !r.ok) return res.status(502).json({ error: "Could not save rota", detail: r ? await r.text() : "no response" });
  const ghl = await syncToGhl(uid);
  res.json({ ok: true, ghl: ghl.ok, ghlError: ghl.error || null });
}

/* ── Renters (ORÁ Supabase; table has NO public access — only these
      secret-gated SECURITY DEFINER functions can read/write it) ────── */
const RPC_SECRET = process.env.ORA_DB_RPC_SECRET || "";
const PLANS = ["half-day", "full-day", "monthly", "other"];
const STATUSES = ["active", "paused", "ended"];
const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

async function renters(_req: VercelRequest, res: VercelResponse) {
  if (!DB_URL || !RPC_SECRET) return res.status(503).json({ error: "Renters database not configured" });
  const r = await dbFetch("rpc/ora_renters_list", { method: "POST", body: JSON.stringify({ p_secret: RPC_SECRET }) }).catch(() => null);
  if (!r || !r.ok) return res.status(502).json({ error: "Could not load renters" });
  res.json({ renters: await r.json() });
}

/** Create (no id) or update (id) one renter. Validated here before it reaches the DB. */
async function renterSet(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!DB_URL || !RPC_SECRET) return res.status(503).json({ error: "Renters database not configured" });
  const b = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const p = {
    id: str(b.id, 64),
    business: str(b.business, 120),
    contact_name: str(b.contact_name, 120),
    email: str(b.email, 200),
    phone: str(b.phone, 40),
    room: str(b.room, 60),
    plan: PLANS.includes(b.plan) ? b.plan : "monthly",
    rate: b.rate === "" || b.rate == null ? "" : String(Number(b.rate)),
    start_date: isDate(b.start_date) ? b.start_date : "",
    end_date: isDate(b.end_date) ? b.end_date : "",
    insurance_expiry: isDate(b.insurance_expiry) ? b.insurance_expiry : "",
    status: STATUSES.includes(b.status) ? b.status : "active",
    notes: str(b.notes, 2000),
  };
  if (!p.business) return res.status(400).json({ error: "Business name is required." });
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return res.status(400).json({ error: "That email doesn't look right." });
  if (p.rate !== "" && !(Number(p.rate) >= 0)) return res.status(400).json({ error: "Rate must be a positive number." });
  if (p.id && !/^[0-9a-f-]{36}$/i.test(p.id)) return res.status(400).json({ error: "Bad renter id" });
  const r = await dbFetch("rpc/ora_renter_upsert", { method: "POST", body: JSON.stringify({ p_secret: RPC_SECRET, p }) }).catch(() => null);
  if (!r || !r.ok) return res.status(502).json({ error: "Could not save renter" });
  res.json({ renter: await r.json() });
}

/* ── Blow-dry bundles ─────────────────────────────────────── */
async function bundles(_req: VercelRequest, res: VercelResponse) {
  const r = await listBundles();
  if (!r.ok) return res.status(502).json({ error: r.error });
  res.json({ bundles: r.data });
}

/** Sell a bundle at the desk from an appointment: paid now, and today's visit counted. */
async function bundleSell(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const b = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const offer = bundleOfferFor(str(b.calendarId, 64));
  const pick = bundleSize(offer, b.size);
  if (!offer || !pick) return res.status(400).json({ error: "Bundles only cover straight or curly blow-dries (short or long)." });
  // Contact details come from GHL (the appointment's contact), not from the browser.
  const contactId = str(b.contactId, 64);
  const c = contactId ? (await ghlFetch<any>(`/contacts/${encodeURIComponent(contactId)}`, { version: "2021-07-28" }).catch(() => ({ body: {} } as any))).body?.contact || {} : {};
  const clientName = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.contactName || str(b.clientName, 120);
  if (!clientName) return res.status(400).json({ error: "Client name is required." });
  const made = await createBundle({
    client_name: clientName, email: c.email || null, phone: c.phone || null, contact_id: contactId || null,
    size: pick.count, price: pick.price, source: "desk", paid: true, first_appointment_id: str(b.appointmentId, 64) || null,
    expiry_months: offer.expiryMonths,
  });
  if (!made.ok) return res.status(502).json({ error: made.error });
  const used = await bundleAction(made.data.id, "use", { appointment_id: str(b.appointmentId, 64) || null, service: str(b.service, 120) || null });
  const bundle = used.ok ? used.data : made.data;
  const emailed = await sendBundleEmail(bundle, "bought");
  res.json({ bundle, emailed, ...(used.ok ? {} : { warning: `Bundle sold, but today's visit wasn't counted: ${used.error}` }) });
}

/** paid | use | unuse | void on one bundle. Emails the client after a visit is counted. */
async function bundleAct(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const b = (typeof req.body === "string" ? safeJson(req.body) : req.body) || {};
  const id = String(b.id || "");
  const action = String(b.action || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "Bad bundle id" });
  if (!["paid", "use", "unuse", "void"].includes(action)) return res.status(400).json({ error: "Unknown bundle action" });
  if (action === "unuse" && !/^[0-9a-f-]{36}$/i.test(String(b.useId || ""))) return res.status(400).json({ error: "Bad visit id" });
  const p = {
    appointment_id: typeof b.appointmentId === "string" ? b.appointmentId.slice(0, 64) : null,
    service: typeof b.service === "string" ? b.service.slice(0, 120) : null,
    use_id: b.useId || null,
    expiry_months: BUNDLE_EXPIRY_MONTHS,
  };
  const r = await bundleAction(id, action as "paid" | "use" | "unuse" | "void", p);
  if (!r.ok) return res.status(400).json({ error: r.error });
  const emailed = action === "use" ? await sendBundleEmail(r.data, "used") : false;
  res.json({ bundle: r.data, emailed });
}

function safeJson(s: string): any { try { return JSON.parse(s); } catch { return {}; } }
