/**
 * POST /api/webhooks/stripe — signature-verified event sink.
 *
 * This endpoint is for RECONCILIATION and VISIBILITY, not for creating
 * bookings. Deposits are verified synchronously in the booking request
 * (api/_lib/deposit-guard.ts), so nothing here is on the critical path — the
 * booking flow works correctly even if the webhook is never configured.
 *
 * What it does handle:
 *   · charge.refunded                 — a refund landed (ours, or one issued by
 *                                       hand in the Stripe dashboard). Logged so
 *                                       the clinic's books can be reconciled.
 *   · payment_intent.payment_failed   — a card was declined at the deposit step.
 *                                       Logged; no booking was created.
 *   · payment_intent.canceled         — a HOLD was released because the
 *                                       appointment could not be created (or it
 *                                       expired uncaptured after ~7 days). The
 *                                       customer was never charged.
 *
 * RAW BODY: Stripe signs the exact bytes it sent, so Vercel's JSON body parser
 * has to be switched off and the stream read by hand. Parsing before verifying
 * would make the signature meaningless.
 *
 * Always returns 200 for a VALID signature, even on an event type we ignore —
 * a non-2xx makes Stripe retry for days. Invalid signature returns 400.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyWebhookSignature, redact } from "../_lib/stripe.js";

export const config = { api: { bodyParser: false } };

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as unknown as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Not an error state — payments simply are not switched on yet.
    return res.status(503).json({ error: "Stripe webhooks are not configured." });
  }

  let raw: Buffer;
  try {
    raw = await readRawBody(req);
  } catch (err) {
    console.error("[stripe-webhook] could not read body:", redact(err));
    return res.status(400).json({ error: "Could not read request body" });
  }

  const sig = req.headers["stripe-signature"];
  const verified = verifyWebhookSignature(raw, Array.isArray(sig) ? sig[0] : sig, secret);
  if (!verified.ok || !verified.event) {
    console.error("[stripe-webhook] rejected:", verified.reason);
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = verified.event;
  const obj: any = event.data?.object ?? {};

  switch (event.type) {
    case "charge.refunded": {
      const pi = typeof obj.payment_intent === "string" ? obj.payment_intent : obj.payment_intent?.id;
      console.log(
        `[stripe-webhook] charge.refunded — intent=${pi ?? "unknown"} ` +
          `refunded=${obj.amount_refunded ?? 0}p of ${obj.amount ?? 0}p ` +
          `full=${obj.refunded === true} service="${obj.metadata?.serviceName ?? obj.metadata?.serviceId ?? "n/a"}"`,
      );
      break;
    }
    case "payment_intent.payment_failed": {
      // Stripe error messages are customer-safe and contain no key material,
      // but redact() runs anyway as a belt-and-braces measure.
      console.warn(
        `[stripe-webhook] deposit failed — intent=${obj.id ?? "unknown"} ` +
          `amount=${obj.amount ?? 0}p service="${obj.metadata?.serviceId ?? "n/a"}" ` +
          `reason=${redact(obj.last_payment_error?.message ?? "unknown")} — no appointment was created.`,
      );
      break;
    }
    case "payment_intent.canceled": {
      console.warn(
        `[stripe-webhook] hold released — intent=${obj.id ?? "unknown"} ` +
          `amount=${obj.amount ?? 0}p service="${obj.metadata?.serviceId ?? "n/a"}" ` +
          `reason=${obj.cancellation_reason ?? "unknown"} — the customer was never charged.`,
      );
      break;
    }
    default:
      // Acknowledged and ignored on purpose.
      break;
  }

  return res.status(200).json({ received: true, type: event.type });
}
