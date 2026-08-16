import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

const GHL_API_KEY = process.env.GHL_API_KEY!;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!;
const GHL_BASE = "https://services.leadconnectorhq.com";

const insertContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  message: z.string().min(1),
});

async function pushToGHL(data: z.infer<typeof insertContactSchema>) {
  try {
    const nameParts = (data.name || "").trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    const contactRes = await fetch(`${GHL_BASE}/contacts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        firstName,
        lastName,
        email: data.email,
        phone: data.phone || "",
        tags: ["website-enquiry"],
        source: "website-contact-form",
        customFields: [
          { key: "message", field_value: data.message || "" },
          ...(data.service ? [{ key: "service_interest", field_value: data.service }] : []),
        ],
      }),
    });

    const contactJson = await contactRes.json();
    const contactId = contactJson?.contact?.id;

    if (contactId && data.service) {
      await fetch(`${GHL_BASE}/opportunities/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          name: `Enquiry — ${data.name}`,
          status: "open",
          contactId,
          monetaryValue: 0,
        }),
      });
    }
  } catch (err) {
    console.error("GHL contact sync error (non-blocking):", err);
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      pushToGHL(validatedData); // fire-and-forget
      return res.status(201).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid form data", details: error.errors });
      }
      return res.status(500).json({ error: "Failed to submit form" });
    }
  }

  if (req.method === "GET") {
    return res.json([]);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
