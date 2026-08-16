/**
 * Booking flow — shared types + step model.
 * State lives in <BookingFlow/>; steps are pure-ish presentational components.
 * Steps: Service → Time → Details → Confirm (+ done).
 */
import type { ResolvedService } from "@/lib/catalogue";

export interface BookingDetails {
  name: string;
  email: string;
  phone: string;
  notes: string;
  consent: boolean;
}

export interface BookingState {
  service?: ResolvedService;
  /** YYYY-MM-DD (Europe/London) */
  date?: string;
  /** ISO start time as returned by GHL free-slots */
  slot?: string;
  details: BookingDetails;
}

export const EMPTY_DETAILS: BookingDetails = { name: "", email: "", phone: "", notes: "", consent: false };

export const STEPS = [
  { key: "service", label: "Service" },
  { key: "datetime", label: "Time" },
  { key: "details", label: "Details" },
  { key: "confirm", label: "Confirm" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"] | "done";
export const STEP_INDEX: Record<(typeof STEPS)[number]["key"], number> = {
  service: 0,
  datetime: 1,
  details: 2,
  confirm: 3,
};

/* ── API shapes (mirror server/routes.ts + api/ghl/*) ────── */
/** GET /api/ghl/slots?calendarId&startDate=<ms>&endDate=<ms> */
export type SlotsResponse = Record<string, { slots?: string[] } | unknown>;

/** POST /api/ghl/booking */
export interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  notes: string;
  calendarId: string;
  serviceName: string;
  /** ISO 8601 */
  startTime: string;
  /** ISO 8601 = start + duration */
  endTime: string;
}
export interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  contactId?: string;
  error?: string;
}
