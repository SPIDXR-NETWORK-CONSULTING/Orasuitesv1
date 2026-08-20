/**
 * useStripeDeposit — the 20% deposit, held with Stripe, with no npm dependency.
 *
 * HELD, NOT TAKEN: the PaymentIntent is created with manual capture, so
 * confirming here only AUTHORISES the deposit — the intent lands on
 * `requires_capture`. The money is taken by the server, seconds later, once the
 * appointment really exists. If the appointment can't be created the hold is
 * released and the customer is never charged at all.
 *
 * Stripe.js is loaded from https://js.stripe.com/v3 on demand (Stripe requires
 * the script to be served from their domain for PCI scope, so bundling it is not
 * an option anyway). The Payment Element is mounted with the vanilla API rather
 * than @stripe/react-stripe-js.
 *
 * DEGRADATION — this is the important part:
 *   · no VITE_STRIPE_PUBLISHABLE_KEY  → `enabled:false`, the panel stays in
 *     preview mode and booking works exactly as it does today
 *   · /api/booking/payment-intent 503 → same, `enabled` flips false at runtime
 *   · free consultation (price 0)     → same, no payment step at all
 *
 * The browser NEVER sends an amount. It sends a serviceId; the server prices it.
 */
import * as React from "react";

const PUBLISHABLE_KEY: string | undefined = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const STRIPE_JS = "https://js.stripe.com/v3";

export function isStripeEnabled(): boolean {
  return typeof PUBLISHABLE_KEY === "string" && PUBLISHABLE_KEY.startsWith("pk_");
}

/* ── Stripe.js loader (one script, one promise, ever) ────── */
let stripeJsPromise: Promise<any> | null = null;

function loadStripeJs(): Promise<any> {
  if (stripeJsPromise) return stripeJsPromise;
  stripeJsPromise = new Promise((resolve, reject) => {
    const w = window as any;
    if (w.Stripe) return resolve(w.Stripe(PUBLISHABLE_KEY));

    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${STRIPE_JS}"]`);
    const script = existing ?? document.createElement("script");
    const onLoad = () => {
      if ((window as any).Stripe) resolve((window as any).Stripe(PUBLISHABLE_KEY));
      else reject(new Error("Stripe.js loaded but did not initialise"));
    };
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("Could not load Stripe")), { once: true });
    if (!existing) {
      script.src = STRIPE_JS;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((err) => {
    stripeJsPromise = null; // allow a retry
    throw err;
  });
  return stripeJsPromise;
}

/* ── PaymentIntent cache ─────────────────────────────────── */
/**
 * One PaymentIntent per treatment per page session. Stepping back to Time and
 * forward again re-uses the same intent instead of leaving a trail of abandoned
 * ones in the Stripe dashboard.
 */
interface IntentRecord {
  clientSecret: string;
  paymentIntentId: string;
  depositPence: number;
  fullPricePence: number;
}
const intentCache = new Map<string, IntentRecord>();

/* ── Appearance — the ORÁ palette, not Stripe's default blue ── */
const APPEARANCE = {
  theme: "flat" as const,
  variables: {
    colorPrimary: "#b98867",
    colorBackground: "#fffdf9",
    colorText: "#1a1008",
    colorTextSecondary: "#8a7d72",
    colorDanger: "#8f3a2f",
    fontFamily: '"DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSizeBase: "15px",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1px solid #eae2d7", boxShadow: "none", padding: "12px 14px" },
    ".Input:focus": { border: "1px solid #b98867", boxShadow: "0 0 0 3px rgba(185,136,103,0.15)" },
    ".Label": { fontSize: "12px", letterSpacing: "0.06em", color: "#8a7d72" },
    ".Tab": { border: "1px solid #eae2d7", boxShadow: "none" },
    ".Tab--selected": { border: "1px solid #b98867", color: "#1a1008" },
  },
};

export type DepositStatus = "off" | "loading" | "ready" | "confirming" | "error";

export interface StripeDeposit {
  /** true when a card really will be taken for this service. */
  enabled: boolean;
  status: DepositStatus;
  /** customer-facing message; null when nothing is wrong. */
  error: string | null;
  depositPence: number | null;
  /** attach to the div the Payment Element mounts into. */
  setMountNode: (el: HTMLDivElement | null) => void;
  /** Holds the deposit on the card. Resolves the paymentIntentId, throws with a readable message. */
  confirm: () => Promise<string>;
}

export interface UseStripeDepositArgs {
  serviceId: string | undefined;
  /** catalogue price in GBP; 0 = complimentary, no payment step. */
  price: number;
  email?: string;
  /** only prepare the payment when the customer is actually on the confirm step */
  active: boolean;
}

export function useStripeDeposit({ serviceId, price, email, active }: UseStripeDepositArgs): StripeDeposit {
  const payable = isStripeEnabled() && price > 0 && Boolean(serviceId);

  const [enabled, setEnabled] = React.useState(payable);
  const [status, setStatus] = React.useState<DepositStatus>(payable ? "loading" : "off");
  const [error, setError] = React.useState<string | null>(null);
  const [depositPence, setDepositPence] = React.useState<number | null>(null);
  const [mountNode, setMountNode] = React.useState<HTMLDivElement | null>(null);

  const stripeRef = React.useRef<any>(null);
  const elementsRef = React.useRef<any>(null);
  const intentIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!payable) {
      setEnabled(false);
      setStatus("off");
      return;
    }
    setEnabled(true);
  }, [payable]);

  /* 1 — get (or reuse) a PaymentIntent + Stripe.js, then mount the element */
  React.useEffect(() => {
    if (!payable || !active || !mountNode) return;
    let cancelled = false;

    (async () => {
      try {
        setStatus("loading");
        setError(null);

        let record = intentCache.get(serviceId!);
        if (!record) {
          const res = await fetch("/api/booking/payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ serviceId, email }),
          });
          const json = await res.json().catch(() => ({}));

          if (res.status === 503) {
            // Payments aren't switched on — fall back to today's preview panel.
            if (!cancelled) {
              setEnabled(false);
              setStatus("off");
            }
            return;
          }
          if (!res.ok || !json?.clientSecret) {
            throw new Error(json?.error || "We couldn't start the payment.");
          }
          record = {
            clientSecret: json.clientSecret,
            paymentIntentId: json.paymentIntentId,
            depositPence: json.depositPence,
            fullPricePence: json.fullPricePence,
          };
          intentCache.set(serviceId!, record);
        }

        const stripe = await loadStripeJs();
        if (cancelled) return;

        stripeRef.current = stripe;
        intentIdRef.current = record.paymentIntentId;
        setDepositPence(record.depositPence);

        const elements = stripe.elements({ clientSecret: record.clientSecret, appearance: APPEARANCE });
        elementsRef.current = elements;
        const paymentElement = elements.create("payment", { layout: "tabs" });
        paymentElement.mount(mountNode);
        paymentElement.on("ready", () => {
          if (!cancelled) setStatus("ready");
        });
        paymentElement.on("loaderror", () => {
          if (!cancelled) {
            setStatus("error");
            setError("The payment form couldn't load. Please refresh and try again.");
          }
        });
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "We couldn't start the payment.");
      }
    })();

    return () => {
      cancelled = true;
      try {
        elementsRef.current?.getElement?.("payment")?.unmount?.();
      } catch {
        /* element already gone */
      }
    };
  }, [payable, active, mountNode, serviceId, email]);

  /* 2 — hold the deposit on the card (authorise; the server captures) */
  const confirm = React.useCallback(async (): Promise<string> => {
    if (!payable || !enabled) throw new Error("No payment is required for this booking.");
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) throw new Error("The payment form isn't ready yet. Please wait a moment and try again.");

    setStatus("confirming");
    setError(null);

    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });

    if (result?.error) {
      const message: string =
        result.error.message || "We couldn't hold the deposit on your card. Please check the details and try again.";
      setStatus("ready");
      setError(message);
      throw new Error(message);
    }

    const intent = result?.paymentIntent;
    // `requires_capture` is the expected outcome with manual capture (the money
    // is held). `succeeded` is accepted too, so an intent created before manual
    // capture — or any Stripe path that captures immediately — still works.
    if (!intent || (intent.status !== "requires_capture" && intent.status !== "succeeded")) {
      const message = "Your payment didn't complete. Nothing has been booked — please try again.";
      setStatus("ready");
      setError(message);
      throw new Error(message);
    }

    // Spent: this intent can never be reused for another booking.
    if (serviceId) intentCache.delete(serviceId);
    setStatus("ready");
    return intent.id as string;
  }, [payable, enabled, serviceId]);

  return { enabled, status, error, depositPence, setMountNode, confirm };
}
