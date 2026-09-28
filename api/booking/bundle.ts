/**
 * GET /api/booking/bundle?t=<token> — one client's blow-dry bundle, for the private
 * link in their emails (/bundle/<token>). The token is 32 random characters; it is the
 * only key. Returns first name, counts, dates and visit history — nothing else.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bundleByToken, publicBundle } from "../_lib/bundles.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const t = String(req.query.t || "");
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(t)) return res.status(404).json({ error: "Bundle not found" });
  const r = await bundleByToken(t);
  if (!r.ok) return res.status(503).json({ error: "Your bundle can't be loaded just now. Please try again shortly." });
  if (!r.data) return res.status(404).json({ error: "Bundle not found" });
  return res.status(200).json({ bundle: publicBundle(r.data) });
}
