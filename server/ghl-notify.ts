/**
 * Express-side entry to the shared GHL enquiry helpers.
 * The implementation lives in api/_lib/ghl.ts so the Vercel function and the
 * Express server stay byte-for-byte in sync (contact upsert → opportunity →
 * admin email via GHL conversations). Everything is best-effort / non-blocking.
 */
export {
  processEnquiry,
  sendAdminEmail,
  enquiryEmailHtml,
  enquirySubject,
  isRoomRental,
  upsertEnquiryContact,
  createEnquiryOpportunity,
  findOrCreateAdminContact,
  ADMIN_EMAIL,
  ROOM_RENTAL_SERVICE,
  ROOM_RENTAL_PREFIX,
  type EnquiryPayload,
} from "../api/_lib/ghl";
