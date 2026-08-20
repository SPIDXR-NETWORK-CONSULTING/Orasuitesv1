/**
 * Booking notifications, part two: RESCHEDULES and NO-SHOWS.
 *
 * WHY A SECOND FILE: booking-notify.ts is being edited concurrently, and two
 * sessions rewriting the same 570-line module is how a working notification
 * path gets lost. Everything new lives here instead. The two files are peers,
 * not layers — this one owns "the booking moved" and "the client didn't turn
 * up"; booking-notify.ts still owns bookings and cancellations.
 *
 * The small presentation helpers (escapeHtml / when / opsEmail / the staff
 * contact lookup) are re-implemented here rather than imported, because they
 * are private in booking-notify.ts and exporting them would mean editing the
 * file another session is holding. They are deliberate copies: if the ORÁ ops
 * email style changes, change it in both.
 *
 * Every function is non-throwing. A notification failure must never fail a
 * reschedule, and must never stop a no-show deposit being kept.
 */
import { ghlFetch, sendAdminEmail, ADMIN_EMAIL } from "./ghl.js";
import { formatPence } from "./catalogue.js";
import { rescheduleLinkFor } from "./cancel-token.js";

const ADDRESS = "ORÁ Suites, 49 Deansgate, Manchester M3 2AY";
const SIGNOFF = `<br><br>With love,<br>The ORÁ Suites team<br><a href="mailto:admin@orasuites.com">admin@orasuites.com</a>`;

/* ── local copies of booking-notify.ts's private helpers ─── */

function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** "Tuesday, 2 September, 13:45" in clinic time. */
export function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/London", hour12: false,
  }).format(d);
}

/** The ORÁ palette, inline — these render inside a GHL conversation. */
function opsEmail(eyebrow: string, heading: string, rows: [string, string][], blocks: { label: string; text: string }[] = []): string {
  const trs = rows
    .filter(([, v]) => v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 14px 8px 0;color:#8a7d72;font-size:12px;letter-spacing:.14em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td>` +
        `<td style="padding:8px 0;color:#1a1008;font-size:15px">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const extra = blocks
    .filter((b) => b.text.trim())
    .map(
      (b) =>
        `<p style="margin:18px 0 6px;color:#8a7d72;font-size:12px;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(b.label)}</p>` +
        `<div style="padding:14px 16px;background:#f4efe8;border-radius:12px;color:#1a1008;font-size:15px;line-height:1.6">${escapeHtml(b.text).replace(/\n/g, "<br/>")}</div>`,
    )
    .join("");

  return `<div style="margin:0;background:#f4efe8;padding:28px 16px;font-family:Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#fffdf9;border:1px solid #e6dccf;border-radius:16px">
    <tr><td style="padding:26px 30px 6px">
      <p style="margin:0 0 6px;color:#b98867;font-size:11px;letter-spacing:.25em;text-transform:uppercase">ORÁ Suites · ${escapeHtml(eyebrow)}</p>
      <h1 style="margin:0;color:#1a1008;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;line-height:1.2">${escapeHtml(heading)}</h1>
    </td></tr>
    <tr><td style="padding:10px 30px 0"><table role="presentation" cellspacing="0" cellpadding="0">${trs}</table></td></tr>
    <tr><td style="padding:0 30px 26px">${extra}
      <p style="margin:20px 0 0;color:#8a7d72;font-size:12px">Manage this in GHL → Calendars, or Opportunities → Online Bookings. Sent automatically by the ORÁ booking system.</p>
    </td></tr>
  </table></div>`;
}

/**
 * Find (or create) the lightweight internal-team contact that carries a
 * practitioner's work email, so we can email them through GHL conversations.
 * Mirrors the private resolveStaffContactId() in booking-notify.ts exactly.
 */
async function resolveStaffContactId(email: string, displayName?: string | null): Promise<string | undefined> {
  const locationId = process.env.GHL_LOCATION_ID;

  const found = await ghlFetch(
    `/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}`,
    { version: "2021-07-28" },
  );
  const existing: string | undefined = found.ok
    ? found.body?.contacts?.find((c: any) => (c.email || "").toLowerCase() === email.toLowerCase())?.id
    : undefined;
  if (existing) return existing;

  const created = await ghlFetch("/contacts/upsert", {
    method: "POST",
    version: "2021-07-28",
    body: JSON.stringify({
      locationId,
      firstName: (displayName || "ORÁ").split(" ")[0],
      lastName: "(team)",
      email,
      tags: ["internal-team"],
    }),
  });
  return created.body?.contact?.id;
}

/* ── the line the confirmation email needs ───────────────── */

/**
 * The "move your appointment" sentence for the customer's CONFIRMATION email,
 * ready to drop into sendClientConfirmation()'s line array in
 * booking-notify.ts. Returns "" when we cannot sign a link, so the array's
 * existing `.filter(Boolean)` removes it and nothing breaks.
 *
 * It replaces the old "reply to this email to move your appointment" line: a
 * customer who can move themselves should not be asked to write to us, and the
 * deposit promise is the same either way.
 */
export function rescheduleLine(
  appointmentId: string | null | undefined,
  contactId: string | null | undefined,
  depositPence?: number | null,
): string {
  const url = appointmentId && contactId ? rescheduleLinkFor(appointmentId, contactId) : null;
  const paid = typeof depositPence === "number" && depositPence > 0;
  if (!url) {
    return `Need a different time? Reply to this email${paid ? " — your deposit moves with your booking" : ""} and we'll move it for you.`;
  }
  return (
    `Need a different time? <a href="${url}">Move this appointment</a> — pick any free slot in the next 14 days.` +
    (paid ? ` Your ${formatPence(depositPence!)} deposit moves with it; it isn't refunded and you're never charged twice.` : "")
  );
}

/* ── Reschedules ─────────────────────────────────────────── */

export interface RescheduleNotice {
  contactId: string;
  appointmentId?: string | null;
  clientName: string;
  /** Admin copy only — reception may want to ring them. */
  clientEmail?: string | null;
  clientPhone?: string | null;
  serviceName: string;
  /** ISO with offset — where the booking WAS. */
  oldStartTime: string;
  /** ISO with offset — where the booking IS now. */
  newStartTime: string;
  durationMins?: number | null;
  /** Practitioner assigned AFTER the move (GHL may reassign on a time change). */
  practitioner?: string | null;
  practitionerEmail?: string | null;
  /**
   * Practitioner assigned BEFORE the move. When GHL hands the booking to
   * somebody else, the original practitioner still has to be told their slot
   * is free — otherwise they come in for a client who is now with a colleague.
   */
  previousPractitioner?: string | null;
  previousPractitionerEmail?: string | null;
  /**
   * What the CATALOGUE says the deposit is, in pence. A reschedule never moves
   * money, so this is only ever used to reassure the customer that it stays put.
   *   > 0   → "your £X deposit moves with your booking"
   *   0     → complimentary; no deposit sentence at all
   *   null  → service unidentified; we say nothing specific about the amount
   */
  expectedDepositPence?: number | null;
}

/** How we describe the money on a reschedule. It is never touched. */
function depositSentence(expectedDepositPence?: number | null): string {
  if (expectedDepositPence === 0) return "";
  if (typeof expectedDepositPence === "number" && expectedDepositPence > 0) {
    return `Your ${formatPence(expectedDepositPence)} deposit moves with your booking — it hasn't been refunded and you won't be charged again.`;
  }
  return "Anything you've already paid stays against this booking — nothing has been refunded and you won't be charged again.";
}

/** Client-facing "your booking moved" email. Never throws. */
export async function sendRescheduleClientEmail(r: RescheduleNotice): Promise<boolean> {
  const first = (r.clientName || "there").trim().split(" ")[0];
  const money = depositSentence(r.expectedDepositPence);

  const html = [
    `Hi ${escapeHtml(first)},`,
    ``,
    `Your appointment at ORÁ Suites has been moved.`,
    ``,
    `<b>Treatment:</b> ${escapeHtml(r.serviceName)}`,
    `<b>New date &amp; time:</b> ${escapeHtml(when(r.newStartTime))}`,
    `<b>Was:</b> ${escapeHtml(when(r.oldStartTime))}`,
    r.durationMins ? `<b>Duration:</b> ${r.durationMins} minutes` : "",
    `<b>Your practitioner:</b> ${escapeHtml(r.practitioner || "assigned — we'll confirm shortly")}`,
    `<b>Where:</b> ${escapeHtml(ADDRESS)}`,
    ``,
    money,
    ``,
    rescheduleLine(r.appointmentId, r.contactId, r.expectedDepositPence),
  ].filter(Boolean).join("<br>") + SIGNOFF;

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: r.contactId,
      subject: `Booking moved — ${r.serviceName}, ${when(r.newStartTime)}`,
      html,
    }),
  });
  if (!res.ok) console.error("[booking-notify-2] reschedule client email failed:", res.status, JSON.stringify(res.body).slice(0, 300));
  return res.ok;
}

/**
 * The practitioner's copy. States BOTH halves explicitly — the old slot is
 * free, the new slot is booked — because a practitioner who reads only the new
 * time will still block out the old one, and a practitioner who reads only
 * "cancelled" will not turn up at all.
 */
export async function sendRescheduledPractitionerAlert(r: RescheduleNotice): Promise<boolean> {
  if (!r.practitionerEmail) return false;
  const staffContactId = await resolveStaffContactId(r.practitionerEmail, r.practitioner);
  if (!staffContactId) return false;

  const html = [
    `A booking in your diary has moved to a new time.`,
    ``,
    `<b>Client:</b> ${escapeHtml(r.clientName || "—")}`,
    `<b>Treatment:</b> ${escapeHtml(r.serviceName)}`,
    `<b>New time (BOOKED):</b> ${escapeHtml(when(r.newStartTime))}${r.durationMins ? ` (${r.durationMins} min)` : ""}`,
    `<b>Old time (NOW FREE):</b> ${escapeHtml(when(r.oldStartTime))}`,
    ``,
    `<b>You are no longer expected at ${escapeHtml(when(r.oldStartTime))} — that slot is free. You are expected at ${escapeHtml(when(r.newStartTime))}.</b>`,
    `Your ORÁ calendar and your Google Calendar have both been updated.`,
  ].filter(Boolean).join("<br>");

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: staffContactId,
      subject: `Rescheduled — ${r.serviceName}, ${when(r.newStartTime)}`,
      html,
    }),
  });
  if (!res.ok) console.error("[booking-notify-2] reschedule practitioner alert failed:", res.status, JSON.stringify(res.body).slice(0, 300));
  return res.ok;
}

/**
 * Only when GHL reassigns the booking on the time change: tell the ORIGINAL
 * practitioner their slot is free and the client is now somebody else's.
 */
async function sendHandedOverAlert(r: RescheduleNotice): Promise<boolean> {
  const email = r.previousPractitionerEmail;
  if (!email || email.toLowerCase() === (r.practitionerEmail || "").toLowerCase()) return false;
  const staffContactId = await resolveStaffContactId(email, r.previousPractitioner);
  if (!staffContactId) return false;

  const html = [
    `A booking has been moved out of your diary.`,
    ``,
    `<b>Client:</b> ${escapeHtml(r.clientName || "—")}`,
    `<b>Treatment:</b> ${escapeHtml(r.serviceName)}`,
    `<b>Was in your diary at:</b> ${escapeHtml(when(r.oldStartTime))}`,
    `<b>Now booked with:</b> ${escapeHtml(r.practitioner || "another practitioner")} at ${escapeHtml(when(r.newStartTime))}`,
    ``,
    `<b>That slot is now free — you are no longer expected for this appointment.</b>`,
  ].filter(Boolean).join("<br>");

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: staffContactId,
      subject: `Moved out of your diary — ${r.serviceName}, ${when(r.oldStartTime)}`,
      html,
    }),
  });
  if (!res.ok) console.error("[booking-notify-2] handover alert failed:", res.status, JSON.stringify(res.body).slice(0, 300));
  return res.ok;
}

/** Reception's copy of a reschedule, to admin@orasuites.com. Never throws. */
export async function sendAdminRescheduleAlert(r: RescheduleNotice): Promise<boolean> {
  const rows: [string, string][] = [
    ["Client", r.clientName || "—"],
    ["Email", r.clientEmail || "—"],
    ["Phone", r.clientPhone || "—"],
    ["Treatment", r.serviceName],
    ["Was booked for", when(r.oldStartTime)],
    ["Now booked for", when(r.newStartTime)],
    ["Duration", r.durationMins ? `${r.durationMins} minutes` : "not set"],
    ["Practitioner", r.practitioner || "unassigned"],
    [
      "Practitioner changed",
      r.previousPractitioner && r.previousPractitioner !== r.practitioner ? `yes — was ${r.previousPractitioner}` : "",
    ],
    [
      "Deposit",
      typeof r.expectedDepositPence === "number" && r.expectedDepositPence > 0
        ? `UNCHANGED ${formatPence(r.expectedDepositPence)} — carried to the new time. Not refunded, not re-charged.`
        : r.expectedDepositPence === 0
          ? "None on this booking (complimentary)."
          : "UNCHANGED — no money was moved by this reschedule.",
    ],
    ["Moved by", "the customer, via the link in their confirmation email"],
    ["Appointment ID", r.appointmentId || "—"],
  ];

  const html = opsEmail("Reschedule", `${r.serviceName} — ${r.clientName}`, rows, [
    {
      label: "What changed on the floor",
      text: `${when(r.oldStartTime)} is now FREE — offer it to someone else.\n${when(r.newStartTime)} is now BOOKED.`,
    },
  ]);

  const res = await sendAdminEmail(`Rescheduled — ${r.serviceName} — ${when(r.oldStartTime)} → ${when(r.newStartTime)}`, html);
  if (!res.ok) console.error("[booking-notify-2] admin reschedule alert failed:", res.status, JSON.stringify(res.body).slice(0, 300));
  return res.ok;
}

/**
 * Everything a reschedule must trigger, in parallel; never throws.
 *   · client        — the new time, and that the deposit is untouched
 *   · practitioner  — old slot free, new slot booked
 *   · previous practitioner — only if GHL reassigned the booking
 *   · admin         — reception's copy
 */
export async function notifyReschedule(
  r: RescheduleNotice,
): Promise<{ client: boolean; practitioner: boolean; admin: boolean; handover: boolean }> {
  const [client, practitioner, admin, handover] = await Promise.all([
    (r.contactId ? sendRescheduleClientEmail(r) : Promise.resolve(false)).catch((e) => {
      console.error("[booking-notify-2] reschedule client:", e);
      return false;
    }),
    sendRescheduledPractitionerAlert(r).catch((e) => {
      console.error("[booking-notify-2] reschedule practitioner:", e);
      return false;
    }),
    sendAdminRescheduleAlert(r).catch((e) => {
      console.error("[booking-notify-2] reschedule admin:", e);
      return false;
    }),
    sendHandedOverAlert(r).catch((e) => {
      console.error("[booking-notify-2] reschedule handover:", e);
      return false;
    }),
  ]);

  if (!admin) {
    console.error(`[booking-notify-2] CRITICAL: nobody at ${ADMIN_EMAIL} was told that ${r.clientName}'s booking moved to ${when(r.newStartTime)}.`);
  }
  return { client, practitioner, admin, handover };
}

/* ── No-shows ────────────────────────────────────────────── */

/** What the automatic no-show sweep did with the money. */
export type NoShowDepositOutcome =
  /** The hold was still uncaptured and we have now CAPTURED it — the clinic keeps it. */
  | "captured"
  /** It was already captured at booking time. Nothing to do; the clinic keeps it. */
  | "already-captured"
  /** A hold existed but had already been released, so there is nothing to keep. */
  | "released-earlier"
  /** The catalogue says this service carries no deposit at all. */
  | "none"
  /** A deposit was due but no payment could be located — a human must check Stripe. */
  | "not-found"
  /** A deposit was due, the payment was found, and capturing it FAILED. */
  | "capture-failed";

export interface NoShowNotice {
  appointmentId: string;
  contactId?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  serviceName: string;
  /** ISO with offset — the appointment they missed. */
  startTime: string;
  practitioner?: string | null;
  /** What the catalogue says the deposit is, in pence. */
  expectedDepositPence?: number | null;
  outcome: NoShowDepositOutcome;
  /** Stripe PaymentIntent id, when we found one — reception may need to look it up. */
  paymentIntentId?: string | null;
  /** Whether the Google mirror event was removed. */
  mirrorRemoved?: boolean;
}

/** One sentence, used by the email AND the contact note, so they can't drift. */
export function noShowDepositLine(n: NoShowNotice): string {
  const amount =
    typeof n.expectedDepositPence === "number" && n.expectedDepositPence > 0 ? formatPence(n.expectedDepositPence) : "the deposit";
  switch (n.outcome) {
    case "captured":
      return `KEPT ${amount} — the hold was still uncaptured, so it has been captured now. The clinic has the money.`;
    case "already-captured":
      return `KEPT ${amount} — it was already taken at booking. No action needed.`;
    case "released-earlier":
      return `NOTHING KEPT — the hold on this booking had already been released, so the customer was never charged. If a deposit was due, it is gone.`;
    case "none":
      return "No deposit on this booking (complimentary service) — there was nothing to keep.";
    case "not-found":
      return `NOT FOUND — a deposit of ${amount} was due but no Stripe payment could be located for this appointment. Check Stripe by hand and capture or invoice it.`;
    case "capture-failed":
      return `ACTION NEEDED — ${amount} was still only HELD and capturing it FAILED. Capture it by hand in Stripe within 7 days or the money is lost.`;
  }
}

/**
 * Reception's no-show alert, to admin@orasuites.com.
 *
 * A no-show is the one event where the clinic KEEPS money without anyone
 * choosing to, so the email has to be unambiguous about three things: who
 * didn't turn up and how to reach them, what happened to their deposit, and
 * which appointment it was. Never throws.
 */
export async function sendNoShowAdminAlert(n: NoShowNotice): Promise<boolean> {
  const rows: [string, string][] = [
    ["Client", n.clientName || "—"],
    ["Email", n.clientEmail || "—"],
    ["Phone", n.clientPhone || "—"],
    ["Treatment", n.serviceName],
    ["Was booked for", when(n.startTime)],
    ["Practitioner", n.practitioner || "unassigned"],
    ["Deposit", noShowDepositLine(n)],
    ["Stripe payment", n.paymentIntentId || "not located"],
    ["Google calendar", n.mirrorRemoved ? "mirror event removed" : "no mirror event to remove"],
    ["Appointment ID", n.appointmentId],
    ["Contact ID", n.contactId || "—"],
  ];

  const needsHand = n.outcome === "not-found" || n.outcome === "capture-failed";

  const html = opsEmail(needsHand ? "ACTION NEEDED · no-show" : "No-show", `${n.serviceName} — ${n.clientName}`, rows, [
    {
      label: "What happened automatically",
      text:
        `Reception marked this appointment as a no-show in GHL. The hourly sweep picked it up and applied the ` +
        `no-show rule: the deposit is KEPT, never refunded.\n\n${noShowDepositLine(n)}\n\n` +
        `It has been recorded against the client's contact record, and the Google calendar event has been removed.`,
    },
    {
      label: needsHand ? "What to do now" : "Optional follow-up",
      text: needsHand
        ? `1. Open Stripe → Payments and search for the customer by name, email or the date they booked.\n` +
          `2. If a deposit is sitting there Uncaptured, capture it — an uncaptured hold expires in about 7 days ` +
          `and the clinic gets nothing.\n` +
          `3. If nothing was ever taken, decide whether to invoice the customer or let it go.`
        : `Ring or email the client if you want to rebook them. The deposit has been kept, so a new booking ` +
          `takes a new deposit.`,
    },
  ]);

  const res = await sendAdminEmail(`No-show — ${n.clientName} — ${n.serviceName} ${when(n.startTime)}`, html);
  if (!res.ok) {
    console.error(
      `[booking-notify-2] CRITICAL: no-show alert for appointment ${n.appointmentId} could NOT be sent to ${ADMIN_EMAIL}:`,
      res.status,
      JSON.stringify(res.body).slice(0, 300),
    );
  }
  return res.ok;
}
