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
import { ghlFetch } from "./ghl";

const ADDRESS = "ORÁ Suites, 49 Deansgate, Manchester M3 2AY";
const SIGNOFF = `<br><br>With love,<br>The ORÁ Suites team<br><a href="mailto:admin@orasuites.com">admin@orasuites.com</a>`;

export interface BookingNotice {
  contactId: string;
  clientName: string;
  serviceName: string;
  /** ISO with offset, e.g. 2026-09-02T13:45:00+01:00 */
  startTime: string;
  durationMins?: number | null;
  practitioner?: string | null;
  practitionerEmail?: string | null;
  price?: number | null;
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
  const html = [
    `Hi ${first},`,
    ``,
    `Your appointment at ORÁ Suites is confirmed.`,
    ``,
    `<b>Treatment:</b> ${b.serviceName}`,
    `<b>When:</b> ${when(b.startTime)}${b.durationMins ? ` (${b.durationMins} min)` : ""}`,
    b.practitioner ? `<b>With:</b> ${b.practitioner}` : "",
    `<b>Where:</b> ${ADDRESS}`,
    ``,
    `Need to change or cancel? Just reply to this email and we'll sort it.`,
  ].filter(Boolean).join("<br>") + SIGNOFF;

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: b.contactId,
      subject: `You're booked — ${b.serviceName}, ${when(b.startTime)}`,
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

/** Fire both; never throws. */
export async function notifyBooking(b: BookingNotice): Promise<{ client: boolean; practitioner: boolean }> {
  const [client, practitioner] = await Promise.all([
    sendClientConfirmation(b).catch((e) => { console.error("[booking-notify] client:", e); return false; }),
    sendPractitionerAlert(b).catch((e) => { console.error("[booking-notify] practitioner:", e); return false; }),
  ]);
  return { client, practitioner };
}
