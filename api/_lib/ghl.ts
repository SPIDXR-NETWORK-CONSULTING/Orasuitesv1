/**
 * ORÁ — shared GHL (LeadConnector) helpers for website enquiries.
 *
 * Used by BOTH backends:
 *   - server/routes.ts  (Express, via server/ghl-notify.ts re-export)
 *   - api/contact.ts    (Vercel serverless)
 *
 * What it does for every POST /api/contact:
 *   1. upsert the enquirer as a GHL contact (tags: website-enquiry [+ room-rental])
 *   2. open an opportunity — Room Rentals pipeline for rental enquiries, otherwise
 *      the Marketing pipeline "New Lead" stage (both overridable via env)
 *   3. email admin@orasuites.com THROUGH GHL (find-or-create the "ORÁ Admin"
 *      contact, then POST /conversations/messages type=Email) — no extra provider.
 *
 * Everything is best-effort: callers respond 201 first, then fire-and-forget.
 * No secrets live here — GHL_API_KEY / GHL_LOCATION_ID come from env at call time.
 */

export const GHL_BASE = "https://services.leadconnectorhq.com";
/** Cloudflare in front of GHL rejects the default Node UA. */
export const GHL_USER_AGENT = "Mozilla/5.0 ora-suites/1.0";

export const ADMIN_EMAIL = "admin@orasuites.com";
export const ROOM_RENTAL_SERVICE = "Room Rental";
export const ROOM_RENTAL_PREFIX = "[Room Rental Enquiry]";

/* Pipelines (verified against the live location on 2026-08-16) */
const ROOM_RENTAL_PIPELINE_ID = process.env.GHL_ROOM_RENTAL_PIPELINE_ID || "ps9Mrw1I7sL2vq7pOvyz";
const ROOM_RENTAL_STAGE_ID = process.env.GHL_ROOM_RENTAL_STAGE_ID || "cecc9ab9-dd9e-4f49-b532-b3b86b87b1f9"; // "Enquiry"
const ENQUIRY_PIPELINE_ID = process.env.GHL_ENQUIRY_PIPELINE_ID || "aPENzEmlv0Y2YldXrDii"; // Marketing Pipeline
const ENQUIRY_STAGE_ID = process.env.GHL_ENQUIRY_STAGE_ID || "e502748d-c373-4cce-b292-880253b89be1"; // "New Lead"

export interface EnquiryPayload {
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  message: string;
}

export interface GhlResult<T = unknown> {
  ok: boolean;
  status: number;
  body: T;
}

function env(name: "GHL_API_KEY" | "GHL_LOCATION_ID"): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

/* ── low-level fetch ─────────────────────────────────────── */
export async function ghlFetch<T = any>(
  path: string,
  init: RequestInit & { version?: string } = {},
): Promise<GhlResult<T>> {
  const { version = "2021-07-28", headers, ...rest } = init;
  const res = await fetch(`${GHL_BASE}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${env("GHL_API_KEY")}`,
      Version: version,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": GHL_USER_AGENT,
      ...(headers || {}),
    },
  });
  let body: unknown = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body: body as T };
}

/* ── helpers ─────────────────────────────────────────────── */
export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "Website", lastName: parts.slice(1).join(" ") };
}

export function isRoomRental(p: EnquiryPayload): boolean {
  return (p.service || "").trim().toLowerCase() === ROOM_RENTAL_SERVICE.toLowerCase() || (p.message || "").trimStart().startsWith(ROOM_RENTAL_PREFIX);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Warm, minimal HTML for the admin notification. */
export function enquiryEmailHtml(p: EnquiryPayload, meta: { receivedAt?: Date; source?: string } = {}): string {
  const rows: [string, string][] = [
    ["Name", p.name],
    ["Email", p.email],
    ["Phone", p.phone || "—"],
    ["Service", p.service || "General enquiry"],
    ["Received", (meta.receivedAt ?? new Date()).toLocaleString("en-GB", { timeZone: "Europe/London" })],
  ];
  const trs = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#8a7d72;font-size:12px;letter-spacing:.14em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:8px 0;color:#1a1008;font-size:15px">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const message = escapeHtml(p.message || "").replace(/\n/g, "<br/>");
  const kind = isRoomRental(p) ? "Room rental enquiry" : "Website enquiry";
  return `<!doctype html><html><body style="margin:0;background:#f4efe8;padding:32px 16px;font-family:Georgia,'Times New Roman',serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#fffdf9;border:1px solid #e6dccf;border-radius:16px">
    <tr><td style="padding:28px 32px 8px">
      <p style="margin:0 0 6px;color:#b98867;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase">ORÁ Suites · ${kind}</p>
      <h1 style="margin:0;color:#1a1008;font-weight:400;font-size:26px;line-height:1.15">New enquiry from ${escapeHtml(p.name)}</h1>
    </td></tr>
    <tr><td style="padding:12px 32px 0"><table role="presentation" cellspacing="0" cellpadding="0" style="font-family:Helvetica,Arial,sans-serif">${trs}</table></td></tr>
    <tr><td style="padding:16px 32px 28px">
      <p style="margin:0 0 6px;color:#8a7d72;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase">Message</p>
      <div style="padding:16px 18px;background:#f4efe8;border-radius:12px;color:#1a1008;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">${message}</div>
      <p style="margin:18px 0 0;color:#8a7d72;font-family:Helvetica,Arial,sans-serif;font-size:12px">Reply directly to <a href="mailto:${escapeHtml(p.email)}" style="color:#b98867">${escapeHtml(p.email)}</a>. Sent automatically by the ORÁ website${meta.source ? ` (${escapeHtml(meta.source)})` : ""}.</p>
    </td></tr>
  </table></body></html>`;
}

/* ── contacts ────────────────────────────────────────────── */
/** Upsert the enquirer; returns the GHL contact id (or null). */
export async function upsertEnquiryContact(p: EnquiryPayload): Promise<string | null> {
  const { firstName, lastName } = splitName(p.name);
  const roomRental = isRoomRental(p);
  const res = await ghlFetch<{ contact?: { id?: string } }>("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId: env("GHL_LOCATION_ID"),
      firstName,
      lastName,
      email: p.email,
      ...(p.phone ? { phone: p.phone } : {}),
      tags: ["website-enquiry", ...(roomRental ? ["room-rental"] : [])],
      source: roomRental ? "website-room-rental-form" : "website-contact-form",
    }),
  });
  if (!res.ok) console.error("GHL upsert contact failed:", res.status, JSON.stringify(res.body));
  return res.body?.contact?.id ?? null;
}

/** Open an opportunity in the right pipeline. Non-fatal. */
export async function createEnquiryOpportunity(p: EnquiryPayload, contactId: string): Promise<GhlResult> {
  const roomRental = isRoomRental(p);
  const res = await ghlFetch("/opportunities/", {
    method: "POST",
    body: JSON.stringify({
      locationId: env("GHL_LOCATION_ID"),
      pipelineId: roomRental ? ROOM_RENTAL_PIPELINE_ID : ENQUIRY_PIPELINE_ID,
      pipelineStageId: roomRental ? ROOM_RENTAL_STAGE_ID : ENQUIRY_STAGE_ID,
      name: `${roomRental ? "Room rental" : "Enquiry"} — ${p.name}${p.service && !roomRental ? ` (${p.service})` : ""}`,
      status: "open",
      contactId,
      monetaryValue: 0,
      source: "website",
    }),
  });
  if (!res.ok) console.error("GHL opportunity failed:", res.status, JSON.stringify(res.body));
  return res;
}

/** Find-or-create the internal "ORÁ Admin" contact that receives notifications. */
export async function findOrCreateAdminContact(): Promise<string | null> {
  const locationId = env("GHL_LOCATION_ID");
  const search = await ghlFetch<{ contacts?: { id: string; email?: string }[] }>(
    `/contacts/?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(ADMIN_EMAIL)}`,
  );
  const hit = search.body?.contacts?.find((c) => (c.email || "").toLowerCase() === ADMIN_EMAIL) ?? search.body?.contacts?.[0];
  if (hit?.id) return hit.id;

  const created = await ghlFetch<{ contact?: { id?: string }; meta?: { contactId?: string } }>("/contacts/", {
    method: "POST",
    body: JSON.stringify({
      locationId,
      firstName: "ORÁ",
      lastName: "Admin",
      email: ADMIN_EMAIL,
      tags: ["internal-admin"],
      source: "website-system",
    }),
  });
  // 400 "duplicated contacts" still returns meta.contactId
  return created.body?.contact?.id ?? created.body?.meta?.contactId ?? null;
}

/** Send an email to the admin inbox via GHL conversations. */
export async function sendAdminEmail(subject: string, html: string, opts: { emailFrom?: string } = {}): Promise<GhlResult> {
  const contactId = await findOrCreateAdminContact();
  if (!contactId) return { ok: false, status: 0, body: { error: "admin contact unavailable" } };
  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId,
      subject,
      html,
      ...(opts.emailFrom ? { emailFrom: opts.emailFrom } : {}),
    }),
  });
  if (!res.ok) console.error("GHL admin email failed:", res.status, JSON.stringify(res.body));
  return res;
}

export function enquirySubject(p: EnquiryPayload): string {
  return `New website enquiry — ${p.service || "General"} — ${p.name}`;
}

/**
 * Full pipeline for one enquiry: contact → opportunity → admin email.
 * Never throws; safe to call fire-and-forget after responding to the client.
 */
export async function processEnquiry(p: EnquiryPayload, source = "web"): Promise<void> {
  const crm = (async () => {
    const contactId = await upsertEnquiryContact(p);
    if (contactId) await createEnquiryOpportunity(p, contactId);
  })().catch((err) => console.error("GHL contact/opportunity error (non-blocking):", err));

  const mail = sendAdminEmail(enquirySubject(p), enquiryEmailHtml(p, { source })).catch((err) =>
    console.error("GHL admin email error (non-blocking):", err),
  );

  await Promise.allSettled([crm, mail]);
}
