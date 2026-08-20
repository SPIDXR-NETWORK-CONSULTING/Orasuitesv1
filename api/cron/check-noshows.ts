/**
 * GET|POST /api/cron/check-noshows — hourly no-show sweep.
 *
 * Reception marks an appointment as a no-show in GHL (Calendars → open the
 * appointment → status). That is the ONLY human step. Within the hour this job
 * finds it and does everything the clinic would otherwise have to remember:
 *
 *   1. KEEPS the deposit. If the money is still only HELD (`requires_capture`)
 *      it is CAPTURED — an uncaptured authorisation expires after about seven
 *      days and the clinic ends up with nothing, so "keeping" a deposit by
 *      leaving it alone silently loses it. If it was already captured at
 *      booking time (the normal case) there is nothing to do.
 *      A no-show deposit is NEVER refunded.
 *   2. Removes the Google mirror event, so the day sheet stops showing a client
 *      who did not come.
 *   3. Writes the no-show onto the CLIENT's GHL contact record, with what
 *      happened to their deposit. Contact notes are used because GHL discards
 *      notes written onto an appointment through the API (verified 20 Aug 2026)
 *      — see the header of api/booking/cancel.ts.
 *   4. Emails admin@orasuites.com with the client's contact details, the
 *      deposit outcome and the appointment id.
 *
 * GHL QUIRKS this relies on (verified against the live location, 17 Aug 2026):
 *   · the status field is returned as BOTH `appointmentStatus` and the
 *     misspelled `appoinmentStatus`; both are checked
 *   · soft-deleted appointments carry `deleted: true` with a live-looking
 *     status, so a deleted appointment is not treated as a no-show
 *
 * IDEMPOTENCY — see `alreadyHandled()`. The marker of record is a note on the
 * client's CONTACT containing `[ora-noshow:<appointmentId>]`, written LAST,
 * after the admin email has gone. The Stripe PaymentIntent also gets
 * `oraNoShowHandled: "1"`, which is what a human sees in the Stripe dashboard
 * when they ask why a deposit was kept, and is the fallback marker for the rare
 * appointment with no contact id.
 *
 * AUTH: identical to api/cron/sync-calendar.ts — `x-cron-key: $CRON_SECRET` or
 * Vercel Cron's `authorization: Bearer $CRON_SECRET`. No CRON_SECRET → 503,
 * never an open write path.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ghlFetch } from "../_lib/ghl.js";
import { appendContactNote } from "../_lib/ghl-contacts.js";
import { findService, depositPence } from "../_lib/catalogue.js";
import {
  isStripeConfigured,
  retrievePaymentIntent,
  capturePaymentIntent,
  updatePaymentIntent,
  findPaymentIntentByAppointment,
} from "../_lib/stripe.js";
import { paymentIntentIdFromNotes } from "../_lib/deposit-guard.js";
import { deleteEvent, teamUserIds, TEAM_BY_USER_ID } from "../_lib/google-calendar.js";
import { sendNoShowAdminAlert, noShowDepositLine, when, type NoShowDepositOutcome, type NoShowNotice } from "../_lib/booking-notify-2.js";

export const config = { maxDuration: 60 };

/** How far back each sweep looks. An hourly job only needs an hour; seven days
 *  means a run that fails all night, or a status set late, is still caught. */
const LOOKBACK_DAYS = 7;
/** Bound one run so a backlog can never blow the function timeout. */
const MAX_PER_RUN = 40;

/** GHL's spellings for "they didn't turn up". */
const NOSHOW_STATUSES = new Set(["noshow", "no-show", "no_show", "no show"]);

/** The durable "we have handled this" marker, written onto the client's contact. */
export function noShowMarker(appointmentId: string): string {
  return `[ora-noshow:${appointmentId}]`;
}

interface GhlEvent {
  id?: string;
  title?: string;
  calendarId?: string;
  contactId?: string;
  assignedUserId?: string;
  appointmentStatus?: string;
  appoinmentStatus?: string;
  deleted?: boolean;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

function statusOf(ev: GhlEvent): string {
  return String(ev.appointmentStatus ?? ev.appoinmentStatus ?? "").trim().toLowerCase();
}

export function isNoShow(ev: GhlEvent): boolean {
  return ev.deleted !== true && NOSHOW_STATUSES.has(statusOf(ev));
}

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
    return res.status(503).json({ ok: false, error: "CRON_SECRET is not configured — refusing to run an unauthenticated sweep." });
  }
  if (!authorised(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const locationId = process.env.GHL_LOCATION_ID;
  if (!process.env.GHL_API_KEY || !locationId) {
    return res.status(503).json({ ok: false, error: "GHL_API_KEY / GHL_LOCATION_ID missing" });
  }

  const startedAt = Date.now();
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - LOOKBACK_DAYS * 86_400_000);

  const stats = {
    practitioners: 0,
    scanned: 0,
    noShows: 0,
    alreadyHandled: 0,
    processed: 0,
    depositsCaptured: 0,
    depositsAlreadyHeld: 0,
    depositsNotFound: 0,
    captureFailures: 0,
    mirrorsRemoved: 0,
    adminEmailFailures: 0,
    capped: false,
  };
  const handled: { appointmentId: string; client: string; outcome: NoShowDepositOutcome }[] = [];

  /* 1 ─ every no-show in the window, across every practitioner ---------- */
  const candidates = new Map<string, GhlEvent>();
  for (const userId of teamUserIds()) {
    stats.practitioners++;
    const qs = new URLSearchParams({
      locationId,
      userId,
      startTime: String(windowStart.getTime()),
      endTime: String(windowEnd.getTime()),
    });
    const r = await ghlFetch<{ events?: GhlEvent[] }>(`/calendars/events?${qs}`, { version: "2021-04-15" }).catch((err) => {
      console.error("[check-noshows] GHL events read threw:", String(err).slice(0, 200));
      return { ok: false, status: 0, body: null } as const;
    });
    if (!r.ok) continue;
    for (const ev of r.body?.events ?? []) {
      if (!ev?.id) continue;
      stats.scanned++;
      if (isNoShow(ev)) candidates.set(ev.id, ev);
    }
  }
  stats.noShows = candidates.size;

  /* 2 ─ handle each one ------------------------------------------------- */
  for (const [appointmentId, ev] of Array.from(candidates.entries())) {
    if (stats.processed >= MAX_PER_RUN) {
      stats.capped = true;
      console.warn(`[check-noshows] hit the ${MAX_PER_RUN}-per-run cap; the rest will be picked up next hour.`);
      break;
    }

    const service = findService(ev.calendarId) ?? findService(stripClientFromTitle(ev.title));
    const serviceName = service?.name ?? stripClientFromTitle(ev.title) ?? "Appointment";
    const expectedDepositPence = service ? depositPence(service.price) : null;
    const contactId = ev.contactId || "";

    /* 2a ─ locate the deposit (Stripe metadata first, legacy notes second) */
    const paymentIntentId = await resolvePayment(appointmentId, ev.notes);

    /* 2b ─ have we been here before? */
    if (await alreadyHandled(appointmentId, contactId, paymentIntentId)) {
      stats.alreadyHandled++;
      continue;
    }

    stats.processed++;

    /* 2c ─ KEEP the deposit. This comes first: an uncaptured hold expires in
     *      about seven days, and every other step below is recoverable. */
    const settled = await keepDeposit(paymentIntentId, expectedDepositPence, appointmentId);
    if (settled.outcome === "captured") stats.depositsCaptured++;
    else if (settled.outcome === "already-captured") stats.depositsAlreadyHeld++;
    else if (settled.outcome === "not-found") stats.depositsNotFound++;
    else if (settled.outcome === "capture-failed") stats.captureFailures++;

    /* 2d ─ record it ON THE PAYMENT, so anyone looking at the money in the
     *      Stripe dashboard can see why it was kept. */
    if (paymentIntentId && isStripeConfigured()) {
      await updatePaymentIntent(paymentIntentId, {
        metadata: {
          oraNoShowHandled: "1",
          oraNoShowAt: new Date().toISOString(),
          oraNoShowAppointmentId: appointmentId,
        },
      }).catch(() => ({ ok: false }));
    }

    /* 2e ─ the client did not come, so the mirror must not say they did. */
    const removed = await deleteEvent(appointmentId).catch((err) => {
      console.error("[check-noshows] google mirror delete failed:", String(err).slice(0, 160));
      return { action: "failed" as const };
    });
    if (removed.action === "deleted") stats.mirrorsRemoved++;

    const contact = contactId ? await contactBrief(contactId) : {};
    const notice: NoShowNotice = {
      appointmentId,
      contactId: contactId || null,
      clientName: contact.name || stripServiceFromTitle(ev.title) || "Client",
      clientEmail: contact.email ?? null,
      clientPhone: contact.phone ?? null,
      serviceName,
      startTime: ev.startTime || "",
      practitioner: (ev.assignedUserId && TEAM_BY_USER_ID.get(ev.assignedUserId)) || null,
      expectedDepositPence,
      outcome: settled.outcome,
      paymentIntentId: paymentIntentId ?? null,
      mirrorRemoved: removed.action === "deleted",
    };

    /* 2f ─ tell reception BEFORE marking it handled. If the email fails, the
     *      marker is not written and the next sweep tries again — a duplicate
     *      alert is a nuisance; a silent no-show is money nobody knows about.
     *      Re-running cannot charge twice: capture is idempotent per intent. */
    const emailed = await sendNoShowAdminAlert(notice).catch((err) => {
      console.error("[check-noshows] admin alert threw:", String(err).slice(0, 200));
      return false;
    });
    if (!emailed) {
      stats.adminEmailFailures++;
      console.error(
        `[check-noshows] appointment ${appointmentId}: the no-show was handled (${settled.outcome}) but reception could ` +
          `NOT be emailed. Leaving it unmarked so the next sweep retries.`,
      );
    }

    /* 2g ─ the marker of record, written last. */
    if (emailed && contactId) {
      await appendContactNote(
        contactId,
        `No-show — ${serviceName}, ${when(ev.startTime || "")} (appt ${appointmentId}).\n` +
          `${noShowDepositLine(notice)}\n` +
          `Recorded automatically by the ORÁ booking system. ${noShowMarker(appointmentId)}`,
      ).catch((err) => {
        console.error("[check-noshows] contact note failed:", String(err).slice(0, 200));
        return false;
      });
    }

    handled.push({ appointmentId, client: notice.clientName, outcome: settled.outcome });
    console.log(`[check-noshows] ${appointmentId} (${serviceName}, ${notice.clientName}) → deposit ${settled.outcome}`);
  }

  const summary = {
    ok: stats.captureFailures === 0 && stats.adminEmailFailures === 0,
    service: "ora-suites-noshow-sweep",
    window: { from: windowStart.toISOString(), to: windowEnd.toISOString(), days: LOOKBACK_DAYS },
    durationMs: Date.now() - startedAt,
    ...stats,
    handled,
  };
  console.log("[check-noshows]", JSON.stringify(summary));
  return res.status(200).json(summary);
}

/* ── helpers ─────────────────────────────────────────────── */

/**
 * Has this no-show already been dealt with?
 *
 * PRIMARY: a note on the client's CONTACT containing `[ora-noshow:<id>]`. It is
 * written last, after reception has been emailed, so its presence means the
 * whole sequence completed — not merely that the money was settled.
 *
 * FALLBACK: `metadata.oraNoShowHandled` on the PaymentIntent, for the rare
 * appointment with no contact id (where there is nothing to write a note to).
 *
 * Never throws: an unreadable marker must not stop the sweep. The cost of
 * guessing "not handled" is a duplicate email, never a duplicate charge —
 * capturePaymentIntent() is idempotent per intent and refuses a second capture.
 */
export async function alreadyHandled(
  appointmentId: string,
  contactId: string,
  paymentIntentId: string | null,
): Promise<boolean> {
  if (contactId) {
    const marker = noShowMarker(appointmentId);
    try {
      const got = await ghlFetch<any>(`/contacts/${encodeURIComponent(contactId)}/notes`, { version: "2021-07-28" });
      if (got.ok) {
        const notes: any[] = got.body?.notes ?? got.body?.note ?? [];
        if (Array.isArray(notes) && notes.some((n) => String(n?.body || "").includes(marker))) return true;
      }
    } catch (err) {
      console.error("[check-noshows] contact notes read failed:", String(err).slice(0, 160));
    }
  }

  if (paymentIntentId && isStripeConfigured()) {
    const got = await retrievePaymentIntent(paymentIntentId).catch(() => ({ ok: false }) as const);
    const meta = got.ok ? (got as { intent?: { metadata?: Record<string, string> } }).intent?.metadata : undefined;
    if (meta?.oraNoShowHandled === "1") return true;
  }

  return false;
}

/**
 * Keep the deposit. Never refunds, never releases, never throws.
 *
 *   held (`requires_capture`) → CAPTURE. This is the whole point: a hold that
 *        is merely left alone expires and the clinic gets nothing.
 *   taken (`succeeded`)       → nothing to do, the money is already ours.
 *   released (`canceled`)     → the hold went before we got here. Reported
 *                               honestly rather than dressed up as "kept".
 *   no payment located        → NEVER claim the customer did not pay. Reported
 *                               as not-found so a human checks Stripe.
 */
export async function keepDeposit(
  paymentIntentId: string | null,
  expectedDepositPence: number | null,
  appointmentId: string,
): Promise<{ outcome: NoShowDepositOutcome }> {
  if (!paymentIntentId || !isStripeConfigured()) {
    // Only the catalogue can prove a deposit does not exist. No service, no proof.
    return { outcome: expectedDepositPence === 0 ? "none" : "not-found" };
  }

  const got = await retrievePaymentIntent(paymentIntentId).catch(() => ({ ok: false }) as const);
  const status = got.ok ? (got as { intent?: { status?: string } }).intent?.status : undefined;

  if (status === "succeeded") return { outcome: "already-captured" };
  if (status === "canceled") {
    console.warn(`[check-noshows] appointment ${appointmentId}: the hold ${paymentIntentId} was already released — nothing to keep.`);
    return { outcome: "released-earlier" };
  }

  if (status === "requires_capture") {
    const cap = await capturePaymentIntent(paymentIntentId).catch(() => ({ ok: false, error: "capture threw" }) as const);
    if (cap.ok) {
      return { outcome: (cap as { alreadyCaptured?: boolean }).alreadyCaptured ? "already-captured" : "captured" };
    }
    console.error(
      `[check-noshows] CRITICAL: appointment ${appointmentId} is a no-show and the deposit ${paymentIntentId} is still ` +
        `only HELD; capturing it FAILED (${(cap as { error?: string }).error ?? "unknown"}). Capture it by hand in ` +
        `Stripe within 7 days or the money is lost.`,
    );
    return { outcome: "capture-failed" };
  }

  // A status we could not read, or one that was never confirmed. Do not guess.
  console.warn(`[check-noshows] appointment ${appointmentId}: deposit ${paymentIntentId} is in state "${status ?? "unknown"}" — flagged for a human.`);
  return { outcome: "not-found" };
}

/** Stripe metadata first, the legacy notes marker second. Never throws. */
async function resolvePayment(appointmentId: string, notes: string | null | undefined): Promise<string | null> {
  if (isStripeConfigured()) {
    const found = await findPaymentIntentByAppointment(appointmentId).catch(() => ({ ok: false }) as const);
    const id = found.ok ? (found as { intent?: { id?: string } }).intent?.id : undefined;
    if (id) return id;
  }
  return paymentIntentIdFromNotes(notes);
}

/** Name, email and phone for the alert. Never throws. */
async function contactBrief(contactId: string): Promise<{ name?: string; email?: string | null; phone?: string | null }> {
  try {
    const got = await ghlFetch<any>(`/contacts/${encodeURIComponent(contactId)}`, { version: "2021-07-28" });
    const c = got.body?.contact ?? got.body;
    if (!got.ok || !c) return {};
    return {
      name: c.contactName || [c.firstName, c.lastName].filter(Boolean).join(" ") || undefined,
      email: c.email ?? null,
      phone: c.phone ?? null,
    };
  } catch {
    return {};
  }
}

/**
 * Booking titles are `${serviceName} — ${clientName}`.
 *
 * Split on the LAST separator, not the first: real service names contain one
 * ("Anti-Wrinkle Injections — 1 Area"), so splitting on the first turns that
 * client into "1 Area — Ada Lovelace" in every email reception reads. Client
 * names do not contain " — ". (api/booking/cancel.ts still splits on the
 * first — same latent bug, left alone rather than edited from here.)
 */
function stripClientFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const i = title.lastIndexOf(" — ");
  return i > 0 ? title.slice(0, i) : title;
}
function stripServiceFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const i = title.lastIndexOf(" — ");
  return i > 0 ? title.slice(i + 3) : undefined;
}
