import type { VercelRequest, VercelResponse } from "@vercel/node";
import syncCalendar from "../_lib/jobs/sync-calendar.js";
import checkNoshows from "../_lib/jobs/check-noshows.js";
import waitlistNotify from "../_lib/jobs/waitlist-notify.js";
import reviewRequests from "../_lib/jobs/review-requests.js";

/**
 * /api/cron/<job> — every scheduled job behind ONE serverless function.
 *
 * Vercel's Hobby plan caps a deployment at 12 functions and permits only a
 * single DAILY cron, so the four jobs live in api/_lib/jobs/ (underscore = not a
 * route) and are dispatched from here.
 *
 *   /api/cron/run-all                 → everything (what the daily cron calls)
 *   /api/cron/run-all?jobs=hourly     → only the time-sensitive pair, for an
 *                                       external hourly scheduler
 *   /api/cron/sync-calendar           → one job, for running by hand
 *
 * Auth is each job's own CRON_SECRET check; run-all re-checks it here too.
 */
type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown;

const JOBS: Record<string, Handler> = {
  "sync-calendar": syncCalendar as Handler,
  "check-noshows": checkNoshows as Handler,
  "waitlist-notify": waitlistNotify as Handler,
  "review-requests": reviewRequests as Handler,
};

/** Time-sensitive: a no-show deposit must be captured before the hold expires,
 *  and a freed slot is only worth announcing while it is still free. */
const HOURLY = ["check-noshows", "waitlist-notify"];
const ALL = [...HOURLY, "sync-calendar", "review-requests"];

/** Runs a job in-process and captures whatever it would have responded. */
async function runJob(name: string, req: VercelRequest): Promise<unknown> {
  const handler = JOBS[name];
  if (!handler) return { error: "unknown job" };
  let payload: unknown = null;
  let status = 0;
  const fake = {
    setHeader() {},
    status(code: number) { status = code; return this; },
    json(body: unknown) { payload = body; return this; },
    send(body: unknown) { payload = body; return this; },
    end() { return this; },
  } as unknown as VercelResponse;
  try {
    await handler(req, fake);
    return { status, body: payload };
  } catch (e) {
    console.error(`[cron] ${name} threw:`, e);
    return { status: 500, error: String(e).slice(0, 200) };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  const job = String((req.query as Record<string, unknown>).job || "");

  if (job !== "run-all") {
    const single = JOBS[job];
    if (!single) return res.status(404).json({ ok: false, error: `Unknown job "${job}"` });
    return single(req, res); // the job does its own auth + response
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(503).json({ ok: false, error: "CRON_SECRET is not configured." });
  const provided =
    (req.headers["x-cron-key"] as string | undefined) ??
    ((req.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, "") || undefined);
  const fromVercel =
    Boolean(req.headers["x-vercel-signature"]) ||
    String(req.headers["user-agent"] || "").includes("vercel-cron");
  if (!fromVercel && provided !== secret) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const due = String((req.query as Record<string, unknown>).jobs || "") === "hourly" ? HOURLY : ALL;
  const results: Record<string, unknown> = {};
  for (const name of due) results[name] = await runJob(name, req);

  console.log("[cron:run-all]", JSON.stringify({ ran: due, results }));
  return res.status(200).json({ ok: true, ran: due, results });
}
