import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/health — live check that the booking pipeline can work RIGHT NOW.
 * Verifies: env present · GHL token accepted for contact reads (write scope) ·
 * calendars readable · a known service calendar returns free-slots.
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
      const r = await fetch(`${GHL_BASE}/contacts/?locationId=${loc}&limit=1`, { headers: H("2021-07-28") });
      checks.contacts = { ok: r.ok, detail: r.ok ? undefined : `HTTP ${r.status} ${(await r.text()).slice(0, 120)}` };
    } catch (e) {
      checks.contacts = { ok: false, detail: String(e).slice(0, 120) };
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

  const ok = Object.values(checks).every((c) => c.ok);
  res.setHeader("Cache-Control", "no-store");
  return res.status(ok ? 200 : 503).json({ ok, service: "ora-suites-booking", checkedAt: new Date().toISOString(), checks });
}
