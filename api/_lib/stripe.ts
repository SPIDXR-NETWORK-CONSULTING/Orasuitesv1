/**
 * ORÁ — minimal Stripe client (hand-rolled REST over fetch).
 *
 * WHY NO SDK: this repo ships two backends (Vercel serverless + an Express twin)
 * and every extra dependency has to be built by both. Stripe's HTTP API is a
 * form-encoded POST and a JSON response; that is all we need for a 20% deposit,
 * a full refund and a webhook signature. No `stripe` npm package is installed
 * and none is required.
 *
 * AUTHORISE THEN CAPTURE: deposits are created with `capture_method: "manual"`.
 * Confirming in the browser only HOLDS the money (status `requires_capture`);
 * it is actually taken by `capturePaymentIntent()` once the GHL appointment
 * exists, and released with `cancelPaymentIntent()` if it does not. Releasing a
 * hold is not a refund — nothing ever reaches the customer's statement and it
 * costs nothing.
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
 *
 * `capture_method: "manual"` is the whole point: confirming in the browser
 * AUTHORISES the deposit (status becomes `requires_capture`) instead of taking
 * it. The money is taken by capturePaymentIntent() only once the appointment
 * exists — see api/ghl/booking.ts.
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
      capture_method: "manual",
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

/**
 * Attach (or overwrite) metadata on an existing PaymentIntent. Never throws.
 *
 * WHY THIS MATTERS: Stripe is the DURABLE index between a booking and its
 * money. GHL silently discards appointment `notes` written through the API
 * (verified 20 Aug 2026 — a note written at creation reads back as `null`), so
 * the `[stripe:pi_…]` marker in the appointment notes cannot be relied on to
 * find the deposit at cancellation time. Writing `ghlAppointmentId` here, on
 * the payment itself, is what makes automatic refunds work.
 *
 * Metadata is writable in every PaymentIntent state, including `succeeded`,
 * so this is safe to call after the deposit has been captured.
 */
export async function updatePaymentIntent(
  id: string,
  update: { metadata?: Record<string, string | number | undefined | null> },
): Promise<{ ok: boolean; intent?: StripePaymentIntent; error?: string }> {
  if (!isStripeConfigured()) return { ok: false, error: "stripe not configured" };
  if (!/^pi_[A-Za-z0-9_]+$/.test(id)) return { ok: false, error: "malformed payment reference" };

  const metadata: Record<string, string> = {};
  for (const [k, v] of Object.entries(update.metadata ?? {})) {
    if (v !== undefined && v !== null && String(v).length) metadata[k] = String(v).slice(0, 480);
  }
  if (!Object.keys(metadata).length) return { ok: false, error: "nothing to update" };

  const res = await stripeFetch<StripePaymentIntent>(`/payment_intents/${encodeURIComponent(id)}`, {
    method: "POST",
    payload: { metadata },
  });
  if (!res.ok || !res.body?.id) return { ok: false, error: res.error || "could not update the payment" };
  return { ok: true, intent: res.body };
}

export interface PaymentLookup {
  ok: boolean;
  intent?: StripePaymentIntent;
  /** Which path found it — `list` means Stripe's search index had not caught up. */
  via?: "search" | "list";
  error?: string;
}

/**
 * Find the deposit that belongs to a GHL appointment, using the metadata
 * written by updatePaymentIntent(). Never throws.
 *
 * TWO PATHS, deliberately:
 *   1. `/payment_intents/search` — the right tool, but Stripe's search index is
 *      EVENTUALLY CONSISTENT (roughly a minute behind a write). A customer who
 *      books and immediately cancels would find nothing.
 *   2. fallback: list the 100 most recent intents and match in code. Bounded,
 *      cheap, and covers exactly the window search cannot.
 *
 * The appointment id is interpolated into a Stripe query string, so it is
 * whitelisted to `[A-Za-z0-9_-]` first — nothing else can reach the query.
 */
export async function findPaymentIntentByAppointment(appointmentId: string): Promise<PaymentLookup> {
  if (!isStripeConfigured()) return { ok: false, error: "stripe not configured" };
  const wanted = String(appointmentId || "").trim();
  if (!wanted || !/^[A-Za-z0-9_-]{4,64}$/.test(wanted)) return { ok: false, error: "malformed appointment reference" };

  const match = (list: StripePaymentIntent[] | undefined) =>
    (list ?? []).find((pi) => pi?.metadata?.ghlAppointmentId === wanted);

  const query = `metadata['ghlAppointmentId']:'${wanted}'`;
  const search = await stripeFetch<{ data?: StripePaymentIntent[] }>(
    `/payment_intents/search?limit=10&query=${encodeURIComponent(query)}`,
  );
  const found = search.ok ? match(search.body?.data) : undefined;
  if (found) return { ok: true, intent: found, via: "search" };

  const list = await stripeFetch<{ data?: StripePaymentIntent[] }>("/payment_intents?limit=100");
  const recent = list.ok ? match(list.body?.data) : undefined;
  if (recent) {
    console.warn(`[stripe] payment for appointment ${wanted} found by recent-list scan — search index had not caught up.`);
    return { ok: true, intent: recent, via: "list" };
  }

  return { ok: false, error: "no payment is linked to that appointment" };
}

/* ── Capture / release an authorisation ──────────────────── */
export interface CaptureResult {
  ok: boolean;
  intent?: StripePaymentIntent;
  /** true when the hold had already been captured (a retry, not a double charge). */
  alreadyCaptured?: boolean;
  error?: string;
}

/**
 * TAKE the money that was held. Call this only once the appointment really
 * exists. Idempotent per intent (`ora-capture-<id>`), so a retry of the same
 * booking cannot charge twice.
 *
 * A `payment_intent_unexpected_state` error usually means it is ALREADY
 * captured — that is a success from our point of view, so the intent is read
 * back and reported as `alreadyCaptured` rather than as a failure.
 */
export async function capturePaymentIntent(id: string): Promise<CaptureResult> {
  if (!isStripeConfigured()) return { ok: false, error: "stripe not configured" };
  if (!/^pi_[A-Za-z0-9_]+$/.test(id)) return { ok: false, error: "malformed payment reference" };

  const res = await stripeFetch<StripePaymentIntent>(`/payment_intents/${encodeURIComponent(id)}/capture`, {
    method: "POST",
    idempotencyKey: `ora-capture-${id}`,
    payload: {},
  });

  if (res.ok && res.body?.id) return { ok: true, intent: res.body };

  if ((res.body as any)?.error?.code === "payment_intent_unexpected_state") {
    const back = await retrievePaymentIntent(id);
    if (back.ok && back.intent?.status === "succeeded") {
      return { ok: true, intent: back.intent, alreadyCaptured: true };
    }
  }
  return { ok: false, error: res.error || "could not take the deposit" };
}

export interface CancelIntentResult {
  ok: boolean;
  intent?: StripePaymentIntent;
  /** true when the hold was already released. */
  alreadyCancelled?: boolean;
  error?: string;
}

/**
 * RELEASE a hold — the opposite of capture, and NOT a refund. The customer was
 * never charged, so nothing appears on their statement, there is no 5–10 day
 * wait and it costs nothing. Some banks take a day or two to drop the pending
 * line from the customer's app; that is the bank, not us.
 *
 * `reason` is our own wording (logged); Stripe only accepts a fixed enum, and
 * a booking that could not be created is "abandoned".
 */
export async function cancelPaymentIntent(id: string, reason: string): Promise<CancelIntentResult> {
  if (!isStripeConfigured()) return { ok: false, error: "stripe not configured" };
  if (!/^pi_[A-Za-z0-9_]+$/.test(id)) return { ok: false, error: "malformed payment reference" };

  const res = await stripeFetch<StripePaymentIntent>(`/payment_intents/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    idempotencyKey: `ora-cancel-${id}`,
    payload: { cancellation_reason: "abandoned" },
  });

  if (res.ok && res.body?.id) {
    console.warn(`[stripe] released the hold on ${id} — ${redact(reason)}`);
    return { ok: true, intent: res.body };
  }

  if ((res.body as any)?.error?.code === "payment_intent_unexpected_state") {
    const back = await retrievePaymentIntent(id);
    if (back.ok && back.intent?.status === "canceled") {
      return { ok: true, intent: back.intent, alreadyCancelled: true };
    }
  }
  return { ok: false, error: res.error || "could not release the hold" };
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
