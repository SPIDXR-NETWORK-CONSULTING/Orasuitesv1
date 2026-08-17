/**
 * ORÁ — "All Appointments" Google Calendar mirror.
 *
 * ONE Google calendar, owned by admin@orasuites.com, that shows every GHL
 * appointment from every practitioner and all 56 service calendars, so the
 * whole clinic day is visible in Google / on a phone.
 *
 * Used by:
 *   - api/ghl/booking.ts        (Vercel serverless — mirrors on booking)
 *   - server/routes.ts          (Express twin — via server/google-calendar.ts)
 *   - api/cron/sync-calendar.ts (nightly reconciler — the real source of truth)
 *   - api/health.ts             (optional connectivity probe)
 *
 * Design rules:
 *   - NO new dependencies. Plain fetch against the Google Calendar v3 REST API
 *     with an OAuth refresh-token grant (no JWT / service account needed).
 *   - EVERY exported function is a silent no-op when the GOOGLE_* env vars are
 *     absent, so the site behaves exactly as before until Abdul connects.
 *   - Nothing here ever throws at the caller. Booking must never fail because
 *     Google is slow, rate-limited or disconnected.
 *   - Idempotent: the GHL appointment id lives in
 *     `extendedProperties.private.ghlId`, and every event we own is tagged
 *     `extendedProperties.private.oraManaged = "1"` so the reconciler can only
 *     ever delete events this system created — never Abdul's own entries.
 *
 * No secrets live in this file. GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET /
 * GOOGLE_REFRESH_TOKEN / GOOGLE_CALENDAR_ID come from env at call time.
 * Run `node script/google-connect.mjs` once to populate them.
 */

import catalogueRaw from "../../shared/catalogue.json";

/* ── constants ───────────────────────────────────────────── */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CAL_BASE = "https://www.googleapis.com/calendar/v3";

export const ORA_CALENDAR_NAME = "ORÁ — All Appointments";
export const ORA_LOCATION = "ORÁ Suites, 49 Deansgate, Manchester M3 2AY";
export const ORA_TIMEZONE = "Europe/London";

/** Marks an event as created by this system — the only events we may delete. */
export const MANAGED_FLAG = "oraManaged";

/** Google's fixed event palette. Warm tones to match the ORÁ brand. */
const CATEGORY_COLOR: Record<string, string> = {
  aesthetics: "6", // Tangerine
  nails: "5", // Banana
  hair: "3", // Grape
  makeup: "4", // Flamingo
  laser: "10", // Basil
};
const DEFAULT_COLOR = "8"; // Graphite

/** Requests time out well inside a serverless invocation. */
const REQUEST_TIMEOUT_MS = 8000;

/* ── catalogue lookups (calendarId → category, userId → name) ─ */

interface CatalogueShape {
  _meta: { team: Record<string, { ghlUserId: string; name: string }> };
  categories: {
    id: string;
    title: string;
    live?: boolean;
    team?: string[];
    groups: { name: string; services: { name: string; ghlCalendarId?: string }[] }[];
  }[];
}

const catalogue = catalogueRaw as unknown as CatalogueShape;

/** GHL service-calendar id → category id ("aesthetics" | "nails" | …). */
const CALENDAR_CATEGORY: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const cat of catalogue.categories ?? []) {
    for (const group of cat.groups ?? []) {
      for (const svc of group.services ?? []) {
        if (svc.ghlCalendarId) m.set(svc.ghlCalendarId, cat.id);
      }
    }
  }
  return m;
})();

/** GHL service-calendar id → service name (for a nicer summary line). */
const CALENDAR_SERVICE: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const cat of catalogue.categories ?? []) {
    for (const group of cat.groups ?? []) {
      for (const svc of group.services ?? []) {
        if (svc.ghlCalendarId) m.set(svc.ghlCalendarId, svc.name);
      }
    }
  }
  return m;
})();

/** GHL user id → practitioner display name. */
export const TEAM_BY_USER_ID: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const member of Object.values(catalogue._meta?.team ?? {})) {
    if (member?.ghlUserId) m.set(member.ghlUserId, member.name);
  }
  return m;
})();

/** GHL user id → practitioner work email (used to invite them onto their own bookings). */
export const TEAM_EMAIL_BY_USER_ID: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const member of Object.values(catalogue._meta?.team ?? {})) {
    const email = (member as { email?: string })?.email;
    if (member?.ghlUserId && email) m.set(member.ghlUserId, email);
  }
  return m;
})();

/** Every practitioner GHL user id — the reconciler sweeps each one. */
export function teamUserIds(): string[] {
  return Array.from(TEAM_BY_USER_ID.keys());
}

export function serviceNameForCalendar(calendarId?: string | null): string | undefined {
  return calendarId ? CALENDAR_SERVICE.get(calendarId) : undefined;
}

/* ── config ──────────────────────────────────────────────── */

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
}

function config(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!clientId || !clientSecret || !refreshToken || !calendarId) return null;
  return { clientId, clientSecret, refreshToken, calendarId };
}

/** True when all four GOOGLE_* vars are present. */
export function isGoogleCalendarConfigured(): boolean {
  return config() !== null;
}

let warnedNotConfigured = false;
function noopBecauseUnconfigured(what: string): void {
  if (!warnedNotConfigured) {
    warnedNotConfigured = true;
    console.log(`[google-calendar] not connected (GOOGLE_* env vars absent) — skipping ${what}. This is expected before setup.`);
  }
}

/* ── access token (refresh-token grant, cached in module scope) ─ */

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Exchange the long-lived refresh token for a short-lived access token.
 * Cached in module scope so warm serverless invocations reuse it.
 * Returns null when unconfigured or when Google rejects the grant.
 */
export async function getAccessToken(): Promise<string | null> {
  const cfg = config();
  if (!cfg) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        refresh_token: cfg.refreshToken,
        grant_type: "refresh_token",
      }).toString(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null;
    if (!res.ok || !body?.access_token) {
      // Never log the token/secret — only the error code Google returns.
      console.error(`[google-calendar] token refresh failed: HTTP ${res.status} ${body?.error ?? ""}`);
      cachedToken = null;
      return null;
    }
    cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
    return cachedToken.value;
  } catch (err) {
    console.error("[google-calendar] token refresh error:", String(err).slice(0, 160));
    cachedToken = null;
    return null;
  }
}

/** Drop the cached access token (used by health checks / after a 401). */
export function clearTokenCache(): void {
  cachedToken = null;
}

/* ── low-level calendar fetch ────────────────────────────── */

export interface CalResult<T = any> {
  ok: boolean;
  status: number;
  body: T | null;
}

async function calFetch<T = any>(path: string, init: RequestInit = {}, retryOn401 = true): Promise<CalResult<T>> {
  const token = await getAccessToken();
  if (!token) return { ok: false, status: 0, body: null };

  try {
    const res = await fetch(`${CAL_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers || {}),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (res.status === 401 && retryOn401) {
      clearTokenCache();
      return calFetch<T>(path, init, false);
    }

    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      console.error(`[google-calendar] ${init.method ?? "GET"} ${path.split("?")[0]} → HTTP ${res.status}`, JSON.stringify(body).slice(0, 240));
    }
    return { ok: res.ok, status: res.status, body: body as T };
  } catch (err) {
    console.error(`[google-calendar] request error on ${path.split("?")[0]}:`, String(err).slice(0, 160));
    return { ok: false, status: 0, body: null };
  }
}

/* ── the appointment shape we mirror ─────────────────────── */

export interface MirrorAppointment {
  /** GHL appointment id — the idempotency key. Required. */
  ghlId: string;
  /** GHL service calendar id (used for category colour + service fallback). */
  ghlCalendarId?: string | null;
  serviceName?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  practitioner?: string | null;
  /** GHL user id of the assigned practitioner (used to resolve their invite email). */
  assignedUserId?: string | null;
  /** Explicit override for the practitioner's invite email. */
  practitionerEmail?: string | null;
  notes?: string | null;
  /** ISO 8601 (with or without offset) or ms-epoch. */
  startTime: string | number;
  endTime: string | number;
  /** GHL appointmentStatus — "cancelled"/"deleted" are removed, not upserted. */
  status?: string | null;
}

export const CANCELLED_STATUSES = new Set(["cancelled", "canceled", "deleted", "noshow", "no-show", "no_show", "invalid"]);

export function isCancelled(status?: string | null): boolean {
  return CANCELLED_STATUSES.has((status || "").trim().toLowerCase());
}

/* ── event body ──────────────────────────────────────────── */

/** Normalise GHL's several time formats to RFC3339 for Google. */
function toRfc3339(value: string | number): string | null {
  if (typeof value === "number" || /^\d{10,13}$/.test(String(value))) {
    const ms = Number(value);
    const d = new Date(ms < 1e12 ? ms * 1000 : ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(value).trim();
  if (!s) return null;
  // Already carries a zone → hand it straight to Google.
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) return s;
  // Naked local time → Google reads it in the event's timeZone (Europe/London).
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 16 ? `${s}:00` : s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function categoryFor(appt: MirrorAppointment): string | undefined {
  return appt.ghlCalendarId ? CALENDAR_CATEGORY.get(appt.ghlCalendarId) : undefined;
}

function buildEventBody(appt: MirrorAppointment): Record<string, unknown> | null {
  const start = toRfc3339(appt.startTime);
  const end = toRfc3339(appt.endTime);
  if (!start || !end) {
    console.error(`[google-calendar] unusable times for GHL appt ${appt.ghlId}:`, appt.startTime, appt.endTime);
    return null;
  }

  const practitionerEmail = appt.practitionerEmail || (appt.assignedUserId ? TEAM_EMAIL_BY_USER_ID.get(appt.assignedUserId) : undefined);
  const service = (appt.serviceName || serviceNameForCalendar(appt.ghlCalendarId) || "Appointment").trim();
  const client = (appt.clientName || "Client").trim();
  const category = categoryFor(appt);

  const lines: string[] = [];
  if (appt.practitioner) lines.push(`Practitioner: ${appt.practitioner}`);
  lines.push(`Service: ${service}`);
  lines.push(`Client: ${client}`);
  if (appt.clientEmail) lines.push(`Email: ${appt.clientEmail}`);
  if (appt.clientPhone) lines.push(`Phone: ${appt.clientPhone}`);
  if (appt.notes) lines.push("", "Notes:", appt.notes.trim());
  lines.push("", `GHL appointment id: ${appt.ghlId}`, "Mirrored automatically from GoHighLevel — edit in GHL, not here.");

  return {
    summary: `${service} — ${client}`,
    description: lines.join("\n"),
    location: ORA_LOCATION,
    start: { dateTime: start, timeZone: ORA_TIMEZONE },
    end: { dateTime: end, timeZone: ORA_TIMEZONE },
    colorId: (category && CATEGORY_COLOR[category]) || DEFAULT_COLOR,
    status: "confirmed",
    transparency: "opaque",
    // The practitioner is invited as an attendee so the booking lands on THEIR
    // Google Calendar too, independently of GHL's per-user sync. The client is
    // never added — mirroring must never email the client.
    ...(practitionerEmail
      ? { attendees: [{ email: practitionerEmail, responseStatus: "accepted", displayName: appt.practitioner ?? undefined }] }
      : {}),
    extendedProperties: {
      private: {
        ghlId: appt.ghlId,
        [MANAGED_FLAG]: "1",
        ...(appt.ghlCalendarId ? { ghlCalendarId: appt.ghlCalendarId } : {}),
        ...(category ? { category } : {}),
      },
    },
  };
}

/* ── find / upsert / delete ──────────────────────────────── */

/** Find the Google event mirroring a given GHL appointment id, if any. */
export async function findEventByGhlId(ghlId: string): Promise<{ id: string } | null> {
  const cfg = config();
  if (!cfg) return null;
  const qs = new URLSearchParams({
    privateExtendedProperty: `ghlId=${ghlId}`,
    showDeleted: "false",
    maxResults: "5",
    singleEvents: "true",
  });
  const res = await calFetch<{ items?: { id: string }[] }>(`/calendars/${encodeURIComponent(cfg.calendarId)}/events?${qs}`);
  const hit = res.body?.items?.[0];
  return hit?.id ? { id: hit.id } : null;
}

export interface UpsertResult {
  action: "created" | "updated" | "deleted" | "skipped" | "failed";
  eventId?: string;
  reason?: string;
}

/**
 * Create or update the Google event for a GHL appointment.
 * Cancelled/deleted appointments are removed instead.
 * Never throws.
 */
export async function upsertEvent(appt: MirrorAppointment): Promise<UpsertResult> {
  const cfg = config();
  if (!cfg) {
    noopBecauseUnconfigured("event upsert");
    return { action: "skipped", reason: "not configured" };
  }
  if (!appt.ghlId) return { action: "skipped", reason: "missing ghlId" };
  if (isCancelled(appt.status)) return deleteEvent(appt.ghlId);

  const body = buildEventBody(appt);
  if (!body) return { action: "failed", reason: "unusable start/end time" };

  try {
    const existing = await findEventByGhlId(appt.ghlId);
    if (existing) {
      const res = await calFetch<{ id?: string }>(
        `/calendars/${encodeURIComponent(cfg.calendarId)}/events/${encodeURIComponent(existing.id)}?sendUpdates=all`,
        { method: "PUT", body: JSON.stringify(body) },
      );
      return res.ok ? { action: "updated", eventId: existing.id } : { action: "failed", reason: `HTTP ${res.status}` };
    }
    const res = await calFetch<{ id?: string }>(`/calendars/${encodeURIComponent(cfg.calendarId)}/events?sendUpdates=all`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.ok && res.body?.id ? { action: "created", eventId: res.body.id } : { action: "failed", reason: `HTTP ${res.status}` };
  } catch (err) {
    console.error("[google-calendar] upsert error:", String(err).slice(0, 160));
    return { action: "failed", reason: "exception" };
  }
}

/** Remove the mirrored event for a GHL appointment id. Never throws. */
export async function deleteEvent(ghlAppointmentId: string): Promise<UpsertResult> {
  const cfg = config();
  if (!cfg) {
    noopBecauseUnconfigured("event delete");
    return { action: "skipped", reason: "not configured" };
  }
  try {
    const existing = await findEventByGhlId(ghlAppointmentId);
    if (!existing) return { action: "skipped", reason: "no mirrored event" };
    return deleteEventById(existing.id);
  } catch (err) {
    console.error("[google-calendar] delete error:", String(err).slice(0, 160));
    return { action: "failed", reason: "exception" };
  }
}

/** Delete by Google event id (used by the reconciler, which already has ids). */
export async function deleteEventById(eventId: string): Promise<UpsertResult> {
  const cfg = config();
  if (!cfg) return { action: "skipped", reason: "not configured" };
  const res = await calFetch(`/calendars/${encodeURIComponent(cfg.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, {
    method: "DELETE",
  });
  // 410 Gone = already deleted, which is the state we wanted.
  return res.ok || res.status === 410 || res.status === 404
    ? { action: "deleted", eventId }
    : { action: "failed", reason: `HTTP ${res.status}` };
}

/**
 * Every event this system owns inside a window, keyed by GHL appointment id.
 * Only events carrying `oraManaged=1` are returned — Abdul's own entries are
 * invisible to the reconciler and can never be deleted by it.
 */
export async function listManagedEvents(timeMin: Date, timeMax: Date): Promise<Map<string, string>> {
  const cfg = config();
  const out = new Map<string, string>();
  if (!cfg) return out;

  let pageToken: string | undefined;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({
      privateExtendedProperty: `${MANAGED_FLAG}=1`,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      showDeleted: "false",
      singleEvents: "true",
      maxResults: "2500",
    });
    if (pageToken) qs.set("pageToken", pageToken);

    const res = await calFetch<{
      items?: { id: string; extendedProperties?: { private?: Record<string, string> } }[];
      nextPageToken?: string;
    }>(`/calendars/${encodeURIComponent(cfg.calendarId)}/events?${qs}`);
    if (!res.ok) break;

    for (const item of res.body?.items ?? []) {
      const ghlId = item.extendedProperties?.private?.ghlId;
      if (ghlId && item.id) out.set(ghlId, item.id);
    }
    pageToken = res.body?.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

/** Lightweight connectivity probe for /api/health. */
export async function pingCalendar(): Promise<{ ok: boolean; detail: string }> {
  const cfg = config();
  if (!cfg) return { ok: true, detail: "not connected — optional" };
  const res = await calFetch<{ summary?: string }>(`/calendars/${encodeURIComponent(cfg.calendarId)}`);
  if (!res.ok) return { ok: false, detail: res.status ? `HTTP ${res.status}` : "token refresh failed" };
  return { ok: true, detail: `connected — "${res.body?.summary ?? cfg.calendarId}"` };
}

/**
 * Booking-path entry point. Awaits the mirror but can never fail the booking:
 * all errors are swallowed and logged. Fast (2 HTTP calls, 8s cap each) and
 * safe to await inside a serverless handler, where fire-and-forget work would
 * be killed when the response is returned.
 */
export async function mirrorAppointmentSafe(appt: MirrorAppointment): Promise<UpsertResult> {
  try {
    const result = await upsertEvent(appt);
    if (result.action !== "skipped") {
      console.log(`[google-calendar] ${result.action} mirror for GHL appt ${appt.ghlId}${result.reason ? ` (${result.reason})` : ""}`);
    }
    return result;
  } catch (err) {
    console.error("[google-calendar] mirror failed (non-blocking):", String(err).slice(0, 160));
    return { action: "failed", reason: "exception" };
  }
}
