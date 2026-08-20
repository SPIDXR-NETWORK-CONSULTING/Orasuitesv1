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
 *     `succeeded`, must carry metadata.serviceId matching the service being
 *     booked, and its amount must equal the expected deposit to the penny.
 *
 * Anything else is a 402. We never trust an amount or a price from the browser.
 */
import { findService, depositPence, formatPence, type CatalogueService } from "./catalogue.js";
import { isStripeConfigured, retrievePaymentIntent, refundPaymentIntent, type StripePaymentIntent } from "./stripe.js";

export interface DepositCheckOk {
  ok: true;
  /** null when no payment was required (free service, or Stripe switched off). */
  paymentIntentId: string | null;
  depositPence: number;
  service?: CatalogueService;
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
  if (!isStripeConfigured()) return { ok: true, paymentIntentId: null, depositPence: 0, service };

  // Unknown service: we cannot price it, so we cannot demand a deposit for it.
  // Booking still proceeds (this is the pre-deposit behaviour) but it is logged.
  if (!service) {
    console.warn("[deposit-guard] service not found in catalogue; booking without a deposit:", input.serviceId ?? input.calendarId ?? input.serviceName);
    return { ok: true, paymentIntentId: null, depositPence: 0 };
  }

  // Free consultations take no deposit and skip payment entirely.
  if (service.price <= 0) return { ok: true, paymentIntentId: null, depositPence: 0, service };

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

  if (intent.status !== "succeeded") {
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

  return { ok: true, paymentIntentId: pid, depositPence: expected, service };
}

/**
 * The card is charged BEFORE the appointment exists, so if appointment creation
 * fails we must hand the money straight back. Never throws.
 */
export async function refundAfterFailedBooking(paymentIntentId: string | null, why: string): Promise<boolean> {
  if (!paymentIntentId) return false;
  const res = await refundPaymentIntent(paymentIntentId, `auto-refund: ${why}`).catch(() => ({ ok: false }) as const);
  if (res.ok) {
    console.error(`[deposit-guard] booking failed after payment ${paymentIntentId} — deposit refunded automatically (${why})`);
    return true;
  }
  console.error(`[deposit-guard] CRITICAL: booking failed after payment ${paymentIntentId} and the automatic refund ALSO failed (${why}). Refund manually in Stripe.`);
  return false;
}
