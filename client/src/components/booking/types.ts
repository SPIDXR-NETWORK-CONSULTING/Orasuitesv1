/**
 * Booking flow — shared types + step model.
 * State lives in <BookingFlow/>; steps are pure-ish presentational components.
 */
import type { ResolvedService, TeamKey } from "@/lib/catalogue";

export type PractitionerChoice = "first" | TeamKey;

export interface BookingDetails {
  name: string;
  email: string;
  phone: string;
  notes: string;
  consent: boolean;
}

export interface BookingState {
  service?: ResolvedService;
  practitioner: PractitionerChoice;
  /** YYYY-MM-DD (Europe/London) */
  date?: string;
  /** ISO start time as returned by GHL free-slots */
  slot?: string;
  details: BookingDetails;
}

export const EMPTY_DETAILS: BookingDetails = { name: "", email: "", phone: "", notes: "", consent: false };

export const STEPS = [
  { key: "service", label: "Service" },
  { key: "practitioner", label: "Practitioner" },
  { key: "datetime", label: "Date & time" },
  { key: "details", label: "Your details" },
  { key: "deposit", label: "Confirm" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"] | "done";
export const STEP_INDEX: Record<(typeof STEPS)[number]["key"], number> = {
  service: 0,
  practitioner: 1,
  datetime: 2,
  details: 3,
  deposit: 4,
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
