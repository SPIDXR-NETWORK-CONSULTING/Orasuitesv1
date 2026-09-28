/**
 * DepositPanel — the payment surface for step 4.
 *
 *  mode="preview"  No deposit is being taken (no Stripe key, or deposits paused with
 *                  env DEPOSITS_ENABLED=false). Says plainly: nothing to pay today, the
 *                  full price is paid at the clinic. No fake inputs.
 *  mode="live"     The Stripe Payment Element lives in `children` — the mount node
 *                  handed over by useStripeDeposit(). Same chrome either way.
 *
 * The panel states the exact figures, that the deposit is HELD now and taken
 * once the booking is confirmed, and — in live mode — the 24-hour refund rule,
 * all BEFORE the customer confirms.
 */
import * as React from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { depositFor, formatPrice, DEPOSIT_PERCENT } from "@/lib/catalogue";
import { Eyebrow } from "@/components/ui/glass";

export interface DepositPanelProps {
  mode: "preview" | "live";
  /** full treatment price in GBP; 0 = complimentary */
  price: number;
  className?: string;
  /** live mode: true while the Payment Element is still being prepared */
  loading?: boolean;
  /** live mode: a card or setup error to show in place of nothing */
  error?: string | null;
  /** live mode: the Stripe Payment Element mount node */
  children?: React.ReactNode;
}

export function DepositPanel({ mode, price, className, loading, error, children }: DepositPanelProps) {
  const free = price === 0;
  const deposit = depositFor(price);
  const balance = price - deposit;
  const live = mode === "live";

  return (
    <section
      aria-label={live ? "Deposit" : "Payment"}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-glass-border-warm bg-ora-cream/55 p-5 shadow-glass backdrop-blur-glass sm:p-6",
        className,
      )}
    >
      {/* soft bronze mesh */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(var(--ora-bronze-rgb)/0.18),transparent)]"
      />

      <div className="relative">
        <Eyebrow as="p" rule className="mb-3">
          {free ? "Complimentary" : live ? `${DEPOSIT_PERCENT}% deposit` : "Payment"}
        </Eyebrow>

        {free ? (
          <p className="max-w-md font-sans text-[0.9375rem] leading-snug text-foreground">Your consultation is complimentary — no deposit needed.</p>
        ) : !live ? (
          <div>
            <p className="font-display text-[1.75rem] leading-none text-foreground">{formatPrice(price)}</p>
            <p className="mt-2 font-sans text-[0.875rem] text-ora-fog">
              <span className="text-foreground">Nothing to pay today</span> · paid at the clinic
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-display text-[1.75rem] leading-none text-foreground">{formatPrice(deposit)}</p>
              <p className="mt-2 font-sans text-[0.875rem] text-ora-fog">
                <span className="text-foreground">{formatPrice(deposit)} held now</span>, taken when your booking is
                confirmed
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-sans text-[0.8125rem]">
              <dt className="text-ora-fog">Treatment</dt>
              <dd className="text-right text-foreground">{formatPrice(price)}</dd>
              <dt className="text-ora-fog">Held today</dt>
              <dd className="text-right font-medium text-foreground">{formatPrice(deposit)}</dd>
              <dt className="text-ora-fog">At the clinic</dt>
              <dd className="text-right text-foreground">{formatPrice(balance)}</dd>
            </dl>
          </div>
        )}

        {live && !free && (
          <div className="mt-5 rounded-2xl border border-glass-border-warm bg-ora-cream/70 p-4">
            {children}
            {loading && (
              <p role="status" className="py-6 text-center font-sans text-[0.8125rem] text-ora-fog">
                Preparing secure payment…
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 flex items-start gap-2 font-sans text-[0.8125rem] text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{error}</span>
              </p>
            )}
          </div>
        )}

        {live && !free && (
          <p className="mt-4 font-sans text-[0.75rem] leading-relaxed text-ora-fog">
            Cancel more than <span className="text-foreground">24 hours</span> before your appointment and the{" "}
            {formatPrice(deposit)} deposit is refunded in full. Within 24 hours the deposit is retained. Rescheduling keeps
            your deposit — it moves with your booking.
          </p>
        )}

        <p className="mt-5 flex items-center gap-2 font-sans text-[0.75rem] text-ora-fog">
          <ShieldCheck className="h-3.5 w-3.5 text-ora-bronze" aria-hidden />
          {live ? "Card details are handled by Stripe — they never touch our servers." : "You'll receive a confirmation by email once your booking is placed."}
        </p>
      </div>
    </section>
  );
}
