/**
 * GET /api/booking/bundle?t=<token> — one client's blow-dry bundle, for the private
 * link in their emails (/bundle/<token>). The token is 32 random characters; it is the
 * only key. Returns first name, counts, dates and visit history — nothing else.
 *
 * POST { email, phone, at } — on the booking confirm step: does this person hold a paid
 * bundle that will cover a blow-dry at `at`? Email AND phone must both match the bundle,
 * and only counts come back (no names), so it says nothing to someone guessing emails.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bundleByToken, publicBundle, activeBundleFor } from "../_lib/bundles.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method === "POST") {
    const b = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) || {};
    const email = String(b.email || "").trim().slice(0, 200), at = String(b.at || "");
    const digits = (x: unknown) => String(x || "").replace(/\D/g, "").slice(-9);
    if (!email.includes("@") || digits(b.phone).length < 9 || Number.isNaN(Date.parse(at))) return res.status(200).json({ covered: null });
    const hit = await activeBundleFor(email, at);
    if (!hit || digits(hit.phone) !== digits(b.phone)) return res.status(200).json({ covered: null });
    return res.status(200).json({ covered: { size: hit.size, left: hit.size - hit.used, expiresAt: hit.expires_at } });
  }
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const t = String(req.query.t || "");
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(t)) return res.status(404).json({ error: "Bundle not found" });
  const r = await bundleByToken(t);
  if (!r.ok) return res.status(503).json({ error: "Your bundle can't be loaded just now. Please try again shortly." });
  if (!r.data) return res.status(404).json({ error: "Bundle not found" });
  return res.status(200).json({ bundle: publicBundle(r.data) });
}
