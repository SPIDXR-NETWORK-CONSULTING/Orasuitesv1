/**
 * Express-side entry to the shared Google Calendar mirror.
 * The implementation lives in api/_lib/google-calendar.ts so the Vercel
 * function and the Express server stay byte-for-byte in sync — exactly the
 * pattern used by server/ghl-notify.ts for the GHL enquiry helpers.
 *
 * Every function is a silent no-op until the GOOGLE_* env vars exist, and
 * none of them throw. Booking must never fail because Google is unavailable.
 */
export {
  mirrorAppointmentSafe,
  upsertEvent,
  deleteEvent,
  getAccessToken,
  isGoogleCalendarConfigured,
  pingCalendar,
  serviceNameForCalendar,
  TEAM_BY_USER_ID,
  TEAM_EMAIL_BY_USER_ID,
  ORA_CALENDAR_NAME,
  ORA_LOCATION,
  ORA_TIMEZONE,
  type MirrorAppointment,
  type UpsertResult,
} from "../api/_lib/google-calendar";
