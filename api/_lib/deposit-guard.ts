/**
 * ORÁ — the one place that decides whether a booking has been paid for.
 *
 * Shared by BOTH booking backends (api/ghl/booking.ts and the Express twin in
 * server/routes.ts) so the rule can never drift between them.
 *
 * The rule:
 *   · Stripe not configured            → no deposit required, book as before.
 *   · Service price is 0 (consultation)→ no deposit, skip payment entirely.
 *   · Otherwise                        → a paymentIntentId is REQUIRED, must be
 *     `requires_capture` (the money is HELD, waiting for the appointment) or
 *     `succeeded` (already taken — intents created before manual capture, and
 *     retries of a booking we already captured), must carry metadata.serviceId
 *     matching the service being booked, and its amount must equal the expected
 *     deposit to the penny.
 *
 * Anything else is a 402. We never trust an amount or a price from the browser.
 *
 * ORDER: this runs BEFORE the appointment is created, but it only verifies the
 * HOLD. The money is taken afterwards by captureDeposit(), and released by
 * releaseAfterFailedBooking() if the appointment could not be created.
 */
import { findService, depositPence, formatPence, type CatalogueService } from "./catalogue.js";
import {
  isStripeConfigured,
  retrievePaymentIntent,
  refundPaymentIntent,
  capturePaymentIntent,
  cancelPaymentIntent,
  type StripePaymentIntent,
} from "./stripe.js";

/** The only two PaymentIntent states a booking may proceed on. */
export type VerifiedIntentStatus = "requires_capture" | "succeeded";
const BOOKABLE_STATUSES: readonly StripePaymentIntent["status"][] = ["requires_capture", "succeeded"];

export interface DepositCheckOk {
  ok: true;
  /** null when no payment was required (free service, or Stripe switched off). */
  paymentIntentId: string | null;
  depositPence: number;
  service?: CatalogueService;
  /**
   * How the money currently sits: `requires_capture` = held and still to be
   * taken; `succeeded` = already taken (legacy intent or a retry). null when
   * there is no payment at all.
   */
  intentStatus: VerifiedIntentStatus | null;
}
export interface DepositCheckFail {
  ok: false;
  status: number;
  error: string;
}
export type DepositCheck = DepositCheckOk | DepositCheckFail;

/** Marker appended to the GHL appointment notes so refunds can find the payment later. */
export function stripeNoteTag(paymentIntentId: string): string {
  return `[stripe:${paymentIntentId}]`;
}

/** Pull a PaymentIntent id back out of an appointment's notes. */
export function paymentIntentIdFromNotes(notes: string | null | undefined): string | null {
  const m = /\[stripe:(pi_[A-Za-z0-9_]+)\]/.exec(String(notes || ""));
  return m ? m[1] : null;
}

/** Append the payment marker to whatever notes the customer wrote. */
export function notesWithPayment(notes: string | null | undefined, paymentIntentId: string | null): string {
  const base = (notes || "").trim();
  if (!paymentIntentId) return base;
  if (base.includes(stripeNoteTag(paymentIntentId))) return base;
  return base ? `${base}\n${stripeNoteTag(paymentIntentId)}` : stripeNoteTag(paymentIntentId);
}

export interface DepositCheckInput {
  /** service id from the browser (`aesthetics/lip-flip`) — looked up server-side. */
  serviceId?: string | null;
  /** fallback identifier when the client is older and only sends a calendar id. */
  calendarId?: string | null;
  serviceName?: string | null;
  paymentIntentId?: unknown;
}

/**
 * Verify the deposit for one booking attempt. Never throws.
 * Returns the service (server-resolved) so callers use the trusted price.
 */
export async function verifyDeposit(input: DepositCheckInput): Promise<DepositCheck> {
  const service = findService(input.serviceId) ?? findService(input.calendarId) ?? findService(input.serviceName);

  // No Stripe → the flow is exactly what it was before deposits existed.
  if (!isStripeConfigured()) return { ok: true, paymentIntentId: null, depositPence: 0, service, intentStatus: null };

  // Unknown service: we cannot price it, so we cannot demand a deposit for it.
  // Booking still proceeds (this is the pre-deposit behaviour) but it is logged.
  if (!service) {
    console.warn("[deposit-guard] service not found in catalogue; booking without a deposit:", input.serviceId ?? input.calendarId ?? input.serviceName);
    return { ok: true, paymentIntentId: null, depositPence: 0, intentStatus: null };
  }

  // Free consultations take no deposit and skip payment entirely.
  if (service.price <= 0) return { ok: true, paymentIntentId: null, depositPence: 0, service, intentStatus: null };

  const expected = depositPence(service.price);
  const pid = typeof input.paymentIntentId === "string" ? input.paymentIntentId.trim() : "";

  if (!pid) {
    return { ok: false, status: 402, error: `A ${formatPence(expected)} deposit is required for this treatment.` };
  }

  const res = await retrievePaymentIntent(pid);
  if (!res.ok || !res.intent) {
    return { ok: false, status: 402, error: "We couldn't verify your payment. Nothing has been booked — please try again." };
  }

  const intent: StripePaymentIntent = res.intent;

  // `requires_capture` = the deposit is held and ours to take once the
  // appointment exists. `succeeded` = already taken; accepted so that intents
  // created before manual capture, and retries of a booking whose capture
  // already ran, still work.
  if (!BOOKABLE_STATUSES.includes(intent.status)) {
    return { ok: false, status: 402, error: "Your payment hasn't completed. Nothing has been booked — please try again." };
  }
  if ((intent.metadata?.serviceId || "") !== service.id) {
    console.error(`[deposit-guard] payment ${pid} is for "${intent.metadata?.serviceId}" but the booking is for "${service.id}"`);
    return { ok: false, status: 402, error: "This payment doesn't match the treatment selected. Nothing has been booked." };
  }
  if (intent.amount !== expected) {
    console.error(`[deposit-guard] payment ${pid} amount ${intent.amount}p ≠ expected ${expected}p for ${service.id}`);
    return { ok: false, status: 402, error: "The deposit amount doesn't match this treatment. Nothing has been booked." };
  }

  return {
    ok: true,
    paymentIntentId: pid,
    depositPence: expected,
    service,
    intentStatus: intent.status as VerifiedIntentStatus,
  };
}

/**
 * Take the money, now that the appointment really exists. Never throws.
 *
 * Returns false ONLY when the money could not be taken — and that must never
 * fail the booking: the appointment is real, the customer is expecting it, and
 * an uncaptured deposit is a bookkeeping job, not a customer problem. A failure
 * is logged as CRITICAL with the `pi_…` id so it can be captured by hand in
 * Stripe (within 7 days — see STRIPE_SETUP.md).
 */
export async function captureDeposit(
  paymentIntentId: string | null,
  status: VerifiedIntentStatus | null,
  context: string,
): Promise<boolean> {
  if (!paymentIntentId) return false;
  // Already taken (legacy intent, or a retry that captured last time).
  if (status === "succeeded") return true;

  const res = await capturePaymentIntent(paymentIntentId).catch(() => ({ ok: false, error: "capture threw" }) as const);
  if (res.ok) return true;

  console.error(
    `[deposit-guard] CRITICAL: ${context} exists but the deposit ${paymentIntentId} could NOT be taken ` +
      `(${(res as { error?: string }).error ?? "unknown"}). The booking stands. Capture it by hand in Stripe — ` +
      `an uncaptured authorisation expires after about 7 days.`,
  );
  return false;
}

/**
 * The appointment could not be created, so the customer must not pay for it.
 * Never throws.
 *
 *  · held (`requires_capture`) → RELEASE the authorisation. No charge ever
 *    reaches the customer's statement, so there is nothing to refund.
 *  · already taken (`succeeded`, legacy intents) → refund, as before.
 */
export async function releaseAfterFailedBooking(
  paymentIntentId: string | null,
  status: VerifiedIntentStatus | null,
  why: string,
): Promise<boolean> {
  if (!paymentIntentId) return false;

  if (status === "succeeded") {
    const res = await refundPaymentIntent(paymentIntentId, `auto-refund: ${why}`).catch(() => ({ ok: false }) as const);
    if (res.ok) {
      console.error(`[deposit-guard] booking failed after payment ${paymentIntentId} — deposit refunded automatically (${why})`);
      return true;
    }
    console.error(`[deposit-guard] CRITICAL: booking failed after payment ${paymentIntentId} and the automatic refund ALSO failed (${why}). Refund manually in Stripe.`);
    return false;
  }

  const res = await cancelPaymentIntent(paymentIntentId, why).catch(() => ({ ok: false }) as const);
  if (res.ok) {
    console.error(`[deposit-guard] booking failed — hold ${paymentIntentId} released, the customer was never charged (${why})`);
    return true;
  }
  console.error(
    `[deposit-guard] CRITICAL: booking failed and the hold ${paymentIntentId} could NOT be released (${why}). ` +
      `The customer has NOT been charged — cancel the payment in Stripe, or leave it: an uncaptured ` +
      `authorisation expires by itself after about 7 days.`,
  );
  return false;
}
