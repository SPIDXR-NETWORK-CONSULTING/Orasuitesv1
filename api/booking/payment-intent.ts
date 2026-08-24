/**
 * POST /api/booking/payment-intent
 *
 * Body: { serviceId: "aesthetics/lip-flip", email?: string }
 * Returns: { clientSecret, paymentIntentId, depositPence, fullPricePence, serviceName }
 *
 * The browser tells us WHICH treatment, never HOW MUCH. The price comes from
 * shared/catalogue.json server-side and the 20% deposit is computed here, so a
 * tampered client cannot pay £0.30 for a £300 treatment.
 *
 * The intent is created with MANUAL CAPTURE: confirming it in the browser only
 * holds the deposit. It is taken once the appointment exists — see
 * api/ghl/booking.ts.
 *
 * 503 when Stripe isn't configured — the booking flow reads that as "stay in
 * preview mode" and keeps working exactly as it does today.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { findService, depositPence, DEPOSIT_PERCENT, isBookableService } from "../_lib/catalogue.js";
import { createPaymentIntent, isStripeConfigured } from "../_lib/stripe.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Closed publicly, but the owner's preview key runs the real payment path.
  const previewOk = ((req.body as any)?.preview ?? (req.query as any)?.preview) === (process.env.BOOKING_PREVIEW_KEY || "ora-preview-2026");
  if (process.env.BOOKING_ENABLED === "false" && !previewOk) {
    return res.status(503).json({ error: "Online booking is temporarily closed. Please email admin@orasuites.com." });
  }

  if (!isStripeConfigured()) {
    return res.status(503).json({ error: "Card payments are not switched on yet.", stripe: false });
  }

  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) ?? {};
  const serviceId = typeof body.serviceId === "string" ? body.serviceId : "";
  const email = typeof body.email === "string" && body.email.includes("@") ? body.email.trim().slice(0, 200) : undefined;

  const service = findService(serviceId);
  if (!service) return res.status(400).json({ error: "Unknown treatment." });
  if (!service.live) return res.status(400).json({ error: "That treatment isn't bookable online yet." });
  // Never hold a card for a category that is not open online.
  if (!isBookableService(serviceId)) {
    return res.status(400).json({ error: "That treatment isn't open for online booking yet — please call the clinic or send us an enquiry." });
  }

  // Free consultations never reach Stripe.
  if (service.price <= 0) {
    return res.status(200).json({
      free: true,
      depositPence: 0,
      fullPricePence: 0,
      serviceName: service.name,
    });
  }

  const deposit = depositPence(service.price);
  const created = await createPaymentIntent({
    amountPence: deposit,
    currency: "gbp",
    description: `${DEPOSIT_PERCENT}% deposit — ${service.name} — ORÁ Suites`,
    statementDescriptorSuffix: "ORA SUITES",
    receiptEmail: email,
    metadata: {
      serviceId: service.id,
      serviceName: service.name,
      deposit: String(deposit),
      fullPrice: String(Math.round(service.price * 100)),
      source: "orasuites.com/book",
    },
  });

  if (!created.ok || !created.clientSecret) {
    return res.status(502).json({ error: created.error === "stripe not configured" ? "Card payments are not switched on yet." : "We couldn't start the payment. Please try again." });
  }

  return res.status(200).json({
    clientSecret: created.clientSecret,
    paymentIntentId: created.id,
    depositPence: deposit,
    fullPricePence: Math.round(service.price * 100),
    depositPercent: DEPOSIT_PERCENT,
    serviceName: service.name,
  });
}

function safeJson(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
