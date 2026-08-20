/**
 * Booking notifications we OWN.
 *
 * GHL's built-in "confirmation" notification does not fire reliably for
 * appointments created through the API (verified 17 Aug 2026: two live bookings
 * produced a 1-hour reminder but no confirmation), and its SMS channel is dead
 * until a phone number is provisioned. Anything a client or practitioner must
 * receive is therefore sent from here, through the GHL conversations API —
 * the same path already proven to deliver.
 *
 * Every function is non-throwing: a notification failure must never fail a booking.
 */
import { ghlFetch, sendAdminEmail, ADMIN_EMAIL } from "./ghl.js";
import { appendContactNote } from "./ghl-contacts.js";
import { cancelLinkFor } from "./cancel-token.js";
import { formatPence } from "./catalogue.js";
import catalogueRaw from "../../shared/catalogue.json" with { type: "json" };

/** calendarId → { duration, price } so emails always carry the real numbers. */
const SERVICE_META: Map<string, { duration: number; price: number }> = (() => {
  const m = new Map<string, { duration: number; price: number }>();
  for (const cat of (catalogueRaw as any).categories ?? []) {
    for (const g of cat.groups ?? []) {
      for (const sv of g.services ?? []) {
        if (sv.ghlCalendarId) m.set(sv.ghlCalendarId, { duration: sv.duration, price: sv.price });
      }
    }
  }
  return m;
})();

export function serviceMetaForCalendar(calendarId?: string | null) {
  return calendarId ? SERVICE_META.get(calendarId) : undefined;
}

const ADDRESS = "ORÁ Suites, 49 Deansgate, Manchester M3 2AY";
const SIGNOFF = `<br><br>With love,<br>The ORÁ Suites team<br><a href="mailto:admin@orasuites.com">admin@orasuites.com</a>`;

export interface BookingNotice {
  contactId: string;
  /** GHL appointment id — needed to build the self-service cancel link. */
  appointmentId?: string | null;
  clientName: string;
  /** Reception needs to be able to reach the client without opening GHL. */
  clientEmail?: string | null;
  clientPhone?: string | null;
  serviceName: string;
  /** ISO with offset, e.g. 2026-09-02T13:45:00+01:00 */
  startTime: string;
  durationMins?: number | null;
  practitioner?: string | null;
  practitionerEmail?: string | null;
  price?: number | null;
  /**
   * Deposit actually TAKEN, in pence — this email is sent after the deposit is
   * captured, so a number here means the money has really left the card.
   * null/0 = nothing was charged.
   */
  depositPence?: number | null;
  notes?: string | null;
}

function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/London", hour12: false,
  }).format(d);
}

/** Client-facing confirmation. Sent by us, immediately, at booking time. */
export async function sendClientConfirmation(b: BookingNotice): Promise<boolean> {
  const first = (b.clientName || "there").trim().split(" ")[0];
  const paid = typeof b.depositPence === "number" && b.depositPence > 0;
  const balance = paid && typeof b.price === "number" ? Math.round(b.price * 100) - b.depositPence! : null;
  const cancelUrl = b.appointmentId ? cancelLinkFor(b.appointmentId, b.contactId) : null;

  const html = [
    `Hi ${first},`,
    ``,
    `Your appointment at ORÁ Suites is confirmed.`,
    ``,
    `<b>Treatment:</b> ${b.serviceName}`,
    `<b>Date &amp; time:</b> ${when(b.startTime)}`,
    `<b>Duration:</b> ${b.durationMins ? `${b.durationMins} minutes` : "confirmed at the clinic"}`,
    `<b>Your practitioner:</b> ${b.practitioner || "assigned — we'll confirm shortly"}`,
    typeof b.price === "number" ? `<b>Price:</b> ${b.price === 0 ? "Complimentary" : `£${b.price}`}` : "",
    paid ? `<b>Deposit taken:</b> ${formatPence(b.depositPence!)}` : "",
    paid && balance !== null && balance > 0 ? `<b>Balance at the clinic:</b> ${formatPence(balance)}` : "",
    `<b>Where:</b> ${ADDRESS}`,
    ``,
    cancelUrl
      ? `Need to cancel? <a href="${cancelUrl}">Cancel this appointment</a>.`
      : `Need to change or cancel? Just reply to this email and we'll sort it.`,
    paid
      ? `Cancel more than 24 hours before your appointment and your ${formatPence(b.depositPence!)} deposit is refunded in full. Within 24 hours the deposit is retained.`
      : cancelUrl
        ? `Please give us at least 24 hours' notice where you can.`
        : "",
    cancelUrl ? `To move your appointment to another time, reply to this email — your deposit moves with it.` : "",
  ].filter(Boolean).join("<br>") + SIGNOFF;

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: b.contactId,
      subject: `Booking confirmed — ${b.serviceName} on ${when(b.startTime)}`,
      html,
    }),
  });
  if (!res.ok) console.error("[booking-notify] client confirmation failed:", res.status, JSON.stringify(res.body));
  return res.ok;
}

/**
 * Practitioner alert. Sent to their work inbox via GHL so it does not depend on
 * GHL's in-app "assigned user" notification, which cannot be verified by API.
 * Uses a lightweight internal contact keyed on the practitioner's email.
 */
export async function sendPractitionerAlert(b: BookingNotice): Promise<boolean> {
  if (!b.practitionerEmail) return false;
  const locationId = process.env.GHL_LOCATION_ID;

  const found = await ghlFetch(
    `/contacts/?locationId=${locationId}&query=${encodeURIComponent(b.practitionerEmail)}`,
    { version: "2021-07-28" },
  );
  let staffContactId: string | undefined = found.ok
    ? found.body?.contacts?.find((c: any) => (c.email || "").toLowerCase() === b.practitionerEmail!.toLowerCase())?.id
    : undefined;

  if (!staffContactId) {
    const created = await ghlFetch("/contacts/upsert", {
      method: "POST",
      version: "2021-07-28",
      body: JSON.stringify({
        locationId,
        firstName: (b.practitioner || "ORÁ").split(" ")[0],
        lastName: "(team)",
        email: b.practitionerEmail,
        tags: ["internal-team"],
      }),
    });
    staffContactId = created.body?.contact?.id;
  }
  if (!staffContactId) return false;

  const html = [
    `New booking for you.`,
    ``,
    `<b>Client:</b> ${b.clientName}`,
    `<b>Treatment:</b> ${b.serviceName}`,
    `<b>When:</b> ${when(b.startTime)}${b.durationMins ? ` (${b.durationMins} min)` : ""}`,
    b.notes ? `<b>Notes:</b> ${b.notes}` : "",
    ``,
    `It's in your ORÁ calendar and your Google Calendar invite.`,
  ].filter(Boolean).join("<br>");

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: staffContactId,
      subject: `New booking — ${b.serviceName}, ${when(b.startTime)}`,
      html,
    }),
  });
  if (!res.ok) console.error("[booking-notify] practitioner alert failed:", res.status, JSON.stringify(res.body));
  return res.ok;
}

/* ── Admin / reception ───────────────────────────────────── */
/**
 * The ORÁ palette, inline. Rendered inside a GHL conversation, so no stylesheet
 * and no external asset can be relied on.
 */
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
 * Reception's copy of every booking, to admin@orasuites.com.
 *
 * WHY THIS EXISTS: until 20 Aug 2026 only the client and the ONE assigned
 * practitioner were emailed. A live booking on that date reached the calendar
 * correctly and the owner had no idea it had happened. Nobody can run a floor
 * they cannot see. This carries everything reception needs to act without
 * opening anything else: who, how to reach them, what, when, how long, with
 * whom, the money, what the client asked for, and the appointment id.
 */
export async function sendAdminBookingAlert(b: BookingNotice): Promise<boolean> {
  const paid = typeof b.depositPence === "number" && b.depositPence > 0;
  const balance = paid && typeof b.price === "number" ? Math.round(b.price * 100) - b.depositPence! : null;

  const rows: [string, string][] = [
    ["Client", b.clientName || "—"],
    ["Email", b.clientEmail || "—"],
    ["Phone", b.clientPhone || "—"],
    ["Treatment", b.serviceName],
    ["Date & time", when(b.startTime)],
    ["Duration", b.durationMins ? `${b.durationMins} minutes` : "not set"],
    ["Practitioner", b.practitioner || "unassigned"],
    ["Price", typeof b.price === "number" ? (b.price === 0 ? "Complimentary" : `£${b.price}`) : "not set"],
    ["Deposit taken", paid ? formatPence(b.depositPence!) : "none"],
    ["Balance at clinic", paid && balance !== null && balance > 0 ? formatPence(balance) : ""],
    ["Appointment ID", b.appointmentId || "—"],
  ];

  const html = opsEmail("New booking", `${b.serviceName} — ${b.clientName}`, rows, [
    { label: "Client's notes", text: b.notes || "" },
  ]);

  const res = await sendAdminEmail(`New booking — ${b.serviceName} — ${when(b.startTime)}`, html);
  if (!res.ok) console.error("[booking-notify] admin booking alert failed:", res.status, JSON.stringify(res.body).slice(0, 300));
  return res.ok;
}

/* ── Cancellations ───────────────────────────────────────── */
export interface CancellationNotice {
  contactId: string;
  clientName: string;
  /** Optional, for the admin copy only — reception may want to call them back. */
  clientEmail?: string | null;
  clientPhone?: string | null;
  /** GHL appointment id, shown to reception so they can find it. */
  appointmentId?: string | null;
  serviceName: string;
  startTime: string;
  /** Deposit refunded, in pence. 0/null = nothing refunded. */
  refundedPence?: number | null;
  /** Deposit retained because it was inside the 24-hour window. */
  retainedPence?: number | null;
  /**
   * A deposit that was only ever HELD and has now been released — the card was
   * never charged, so this is not a refund and there is nothing to wait for.
   */
  releasedPence?: number | null;
  /** true when the clinic cancelled (always a full refund). */
  byClinic?: boolean;
}

/**
 * Tells the customer plainly what happened to their money. Never throws.
 * Subject deliberately mirrors the confirmation format.
 */
export async function sendCancellationEmail(c: CancellationNotice): Promise<boolean> {
  const first = (c.clientName || "there").trim().split(" ")[0];
  const refunded = typeof c.refundedPence === "number" && c.refundedPence > 0;
  const retained = typeof c.retainedPence === "number" && c.retainedPence > 0;
  const released = typeof c.releasedPence === "number" && c.releasedPence > 0;

  const money = refunded
    ? `Your ${formatPence(c.refundedPence!)} deposit has been refunded in full. It usually reaches your account within 5–10 working days, depending on your bank.`
    : released
      ? `Your card was never charged — the ${formatPence(c.releasedPence!)} we were holding has been released. If your bank still shows it as pending, it will drop off within a day or two.`
      : retained
        ? `As this cancellation is within 24 hours of your appointment, the ${formatPence(c.retainedPence!)} deposit is retained. If something unexpected came up, reply to this email and we'll look at it personally.`
        : `There was no deposit on this booking, so there is nothing to refund.`;

  const html = [
    `Hi ${first},`,
    ``,
    c.byClinic
      ? `We're very sorry — we've had to cancel your appointment at ORÁ Suites.`
      : `Your appointment at ORÁ Suites has been cancelled.`,
    ``,
    `<b>Treatment:</b> ${c.serviceName}`,
    `<b>Was booked for:</b> ${when(c.startTime)}`,
    ``,
    money,
    ``,
    `We'd love to see you another time — reply to this email or book again at <a href="https://www.orasuites.com/book">orasuites.com/book</a>.`,
  ].filter(Boolean).join("<br>") + SIGNOFF;

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: c.contactId,
      subject: `Booking cancelled — ${c.serviceName} on ${when(c.startTime)}`,
      html,
    }),
  });
  if (!res.ok) console.error("[booking-notify] cancellation email failed:", res.status, JSON.stringify(res.body));
  return res.ok;
}

/**
 * Reception's copy of a cancellation, to admin@orasuites.com. States plainly
 * who cancelled and what happened to the money, so a freed slot is never a
 * surprise and a refund is never a mystery. Never throws.
 */
export async function sendAdminCancellationAlert(c: CancellationNotice): Promise<boolean> {
  const refunded = typeof c.refundedPence === "number" && c.refundedPence > 0;
  const retained = typeof c.retainedPence === "number" && c.retainedPence > 0;
  const released = typeof c.releasedPence === "number" && c.releasedPence > 0;

  const money = refunded
    ? `REFUNDED ${formatPence(c.refundedPence!)} — the deposit has been returned to the customer.`
    : released
      ? `RELEASED ${formatPence(c.releasedPence!)} — the hold was never captured, so the customer was not charged.`
      : retained
        ? `RETAINED ${formatPence(c.retainedPence!)} — cancelled inside the 24-hour window, the clinic keeps the deposit.`
        : "No deposit on this booking — nothing to refund or retain.";

  const rows: [string, string][] = [
    ["Client", c.clientName || "—"],
    ["Email", c.clientEmail || "—"],
    ["Phone", c.clientPhone || "—"],
    ["Treatment", c.serviceName],
    ["Was booked for", when(c.startTime)],
    ["Cancelled by", c.byClinic ? "the clinic (staff-initiated)" : "the customer"],
    ["Deposit", money],
    ["Appointment ID", c.appointmentId || "—"],
  ];

  const html = opsEmail("Cancellation", `${c.serviceName} — ${c.clientName}`, rows, [
    { label: "The slot is now free", text: "Remove it from the day sheet and offer the time to someone else." },
  ]);

  const res = await sendAdminEmail(`Cancelled — ${c.serviceName} — ${when(c.startTime)}`, html);
  if (!res.ok) console.error("[booking-notify] admin cancellation alert failed:", res.status, JSON.stringify(res.body).slice(0, 300));
  return res.ok;
}

/**
 * Everything a new booking must trigger, in parallel; never throws.
 *
 *   · client      — confirmation email
 *   · practitioner— their copy, with the client's notes
 *   · admin       — reception's copy at admin@orasuites.com, so the owner can
 *                   actually see the floor (added 20 Aug 2026)
 *   · contactNote — the client's message written onto their GHL CONTACT, because
 *                   GHL discards appointment notes created through the API and
 *                   the message would otherwise be lost entirely
 */
export async function notifyBooking(
  b: BookingNotice,
): Promise<{ client: boolean; practitioner: boolean; admin: boolean; contactNote: boolean }> {
  const [client, practitioner, admin, contactNote] = await Promise.all([
    sendClientConfirmation(b).catch((e) => { console.error("[booking-notify] client:", e); return false; }),
    sendPractitionerAlert(b).catch((e) => { console.error("[booking-notify] practitioner:", e); return false; }),
    sendAdminBookingAlert(b).catch((e) => { console.error("[booking-notify] admin:", e); return false; }),
    (b.notes && b.notes.trim()
      ? appendContactNote(
          b.contactId,
          `Booking note — ${b.serviceName}, ${when(b.startTime)}${b.appointmentId ? ` (appt ${b.appointmentId})` : ""}:\n${b.notes.trim()}`,
        )
      : Promise.resolve(false)
    ).catch((e) => { console.error("[booking-notify] contact note:", e); return false; }),
  ]);
  if (!admin) console.error(`[booking-notify] CRITICAL: nobody at ${ADMIN_EMAIL} was told about the booking for ${b.clientName}.`);
  return { client, practitioner, admin, contactNote };
}
