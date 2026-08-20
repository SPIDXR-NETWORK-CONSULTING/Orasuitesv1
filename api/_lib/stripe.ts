/**
 * ORÁ — minimal Stripe client (hand-rolled REST over fetch).
 *
 * WHY NO SDK: this repo ships two backends (Vercel serverless + an Express twin)
 * and every extra dependency has to be built by both. Stripe's HTTP API is a
 * form-encoded POST and a JSON response; that is all we need for a 20% deposit,
 * a full refund and a webhook signature. No `stripe` npm package is installed
 * and none is required.
 *
 * SECRETS: the key is read from process.env at CALL TIME and never stored,
 * logged, returned or embedded. `redact()` scrubs anything key-shaped out of
 * every log line as a second line of defence.
 *
 * DEGRADATION: when STRIPE_SECRET_KEY is absent `isStripeConfigured()` is false
 * and every function returns a soft `{ ok: false, error: "stripe not configured" }`
 * instead of throwing, so the booking flow behaves exactly as it did before
 * payments existed.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_BASE = "https://api.stripe.com/v1";
/** Pinned so a Stripe API upgrade can never silently change response shapes. */
const STRIPE_API_VERSION = "2024-06-20";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Strip anything that looks like a Stripe key out of a string before logging. */
export function redact(input: unknown): string {
  return String(input)
    .replace(/(sk|rk|pk|whsec)_(live|test)?_?[A-Za-z0-9]{8,}/g, "[redacted-key]")
    .slice(0, 400);
}

/* ── form encoding (Stripe takes application/x-www-form-urlencoded) ── */
function appendForm(params: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => appendForm(params, `${key}[${i}]`, v));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) appendForm(params, `${key}[${k}]`, v);
    return;
  }
  params.append(key, String(value));
}

export function toForm(payload: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) appendForm(params, k, v);
  return params.toString();
}

/* ── low-level fetch ─────────────────────────────────────── */
export interface StripeResult<T = any> {
  ok: boolean;
  status: number;
  body: T;
  /** Human-readable Stripe error message, safe to log (never contains keys). */
  error?: string;
}

async function stripeFetch<T = any>(
  path: string,
  init: { method?: "GET" | "POST"; payload?: Record<string, unknown>; idempotencyKey?: string } = {},
): Promise<StripeResult<T>> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: false, status: 0, body: null as T, error: "stripe not configured" };

  const { method = "GET", payload, idempotencyKey } = init;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Stripe-Version": STRIPE_API_VERSION,
  };
  if (payload) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  try {
    const res = await fetch(`${STRIPE_BASE}${path}`, {
      method,
      headers,
      ...(payload ? { body: toForm(payload) } : {}),
    });
    const text = await res.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    const error = res.ok ? undefined : redact(body?.error?.message || `HTTP ${res.status}`);
    if (!res.ok) console.error(`[stripe] ${method} ${path} failed:`, res.status, error);
    return { ok: res.ok, status: res.status, body: body as T, error };
  } catch (err) {
    console.error(`[stripe] ${method} ${path} threw:`, redact(err));
    return { ok: false, status: 0, body: null as T, error: "network error talking to Stripe" };
  }
}

/* ── PaymentIntents ──────────────────────────────────────── */
export interface StripePaymentIntent {
  id: string;
  status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "requires_capture" | "canceled" | "succeeded";
  amount: number;
  amount_received?: number;
  currency: string;
  metadata?: Record<string, string>;
  latest_charge?: string | null;
  client_secret?: string;
}

export interface CreatePaymentIntentInput {
  amountPence: number;
  currency?: string;
  metadata?: Record<string, string | number | undefined | null>;
  description?: string;
  /** Shown on the customer's statement (max 22 chars, Stripe truncates). */
  statementDescriptorSuffix?: string;
  receiptEmail?: string;
  idempotencyKey?: string;
}

/**
 * Create a PaymentIntent for a deposit. Never throws.
 * Returns the client secret the browser needs to confirm the card.
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<{ ok: boolean; id?: string; clientSecret?: string; amountPence?: number; error?: string }> {
  if (!isStripeConfigured()) return { ok: false, error: "stripe not configured" };
  const amount = Math.round(input.amountPence);
  if (!Number.isFinite(amount) || amount < 30) {
    // Stripe's GBP minimum is 30p; below that a deposit is not chargeable.
    return { ok: false, error: "deposit amount below the minimum chargeable value" };
  }

  const metadata: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.metadata ?? {})) {
    if (v !== undefined && v !== null && String(v).length) metadata[k] = String(v).slice(0, 480);
  }

  const res = await stripeFetch<StripePaymentIntent>("/payment_intents", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    payload: {
      amount,
      currency: input.currency || "gbp",
      "automatic_payment_methods[enabled]": true,
      ...(input.description ? { description: input.description } : {}),
      ...(input.receiptEmail ? { receipt_email: input.receiptEmail } : {}),
      ...(input.statementDescriptorSuffix ? { statement_descriptor_suffix: input.statementDescriptorSuffix.slice(0, 22) } : {}),
      ...(Object.keys(metadata).length ? { metadata } : {}),
    },
  });

  if (!res.ok || !res.body?.id || !res.body?.client_secret) {
    return { ok: false, error: res.error || "could not create payment" };
  }
  return { ok: true, id: res.body.id, clientSecret: res.body.client_secret, amountPence: res.body.amount };
}

/** Read a PaymentIntent back from Stripe. Never throws. */
export async function retrievePaymentIntent(
  id: string,
): Promise<{ ok: boolean; intent?: StripePaymentIntent; error?: string }> {
  if (!isStripeConfigured()) return { ok: false, error: "stripe not configured" };
  if (!/^pi_[A-Za-z0-9_]+$/.test(id)) return { ok: false, error: "malformed payment reference" };
  const res = await stripeFetch<StripePaymentIntent>(`/payment_intents/${encodeURIComponent(id)}`);
  if (!res.ok || !res.body?.id) return { ok: false, error: res.error || "payment not found" };
  return { ok: true, intent: res.body };
}

/* ── Refunds ─────────────────────────────────────────────── */
export interface RefundResult {
  ok: boolean;
  refundId?: string;
  amountPence?: number;
  /** true when Stripe reports the charge was already fully refunded. */
  alreadyRefunded?: boolean;
  error?: string;
}

/**
 * Full refund of a deposit. Idempotent per payment intent — calling twice for
 * the same booking reuses Stripe's idempotency record rather than double-refunding.
 * `reason` is our own words; Stripe only accepts a fixed enum, so the human
 * reason is carried in metadata.
 */
export async function refundPaymentIntent(id: string, reason: string): Promise<RefundResult> {
  if (!isStripeConfigured()) return { ok: false, error: "stripe not configured" };
  if (!/^pi_[A-Za-z0-9_]+$/.test(id)) return { ok: false, error: "malformed payment reference" };

  const res = await stripeFetch<{ id: string; amount: number; status: string }>("/refunds", {
    method: "POST",
    idempotencyKey: `ora-refund-${id}`,
    payload: {
      payment_intent: id,
      reason: "requested_by_customer",
      metadata: { ora_reason: reason.slice(0, 480) },
    },
  });

  if (res.ok && res.body?.id) return { ok: true, refundId: res.body.id, amountPence: res.body.amount };

  const code = (res.body as any)?.error?.code;
  if (code === "charge_already_refunded") return { ok: true, alreadyRefunded: true };
  return { ok: false, error: res.error || "refund failed" };
}

/* ── Webhook signature ───────────────────────────────────── */
export interface WebhookVerification {
  ok: boolean;
  event?: { id: string; type: string; data: { object: any } };
  reason?: string;
}

/**
 * Stripe's signature scheme: `Stripe-Signature: t=<unix>,v1=<hex hmac>`, where
 * the signed payload is `${t}.${rawBody}` HMAC-SHA256'd with the endpoint
 * secret. Multiple v1 values can be present during a secret rotation, so we
 * accept any match. Timestamps outside the tolerance are rejected (replay).
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  sigHeader: string | undefined | null,
  secret: string | undefined | null,
  toleranceSeconds = 300,
): WebhookVerification {
  if (!secret) return { ok: false, reason: "webhook secret not configured" };
  if (!sigHeader) return { ok: false, reason: "missing Stripe-Signature header" };

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of sigHeader.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k?.trim() === "t") timestamp = (v || "").trim();
    else if (k?.trim() === "v1") signatures.push((v || "").trim());
  }
  if (!timestamp || !signatures.length) return { ok: false, reason: "malformed Stripe-Signature header" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "malformed signature timestamp" };
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return { ok: false, reason: "signature timestamp outside tolerance" };

  const payload = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");

  const matched = signatures.some((sig) => {
    const given = Buffer.from(sig, "utf8");
    return given.length === expectedBuf.length && timingSafeEqual(given, expectedBuf);
  });
  if (!matched) return { ok: false, reason: "signature mismatch" };

  try {
    return { ok: true, event: JSON.parse(payload) };
  } catch {
    return { ok: false, reason: "event body is not valid JSON" };
  }
}

/* ── Health ──────────────────────────────────────────────── */
/**
 * Cheap authenticated read that proves the secret key works.
 * Reports ok when Stripe is deliberately NOT configured — deposits are optional
 * and /api/health must never fail just because payments are not switched on.
 */
export async function pingStripe(): Promise<{ ok: boolean; detail: string }> {
  if (!isStripeConfigured()) return { ok: true, detail: "not connected — optional" };
  const res = await stripeFetch<{ livemode?: boolean; object?: string }>("/balance");
  if (!res.ok) return { ok: false, detail: res.error || `HTTP ${res.status}` };
  return { ok: true, detail: res.body?.livemode ? "live mode key OK" : "test mode key OK" };
}
