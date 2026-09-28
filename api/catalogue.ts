/**
 * GET /api/catalogue — the PUBLIC, read-only menu for the ORÁ app (ported from
 * orasuites-web-dev PR #1, with fixes).
 *
 * Built from shared/catalogue.json so web and app never drift, but NOT served raw:
 *   - `_meta` is reduced to {updated, depositPercent, depositsEnabled}: the raw file holds
 *     staff names, GHL user ids and personal emails, which must never be public.
 *     While deposits are paused (env DEPOSITS_ENABLED=false) depositPercent is 0, so the
 *     app and the website never promise a deposit that isn't taken.
 *   - hidden categories (e.g. aesthetics, now 25 Clinic's) are dropped: the app filters
 *     on `live` only and doesn't know `hidden`, so leaving them in would re-list them.
 *   - per-category `team` (internal staff keys) is dropped.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import raw from "../shared/catalogue.json" with { type: "json" };
import { isStripeConfigured } from "./_lib/stripe.js";

const src = raw as any;
const depositsEnabled = process.env.DEPOSITS_ENABLED !== "false" && isStripeConfigured();
const PUBLIC = JSON.stringify({
  _meta: { updated: src._meta?.updated ?? null, depositPercent: depositsEnabled ? src._meta?.depositPercent ?? 0 : 0, depositsEnabled },
  categories: (src.categories ?? [])
    .filter((c: any) => !c.hidden)
    .map(({ team: _team, ...c }: any) => c),
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=900, stale-while-revalidate=3600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).send(PUBLIC);
}
