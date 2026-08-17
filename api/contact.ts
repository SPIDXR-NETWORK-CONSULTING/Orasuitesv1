import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { processEnquiry } from "./_lib/ghl.js";

/** Mirrors shared/schema insertContactSchema (name, email, phone?, service?, message). */
const insertContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  message: z.string().min(1),
});

/**
 * POST /api/contact (Vercel)
 * Same contract + same GHL side-effects as server/routes.ts:
 *   contact upsert → opportunity (Room Rentals pipeline for rental enquiries) → admin email via GHL.
 * We await the sync here because a serverless function may be frozen the moment the
 * response is sent; the calls are wrapped so a GHL failure never fails the submission.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    let validated: z.infer<typeof insertContactSchema>;
    try {
      validated = insertContactSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid form data", details: error.errors });
      }
      return res.status(500).json({ error: "Failed to submit form" });
    }

    // Best-effort, never throws. Awaited so Vercel doesn't freeze the function mid-request.
    await processEnquiry(validated, "vercel");
    return res.status(201).json({ success: true });
  }

  if (req.method === "GET") {
    // Submissions are not persisted on Vercel (no DB) — they live in GHL.
    return res.json([]);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
