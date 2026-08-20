/**
 * /api/booking/cancel — self-service cancellation with automatic refunds.
 *
 *   GET  ?a=<appointmentId>&c=<contactId>&t=<token>
 *        Shows what WILL happen (refund or not) without changing anything.
 *        Browsers get a small confirmation page; anything else gets JSON.
 *
 *   POST same query
 *        Performs it.
 *
 * AUTH: `t` is HMAC-SHA256(`${appointmentId}.${contactId}`, BOOKING_CANCEL_SECRET),
 * base64url. See api/_lib/cancel-token.ts.
 *
 * STAFF: add `&clinic=1` plus the ADMIN_CANCEL_SECRET (header
 * `x-admin-cancel-secret`, or `&s=<secret>`). A clinic cancellation ALWAYS
 * refunds in full, whatever the timing. The customer token is not required.
 *
 * REFUND RULES (owner-confirmed):
 *   · customer cancels  > 24h before start  → full refund
 *   · customer cancels <= 24h before start  → deposit retained, said plainly first
 *   · clinic cancels                        → full refund, always
 *   · reschedule                            → NOT handled here; the deposit is
 *     kept and carried to the new time, so rescheduling never touches this route.
 *
 * ORDER OF OPERATIONS: the GHL appointment is cancelled BEFORE the refund is
 * issued. Both steps are individually retry-safe (the refund is idempotent per
 * payment intent), but if only one can succeed, "cancelled, refund pending" is
 * recoverable by staff whereas "refunded, still on the calendar" silently blocks
 * a slot and sends a practitioner to an empty room.
 *
 * REFUND vs RELEASE: deposits are authorised at booking and captured seconds
 * later, so by the time anyone cancels the money has almost always been TAKEN
 * (`succeeded`) and giving it back means a refund. The rare exception is an
 * intent still sitting at `requires_capture` — the capture never ran — where
 * nothing was ever charged and the right move is to RELEASE the hold, which
 * costs nothing and never touches the customer's statement. `settleDeposit()`
 * below picks between the two; the four business rules above are unchanged.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ghlFetch } from "../_lib/ghl.js";
import { findService, formatPence, depositPence } from "../_lib/catalogue.js";
import { refundPaymentIntent, cancelPaymentIntent, capturePaymentIntent, retrievePaymentIntent, isStripeConfigured } from "../_lib/stripe.js";
import { paymentIntentIdFromNotes } from "../_lib/deposit-guard.js";
import { verifyCancelToken, verifyAdminSecret } from "../_lib/cancel-token.js";
import { deleteEvent, isCancelled } from "../_lib/google-calendar.js";
import { sendCancellationEmail } from "../_lib/booking-notify.js";

const BOOKINGS_PIPELINE_ID = process.env.GHL_BOOKINGS_PIPELINE_ID || "6NsVFiUCxgAelJszMS1z";
const CANCELLED_STAGE_ID = process.env.GHL_BOOKINGS_CANCELLED_STAGE_ID || "45d77107-9737-4898-afbf-1e4ed61ef9b9";
const REFUND_WINDOW_HOURS = 24;

interface Appointment {
  id: string;
  contactId?: string;
  calendarId?: string;
  startTime?: string;
  title?: string;
  notes?: string;
  appointmentStatus?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const q = req.query as Record<string, string | string[] | undefined>;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
  const appointmentId = one(q.a).trim();
  const contactId = one(q.c).trim();
  const token = one(q.t).trim();
  const clinic = one(q.clinic) === "1";
  const wantsHtml = String(req.headers.accept || "").includes("text/html");

  const reply = (status: number, payload: Record<string, unknown>, page?: { title: string; lines: string[]; action?: "confirm" }) => {
    if (wantsHtml && page) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(status).send(renderPage(page.title, page.lines, page.action ? currentUrl(req) : undefined));
    }
    return res.status(status).json(payload);
  };

  if (!appointmentId || (!clinic && !contactId)) {
    return reply(400, { error: "This cancellation link is incomplete." }, { title: "Link incomplete", lines: ["This cancellation link is missing something. Please reply to your confirmation email and we'll cancel it for you."] });
  }

  /* ── Auth ─────────────────────────────────────────────── */
  if (clinic) {
    const provided = (req.headers["x-admin-cancel-secret"] as string | undefined) || one(q.s);
    if (!verifyAdminSecret(provided)) {
      return reply(401, { error: "Not authorised." }, { title: "Not authorised", lines: ["This staff cancellation link isn't valid."] });
    }
  } else if (!verifyCancelToken(appointmentId, contactId, token)) {
    return reply(401, { error: "This cancellation link isn't valid or has expired." }, {
      title: "Link not valid",
      lines: ["This cancellation link isn't valid. Please reply to your confirmation email and we'll cancel it for you."],
    });
  }

  /* ── Fetch the appointment ────────────────────────────── */
  let appt: Appointment | null = null;
  try {
    const got = await ghlFetch<any>(`/calendars/events/appointments/${encodeURIComponent(appointmentId)}`, { version: "2021-04-15" });
    const ev = got.body?.event ?? got.body?.appointment ?? got.body;
    if (got.ok && ev?.id) appt = ev as Appointment;
    else console.error("[cancel] appointment lookup failed:", got.status, JSON.stringify(got.body).slice(0, 300));
  } catch (err) {
    console.error("[cancel] appointment lookup threw:", String(err).slice(0, 200));
  }

  if (!appt) {
    return reply(404, { error: "We couldn't find that appointment." }, { title: "Appointment not found", lines: ["We couldn't find that appointment. It may already have been cancelled — reply to your confirmation email and we'll check."] });
  }

  const service = findService(appt.calendarId) ?? findService(stripClientFromTitle(appt.title));
  const serviceName = service?.name ?? stripClientFromTitle(appt.title) ?? "Your appointment";
  const startTime = appt.startTime || "";
  const paymentIntentId = paymentIntentIdFromNotes(appt.notes);
  // Same 20% maths as the charge, from the same source of truth.
  const depositAmount = service ? depositPence(service.price) : 0;
  const resolvedContactId = contactId || appt.contactId || "";

  const hoursUntil = startTime ? (new Date(startTime).getTime() - Date.now()) / 3_600_000 : Number.NaN;
  const outsideWindow = Number.isFinite(hoursUntil) ? hoursUntil > REFUND_WINDOW_HOURS : true;
  const hasDeposit = Boolean(paymentIntentId) && isStripeConfigured();
  const willRefund = hasDeposit && (clinic || outsideWindow);

  /* ── Already cancelled → idempotent success ───────────── */
  if (isCancelled(appt.appointmentStatus)) {
    return reply(200, {
      success: true,
      alreadyCancelled: true,
      appointmentId,
      refunded: false,
      message: "This appointment was already cancelled.",
    }, {
      title: "Already cancelled",
      lines: [`${escapeHtml(serviceName)} is already cancelled — there's nothing more to do.`, "If you were expecting a refund and haven't seen it, reply to your confirmation email and we'll check it for you."],
    });
  }

  /* ── GET: preview only ────────────────────────────────── */
  if (req.method === "GET") {
    const refundLine = !hasDeposit
      ? "There is no deposit on this booking, so there is nothing to refund."
      : willRefund
        ? `Your ${formatPence(depositAmount || 0)} deposit will be refunded in full.`
        : `This is within ${REFUND_WINDOW_HOURS} hours of your appointment, so the ${formatPence(depositAmount || 0)} deposit will NOT be refunded.`;

    return reply(200, {
      appointmentId,
      serviceName,
      startTime,
      hoursUntilStart: Number.isFinite(hoursUntil) ? Math.round(hoursUntil * 10) / 10 : null,
      hasDeposit,
      depositPence: hasDeposit ? depositAmount : 0,
      willRefund,
      refundPolicy: `Cancel more than ${REFUND_WINDOW_HOURS} hours before the appointment for a full refund of the deposit. Within ${REFUND_WINDOW_HOURS} hours the deposit is retained.`,
      message: refundLine,
      confirmWith: "POST this same URL to confirm the cancellation.",
    }, {
      title: "Cancel your appointment",
      lines: [
        `<strong>${escapeHtml(serviceName)}</strong>`,
        startTime ? escapeHtml(formatWhen(startTime)) : "",
        "",
        escapeHtml(refundLine),
      ].filter(Boolean),
      action: "confirm",
    });
  }

  /* ── POST: do it ──────────────────────────────────────── */
  // 1. Cancel in GHL first — see the header comment for why this comes before
  //    the refund.
  const cancelRes = await ghlFetch<any>(`/calendars/events/appointments/${encodeURIComponent(appointmentId)}`, {
    method: "PUT",
    version: "2021-04-15",
    body: JSON.stringify({ appointmentStatus: "cancelled" }),
  }).catch((err) => {
    console.error("[cancel] GHL cancel threw:", String(err).slice(0, 200));
    return { ok: false, status: 0, body: null } as const;
  });

  if (!cancelRes.ok) {
    console.error("[cancel] GHL cancel failed:", cancelRes.status, JSON.stringify(cancelRes.body).slice(0, 300));
    return reply(502, { error: "We couldn't cancel that just now. Nothing has changed — please reply to your confirmation email." }, {
      title: "Couldn't cancel",
      lines: ["We couldn't cancel that just now, and nothing has been changed.", "Please reply to your confirmation email and we'll cancel it for you straight away."],
    });
  }

  // 2. Settle the deposit per the rules — refund if it was taken, release the
  //    hold if it never was. Idempotent per payment intent either way.
  let refunded = false;
  let released = false;
  let refundError: string | undefined;
  if (paymentIntentId && isStripeConfigured()) {
    const settled = await settleDeposit(
      paymentIntentId,
      willRefund,
      clinic ? "clinic-initiated cancellation" : `customer cancelled ${Math.round(hoursUntil)}h before start`,
      appointmentId,
    );
    refunded = settled.refunded;
    released = settled.released;
    refundError = settled.error;
  }

  // 3. Remove the Google mirror event (non-fatal).
  await deleteEvent(appointmentId).catch((err) => {
    console.error("[cancel] google mirror delete failed:", String(err).slice(0, 160));
    return null;
  });

  // 4. Move the opportunity to Online Bookings → Cancelled (non-fatal).
  if (resolvedContactId) await moveOpportunityToCancelled(resolvedContactId, serviceName).catch(() => null);

  // 5. Tell the customer exactly what happened to their money (non-fatal).
  if (resolvedContactId) {
    await sendCancellationEmail({
      contactId: resolvedContactId,
      clientName: stripServiceFromTitle(appt.title) || "there",
      serviceName,
      startTime,
      refundedPence: refunded ? depositAmount : 0,
      retainedPence: hasDeposit && !willRefund ? depositAmount : 0,
      releasedPence: released ? depositAmount : 0,
      byClinic: clinic,
    }).catch(() => false);
  }

  const outcome = refunded
    ? `Your ${formatPence(depositAmount)} deposit has been refunded in full.`
    : released
      ? `Your card was never charged — the ${formatPence(depositAmount)} hold on it has been released.`
      : hasDeposit && !willRefund
        ? `As this is within ${REFUND_WINDOW_HOURS} hours of the appointment, the ${formatPence(depositAmount)} deposit is retained.`
        : refundError
          ? "Your refund is being processed manually — we'll be in touch shortly."
          : "There was no deposit on this booking.";

  return reply(200, {
    success: true,
    appointmentId,
    cancelled: true,
    refunded,
    released,
    refundedPence: refunded ? depositAmount : 0,
    releasedPence: released ? depositAmount : 0,
    retainedPence: hasDeposit && !willRefund ? depositAmount : 0,
    byClinic: clinic,
    ...(refundError ? { refundPending: true } : {}),
    message: outcome,
  }, {
    title: "Appointment cancelled",
    lines: [
      `<strong>${escapeHtml(serviceName)}</strong> has been cancelled.`,
      escapeHtml(outcome),
      "We've emailed you a confirmation. We'd love to see you another time.",
    ],
  });
}

/* ── helpers ─────────────────────────────────────────────── */

interface SettleResult {
  /** money was given back (a real refund of a captured deposit) */
  refunded: boolean;
  /** an untaken authorisation was released — the customer was never charged */
  released: boolean;
  error?: string;
}

/**
 * Give the deposit back, or keep it, according to `giveBack` — choosing refund
 * vs release from the payment's actual state. Never throws.
 *
 *   held  + give back → release the hold (no charge ever happened)
 *   taken + give back → refund
 *   held  + keep      → CAPTURE it. "Retained" has to mean money we actually
 *                       hold; a hold that is merely left alone expires in ~7
 *                       days and the clinic ends up with nothing. Vanishingly
 *                       rare — capture normally runs seconds after booking.
 *   taken + keep      → nothing to do
 */
export async function settleDeposit(
  paymentIntentId: string,
  giveBack: boolean,
  reason: string,
  appointmentId: string,
): Promise<SettleResult> {
  const got = await retrievePaymentIntent(paymentIntentId).catch(() => ({ ok: false }) as const);
  const status = got.ok ? (got as { intent?: { status?: string } }).intent?.status : undefined;

  if (!giveBack) {
    if (status === "requires_capture") {
      const cap = await capturePaymentIntent(paymentIntentId).catch(() => ({ ok: false, error: "capture threw" }) as const);
      if (!cap.ok) {
        console.error(
          `[cancel] appointment ${appointmentId} cancelled inside the window and the deposit ${paymentIntentId} was ` +
            `still only held; capturing it FAILED (${(cap as { error?: string }).error ?? "unknown"}). Capture by hand in Stripe within 7 days.`,
        );
      }
    }
    return { refunded: false, released: false };
  }

  if (status === "canceled") {
    console.warn(`[cancel] ${paymentIntentId} was already released — treating as done.`);
    return { refunded: false, released: true };
  }

  if (status === "requires_capture") {
    const rel = await cancelPaymentIntent(paymentIntentId, reason).catch(() => ({ ok: false, error: "cancel threw" }) as const);
    if (rel.ok) return { refunded: false, released: true };
    const err = (rel as { error?: string }).error;
    console.error(
      `[cancel] appointment ${appointmentId} is cancelled but releasing the hold ${paymentIntentId} FAILED (${err}). ` +
        `The customer has NOT been charged; the hold expires by itself in about 7 days.`,
    );
    return { refunded: false, released: false, error: err };
  }

  // `succeeded`, or a status we could not read — treat as taken and refund.
  const r = await refundPaymentIntent(paymentIntentId, reason);
  if (r.ok && r.alreadyRefunded) console.warn(`[cancel] ${paymentIntentId} was already refunded — treating as done.`);
  if (r.ok) return { refunded: true, released: false };

  console.error(
    `[cancel] CRITICAL: appointment ${appointmentId} is cancelled but the refund of ${paymentIntentId} FAILED (${r.error}). Refund manually in Stripe.`,
  );
  return { refunded: false, released: false, error: r.error };
}

/** Booking titles are `${serviceName} — ${clientName}`. */
function stripClientFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const i = title.indexOf(" — ");
  return i > 0 ? title.slice(0, i) : title;
}
function stripServiceFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const i = title.indexOf(" — ");
  return i > 0 ? title.slice(i + 3) : undefined;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/London", hour12: false,
  }).format(d);
}

function currentUrl(req: VercelRequest): string {
  return req.url || "";
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/**
 * Find this customer's open Online-Bookings opportunity and move it to
 * Cancelled. Best-effort: a CRM tidy-up must never fail a cancellation.
 */
async function moveOpportunityToCancelled(contactId: string, serviceName: string): Promise<void> {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) return;

  const found = await ghlFetch<any>(
    `/opportunities/search?location_id=${encodeURIComponent(locationId)}&contact_id=${encodeURIComponent(contactId)}&limit=20`,
    { version: "2021-07-28" },
  );
  if (!found.ok) return;

  const list: any[] = found.body?.opportunities ?? [];
  const match =
    list.find((o) => o.pipelineId === BOOKINGS_PIPELINE_ID && String(o.name || "").startsWith(serviceName) && o.status === "open") ??
    list.find((o) => o.pipelineId === BOOKINGS_PIPELINE_ID && o.status === "open");
  if (!match?.id) return;

  const updated = await ghlFetch(`/opportunities/${encodeURIComponent(match.id)}`, {
    method: "PUT",
    version: "2021-07-28",
    body: JSON.stringify({ pipelineId: BOOKINGS_PIPELINE_ID, pipelineStageId: CANCELLED_STAGE_ID }),
  });
  if (!updated.ok) console.error("[cancel] opportunity move failed:", updated.status, JSON.stringify(updated.body).slice(0, 200));
}

/**
 * A small, self-contained confirmation page in the ORÁ palette. No external
 * assets, no framework — this endpoint is reached straight from an email.
 */
function renderPage(title: string, lines: string[], confirmAction?: string): string {
  const body = lines.map((l) => (l ? `<p>${l}</p>` : "<div class=\"sp\"></div>")).join("");
  const form = confirmAction
    ? `<form method="POST" action="${escapeHtml(confirmAction)}">
         <button type="submit">Yes, cancel my appointment</button>
       </form>
       <p class="fine">Changed your mind? Just close this page — nothing has happened yet.</p>`
    : `<p class="fine"><a href="https://www.orasuites.com/book">Book another time</a></p>`;

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(title)} — ORÁ Suites</title>
<style>
  :root{--milk:#fffdf9;--sand:#f4efe8;--bone:#eae2d7;--deep:#1a1008;--fog:#8a7d72;--bronze:#b98867}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px 20px;
       background:radial-gradient(120% 90% at 50% 0%,var(--sand),#efe7dd);
       color:var(--deep);font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
       font-size:15px;line-height:1.55}
  .card{width:100%;max-width:34rem;padding:36px 32px;border:1px solid var(--bone);border-radius:20px;
        background:rgba(255,253,249,.72);backdrop-filter:blur(24px);box-shadow:0 24px 60px -32px rgba(26,16,8,.35)}
  .eyebrow{margin:0 0 14px;color:var(--bronze);font-size:11px;letter-spacing:.25em;text-transform:uppercase}
  h1{margin:0 0 18px;font-family:"Playfair Display",Georgia,serif;font-weight:400;font-size:clamp(1.6rem,4vw,2rem);
     line-height:1.15;letter-spacing:-.01em}
  p{margin:0 0 10px}
  .sp{height:10px}
  button{margin-top:22px;width:100%;padding:14px 20px;border:0;border-radius:999px;background:var(--deep);color:var(--milk);
         font:inherit;font-size:.9375rem;letter-spacing:.01em;cursor:pointer;transition:transform .2s,opacity .2s}
  button:hover{transform:translateY(-1px);opacity:.92}
  .fine{margin-top:16px;color:var(--fog);font-size:.8125rem}
  a{color:var(--bronze)}
</style></head><body>
<main class="card">
  <p class="eyebrow">ORÁ Suites</p>
  <h1>${escapeHtml(title)}</h1>
  ${body}
  ${form}
</main></body></html>`;
}
