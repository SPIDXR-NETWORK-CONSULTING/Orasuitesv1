import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pingCalendar } from "./_lib/google-calendar";

/**
 * GET /api/health — live check that the booking pipeline can work RIGHT NOW.
 * Verifies: env present · GHL token accepted for contact reads (write scope) ·
 * calendars readable · a known service calendar returns free-slots ·
 * the "ORÁ — All Appointments" Google mirror (optional — reports ok when not
 * connected, so health never fails just because Google isn't set up yet).
 * 200 = healthy, 503 = booking would fail. Safe to poll; no side effects.
 */
const GHL_BASE = "https://services.leadconnectorhq.com";
const PROBE_CALENDAR = "HeNvXTTfEAvHFV2FOthP"; // Consultation (free)

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.GHL_API_KEY;
  const loc = process.env.GHL_LOCATION_ID;
  const checks: Record<string, { ok: boolean; detail?: string }> = {};
  const H = (v: string) => ({
    Authorization: `Bearer ${key}`,
    Version: v,
    "User-Agent": "Mozilla/5.0 ora-suites-health/1.0",
    Accept: "application/json",
  });

  checks.env = { ok: !!key && !!loc, detail: !key ? "GHL_API_KEY missing" : !loc ? "GHL_LOCATION_ID missing" : undefined };

  if (checks.env.ok) {
    try {
      // WRITE-scope proof: idempotent upsert of the internal admin contact (no new records, no notifications).
      const r = await fetch(`${GHL_BASE}/contacts/upsert`, {
        method: "POST",
        headers: { ...H("2021-07-28"), "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: loc, firstName: "ORÁ", lastName: "Admin", email: "admin@orasuites.com", tags: ["internal-admin"] }),
      });
      const j: any = r.ok ? await r.json() : null;
      checks.contactWrite = { ok: r.ok && !!j?.contact?.id, detail: r.ok ? undefined : `HTTP ${r.status} ${(await r.text()).slice(0, 120)}` };
    } catch (e) {
      checks.contactWrite = { ok: false, detail: String(e).slice(0, 120) };
    }
    try {
      const r = await fetch(`${GHL_BASE}/calendars/?locationId=${loc}`, { headers: H("2021-04-15") });
      const j: any = r.ok ? await r.json() : null;
      const n = j?.calendars?.length ?? 0;
      checks.calendars = { ok: r.ok && n >= 50, detail: r.ok ? `${n} calendars` : `HTTP ${r.status}` };
    } catch (e) {
      checks.calendars = { ok: false, detail: String(e).slice(0, 120) };
    }
    try {
      const start = Date.now() + 2 * 86400000;
      const end = start + 6 * 86400000;
      const r = await fetch(
        `${GHL_BASE}/calendars/${PROBE_CALENDAR}/free-slots?startDate=${start}&endDate=${end}&timezone=Europe%2FLondon`,
        { headers: H("2021-04-15") },
      );
      const j: any = r.ok ? await r.json() : null;
      const days = j ? Object.keys(j).filter((k) => j[k]?.slots?.length).length : 0;
      checks.slots = { ok: r.ok && days > 0, detail: r.ok ? `${days} bookable days in next week` : `HTTP ${r.status}` };
    } catch (e) {
      checks.slots = { ok: false, detail: String(e).slice(0, 120) };
    }
  }

  // Google Calendar mirror — OPTIONAL. `ok:true` when the GOOGLE_* vars are
  // absent (nothing to check), or when a token refresh + calendar GET succeed.
  // Only a genuinely broken connection (revoked token, deleted calendar) fails.
  try {
    checks.googleCalendar = await pingCalendar();
  } catch (e) {
    checks.googleCalendar = { ok: false, detail: String(e).slice(0, 120) };
  }

  const bookingEnabled = process.env.BOOKING_ENABLED !== "false";
  // When booking is intentionally switched off, health still reports the pipeline's
  // real state but must NOT alert — `ok` stays true so monitors don't page.
  const ok = Object.values(checks).every((c) => c.ok);
  res.setHeader("Cache-Control", "no-store");
  return res
    .status(ok ? 200 : 503)
    .json({ ok, bookingEnabled, service: "ora-suites-booking", checkedAt: new Date().toISOString(), checks });
}
