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
 * Every booking becomes an opportunity in the Online Bookings pipeline so the
 * clinic can see and market to its customers. Non-throwing.
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
  const res = await ghlFetch("/opportunities/", {
    method: "POST",
    version: "2021-07-28",
    body: JSON.stringify({
      locationId: process.env.GHL_LOCATION_ID,
      pipelineId,
      pipelineStageId: stageId,
      contactId: args.contactId,
      name: `${args.serviceName} — ${args.clientName}`,
      status: "open",
      ...(typeof args.price === "number" && args.price > 0 ? { monetaryValue: args.price } : {}),
    }),
  });
  if (!res.ok) {
    console.error("[ghl-contacts] booking opportunity failed:", res.status, JSON.stringify(res.body));
    return null;
  }
  return res.body?.opportunity?.id ?? null;
}
