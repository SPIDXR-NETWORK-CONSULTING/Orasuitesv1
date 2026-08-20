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
import { ghlFetch } from "./ghl.js";
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

/* ── Cancellations ───────────────────────────────────────── */
export interface CancellationNotice {
  contactId: string;
  clientName: string;
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

/** Fire both; never throws. */
export async function notifyBooking(b: BookingNotice): Promise<{ client: boolean; practitioner: boolean }> {
  const [client, practitioner] = await Promise.all([
    sendClientConfirmation(b).catch((e) => { console.error("[booking-notify] client:", e); return false; }),
    sendPractitionerAlert(b).catch((e) => { console.error("[booking-notify] practitioner:", e); return false; }),
  ]);
  return { client, practitioner };
}
