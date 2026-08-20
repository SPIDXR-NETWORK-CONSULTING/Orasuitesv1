/**
 * GET|POST /api/cron/review-requests — ask yesterday's clients for a review.
 *
 * SWITCHED OFF BY DEFAULT. The clinic does not own its Google Business Profile
 * yet, so with `GOOGLE_REVIEW_URL` unset this job sends nothing, writes nothing
 * and logs "review requests disabled (no GOOGLE_REVIEW_URL)". Setting that one
 * variable to the review link turns the whole feature on — no code change.
 *
 * When enabled: scan the last 3 days of appointments for every practitioner in
 * shared/catalogue.json (same window and endpoint as api/cron/sync-calendar.ts),
 * keep the ones that finished 20–72 hours ago and were not cancelled, and email
 * each client once. "Once" is enforced by a contact note carrying the
 * appointment id, so re-running the job never double-asks anybody.
 *
 * AUTH: `x-cron-key: $CRON_SECRET`, or Vercel Cron's `authorization: Bearer
 * $CRON_SECRET`. Without CRON_SECRET the endpoint refuses to run (503).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { teamUserIds } from "../_lib/google-calendar.js";
import {
  MAX_CONTACT_LOOKUPS,
  MAX_REVIEW_EMAILS_PER_RUN,
  MAX_AGE_HOURS,
  MIN_AGE_HOURS,
  finishedAppointmentsFor,
  isReviewRequestEnabled,
  readContact,
  requestReview,
  type ContactLite,
} from "../_lib/review-request.js";

export const config = { maxDuration: 60 };

function authorised(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerKey = req.headers["x-cron-key"];
  const key = Array.isArray(headerKey) ? headerKey[0] : headerKey;
  if (key === secret) return true;
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth === `Bearer ${secret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.CRON_SECRET) {
    return res.status(503).json({ ok: false, error: "CRON_SECRET is not configured — refusing to run an unauthenticated job." });
  }
  if (!authorised(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });

  /* THE SWITCH — checked before any GHL call, so a disabled job costs nothing. */
  if (!isReviewRequestEnabled()) {
    console.log("[review-requests] review requests disabled (no GOOGLE_REVIEW_URL)");
    return res.status(200).json({
      ok: true,
      service: "ora-suites-review-requests",
      enabled: false,
      skipped: "review requests disabled (no GOOGLE_REVIEW_URL)",
      sent: 0,
    });
  }

  if (!process.env.GHL_API_KEY || !process.env.GHL_LOCATION_ID) {
    return res.status(503).json({ ok: false, error: "GHL_API_KEY / GHL_LOCATION_ID missing" });
  }

  const startedAt = Date.now();
  const stats = {
    practitioners: 0,
    finished: 0,
    sent: 0,
    alreadyAsked: 0,
    failed: 0,
    skippedNoEmail: 0,
    capped: false,
  };

  /* 1 ─ every appointment that finished ~yesterday ---------------------- */
  const appointments = new Map<string, Awaited<ReturnType<typeof finishedAppointmentsFor>>[number]>();
  for (const userId of teamUserIds()) {
    stats.practitioners++;
    for (const appt of await finishedAppointmentsFor(userId, startedAt)) appointments.set(appt.id, appt);
  }
  stats.finished = appointments.size;

  /* 2 ─ ask each client once -------------------------------------------- */
  const contactCache = new Map<string, ContactLite | null>();
  let lookups = 0;
  let budget = MAX_REVIEW_EMAILS_PER_RUN;

  for (const appt of Array.from(appointments.values())) {
    if (budget <= 0) {
      stats.capped = true;
      break;
    }

    let contact = contactCache.get(appt.contactId);
    if (contact === undefined) {
      if (lookups >= MAX_CONTACT_LOOKUPS) {
        stats.capped = true;
        break;
      }
      lookups++;
      contact = await readContact(appt.contactId);
      contactCache.set(appt.contactId, contact);
    }
    if (!contact || !contact.email) {
      stats.skippedNoEmail++;
      continue;
    }

    const outcome = await requestReview(appt, contact);
    if (outcome === "sent") {
      stats.sent++;
      budget--;
    } else if (outcome === "already") stats.alreadyAsked++;
    else if (outcome === "failed") stats.failed++;
  }

  const summary = {
    ok: stats.failed === 0,
    service: "ora-suites-review-requests",
    enabled: true,
    window: { minAgeHours: MIN_AGE_HOURS, maxAgeHours: MAX_AGE_HOURS },
    caps: { emails: MAX_REVIEW_EMAILS_PER_RUN, contactLookups: MAX_CONTACT_LOOKUPS },
    contactLookups: lookups,
    durationMs: Date.now() - startedAt,
    ...stats,
  };
  console.log("[review-requests]", JSON.stringify(summary));
  return res.status(200).json(summary);
}
