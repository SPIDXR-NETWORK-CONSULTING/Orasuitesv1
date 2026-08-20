/**
 * POST /api/booking/waitlist — join the waiting list for a treatment on a day.
 * GET  /api/booking/waitlist?serviceId=…&date=… — who is currently waiting.
 *
 * Offered on the booking page when the client picks a day with no free slots.
 * There is no database: the entry becomes a CONTACT NOTE plus two tags on the
 * client's GHL contact record (see api/_lib/waitlist.ts for the format).
 *
 * The client gets a short "we'll email you the moment something frees up on
 * <date>" note; admin@orasuites.com gets told somebody joined.
 *
 * Nothing here throws. A failed email must never lose the waiting-list entry,
 * so the entry is written FIRST and the notifications are best-effort after.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveContact } from "../_lib/ghl-contacts.js";
import { findService } from "../_lib/catalogue.js";
import {
  WAITLIST_TAG,
  addTags,
  contactNoteBodies,
  dateTag,
  entryKey,
  formatWaitlistNote,
  isValidYmd,
  listContactsWithTag,
  pendingEntries,
  sendAdminWaitlistAlert,
  sendWaitlistJoinedEmail,
  splitName,
  validateWaitlistRequest,
  writeContactNote,
  MAX_CONTACT_SCAN,
} from "../_lib/waitlist.js";

export const config = { maxDuration: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.GHL_API_KEY || !process.env.GHL_LOCATION_ID) {
    return res.status(503).json({ ok: false, error: "Waiting list is not configured yet." });
  }

  if (req.method === "GET") return listHandler(req, res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const parsed = validateWaitlistRequest(req.body);
  if (!parsed.ok) return res.status(400).json({ ok: false, error: parsed.error });

  const { service, date, name, email, phone } = parsed.value;

  try {
    /* 1 ─ the client's contact record IS the storage. Email is the identity. */
    const { firstName, lastName } = splitName(name);
    const contact = await resolveContact({
      email,
      firstName,
      lastName,
      phone: phone ?? null,
      tags: [WAITLIST_TAG, dateTag(date)],
    });
    if (!contact) {
      return res.status(502).json({ ok: false, error: "We couldn't save your place just now. Please email admin@orasuites.com." });
    }

    // resolveContact only sets tags when it CREATES the contact, so an existing
    // client (the common case) needs them applied explicitly.
    if (!contact.created) await addTags(contact.id, [WAITLIST_TAG, dateTag(date)]);

    /* 2 ─ already waiting for this exact treatment + day? Don't double-record. */
    const existing = pendingEntries(await contactNoteBodies(contact.id));
    const already = existing.some((e) => entryKey(e.service, e.date) === entryKey(service.id, date));

    if (!already) {
      const written = await writeContactNote(
        contact.id,
        formatWaitlistNote(
          {
            service: service.id,
            calendar: service.ghlCalendarId ?? "",
            date,
            requested: new Date().toISOString(),
            name,
          },
          service.name,
        ),
      );
      if (!written) {
        return res.status(502).json({ ok: false, error: "We couldn't save your place just now. Please email admin@orasuites.com." });
      }
    }

    /* 3 ─ tell the client and the clinic. Best-effort, never fatal. */
    const notify = Promise.allSettled([
      already
        ? Promise.resolve(true)
        : sendWaitlistJoinedEmail({ contactId: contact.id, clientName: name, serviceName: service.name, date }),
      already
        ? Promise.resolve(true)
        : sendAdminWaitlistAlert({
            clientName: name,
            clientEmail: email,
            clientPhone: phone ?? null,
            serviceName: service.name,
            date,
          }),
    ]);
    // Serverless functions are frozen the moment the response is written, so the
    // emails are awaited rather than fired and forgotten.
    await notify;

    return res.status(already ? 200 : 201).json({
      ok: true,
      already,
      serviceId: service.id,
      serviceName: service.name,
      date,
    });
  } catch (err) {
    console.error("[waitlist] join failed:", String(err).slice(0, 300));
    return res.status(500).json({ ok: false, error: "Something went wrong. Please email admin@orasuites.com." });
  }
}

/**
 * Who is waiting for one service on one day. Used by the notifier and by the
 * owner for a quick sanity check; it exposes nothing a booking page visitor
 * could not already trigger, but it does list client emails, so it is gated on
 * the same CRON_SECRET as the cron jobs.
 */
async function listHandler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const headerKey = req.headers["x-cron-key"];
  const key = Array.isArray(headerKey) ? headerKey[0] : headerKey;
  const auth = req.headers.authorization;
  const authorised = Boolean(secret) && (key === secret || auth === `Bearer ${secret}`);
  if (!authorised) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const serviceId = String(req.query.serviceId ?? "").trim();
  const date = String(req.query.date ?? "").trim();
  if (!serviceId || !isValidYmd(date)) {
    return res.status(400).json({ ok: false, error: "serviceId and date=YYYY-MM-DD are required" });
  }
  const service = findService(serviceId);
  if (!service) return res.status(404).json({ ok: false, error: "Unknown treatment" });

  const contacts = await listContactsWithTag(dateTag(date), MAX_CONTACT_SCAN);
  const waiting: { contactId: string; name: string; email: string; requested: string }[] = [];
  for (const c of contacts) {
    const entry = pendingEntries(await contactNoteBodies(c.id)).find(
      (e) => entryKey(e.service, e.date) === entryKey(service.id, date),
    );
    if (entry) waiting.push({ contactId: c.id, name: entry.name || c.name, email: c.email, requested: entry.requested });
  }

  return res.status(200).json({ ok: true, serviceId: service.id, serviceName: service.name, date, count: waiting.length, waiting });
}
