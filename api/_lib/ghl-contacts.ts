/**
 * Safe contact resolution for bookings.
 *
 * WHY THIS EXISTS: `POST /contacts/upsert` matches on email OR phone and then
 * OVERWRITES the matched record's name and email. On 17 Aug 2026 a test booking
 * (Abdul / abdulbusiness100@gmail.com / +447519331606) hijacked the internal
 * "ORÁ Admin" contact and replaced its identity. On a live clinic that means one
 * client booking could silently rewrite another client's record.
 *
 * The rule here: EMAIL is the identity. We look the email up first and reuse
 * that contact. We only ever create when the email is genuinely new, and we
 * never overwrite an existing contact's name or email.
 */
import { ghlFetch } from "./ghl.js";

export interface ContactInput {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string | null;
  tags?: string[];
}

export interface ResolvedContact {
  id: string;
  created: boolean;
}

/** Exact-email lookup (GHL's query is fuzzy, so we filter strictly). */
async function findByEmail(email: string): Promise<string | undefined> {
  const locationId = process.env.GHL_LOCATION_ID;
  const res = await ghlFetch(
    `/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}&limit=20`,
    { version: "2021-07-28" },
  );
  if (!res.ok) return undefined;
  const wanted = email.trim().toLowerCase();
  return res.body?.contacts?.find((c: any) => (c.email || "").trim().toLowerCase() === wanted)?.id;
}

export async function resolveContact(input: ContactInput): Promise<ResolvedContact | null> {
  const existing = await findByEmail(input.email);
  if (existing) return { id: existing, created: false };

  const created = await ghlFetch("/contacts/", {
    method: "POST",
    version: "2021-07-28",
    body: JSON.stringify({
      locationId: process.env.GHL_LOCATION_ID,
      firstName: input.firstName,
      lastName: input.lastName || "",
      email: input.email,
      ...(input.phone ? { phone: input.phone } : {}),
      tags: input.tags || [],
    }),
  });
  if (created.ok && created.body?.contact?.id) return { id: created.body.contact.id, created: true };

  // Duplicate on a NON-email field (usually phone: a family sharing one number).
  // Reuse that contact — but never rewrite its identity.
  const dupId = created.body?.meta?.contactId;
  if (dupId) {
    console.warn(
      `[ghl-contacts] ${input.email} matched existing contact ${dupId} on ` +
        `${created.body?.meta?.matchingField || "unknown field"} — reusing without overwriting.`,
    );
    return { id: dupId, created: false };
  }

  console.error("[ghl-contacts] could not resolve contact:", created.status, JSON.stringify(created.body));
  return null;
}

/**
 * Pull the existing opportunity id out of GHL's duplicate rejection.
 *
 * GHL allows ONE open opportunity per contact per pipeline. A returning
 * customer therefore gets a 400:
 *   {"statusCode":400,"message":"Can not create duplicate opportunity for the
 *    contact.","code":"OPPORTUNITY_NO_DUPLICATE","meta":{"existingId":"…"}}
 * The shape has moved around before, so the message is accepted as a fallback
 * signal and the id is looked for in both plausible places.
 */
function duplicateOpportunityId(body: any): string | null {
  const isDuplicate =
    body?.code === "OPPORTUNITY_NO_DUPLICATE" ||
    /duplicate opportunity/i.test(String(body?.message ?? ""));
  if (!isDuplicate) return null;
  const id = body?.meta?.existingId ?? body?.meta?.existingID ?? body?.existingId ?? null;
  return typeof id === "string" && id.length ? id : null;
}

/**
 * Every booking becomes an opportunity in the Online Bookings pipeline so the
 * clinic can see and market to its customers. Non-throwing.
 *
 * A RETURNING CUSTOMER IS NOT AN ERROR. Before 20 Aug 2026 a second booking by
 * the same person made GHL reject the create with OPPORTUNITY_NO_DUPLICATE and
 * this function returned null — the booking never appeared in the pipeline and
 * the owner had no record of it. Now that rejection is treated as "you already
 * have one": the existing opportunity is UPDATED to this booking (name, value,
 * back to the Booked stage, status open) and its id returned. Either way the
 * customer ends up visible in Online Bookings, which is the actual requirement.
 */
export async function createBookingOpportunity(args: {
  contactId: string;
  clientName: string;
  serviceName: string;
  price?: number | null;
  startTime: string;
}): Promise<string | null> {
  const pipelineId = process.env.GHL_BOOKINGS_PIPELINE_ID || "6NsVFiUCxgAelJszMS1z";
  const stageId = process.env.GHL_BOOKINGS_STAGE_ID || "ff701f68-6c63-4838-b4ff-ed37614df9f5"; // "Booked"
  const name = `${args.serviceName} — ${args.clientName}`;
  const value = typeof args.price === "number" && args.price > 0 ? { monetaryValue: args.price } : {};

  const res = await ghlFetch("/opportunities/", {
    method: "POST",
    version: "2021-07-28",
    body: JSON.stringify({
      locationId: process.env.GHL_LOCATION_ID,
      pipelineId,
      pipelineStageId: stageId,
      contactId: args.contactId,
      name,
      status: "open",
      ...value,
    }),
  });

  if (res.ok) {
    const created = res.body?.opportunity?.id ?? null;
    console.log(`[ghl-contacts] booking opportunity CREATED ${created ?? "(id missing)"} for contact ${args.contactId}`);
    return created;
  }

  const existingId = duplicateOpportunityId(res.body);
  if (!existingId) {
    console.error("[ghl-contacts] booking opportunity failed:", res.status, JSON.stringify(res.body));
    return null;
  }

  const updated = await ghlFetch(`/opportunities/${encodeURIComponent(existingId)}`, {
    method: "PUT",
    version: "2021-07-28",
    body: JSON.stringify({
      pipelineId,
      pipelineStageId: stageId,
      name,
      status: "open",
      ...value,
    }),
  });

  if (updated.ok) {
    console.log(
      `[ghl-contacts] booking opportunity UPDATED ${existingId} (contact ${args.contactId} already had one) — ` +
        `moved to Booked and renamed to "${name}".`,
    );
  } else {
    console.error(
      `[ghl-contacts] booking opportunity ${existingId} exists but could NOT be updated:`,
      updated.status,
      JSON.stringify(updated.body).slice(0, 300),
    );
  }
  // The customer IS in the pipeline either way — that is what the id means here.
  return existingId;
}

/**
 * Attach a permanent note to the CLIENT's contact record. Non-throwing.
 *
 * WHY: GHL discards appointment notes created through the API, so anything the
 * customer wrote at booking ("please use the quiet room") disappears from the
 * appointment. A contact note survives, is visible to every staff member, and
 * travels with the client rather than the single booking.
 */
export async function appendContactNote(contactId: string, body: string): Promise<boolean> {
  const text = (body || "").trim();
  if (!contactId || !text) return false;

  const res = await ghlFetch(`/contacts/${encodeURIComponent(contactId)}/notes`, {
    method: "POST",
    version: "2021-07-28",
    body: JSON.stringify({ body: text.slice(0, 5000) }),
  });
  if (!res.ok) {
    console.error("[ghl-contacts] contact note failed:", res.status, JSON.stringify(res.body).slice(0, 300));
  }
  return res.ok;
}
