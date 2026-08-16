import type { VercelRequest, VercelResponse } from "@vercel/node";

const GHL_API_KEY = process.env.GHL_API_KEY!;
const GHL_BASE = "https://services.leadconnectorhq.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { calendarId, startDate, endDate } = req.query;
  if (!calendarId || !startDate || !endDate) {
    return res.status(400).json({ error: "calendarId, startDate, endDate required" });
  }

  try {
    const response = await fetch(
      `${GHL_BASE}/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}&timezone=Europe%2FLondon`,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-04-15",
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("GHL slots error:", err);
      return res.status(502).json({ error: "Failed to fetch slots from GHL" });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("GHL slots exception:", err);
    return res.status(500).json({ error: "Failed to fetch slots" });
  }
}
