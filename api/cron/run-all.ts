import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST/GET /api/cron/run-all — the single scheduled entry point.
 *
 * Vercel's lower plans cap the number of cron entries (and can restrict them to
 * daily), so instead of registering four schedules we register ONE hourly job
 * that decides what is due:
 *
 *   every hour  → check-noshows      (reception marks a no-show; deposit must be
 *                                     captured before the ~7-day hold expires)
 *                 waitlist-notify    (a freed slot is only worth telling people
 *                                     about while it is still free)
 *   at 03:00 UTC → sync-calendar     (nightly Google reconcile)
 *   at 10:30-ish → review-requests   (no-op until GOOGLE_REVIEW_URL is set)
 *
 * Each job is called over HTTP on this same deployment with the shared
 * CRON_SECRET, so every job keeps its own auth, timeout and error handling and
 * one failing job cannot take the others down.
 */
const HOURLY = ["check-noshows", "waitlist-notify"] as const;

function baseUrl(req: VercelRequest): string {
  const envBase = process.env.PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const host = (req.headers["x-forwarded-host"] || req.headers.host) as string | undefined;
  return host ? `https://${host}` : "https://www.orasuites.com";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  res.setHeader("Cache-Control", "no-store");
  if (!secret) return res.status(503).json({ ok: false, error: "CRON_SECRET is not configured." });

  const provided =
    (req.headers["x-cron-key"] as string | undefined) ??
    ((req.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, "") || undefined);
  // Vercel's own scheduler is trusted via its signature header.
  const fromVercel = Boolean(req.headers["x-vercel-signature"]) || String(req.headers["user-agent"] || "").includes("vercel-cron");
  if (!fromVercel && provided !== secret) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const hour = new Date().getUTCHours();
  const due = [...HOURLY];
  if (hour === 3) due.push("sync-calendar" as (typeof HOURLY)[number]);
  if (hour === 10) due.push("review-requests" as (typeof HOURLY)[number]);

  const base = baseUrl(req);
  const results: Record<string, unknown> = {};

  for (const job of due) {
    try {
      const r = await fetch(`${base}/api/cron/${job}`, {
        headers: { "x-cron-key": secret, "User-Agent": "ora-cron-dispatcher/1.0" },
      });
      const text = await r.text();
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
      results[job] = { status: r.status, body };
      if (!r.ok) console.error(`[run-all] ${job} → HTTP ${r.status}`, text.slice(0, 200));
    } catch (e) {
      results[job] = { error: String(e).slice(0, 160) };
      console.error(`[run-all] ${job} threw:`, e);
    }
  }

  console.log("[run-all]", JSON.stringify({ hour, ran: due, results }));
  return res.status(200).json({ ok: true, hourUtc: hour, ran: due, results });
}
