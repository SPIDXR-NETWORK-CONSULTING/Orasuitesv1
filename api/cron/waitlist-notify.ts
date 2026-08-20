/**
 * GET|POST /api/cron/waitlist-notify — tell the waiting list when a day opens up.
 *
 * For every distinct (treatment, day) somebody is waiting on in the next 14
 * days, ask GHL whether that calendar now has any free slots on that day. If it
 * does, EVERY client waiting for that treatment on that day is emailed with the
 * times and a direct booking link, and told plainly that it is first come,
 * first served. First to book wins — that is the owner's rule.
 *
 * State lives entirely in GHL contact notes (api/_lib/waitlist.ts): each client
 * emailed for a (treatment, day) gets an ORA-WAITLIST-NOTIFIED note and loses
 * the `waitlist-<date>` tag, so a second run of this job sends nobody a second
 * email for the same day. Fully idempotent — safe to run hourly and safe to
 * re-run by hand.
 *
 * Bounded on purpose: at most MAX_CONTACT_SCAN contacts read, MAX_GROUPS_PER_RUN
 * (treatment, day) pairs checked and MAX_EMAILS_PER_RUN client emails sent. Work
 * over the cap is simply left pending for the next run.
 *
 * AUTH: `x-cron-key: $CRON_SECRET`, or Vercel Cron's `authorization: Bearer
 * $CRON_SECRET`. Anything else → 401. Without CRON_SECRET the endpoint refuses
 * to run at all (503) rather than exposing an unauthenticated send path.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { findService } from "../_lib/catalogue.js";
import {
  MAX_CONTACT_SCAN,
  MAX_EMAILS_PER_RUN,
  MAX_GROUPS_PER_RUN,
  NOTIFY_WINDOW_DAYS,
  WAITLIST_TAG,
  contactNoteBodies,
  dateTag,
  daysBetween,
  entryKey,
  formatNotifiedNote,
  freeSlotsFor,
  isoDate,
  listContactsWithTag,
  pendingEntries,
  removeTags,
  sendWaitlistOpeningEmail,
  writeContactNote,
  type WaitlistEntry,
} from "../_lib/waitlist.js";

export const config = { maxDuration: 60 };

interface Member {
  contactId: string;
  name: string;
  entry: WaitlistEntry;
}

interface Group {
  serviceId: string;
  serviceName: string;
  calendarId: string;
  date: string;
  members: Member[];
}

function authorised(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerKey = req.headers["x-cron-key"];
  const key = Array.isArray(headerKey) ? headerKey[0] : headerKey;
  if (key === secret) return true;
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth === `Bearer ${secret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.CRON_SECRET) {
    return res.status(503).json({ ok: false, error: "CRON_SECRET is not configured — refusing to run an unauthenticated notifier." });
  }
  if (!authorised(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });
  if (!process.env.GHL_API_KEY || !process.env.GHL_LOCATION_ID) {
    return res.status(503).json({ ok: false, error: "GHL_API_KEY / GHL_LOCATION_ID missing" });
  }

  const startedAt = Date.now();
  const today = isoDate();
  const stats = {
    contactsScanned: 0,
    entriesPending: 0,
    groups: 0,
    groupsChecked: 0,
    groupsWithSlots: 0,
    emailsSent: 0,
    emailsFailed: 0,
    expiredCleaned: 0,
    capped: false,
  };

  /* 1 ─ everyone currently on the list --------------------------------- */
  const contacts = await listContactsWithTag(WAITLIST_TAG, MAX_CONTACT_SCAN);
  stats.contactsScanned = contacts.length;

  const groups = new Map<string, Group>();
  /** contactId → how many pending entries it still has after this run. */
  const remaining = new Map<string, number>();

  for (const c of contacts) {
    const pending = pendingEntries(await contactNoteBodies(c.id));
    let live = 0;

    for (const entry of pending) {
      const lead = daysBetween(today, entry.date);

      if (lead < 0) {
        // The day has passed. Drop the date tag so GHL stays tidy; the note stays
        // as history. Nothing is emailed.
        await removeTags(c.id, [dateTag(entry.date)]);
        stats.expiredCleaned++;
        continue;
      }
      live++;
      if (lead > NOTIFY_WINDOW_DAYS) continue;

      stats.entriesPending++;
      const service = findService(entry.service);
      const calendarId = entry.calendar || service?.ghlCalendarId || "";
      if (!calendarId) continue;

      const key = entryKey(entry.service, entry.date);
      const group =
        groups.get(key) ??
        ({
          serviceId: entry.service,
          serviceName: service?.name ?? entry.service,
          calendarId,
          date: entry.date,
          members: [],
        } satisfies Group);
      group.members.push({ contactId: c.id, name: entry.name || c.name, entry });
      groups.set(key, group);
    }
    remaining.set(c.id, live);
  }

  stats.groups = groups.size;

  /* 2 ─ soonest days first, then check each calendar -------------------- */
  const ordered = Array.from(groups.values()).sort((a, b) => a.date.localeCompare(b.date));
  let budget = MAX_EMAILS_PER_RUN;

  for (const group of ordered) {
    if (stats.groupsChecked >= MAX_GROUPS_PER_RUN || budget <= 0) {
      stats.capped = true;
      break;
    }
    stats.groupsChecked++;

    const slots = await freeSlotsFor(group.calendarId, group.date);
    if (!slots.length) continue;
    stats.groupsWithSlots++;

    /* 3 ─ email EVERYONE waiting for this treatment on this day --------- */
    for (const member of group.members) {
      if (budget <= 0) {
        stats.capped = true;
        break;
      }
      budget--;

      const sent = await sendOpening(member, group, slots);
      if (!sent) {
        stats.emailsFailed++;
        // Leave the entry pending — the next run tries again.
        continue;
      }
      stats.emailsSent++;

      // Mark notified so nobody is emailed twice for the same day.
      await writeContactNote(
        member.contactId,
        formatNotifiedNote(group.serviceId, group.date, slots.length, group.serviceName),
      );
      await removeTags(member.contactId, [dateTag(group.date)]);

      const left = (remaining.get(member.contactId) ?? 1) - 1;
      remaining.set(member.contactId, left);
      if (left <= 0) await removeTags(member.contactId, [WAITLIST_TAG]);
    }
  }

  const summary = {
    ok: stats.emailsFailed === 0,
    service: "ora-suites-waitlist-notify",
    windowDays: NOTIFY_WINDOW_DAYS,
    caps: { emails: MAX_EMAILS_PER_RUN, groups: MAX_GROUPS_PER_RUN, contacts: MAX_CONTACT_SCAN },
    durationMs: Date.now() - startedAt,
    ...stats,
  };
  console.log("[waitlist-notify]", JSON.stringify(summary));
  return res.status(200).json(summary);
}

/** Split out so the loop above stays readable. */
function sendOpening(member: Member, group: Group, slots: string[]): Promise<boolean> {
  return sendWaitlistOpeningEmail({
    contactId: member.contactId,
    clientName: member.name,
    serviceId: group.serviceId,
    serviceName: group.serviceName,
    date: group.date,
    times: slots,
  });
}
