/**
 * ORÁ — post-appointment review requests. BUILT, BUT SWITCHED OFF.
 *
 * The clinic does not own its Google Business Profile yet, so there is nowhere
 * honest to send a client. The switch is ONE environment variable:
 *
 *     GOOGLE_REVIEW_URL   unset  → the whole job is a strict no-op, nothing sent
 *     GOOGLE_REVIEW_URL   set    → clients are asked ~24h after their appointment
 *
 * Nothing else needs changing when the profile exists — set the variable in
 * Vercel, redeploy, done.
 *
 * IDEMPOTENCY: a client is asked once per APPOINTMENT, never twice. The proof
 * lives where everything else in this system lives — a GHL contact note:
 *
 *     ORA-REVIEW-ASKED v1 | appointment=<enc> | asked=<ISO>
 *
 * (GHL discards appointment notes created over the API; contact notes persist.)
 * Contacts are also tagged `review-requested` so the owner can see it in GHL.
 *
 * Every function is non-throwing.
 */
import { ghlFetch } from "./ghl.js";
import { addTags, contactNoteBodies, escapeHtml, writeContactNote } from "./waitlist.js";

/** Titles are "<Service> — <Client>"; service names may themselves contain " — ". */
function serviceFromTitle(title?: string | null): string | undefined {
  const t = (title || "").trim();
  const i = t.lastIndexOf(" — ");
  return (i > 0 ? t.slice(0, i) : t).trim() || undefined;
}



export const REVIEW_MARKER = "ORA-REVIEW-ASKED v1";
export const REVIEW_TAG = "review-requested";

/** Appointments older than this are eligible — "yesterday", give or take. */
export const MIN_AGE_HOURS = 20;
/** …and anything older than this is left alone. Matches the 3-day scan. */
export const MAX_AGE_HOURS = 72;
/** Ceiling on client emails per run. Above it, the rest wait for tomorrow. */
export const MAX_REVIEW_EMAILS_PER_RUN = 40;
/** Bound on contact lookups so one run cannot blow the function timeout. */
export const MAX_CONTACT_LOOKUPS = 150;

const SIGNOFF = `<br><br>With love,<br>The ORÁ Suites team<br><a href="mailto:admin@orasuites.com">admin@orasuites.com</a>`;

/** THE SWITCH. Everything downstream checks this first. */
export function reviewUrl(): string | null {
  const raw = (process.env.GOOGLE_REVIEW_URL || "").trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) {
    console.error("[review-request] GOOGLE_REVIEW_URL is set but is not an http(s) URL — treating as disabled.");
    return null;
  }
  return raw;
}

export function isReviewRequestEnabled(): boolean {
  return reviewUrl() !== null;
}

/** The exact line written to the contact record once a client has been asked. */
export function formatAskedNote(appointmentId: string, serviceName?: string): string {
  const machine = `${REVIEW_MARKER} | appointment=${encodeURIComponent(appointmentId)} | asked=${encodeURIComponent(new Date().toISOString())}`;
  const human = `Review request sent${serviceName ? ` after ${serviceName}` : ""}.`;
  return `${machine}\n${human}`;
}

/** Appointment ids this contact has already been asked about. */
export function alreadyAskedAppointments(bodies: (string | null | undefined)[]): Set<string> {
  const out = new Set<string>();
  for (const body of bodies) {
    for (const rawLine of String(body ?? "").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line.startsWith(REVIEW_MARKER)) continue;
      for (const raw of line.slice(REVIEW_MARKER.length).split("|")) {
        const token = raw.trim();
        const eq = token.indexOf("=");
        if (eq <= 0) continue;
        if (token.slice(0, eq).trim() !== "appointment") continue;
        try {
          out.add(decodeURIComponent(token.slice(eq + 1).trim()));
        } catch {
          out.add(token.slice(eq + 1).trim());
        }
      }
    }
  }
  return out;
}

export async function hasBeenAsked(contactId: string, appointmentId: string): Promise<boolean> {
  return alreadyAskedAppointments(await contactNoteBodies(contactId)).has(appointmentId);
}

/* ── GHL reads ───────────────────────────────────────────── */
export interface FinishedAppointment {
  id: string;
  contactId: string;
  serviceName: string;
  /** ISO end time */
  endTime: string;
}

/** GHL returns their own typo `appoinmentStatus` alongside the correct spelling. */
interface GhlEvent {
  id?: string;
  title?: string;
  contactId?: string;
  appointmentStatus?: string;
  appoinmentStatus?: string;
  deleted?: boolean;
  startTime?: string;
  endTime?: string;
}

const DEAD_STATUS = /cancelled|canceled|noshow|no-show|no_show|invalid/i;

function isGone(ev: GhlEvent): boolean {
  return ev.deleted === true || DEAD_STATUS.test(String(ev.appointmentStatus ?? ev.appoinmentStatus ?? ""));
}

/**
 * Appointments that finished roughly a day ago, scanning the last 3 days for one
 * practitioner — the same window and endpoint api/cron/sync-calendar.ts uses.
 */
export async function finishedAppointmentsFor(userId: string, now = Date.now()): Promise<FinishedAppointment[]> {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) return [];

  const qs = new URLSearchParams({
    locationId,
    userId,
    startTime: String(now - MAX_AGE_HOURS * 3_600_000),
    endTime: String(now),
  });
  const res = await ghlFetch<{ events?: GhlEvent[] }>(`/calendars/events?${qs.toString()}`, { version: "2021-04-15" });
  if (!res.ok) {
    console.error("[review-request] calendar events failed:", res.status, JSON.stringify(res.body).slice(0, 200));
    return [];
  }

  const out: FinishedAppointment[] = [];
  for (const ev of res.body?.events ?? []) {
    if (!ev?.id || !ev.contactId || !ev.endTime || isGone(ev)) continue;
    const ended = new Date(ev.endTime).getTime();
    if (!Number.isFinite(ended)) continue;
    const ageHours = (now - ended) / 3_600_000;
    if (ageHours < MIN_AGE_HOURS || ageHours > MAX_AGE_HOURS) continue;
    // Website bookings are titled "<Service> — <Client>"; keep only the service.
    const serviceName = serviceFromTitle(ev.title) || "your appointment";
    out.push({ id: ev.id, contactId: ev.contactId, serviceName, endTime: ev.endTime });
  }
  return out;
}

export interface ContactLite {
  id: string;
  name: string;
  email: string;
}

export async function readContact(contactId: string): Promise<ContactLite | null> {
  const res = await ghlFetch<{ contact?: any }>(`/contacts/${encodeURIComponent(contactId)}`, { version: "2021-07-28" });
  const c = res.body?.contact;
  if (!res.ok || !c?.id) return null;
  return {
    id: String(c.id),
    name: c.contactName || [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "there",
    email: String(c.email ?? ""),
  };
}

/* ── the email ───────────────────────────────────────────── */
/** Short, warm, one ask. Returns false when the feature is switched off. */
export async function sendReviewRequestEmail(args: {
  contactId: string;
  clientName: string;
  serviceName: string;
}): Promise<boolean> {
  const url = reviewUrl();
  if (!url) return false;

  const first = (args.clientName || "there").trim().split(" ")[0];
  const html =
    [
      `Hi ${escapeHtml(first)},`,
      ``,
      `Thank you for coming in for ${escapeHtml(args.serviceName)} — it was lovely to have you.`,
      ``,
      `If you have a minute, a short review means a great deal to a small clinic.`,
      ``,
      `<a href="${escapeHtml(url)}">Leave a review</a>`,
      ``,
      `And if anything wasn't right, reply to this email instead and we'll put it right.`,
    ].join("<br>") + SIGNOFF;

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: args.contactId,
      subject: `How was your visit to ORÁ Suites?`,
      html,
    }),
  });
  if (!res.ok) console.error("[review-request] email failed:", res.status, JSON.stringify(res.body).slice(0, 200));
  return res.ok;
}

/**
 * Ask one client about one appointment, once.
 * Returns "sent" | "already" | "disabled" | "failed" — never throws.
 */
export async function requestReview(appt: FinishedAppointment, contact: ContactLite): Promise<"sent" | "already" | "disabled" | "failed"> {
  if (!isReviewRequestEnabled()) return "disabled";
  if (await hasBeenAsked(contact.id, appt.id)) return "already";

  const sent = await sendReviewRequestEmail({
    contactId: contact.id,
    clientName: contact.name,
    serviceName: appt.serviceName,
  });
  if (!sent) return "failed";

  await writeContactNote(contact.id, formatAskedNote(appt.id, appt.serviceName));
  await addTags(contact.id, [REVIEW_TAG]);
  return "sent";
}
