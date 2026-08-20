/**
 * Master switch for online booking.
 *
 * false → /book shows a "coming soon" panel, the site's Book buttons still lead
 *         there, and POST /api/ghl/booking refuses requests (server-side guard,
 *         so nothing can be booked by deep-linking or replaying the API).
 * true  → the full 4-step booking flow is live again.
 *
 * Flip this one value, then run `npm run deploy`.
 * The server reads the same intent from env BOOKING_ENABLED ("true"/"false");
 * keep the two in step — deploy sets it for you if you use script/deploy.sh.
 */
export const BOOKING_ENABLED = false;

/**
 * Private preview: /book?preview=<key> runs the REAL booking flow (real deposit,
 * real appointment) while the public still sees the coming-soon panel.
 * Used for owner testing before launch. The server enforces the same key.
 */
export const BOOKING_PREVIEW_KEY = "ora-preview-2026";

export function bookingUnlocked(): boolean {
  if (BOOKING_ENABLED) return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("preview") === BOOKING_PREVIEW_KEY;
}

/** Shown on /book while booking is off. Keep it short. */
export const BOOKING_SOON_COPY = {
  eyebrow: "Online booking",
  heading: "Booking opens soon",
  line: "We're putting the final touches to online booking. Message us and we'll arrange your appointment personally.",
};
