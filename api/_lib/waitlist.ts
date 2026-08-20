/**
 * ORÁ — waiting list, stored in GHL.
 *
 * THERE IS NO DATABASE. GHL is the system of record, so a waiting-list entry is
 * a CONTACT NOTE on the client's contact record plus two tags for discovery:
 *
 *   tag `waitlist`               — "this person is waiting for something"
 *   tag `waitlist-YYYY-MM-DD`    — "…on this day" (visible + filterable in GHL)
 *
 * Contact notes persist (GHL discards APPOINTMENT notes created over the API —
 * never use those). Each note carries ONE strict machine-readable first line:
 *
 *   ORA-WAITLIST v1 | service=<enc> | calendar=<enc> | date=YYYY-MM-DD | requested=<ISO> | name=<enc>
 *
 * and one human line underneath so the owner can read it inside GHL. Every
 * value is percent-encoded (encodeURIComponent escapes `|`, `=`, `/`, newlines
 * and spaces), so a name like `Renée | O'Hara = "Bee"` round-trips exactly and
 * can never break the field separators.
 *
 * When the client is emailed about a freed slot a second note is appended:
 *
 *   ORA-WAITLIST-NOTIFIED v1 | service=<enc> | date=YYYY-MM-DD | notified=<ISO> | slots=<n>
 *
 * "Pending" therefore means: a WAITLIST line exists for (service, date) and no
 * NOTIFIED line exists for the same (service, date). That is the whole state
 * machine — no extra store, and re-running the notifier is safe.
 *
 * Nothing in here throws at the caller: every helper returns a value the caller
 * can carry on with. A notification failure must never break a booking page.
 */
import { ghlFetch, sendAdminEmail } from "./ghl.js";
import { findService, type CatalogueService } from "./catalogue.js";
import { publicBaseUrl } from "./cancel-token.js";

export const CLINIC_TZ = "Europe/London";
export const WAITLIST_TAG = "waitlist";
export const WAITLIST_MARKER = "ORA-WAITLIST v1";
export const NOTIFIED_MARKER = "ORA-WAITLIST-NOTIFIED v1";

/** How far ahead the notifier looks. Beyond this, entries simply age out. */
export const NOTIFY_WINDOW_DAYS = 14;
/**
 * Hard ceiling on client emails sent by ONE notifier run. A freed slot on a
 * busy day could otherwise fan out to every waiting client at once; 60 keeps a
 * single run inside the function timeout and inside GHL's rate limits. Anything
 * above the cap is simply left pending and picked up by the next run.
 */
export const MAX_EMAILS_PER_RUN = 60;
/** Bound on how many `waitlist`-tagged contacts one run will read notes for. */
export const MAX_CONTACT_SCAN = 300;
/** Bound on distinct (service, date) pairs checked for free slots per run. */
export const MAX_GROUPS_PER_RUN = 25;

const ADDRESS = "ORÁ Suites, 49 Deansgate, Manchester M3 2AY";
const SIGNOFF = `<br><br>With love,<br>The ORÁ Suites team<br><a href="mailto:admin@orasuites.com">admin@orasuites.com</a>`;

/* ── tiny local copies (booking-notify.ts does not export these) ── */
export function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** Ops-styled HTML card, same palette as api/_lib/booking-notify.ts. */
export function opsEmail(eyebrow: string, heading: string, rows: [string, string][]): string {
  const trs = rows
    .filter(([, v]) => v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 14px 8px 0;color:#8a7d72;font-size:12px;letter-spacing:.14em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td>` +
        `<td style="padding:8px 0;color:#1a1008;font-size:15px">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  return `<div style="margin:0;background:#f4efe8;padding:28px 16px;font-family:Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#fffdf9;border:1px solid #e6dccf;border-radius:16px">
    <tr><td style="padding:26px 30px 6px">
      <p style="margin:0 0 6px;color:#b98867;font-size:11px;letter-spacing:.25em;text-transform:uppercase">ORÁ Suites · ${escapeHtml(eyebrow)}</p>
      <h1 style="margin:0;color:#1a1008;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;line-height:1.2">${escapeHtml(heading)}</h1>
    </td></tr>
    <tr><td style="padding:10px 30px 26px"><table role="presentation" cellspacing="0" cellpadding="0">${trs}</table>
      <p style="margin:20px 0 0;color:#8a7d72;font-size:12px">Sent automatically by the ORÁ waiting list.</p>
    </td></tr>
  </table></div>`;
}

/* ── Europe/London day maths (mirrors client/src/components/booking/time.ts) ── */
const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: CLINIC_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function zonedParts(ms: number) {
  const parts = partsFmt.formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour") % 24, mm: get("minute"), ss: get("second") };
}

function tzOffsetMinutes(ms: number): number {
  const p = zonedParts(ms);
  return Math.round((Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss) - ms) / 60000);
}

/** YYYY-MM-DD for an instant, in London. */
export function isoDate(ms: number = Date.now()): string {
  const p = zonedParts(ms);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Start + end (inclusive-ish) of a London calendar day, as epoch ms. */
export function londonDayBounds(ymd: string): { start: number; end: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0);
  const start = guess - tzOffsetMinutes(guess) * 60000;
  const nextGuess = Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + 1, 0, 0, 0);
  const end = nextGuess - tzOffsetMinutes(nextGuess) * 60000 - 1;
  return { start, end };
}

/** "Thursday 4 September" in London. */
export function formatLongDate(ymd: string): string {
  const { start } = londonDayBounds(ymd);
  return new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TZ, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(start + 12 * 3600000),
  );
}

/** "10:30" in London for an ISO instant. */
export function formatTime(iso: string): string {
  const p = zonedParts(new Date(iso).getTime());
  return `${String(p.hh).padStart(2, "0")}:${String(p.mm).padStart(2, "0")}`;
}

/** Whole days between two YYYY-MM-DD dates (b − a), London-anchored. */
export function daysBetween(a: string, b: string): number {
  return Math.round((londonDayBounds(b).start - londonDayBounds(a).start) / 86400000);
}

export const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidYmd(ymd: unknown): ymd is string {
  if (typeof ymd !== "string" || !YMD_RE.test(ymd)) return false;
  const { start } = londonDayBounds(ymd);
  return Number.isFinite(start) && isoDate(start + 12 * 3600000) === ymd;
}

/* ── the note format ─────────────────────────────────────── */
const enc = (v: unknown) => encodeURIComponent(String(v ?? ""));
function dec(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export interface WaitlistEntry {
  /** catalogue service id, `${categoryId}/${slug}` */
  service: string;
  /** GHL calendar id for that service at the time of joining */
  calendar: string;
  /** YYYY-MM-DD (Europe/London) */
  date: string;
  /** ISO timestamp the request was made */
  requested: string;
  /** the name the client typed (display only — identity is the contact record) */
  name?: string;
}

export interface NotifiedEntry {
  service: string;
  date: string;
  notified: string;
}

/** `service|date` — the identity of one waiting-list request. */
export function entryKey(service: string, date: string): string {
  return `${service}|${date}`;
}

/** The exact note body written to GHL. Line 1 is machine-read; line 2 is for humans. */
export function formatWaitlistNote(e: WaitlistEntry, serviceName?: string): string {
  const machine =
    `${WAITLIST_MARKER} | service=${enc(e.service)} | calendar=${enc(e.calendar)} ` +
    `| date=${e.date} | requested=${enc(e.requested)}` +
    (e.name ? ` | name=${enc(e.name)}` : "");
  const human = `Waiting list — ${serviceName || e.service} on ${formatLongDate(e.date)}. Added from the website.`;
  return `${machine}\n${human}`;
}

export function formatNotifiedNote(service: string, date: string, slots: number, serviceName?: string): string {
  const machine =
    `${NOTIFIED_MARKER} | service=${enc(service)} | date=${date} ` +
    `| notified=${enc(new Date().toISOString())} | slots=${slots}`;
  const human = `Emailed about a freed slot for ${serviceName || service} on ${formatLongDate(date)}.`;
  return `${machine}\n${human}`;
}

/** Split ` a=1 | b=2 ` into a decoded record. Values may contain nothing unsafe. */
function fields(line: string, marker: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = line.slice(marker.length).split("|");
  for (const raw of parts) {
    const token = raw.trim();
    if (!token) continue;
    const eq = token.indexOf("=");
    if (eq <= 0) continue;
    out[token.slice(0, eq).trim()] = dec(token.slice(eq + 1).trim());
  }
  return out;
}

/**
 * Parse every ORÁ waiting-list line out of a set of note bodies.
 *
 * Notes are read line by line so a note that also carries free text (staff can
 * type into the same record) still parses, and anything unrecognised is ignored
 * rather than throwing.
 */
export function parseWaitlistNotes(bodies: (string | null | undefined)[]): {
  entries: WaitlistEntry[];
  notified: NotifiedEntry[];
} {
  const entries: WaitlistEntry[] = [];
  const notified: NotifiedEntry[] = [];

  for (const body of bodies) {
    for (const rawLine of String(body ?? "").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line.startsWith(WAITLIST_MARKER)) {
        const f = fields(line, WAITLIST_MARKER);
        if (!f.service || !isValidYmd(f.date)) continue;
        entries.push({
          service: f.service,
          calendar: f.calendar || "",
          date: f.date,
          requested: f.requested || "",
          ...(f.name ? { name: f.name } : {}),
        });
      } else if (line.startsWith(NOTIFIED_MARKER)) {
        const f = fields(line, NOTIFIED_MARKER);
        if (!f.service || !isValidYmd(f.date)) continue;
        notified.push({ service: f.service, date: f.date, notified: f.notified || "" });
      }
    }
  }
  return { entries, notified };
}

/** Entries still owed an email: a WAITLIST line with no matching NOTIFIED line. */
export function pendingEntries(bodies: (string | null | undefined)[]): WaitlistEntry[] {
  const { entries, notified } = parseWaitlistNotes(bodies);
  const done = new Set(notified.map((n) => entryKey(n.service, n.date)));
  const seen = new Set<string>();
  const out: WaitlistEntry[] = [];
  for (const e of entries) {
    const k = entryKey(e.service, e.date);
    if (done.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

/* ── GHL reads/writes ────────────────────────────────────── */
export interface GhlContactLite {
  id: string;
  name: string;
  email: string;
  tags: string[];
}

function contactName(c: any): string {
  return (
    c?.contactName || [c?.firstName, c?.lastName].filter(Boolean).join(" ").trim() || c?.email || "there"
  );
}

/** Every note body on a contact, newest first. Empty array on any failure. */
export async function contactNoteBodies(contactId: string): Promise<string[]> {
  const res = await ghlFetch<{ notes?: { id?: string; body?: string }[] }>(
    `/contacts/${encodeURIComponent(contactId)}/notes`,
    { version: "2021-07-28" },
  );
  if (!res.ok) {
    console.error("[waitlist] notes read failed:", res.status, JSON.stringify(res.body).slice(0, 200));
    return [];
  }
  return (res.body?.notes ?? []).map((n) => n?.body ?? "").filter(Boolean);
}

/** Append a note. Non-throwing; returns whether GHL accepted it. */
export async function writeContactNote(contactId: string, body: string): Promise<boolean> {
  const text = (body || "").trim();
  if (!contactId || !text) return false;
  const res = await ghlFetch(`/contacts/${encodeURIComponent(contactId)}/notes`, {
    method: "POST",
    version: "2021-07-28",
    body: JSON.stringify({ body: text.slice(0, 5000) }),
  });
  if (!res.ok) console.error("[waitlist] note write failed:", res.status, JSON.stringify(res.body).slice(0, 200));
  return res.ok;
}

export async function addTags(contactId: string, tags: string[]): Promise<boolean> {
  if (!tags.length) return true;
  const res = await ghlFetch(`/contacts/${encodeURIComponent(contactId)}/tags`, {
    method: "POST",
    version: "2021-07-28",
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) console.error("[waitlist] add tags failed:", res.status, JSON.stringify(res.body).slice(0, 200));
  return res.ok;
}

export async function removeTags(contactId: string, tags: string[]): Promise<boolean> {
  if (!tags.length) return true;
  const res = await ghlFetch(`/contacts/${encodeURIComponent(contactId)}/tags`, {
    method: "DELETE",
    version: "2021-07-28",
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) console.error("[waitlist] remove tags failed:", res.status, JSON.stringify(res.body).slice(0, 200));
  return res.ok;
}

/** `waitlist-2026-09-04` — one per day so the owner can see who's waiting when. */
export function dateTag(ymd: string): string {
  return `${WAITLIST_TAG}-${ymd}`;
}

/**
 * Every contact carrying `tag`, bounded by `cap`.
 *
 * GHL's advanced search (POST /contacts/search) is tried first because it
 * filters server-side. If that endpoint answers with anything other than a
 * contact list — its request shape has moved between API revisions — we fall
 * back to paging GET /contacts/ and filtering on the tags array locally. Both
 * paths are bounded, so a location with thousands of contacts cannot blow the
 * function timeout.
 */
export async function listContactsWithTag(tag: string, cap = MAX_CONTACT_SCAN): Promise<GhlContactLite[]> {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) return [];
  const wanted = tag.toLowerCase();
  const out: GhlContactLite[] = [];

  const push = (c: any) => {
    const tags = (Array.isArray(c?.tags) ? c.tags : []).map((t: unknown) => String(t).toLowerCase());
    if (!tags.includes(wanted)) return;
    if (!c?.id) return;
    out.push({ id: String(c.id), name: contactName(c), email: String(c?.email ?? ""), tags });
  };

  /* preferred: server-side tag filter */
  const search = await ghlFetch<{ contacts?: any[] }>("/contacts/search", {
    method: "POST",
    version: "2021-07-28",
    body: JSON.stringify({
      locationId,
      page: 1,
      pageLimit: Math.min(cap, 100),
      filters: [{ field: "tags", operator: "contains", value: tag }],
    }),
  });
  if (search.ok && Array.isArray(search.body?.contacts)) {
    for (const c of search.body!.contacts!) push(c);
    return out.slice(0, cap);
  }
  console.warn(
    `[waitlist] /contacts/search unavailable (HTTP ${search.status}) — falling back to paged /contacts/ scan.`,
  );

  /* fallback: page the plain list and filter locally */
  let startAfterId: string | undefined;
  let startAfter: number | undefined;
  for (let page = 0; page < 10 && out.length < cap; page++) {
    const qs = new URLSearchParams({ locationId, limit: "100" });
    if (startAfterId) qs.set("startAfterId", startAfterId);
    if (startAfter) qs.set("startAfter", String(startAfter));
    const res = await ghlFetch<{ contacts?: any[]; meta?: { startAfterId?: string; startAfter?: number } }>(
      `/contacts/?${qs.toString()}`,
      { version: "2021-07-28" },
    );
    const batch = res.ok && Array.isArray(res.body?.contacts) ? res.body!.contacts! : [];
    for (const c of batch) push(c);
    if (batch.length < 100) break;
    startAfterId = res.body?.meta?.startAfterId;
    startAfter = res.body?.meta?.startAfter;
    if (!startAfterId) break;
  }
  return out.slice(0, cap);
}

/**
 * Free slots for one calendar on one London day, as ISO strings, future-only.
 * Same endpoint the booking page uses (api/ghl/slots.ts).
 */
export async function freeSlotsFor(calendarId: string, ymd: string): Promise<string[]> {
  if (!calendarId || !isValidYmd(ymd)) return [];
  const { start, end } = londonDayBounds(ymd);
  const qs = new URLSearchParams({
    startDate: String(start),
    endDate: String(end),
    timezone: CLINIC_TZ,
  });
  const res = await ghlFetch<Record<string, unknown>>(
    `/calendars/${encodeURIComponent(calendarId)}/free-slots?${qs.toString()}`,
    { version: "2021-04-15" },
  );
  if (!res.ok || !res.body || typeof res.body !== "object") {
    if (!res.ok) console.error("[waitlist] free-slots failed:", res.status, JSON.stringify(res.body).slice(0, 200));
    return [];
  }
  const now = Date.now();
  const found: string[] = [];
  for (const [key, val] of Object.entries(res.body)) {
    if (key !== ymd) continue;
    const slots = (val as { slots?: unknown })?.slots;
    if (!Array.isArray(slots)) continue;
    for (const s of slots) {
      if (typeof s === "string" && new Date(s).getTime() > now) found.push(s);
    }
  }
  return found.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

/* ── emails ──────────────────────────────────────────────── */
function bookingLink(serviceId: string): string {
  return `${publicBaseUrl()}/book?service=${encodeURIComponent(serviceId)}`;
}

/** Client-facing "you're on the list" confirmation. */
export async function sendWaitlistJoinedEmail(args: {
  contactId: string;
  clientName: string;
  serviceName: string;
  date: string;
}): Promise<boolean> {
  const first = (args.clientName || "there").trim().split(" ")[0];
  const day = formatLongDate(args.date);
  const html =
    [
      `Hi ${escapeHtml(first)},`,
      ``,
      `You're on the waiting list for <b>${escapeHtml(args.serviceName)}</b> on <b>${escapeHtml(day)}</b>.`,
      ``,
      `We'll email you the moment something frees up on ${escapeHtml(day)}. Appointments are first come, first served, so book straight from that email if it suits you.`,
      ``,
      `${escapeHtml(ADDRESS)}`,
    ].join("<br>") + SIGNOFF;

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: args.contactId,
      subject: `You're on the waiting list — ${args.serviceName}, ${day}`,
      html,
    }),
  });
  if (!res.ok) console.error("[waitlist] joined email failed:", res.status, JSON.stringify(res.body).slice(0, 200));
  return res.ok;
}

/** "A time has opened up" — sent to EVERY waiting client for that service+day. */
export async function sendWaitlistOpeningEmail(args: {
  contactId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  times: string[];
}): Promise<boolean> {
  const first = (args.clientName || "there").trim().split(" ")[0];
  const day = formatLongDate(args.date);
  const shown = args.times.slice(0, 8).map(formatTime);
  const more = args.times.length > shown.length ? ` (and ${args.times.length - shown.length} more)` : "";
  const link = bookingLink(args.serviceId);

  const html =
    [
      `Hi ${escapeHtml(first)},`,
      ``,
      `A time has opened up for <b>${escapeHtml(args.serviceName)}</b> on <b>${escapeHtml(day)}</b>.`,
      ``,
      `<b>Available:</b> ${escapeHtml(shown.join(" · "))}${escapeHtml(more)}`,
      ``,
      `<a href="${escapeHtml(link)}">Book your appointment</a>`,
      ``,
      `Everyone on the list for this day has been emailed, so appointments are first come, first served — the time is yours once it's booked.`,
      ``,
      `${escapeHtml(ADDRESS)}`,
    ].join("<br>") + SIGNOFF;

  const res = await ghlFetch("/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({
      type: "Email",
      contactId: args.contactId,
      subject: `A time has opened up — ${args.serviceName}, ${day}`,
      html,
    }),
  });
  if (!res.ok) console.error("[waitlist] opening email failed:", res.status, JSON.stringify(res.body).slice(0, 200));
  return res.ok;
}

/** Reception's copy: somebody joined the list. */
export async function sendAdminWaitlistAlert(args: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  serviceName: string;
  date: string;
}): Promise<boolean> {
  const day = formatLongDate(args.date);
  const rows: [string, string][] = [
    ["Client", args.clientName],
    ["Email", args.clientEmail],
    ["Phone", args.clientPhone || "—"],
    ["Treatment", args.serviceName],
    ["Day wanted", day],
  ];
  const res = await sendAdminEmail(
    `Waiting list — ${args.serviceName}, ${day}`,
    opsEmail("Waiting list", `${args.clientName} is waiting for ${day}`, rows),
  );
  return res.ok;
}

/* ── validation shared by the API route ──────────────────── */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface WaitlistRequest {
  serviceId: string;
  date: string;
  name: string;
  email: string;
  phone?: string;
}

export type Validated = { ok: true; value: WaitlistRequest & { service: CatalogueService } } | { ok: false; error: string };

/** How far ahead someone may join. Matches the booking strip plus headroom. */
const MAX_LEAD_DAYS = 90;

export function validateWaitlistRequest(raw: unknown): Validated {
  const b = (raw ?? {}) as Record<string, unknown>;
  const serviceId = String(b.serviceId ?? "").trim();
  const date = String(b.date ?? "").trim();
  const name = String(b.name ?? "").trim();
  const email = String(b.email ?? "").trim().toLowerCase();
  const phone = String(b.phone ?? "").trim();

  if (!serviceId) return { ok: false, error: "serviceId is required" };
  const service = findService(serviceId);
  if (!service) return { ok: false, error: "Unknown treatment" };
  if (!service.live) return { ok: false, error: "That treatment isn't bookable online yet" };
  if (!service.ghlCalendarId) return { ok: false, error: "That treatment has no online calendar yet" };

  if (!isValidYmd(date)) return { ok: false, error: "date must be YYYY-MM-DD" };
  const today = isoDate();
  const lead = daysBetween(today, date);
  if (lead < 0) return { ok: false, error: "That date has already passed" };
  if (lead > MAX_LEAD_DAYS) return { ok: false, error: `We only take waiting-list requests ${MAX_LEAD_DAYS} days ahead` };

  if (name.length < 2 || name.length > 120) return { ok: false, error: "Please give us your name" };
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, error: "Please give us a valid email address" };
  if (phone.length > 40) return { ok: false, error: "That phone number doesn't look right" };

  return { ok: true, value: { serviceId: service.id, date, name, email, phone: phone || undefined, service } };
}

export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "Client", lastName: parts.slice(1).join(" ") };
}
