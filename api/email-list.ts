import type { VercelRequest, VercelResponse } from "@vercel/node";

const GHL_API_KEY = process.env.GHL_API_KEY!;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!;
const GHL_BASE = "https://services.leadconnectorhq.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Valid email required" });
  }

  try {
    const response = await fetch(`${GHL_BASE}/contacts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        email,
        tags: ["email-list", "website-signup"],
        source: "website-email-list",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("GHL email-list error:", err);
      return res.status(502).json({ error: "Failed to subscribe" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Email list exception:", err);
    return res.status(500).json({ error: "Failed to subscribe" });
  }
}
