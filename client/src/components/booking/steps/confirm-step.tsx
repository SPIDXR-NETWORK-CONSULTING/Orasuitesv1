/**
 * Step 4 — review, hold the 20% deposit, then confirm.
 *
 * ORDER: the deposit is HELD on the card first (authorised, not taken), then
 * POST /api/ghl/booking runs with the resulting paymentIntentId. The server
 * takes the money only once the appointment exists; if it can't be created the
 * hold is released and the customer is never charged (see
 * api/_lib/deposit-guard.ts).
 *
 * When Stripe isn't configured — or the treatment is complimentary — this is
 * exactly the flow it has always been: no payment step at all.
 */
import * as React from "react";
import { AlertCircle, Clock, Pencil } from "lucide-react";
import { formatDuration, formatPrice, depositFor, type ResolvedService } from "@/lib/catalogue";
import { Button } from "@/components/ui/button";
import { DepositPanel } from "../deposit-panel";
import { useStripeDeposit } from "../use-stripe-deposit";
import { StepHeader, StepNav } from "../step-shell";
import { formatLongDate, formatTime } from "../time";
import type { BookingState } from "../types";

interface Props {
  state: BookingState & { service: ResolvedService; date: string; slot: string };
  onBack: () => void;
  onEdit: (step: number) => void;
  /** paymentIntentId is undefined for free consultations and preview mode. */
  onConfirm: (paymentIntentId?: string) => void;
  loading: boolean;
  error?: string | null;
}

export function ConfirmStep({ state, onBack, onEdit, onConfirm, loading, error }: Props) {
  const s = state.service;
  const free = s.price === 0;

  const deposit = useStripeDeposit({
    serviceId: s.id,
    price: s.price,
    email: state.details.email,
    active: true,
  });

  const [paying, setPaying] = React.useState(false);
  const [payError, setPayError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    if (!deposit.enabled) return onConfirm();
    setPaying(true);
    setPayError(null);
    try {
      const paymentIntentId = await deposit.confirm();
      onConfirm(paymentIntentId);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "We couldn't hold the deposit on your card.");
    } finally {
      setPaying(false);
    }
  };

  const depositAmount = depositFor(s.price);
  const busy = loading || paying || deposit.status === "confirming";
  const blocked = deposit.enabled && deposit.status !== "ready" && deposit.status !== "confirming";
  /** Stripe.js or the PaymentIntent failed outright — retrying in place won't help. */
  const paymentUnavailable = deposit.enabled && deposit.status === "error";

  return (
    <div>
      <StepHeader step={3} title={free ? "Confirm your consultation" : "Review and confirm"} />

      {/* Review card */}
      <dl className="overflow-hidden rounded-2xl border border-glass-border-warm bg-ora-cream/50 backdrop-blur-glass-sm">
        <ReviewRow label="Treatment" onEdit={() => onEdit(0)}>
          <span className="font-display text-[1.125rem] leading-tight text-foreground">{s.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.8125rem] text-ora-fog">
            <span>{s.categoryTitle} · {s.groupName}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-ora-bronze" aria-hidden />{formatDuration(s.duration)}</span>
            <span className="text-foreground">{free ? "Complimentary" : formatPrice(s.price)}</span>
          </span>
        </ReviewRow>
        <ReviewRow label="When" onEdit={() => onEdit(1)}>
          <span className="font-sans text-[0.9375rem] text-foreground">
            {formatLongDate(state.date)} · <span className="text-ora-bronze">{formatTime(state.slot)}</span>
          </span>
        </ReviewRow>
        <ReviewRow label="Your details" onEdit={() => onEdit(2)}>
          <span className="font-sans text-[0.9375rem] text-foreground">{state.details.name}</span>
          <span className="mt-0.5 block font-sans text-[0.8125rem] text-ora-fog">{state.details.email} · {state.details.phone}</span>
          {state.details.notes && <span className="mt-1 block font-sans text-[0.8125rem] italic text-ora-fog">“{state.details.notes}”</span>}
        </ReviewRow>
      </dl>

      <DepositPanel
        mode={deposit.enabled ? "live" : "preview"}
        price={s.price}
        className="mt-6"
        loading={deposit.enabled && deposit.status === "loading"}
        error={payError ?? deposit.error}
      >
        {deposit.enabled && <div ref={deposit.setMountNode} data-testid="stripe-payment-element" />}
      </DepositPanel>

      {/* Also shown when the payment form itself can't load — otherwise the
          Confirm button stays disabled and the customer has nowhere to go. */}
      {(error || paymentUnavailable) && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <div className="font-sans text-[0.875rem]">
            <p className="font-medium text-foreground">
              {paymentUnavailable ? "We can't take payment online just now" : "We couldn't confirm this online just now"}
            </p>
            <p className="mt-0.5 text-ora-fog">
              {paymentUnavailable
                ? "Send us your request in one tap instead — we'll confirm it by email and take the deposit at the clinic."
                : "Please try again, or send us your request in one tap — we'll confirm it by email."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="primary">
                <a href={fallbackMailto(state)} data-testid="link-booking-fallback-email">Email this booking request</a>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <a href="/contact">Contact page</a>
              </Button>
            </div>
            <p className="mt-2 text-[0.75rem] text-ora-fog/80">Ref: {error ?? deposit.error}</p>
          </div>
        </div>
      )}

      <StepNav
        onBack={onBack}
        onNext={handleConfirm}
        loading={busy}
        nextDisabled={blocked}
        nextLabel={free ? "Confirm consultation" : "Confirm booking"}
        hint={
          free
            ? undefined
            : deposit.enabled
              ? `${formatPrice(depositAmount)} held now, taken when your booking is confirmed`
              : "Nothing is charged today"
        }
      />
    </div>
  );
}

function ReviewRow({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ora-greige/70 px-5 py-4 last:border-b-0 sm:px-6">
      <div className="min-w-0">
        <dt className="mb-1.5 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-bronze">{label}</dt>
        <dd className="min-w-0">{children}</dd>
      </div>
      <Button type="button" variant="link" size="sm" onClick={onEdit} className="shrink-0 text-ora-fog hover:text-foreground" aria-label={`Change ${label.toLowerCase()}`}>
        <Pencil aria-hidden className="!size-3.5" /> Change
      </Button>
    </div>
  );
}

/** Zero-dependency fallback: if the booking API is unavailable, the client can still send us the exact request. */
function fallbackMailto(state: Props["state"]): string {
  const subject = `Booking request — ${state.service.name} — ${formatLongDate(state.date)} ${formatTime(state.slot)}`;
  const body = [
    `Hi ORÁ,`,
    ``,
    `I tried to book online but it couldn't be confirmed. Please book me in:`,
    ``,
    `Treatment: ${state.service.name} (${formatDuration(state.service.duration)}, ${state.service.price === 0 ? "complimentary" : formatPrice(state.service.price)})`,
    `When: ${formatLongDate(state.date)} at ${formatTime(state.slot)}`,
    `Name: ${state.details.name}`,
    `Email: ${state.details.email}`,
    `Phone: ${state.details.phone}`,
    state.details.notes ? `Notes: ${state.details.notes}` : ``,
    ``,
    `Thank you`,
  ].join("\n");
  return `mailto:admin@orasuites.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
