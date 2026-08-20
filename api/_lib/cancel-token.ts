/**
 * ORÁ — signed self-service cancellation links.
 *
 * A customer's confirmation email carries a link they can click to cancel. The
 * link must be safe to put in an email: no login, but also no way to cancel
 * someone else's appointment by guessing an id. The token is
 *
 *     base64url( HMAC-SHA256( `${appointmentId}.${contactId}`, BOOKING_CANCEL_SECRET ) )
 *
 * so a valid link requires knowing BOTH ids AND the server secret. Comparison is
 * constant-time.
 *
 * Clinic staff use the same endpoint with `?clinic=1` plus ADMIN_CANCEL_SECRET,
 * which always refunds regardless of timing.
 *
 * If BOOKING_CANCEL_SECRET is not set, `signCancelToken` returns null and the
 * confirmation email simply omits the cancel line — nothing breaks.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const CANCEL_PATH = "/api/booking/cancel";

/** Canonical public origin for links we put in emails. */
export function publicBaseUrl(): string {
  const raw = process.env.PUBLIC_BASE_URL || "https://www.orasuites.com";
  return raw.replace(/\/+$/, "");
}

export function isCancelSigningConfigured(): boolean {
  return Boolean(process.env.BOOKING_CANCEL_SECRET);
}

export function signCancelToken(appointmentId: string, contactId: string): string | null {
  const secret = process.env.BOOKING_CANCEL_SECRET;
  if (!secret || !appointmentId || !contactId) return null;
  return createHmac("sha256", secret).update(`${appointmentId}.${contactId}`, "utf8").digest("base64url");
}

export function verifyCancelToken(appointmentId: string, contactId: string, token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = signCancelToken(appointmentId, contactId);
  if (!expected) return false;
  const a = Buffer.from(String(token), "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Full self-service cancel URL, or null when signing isn't configured. */
export function cancelLinkFor(appointmentId: string, contactId: string): string | null {
  const token = signCancelToken(appointmentId, contactId);
  if (!token) return null;
  const qs = new URLSearchParams({ a: appointmentId, c: contactId, t: token });
  return `${publicBaseUrl()}${CANCEL_PATH}?${qs.toString()}`;
}

/** Constant-time check of the staff-only secret used by `?clinic=1`. */
export function verifyAdminSecret(provided: string | undefined | null): boolean {
  const secret = process.env.ADMIN_CANCEL_SECRET;
  if (!secret || !provided) return false;
  const a = Buffer.from(String(provided), "utf8");
  const b = Buffer.from(secret, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
