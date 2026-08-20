/**
 * /api/booking/reschedule — self-service "move my appointment".
 *
 *   GET  ?a=<appointmentId>&c=<contactId>&t=<token>
 *        Shows the current booking and every free slot for the SAME service
 *        over the next 14 days. Browsers get a page they can pick from;
 *        anything else gets JSON. Nothing is changed.
 *
 *   POST same query, body { slot: "<ISO start time>" }
 *        Moves it.
 *
 * AUTH: the same HMAC token as cancellation — see api/_lib/cancel-token.ts and
 * the note on rescheduleLinkFor(). One token, two routes.
 *
 * OWNER-CONFIRMED RULES:
 *   · TIME ONLY. The treatment never changes, so the deposit never has to be
 *     recalculated. Changing treatment is a cancel and a rebook, by a human.
 *   · The deposit CARRIES OVER. It is never refunded and never re-charged.
 *     This route therefore makes NO Stripe calls at all — the surest way not to
 *     move money is not to have the code that could.
 *   · The new slot must be within 14 DAYS of today.
 *   · The request must be made MORE THAN 24 HOURS before the CURRENT start.
 *     Same cliff as the refund rule, for the same reason: inside a day, an
 *     empty chair cannot be re-sold and a practitioner has already planned
 *     around it.
 *   · UNLIMITED reschedules. Someone who keeps moving a booking is still a
 *     customer who intends to come.
 *
 * ORDER OF OPERATIONS: GHL first, then the Google mirror, then the emails. If
 * GHL refuses, nothing at all has happened and the original booking stands —
 * which is the only failure state a customer can be told about honestly. If the
 * mirror or the emails fail afterwards, the booking HAS moved and saying
 * otherwise would be a lie; those steps are logged, not surfaced.
 *
 * WHY WE RE-READ THE APPOINTMENT AFTER THE PUT: GHL may hand a moved booking to
 * a different practitioner, because availability at the new time is not the
 * availability at the old one. The re-read gives us the authoritative new
 * times and assignee, so the practitioner emails go to whoever is actually
 * expected — and the practitioner who is no longer expected is told so.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ghlFetch } from "../_lib/ghl.js";
import { findService, depositPence } from "../_lib/catalogue.js";
import { verifyCancelToken } from "../_lib/cancel-token.js";
import { upsertEvent, isCancelled, TEAM_BY_USER_ID, TEAM_EMAIL_BY_USER_ID } from "../_lib/google-calendar.js";
import { serviceMetaForCalendar } from "../_lib/booking-notify.js";
import { notifyReschedule } from "../_lib/booking-notify-2.js";

export const config = { maxDuration: 60 };

/** Must be more than this many hours before the CURRENT start. */
export const RESCHEDULE_NOTICE_HOURS = 24;
/** The new slot must fall inside this many days from now. */
export const RESCHEDULE_WINDOW_DAYS = 14;
/** Enough for a fortnight of a busy calendar; keeps the page and the JSON sane. */
const MAX_SLOTS_SHOWN = 400;

interface Appointment {
  id: string;
  contactId?: string;
  calendarId?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  notes?: string;
  appointmentStatus?: string;
  appoinmentStatus?: string;
  assignedUserId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const q = req.query as Record<string, string | string[] | undefined>;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
  const appointmentId = one(q.a).trim();
  const contactId = one(q.c).trim();
  const token = one(q.t).trim();
  const wantsHtml = String(req.headers.accept || "").includes("text/html");

  const reply = (
    status: number,
    payload: Record<string, unknown>,
    page?: { title: string; lines: string[]; slots?: SlotChoice[] },
  ) => {
    if (wantsHtml && page) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(status).send(renderPage(page.title, page.lines, page.slots ? currentUrl(req) : undefined, page.slots));
    }
    return res.status(status).json(payload);
  };

  if (!appointmentId || !contactId) {
    return reply(400, { error: "This reschedule link is incomplete." }, {
      title: "Link incomplete",
      lines: ["This link is missing something. Please reply to your confirmation email and we'll move your appointment for you."],
    });
  }

  if (!verifyCancelToken(appointmentId, contactId, token)) {
    return reply(401, { error: "This reschedule link isn't valid or has expired." }, {
      title: "Link not valid",
      lines: ["This reschedule link isn't valid. Please reply to your confirmation email and we'll move your appointment for you."],
    });
  }

  /* ── Fetch the appointment ────────────────────────────── */
  const appt = await readAppointment(appointmentId);
  if (!appt) {
    return reply(404, { error: "We couldn't find that appointment." }, {
      title: "Appointment not found",
      lines: ["We couldn't find that appointment. It may already have been cancelled — reply to your confirmation email and we'll check."],
    });
  }

  const service = findService(appt.calendarId) ?? findService(stripClientFromTitle(appt.title));
  const serviceName = service?.name ?? stripClientFromTitle(appt.title) ?? "Your appointment";
  const oldStartTime = appt.startTime || "";
  const calendarId = appt.calendarId || service?.ghlCalendarId || "";
  /**
   * The catalogue is the only honest source for what the deposit IS. We never
   * look the payment up here, because we never touch it — see the header.
   * null = we could not identify the service, so we say nothing specific.
   */
  const expectedDepositPence = service ? depositPence(service.price) : null;

  if (isCancelled(appt.appointmentStatus ?? appt.appoinmentStatus)) {
    return reply(409, {
      error: "This appointment has already been cancelled.",
      appointmentId,
      alreadyCancelled: true,
    }, {
      title: "Already cancelled",
      lines: [
        `<strong>${escapeHtml(serviceName)}</strong> has already been cancelled, so there's nothing to move.`,
        `We'd love to see you — <a href="https://www.orasuites.com/book">book a new time</a>.`,
      ],
    });
  }

  /* ── The 24-hour rule ─────────────────────────────────── */
  const hoursUntil = oldStartTime ? (new Date(oldStartTime).getTime() - Date.now()) / 3_600_000 : Number.NaN;
  const tooLate = Number.isFinite(hoursUntil) ? hoursUntil <= RESCHEDULE_NOTICE_HOURS : true;

  if (tooLate) {
    const line = Number.isFinite(hoursUntil) && hoursUntil <= 0
      ? "This appointment has already passed, so it can't be moved online. Reply to your confirmation email and we'll book you a new time."
      : `This is within ${RESCHEDULE_NOTICE_HOURS} hours of your appointment, so it can't be moved online. Reply to your confirmation email or call the clinic and we'll do everything we can to help.`;
    return reply(409, {
      error: line,
      appointmentId,
      serviceName,
      startTime: oldStartTime,
      hoursUntilStart: Number.isFinite(hoursUntil) ? Math.round(hoursUntil * 10) / 10 : null,
      canReschedule: false,
      reason: "inside-notice-window",
      noticeHours: RESCHEDULE_NOTICE_HOURS,
    }, {
      title: "Too close to move online",
      lines: [
        `<strong>${escapeHtml(serviceName)}</strong>`,
        oldStartTime ? escapeHtml(formatWhen(oldStartTime)) : "",
        "",
        escapeHtml(line),
        `Your appointment is unchanged — nothing has happened.`,
      ].filter(Boolean),
    });
  }

  const windowEnd = new Date(Date.now() + RESCHEDULE_WINDOW_DAYS * 86_400_000);
  const durationMs = durationOf(appt, service?.duration ?? serviceMetaForCalendar(calendarId)?.duration ?? null);
  const durationMins = Math.round(durationMs / 60_000);

  /* ── GET: show what's free ────────────────────────────── */
  if (req.method === "GET") {
    const slots = await freeSlots(calendarId, new Date(), windowEnd);
    const choices = toChoices(slots, oldStartTime);

    if (!choices.length) {
      const line = `There's nothing free in the next ${RESCHEDULE_WINDOW_DAYS} days for this treatment. Reply to your confirmation email and we'll find you a time.`;
      return reply(200, {
        appointmentId,
        serviceName,
        startTime: oldStartTime,
        canReschedule: true,
        slots: [],
        windowDays: RESCHEDULE_WINDOW_DAYS,
        message: line,
      }, {
        title: "No times free just now",
        lines: [`<strong>${escapeHtml(serviceName)}</strong>`, escapeHtml(formatWhen(oldStartTime)), "", escapeHtml(line), "Your appointment is unchanged."],
      });
    }

    return reply(200, {
      appointmentId,
      serviceName,
      startTime: oldStartTime,
      durationMins,
      hoursUntilStart: Math.round(hoursUntil * 10) / 10,
      canReschedule: true,
      windowDays: RESCHEDULE_WINDOW_DAYS,
      noticeHours: RESCHEDULE_NOTICE_HOURS,
      windowEnds: windowEnd.toISOString(),
      slots: choices.map((c) => c.iso),
      depositPolicy: "Your deposit moves with the booking. It is never refunded and never re-charged.",
      expectedDepositPence,
      confirmWith: 'POST this same URL with { "slot": "<one of the slots above>" }.',
    }, {
      title: "Move your appointment",
      lines: [
        `<strong>${escapeHtml(serviceName)}</strong>`,
        `Currently ${escapeHtml(formatWhen(oldStartTime))}`,
        "",
        `Pick any time in the next ${RESCHEDULE_WINDOW_DAYS} days. Same treatment, same price — your deposit moves with it and you're never charged twice.`,
      ],
      slots: choices,
    });
  }

  /* ── POST: move it ────────────────────────────────────── */
  const wanted = readSlotFromBody(req.body);
  if (!wanted) {
    return reply(400, { error: "Please choose a time first." }, {
      title: "No time chosen",
      lines: ["Please go back and choose a time from the list.", "Your appointment is unchanged."],
    });
  }

  const wantedMs = Date.parse(wanted);
  if (!Number.isFinite(wantedMs)) {
    return reply(400, { error: "We didn't understand that time. Please pick one from the list." }, {
      title: "Time not recognised",
      lines: ["We didn't understand that time. Please go back and pick one from the list.", "Your appointment is unchanged."],
    });
  }

  if (wantedMs <= Date.now()) {
    return reply(409, { error: "That time is in the past. Please pick another." }, {
      title: "That time has passed",
      lines: ["That time is in the past. Please go back and pick another.", "Your appointment is unchanged."],
    });
  }

  if (wantedMs > windowEnd.getTime()) {
    const line = `We can only move bookings up to ${RESCHEDULE_WINDOW_DAYS} days ahead online. Please choose a time on or before ${formatWhen(windowEnd.toISOString())}, or reply to your confirmation email and we'll find you something further out.`;
    return reply(409, {
      error: line,
      reason: "outside-window",
      windowDays: RESCHEDULE_WINDOW_DAYS,
      windowEnds: windowEnd.toISOString(),
    }, {
      title: "That's too far ahead",
      lines: [escapeHtml(line), "Your appointment is unchanged."],
    });
  }

  // Re-check availability at the moment of the move, not at the moment the page
  // was rendered. Two people can be looking at the same slot.
  const slots = await freeSlots(calendarId, new Date(), windowEnd);
  const stillFree = slots.some((iso) => Date.parse(iso) === wantedMs);
  if (!stillFree) {
    const line = "Sorry — that time was taken while you were choosing. Please go back and pick another.";
    return reply(409, { error: line, reason: "slot-taken" }, {
      title: "That time has gone",
      lines: [escapeHtml(line), "Your appointment is unchanged."],
    });
  }

  const newStartTime = slots.find((iso) => Date.parse(iso) === wantedMs) as string;
  const newEndTime = shiftIsoKeepingOffset(newStartTime, durationMs);

  const previousUserId = appt.assignedUserId || "";

  /* 1 ─ GHL is the source of truth. If this fails, nothing has changed. */
  const moved = await ghlFetch<any>(`/calendars/events/appointments/${encodeURIComponent(appointmentId)}`, {
    method: "PUT",
    version: "2021-04-15",
    body: JSON.stringify({ startTime: newStartTime, endTime: newEndTime }),
  }).catch((err) => {
    console.error("[reschedule] GHL move threw:", String(err).slice(0, 200));
    return { ok: false, status: 0, body: null } as const;
  });

  if (!moved.ok) {
    console.error("[reschedule] GHL move failed:", moved.status, JSON.stringify(moved.body).slice(0, 300));
    const line = "We couldn't move that just now, and nothing has been changed — your original appointment still stands. Please reply to your confirmation email and we'll move it for you.";
    return reply(502, { error: line, moved: false }, { title: "Couldn't move it", lines: [escapeHtml(line)] });
  }

  /* 2 ─ Re-read: GHL may have reassigned the practitioner, and it is the
   *     authority on the times that actually landed. */
  const after = (await readAppointment(appointmentId)) ?? appt;
  const confirmedStart = after.startTime || newStartTime;
  const confirmedEnd = after.endTime || newEndTime;
  const newUserId = after.assignedUserId || previousUserId;

  /* 3 ─ Move the Google mirror. SAME ghlId, so upsertEvent finds the existing
   *     event and updates it in place rather than leaving a ghost at the old
   *     time. Non-fatal. */
  const mirror = await upsertEvent({
    ghlId: appointmentId,
    ghlCalendarId: calendarId || null,
    serviceName,
    clientName: stripServiceFromTitle(after.title) ?? stripServiceFromTitle(appt.title) ?? null,
    practitioner: (newUserId && TEAM_BY_USER_ID.get(newUserId)) || null,
    assignedUserId: newUserId || null,
    notes: after.notes ?? appt.notes ?? null,
    startTime: confirmedStart,
    endTime: confirmedEnd,
    status: "confirmed",
  }).catch((err) => {
    console.error("[reschedule] google mirror move failed:", String(err).slice(0, 160));
    return { action: "failed" as const };
  });
  if (mirror.action === "failed") {
    console.error(`[reschedule] appointment ${appointmentId} MOVED in GHL but the Google mirror did not follow. The 03:00 reconciler will fix it.`);
  }

  /* 4 ─ Tell everyone. Non-fatal — the booking has already moved. */
  const brief = await contactBrief(contactId);
  await notifyReschedule({
    contactId,
    appointmentId,
    clientName: stripServiceFromTitle(after.title) ?? stripServiceFromTitle(appt.title) ?? "there",
    clientEmail: brief.email ?? null,
    clientPhone: brief.phone ?? null,
    serviceName,
    oldStartTime,
    newStartTime: confirmedStart,
    durationMins,
    practitioner: (newUserId && TEAM_BY_USER_ID.get(newUserId)) || null,
    practitionerEmail: (newUserId && TEAM_EMAIL_BY_USER_ID.get(newUserId)) || null,
    previousPractitioner: (previousUserId && TEAM_BY_USER_ID.get(previousUserId)) || null,
    previousPractitionerEmail: (previousUserId && TEAM_EMAIL_BY_USER_ID.get(previousUserId)) || null,
    expectedDepositPence,
  }).catch(() => null);

  const depositLine =
    expectedDepositPence === null
      ? "Anything you've already paid stays against this booking — nothing has been refunded and you won't be charged again."
      : expectedDepositPence > 0
        ? `Your deposit moves with your booking — it hasn't been refunded and you won't be charged again.`
        : "There's no deposit on this booking, so there's nothing to move.";

  console.log(`[reschedule] appointment ${appointmentId} moved ${oldStartTime} → ${confirmedStart}. Deposit untouched.`);

  return reply(200, {
    success: true,
    moved: true,
    appointmentId,
    serviceName,
    previousStartTime: oldStartTime,
    startTime: confirmedStart,
    endTime: confirmedEnd,
    durationMins,
    practitioner: (newUserId && TEAM_BY_USER_ID.get(newUserId)) || null,
    practitionerChanged: Boolean(previousUserId && newUserId && previousUserId !== newUserId),
    depositTouched: false,
    expectedDepositPence,
    mirror: mirror.action,
    message: `Your appointment has been moved to ${formatWhen(confirmedStart)}. ${depositLine}`,
  }, {
    title: "Appointment moved",
    lines: [
      `<strong>${escapeHtml(serviceName)}</strong> is now on`,
      `<strong>${escapeHtml(formatWhen(confirmedStart))}</strong>`,
      "",
      escapeHtml(depositLine),
      "We've emailed you a confirmation. See you then.",
    ],
  });
}

/* ── helpers ─────────────────────────────────────────────── */

/** Single-appointment read. Never throws. */
async function readAppointment(appointmentId: string): Promise<Appointment | null> {
  try {
    const got = await ghlFetch<any>(`/calendars/events/appointments/${encodeURIComponent(appointmentId)}`, { version: "2021-04-15" });
    const ev = got.body?.event ?? got.body?.appointment ?? got.body;
    if (got.ok && ev?.id) return ev as Appointment;
    console.error("[reschedule] appointment lookup failed:", got.status, JSON.stringify(got.body).slice(0, 300));
  } catch (err) {
    console.error("[reschedule] appointment lookup threw:", String(err).slice(0, 200));
  }
  return null;
}

/**
 * Free slots for one service calendar, exactly as api/ghl/slots.ts asks for
 * them (ms epochs, Europe/London). GHL answers with
 * `{ "2026-09-02": { slots: [...] }, traceId: "…" }`, so anything without a
 * `slots` array is skipped. Never throws — an empty list is a safe answer.
 */
export async function freeSlots(calendarId: string, from: Date, to: Date): Promise<string[]> {
  if (!calendarId) return [];
  try {
    const qs = `startDate=${from.getTime()}&endDate=${to.getTime()}&timezone=Europe%2FLondon`;
    const got = await ghlFetch<any>(`/calendars/${encodeURIComponent(calendarId)}/free-slots?${qs}`, { version: "2021-04-15" });
    if (!got.ok) {
      console.error("[reschedule] free-slots failed:", got.status, JSON.stringify(got.body).slice(0, 240));
      return [];
    }
    const out: string[] = [];
    for (const value of Object.values(got.body ?? {})) {
      const list = (value as { slots?: unknown })?.slots;
      if (Array.isArray(list)) for (const s of list) if (typeof s === "string") out.push(s);
    }
    return out.sort((a, b) => Date.parse(a) - Date.parse(b));
  } catch (err) {
    console.error("[reschedule] free-slots threw:", String(err).slice(0, 200));
    return [];
  }
}

export interface SlotChoice {
  iso: string;
  /** "Tue 2 Sep" */
  day: string;
  /** "13:45" */
  time: string;
}

/** Drop anything unparseable, in the past, or equal to where they already are. */
export function toChoices(slots: string[], currentStart: string): SlotChoice[] {
  const now = Date.now();
  const currentMs = Date.parse(currentStart);
  const seen = new Set<number>();
  const out: SlotChoice[] = [];
  for (const iso of slots) {
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms) || ms <= now) continue;
    if (Number.isFinite(currentMs) && ms === currentMs) continue;
    if (seen.has(ms)) continue;
    seen.add(ms);
    const d = new Date(ms);
    out.push({
      iso,
      day: new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" }).format(d),
      time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London" }).format(d),
    });
    if (out.length >= MAX_SLOTS_SHOWN) break;
  }
  return out;
}

/** How long the booking runs: what was actually booked, else the catalogue, else an hour. */
export function durationOf(appt: { startTime?: string; endTime?: string }, catalogueMins: number | null): number {
  const s = Date.parse(appt.startTime || "");
  const e = Date.parse(appt.endTime || "");
  if (Number.isFinite(s) && Number.isFinite(e) && e > s) return e - s;
  const mins = catalogueMins && catalogueMins > 0 ? catalogueMins : 60;
  return mins * 60_000;
}

/**
 * Add `ms` to an ISO time and render the result in the SAME UTC offset it came
 * in with. GHL hands us `2026-09-02T13:45:00+01:00`; handing back a `Z` time
 * for the end would be correct to the instant but visibly inconsistent in
 * their UI, and mixed formats in one payload are exactly the sort of thing an
 * API validates on. Same instant, same shape.
 */
export function shiftIsoKeepingOffset(iso: string, ms: number): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const m = /([+-]\d{2}:\d{2}|Z)$/.exec(iso);
  const offset = m ? m[1] : null;
  if (!offset || offset === "Z") return new Date(t + ms).toISOString();

  const sign = offset[0] === "-" ? -1 : 1;
  const [oh, om] = offset.slice(1).split(":").map(Number);
  const shifted = new Date(t + ms + sign * (oh * 60 + om) * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${shifted.getUTCFullYear()}-${p(shifted.getUTCMonth() + 1)}-${p(shifted.getUTCDate())}` +
    `T${p(shifted.getUTCHours())}:${p(shifted.getUTCMinutes())}:${p(shifted.getUTCSeconds())}${offset}`
  );
}

/** The chosen slot, from a JSON body or an HTML form post. */
function readSlotFromBody(body: unknown): string {
  if (!body) return "";
  if (typeof body === "string") {
    try {
      return readSlotFromBody(JSON.parse(body));
    } catch {
      return new URLSearchParams(body).get("slot")?.trim() || "";
    }
  }
  const v = (body as Record<string, unknown>).slot;
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim();
  return "";
}

/** Best-effort contact details for the admin copy only. Never throws. */
async function contactBrief(contactId: string): Promise<{ email?: string | null; phone?: string | null }> {
  try {
    const got = await ghlFetch<any>(`/contacts/${encodeURIComponent(contactId)}`, { version: "2021-07-28" });
    const c = got.body?.contact ?? got.body;
    return got.ok && c ? { email: c.email ?? null, phone: c.phone ?? null } : {};
  } catch {
    return {};
  }
}

/**
 * Booking titles are `${serviceName} — ${clientName}`.
 *
 * Split on the LAST separator, not the first: real service names contain one
 * ("Anti-Wrinkle Injections — 1 Area"), so splitting on the first turns that
 * client into "1 Area — Ada Lovelace" in every email reception reads. Client
 * names do not contain " — ". (api/booking/cancel.ts still splits on the
 * first — same latent bug, left alone rather than edited from here.)
 */
function stripClientFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const i = title.lastIndexOf(" — ");
  return i > 0 ? title.slice(0, i) : title;
}
function stripServiceFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const i = title.lastIndexOf(" — ");
  return i > 0 ? title.slice(i + 3) : undefined;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/London", hour12: false,
  }).format(d);
}

function currentUrl(req: VercelRequest): string {
  return req.url || "";
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/**
 * A small, self-contained page in the ORÁ palette — same shell as the cancel
 * page, because they are reached the same way (straight from an email, on a
 * phone, with no stylesheet and no framework available).
 */
function renderPage(title: string, lines: string[], action?: string, slots?: SlotChoice[]): string {
  const body = lines.map((l) => (l ? `<p>${l}</p>` : '<div class="sp"></div>')).join("");

  let form = `<p class="fine"><a href="https://www.orasuites.com/book">Book another time</a></p>`;
  if (action && slots?.length) {
    const byDay = new Map<string, SlotChoice[]>();
    for (const s of slots) {
      const list = byDay.get(s.day) ?? [];
      list.push(s);
      byDay.set(s.day, list);
    }
    const groups = Array.from(byDay.entries())
      .map(
        ([day, list]) =>
          `<fieldset><legend>${escapeHtml(day)}</legend><div class="times">` +
          list
            .map(
              (s) =>
                `<label><input type="radio" name="slot" value="${escapeHtml(s.iso)}" required><span>${escapeHtml(s.time)}</span></label>`,
            )
            .join("") +
          `</div></fieldset>`,
      )
      .join("");

    form = `<form method="POST" action="${escapeHtml(action)}">
        ${groups}
        <button type="submit">Move my appointment</button>
      </form>
      <p class="fine">Changed your mind? Just close this page — nothing has happened yet.</p>`;
  }

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(title)} — ORÁ Suites</title>
<style>
  :root{--milk:#fffdf9;--sand:#f4efe8;--bone:#eae2d7;--deep:#1a1008;--fog:#8a7d72;--bronze:#b98867}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px 20px;
       background:radial-gradient(120% 90% at 50% 0%,var(--sand),#efe7dd);
       color:var(--deep);font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
       font-size:15px;line-height:1.55}
  .card{width:100%;max-width:34rem;padding:36px 32px;border:1px solid var(--bone);border-radius:20px;
        background:rgba(255,253,249,.72);backdrop-filter:blur(24px);box-shadow:0 24px 60px -32px rgba(26,16,8,.35)}
  .eyebrow{margin:0 0 14px;color:var(--bronze);font-size:11px;letter-spacing:.25em;text-transform:uppercase}
  h1{margin:0 0 18px;font-family:"Playfair Display",Georgia,serif;font-weight:400;font-size:clamp(1.6rem,4vw,2rem);
     line-height:1.15;letter-spacing:-.01em}
  p{margin:0 0 10px}
  .sp{height:10px}
  fieldset{margin:18px 0 0;padding:0;border:0;border-top:1px solid var(--bone)}
  legend{padding:0 10px 0 0;color:var(--fog);font-size:11px;letter-spacing:.22em;text-transform:uppercase}
  .times{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
  .times label{position:relative}
  .times input{position:absolute;inset:0;opacity:0;cursor:pointer;margin:0;width:100%;height:100%}
  .times span{display:block;padding:9px 14px;border:1px solid var(--bone);border-radius:999px;
              background:rgba(255,253,249,.7);font-variant-numeric:tabular-nums;transition:all .18s}
  .times input:hover+span{border-color:var(--bronze)}
  .times input:focus-visible+span{outline:2px solid var(--bronze);outline-offset:2px}
  .times input:checked+span{background:var(--deep);border-color:var(--deep);color:var(--milk)}
  button{margin-top:24px;width:100%;padding:14px 20px;border:0;border-radius:999px;background:var(--deep);color:var(--milk);
         font:inherit;font-size:.9375rem;letter-spacing:.01em;cursor:pointer;transition:transform .2s,opacity .2s}
  button:hover{transform:translateY(-1px);opacity:.92}
  .fine{margin-top:16px;color:var(--fog);font-size:.8125rem}
  a{color:var(--bronze)}
</style></head><body>
<main class="card">
  <p class="eyebrow">ORÁ Suites</p>
  <h1>${escapeHtml(title)}</h1>
  ${body}
  ${form}
</main></body></html>`;
}
