/**
 * DepositPanel — the payment surface for step 5.
 *
 *  mode="preview"  Stripe is not connected yet. Shows the deposit maths honestly and a
 *                  clearly-labelled "Payments launching soon" panel. No fake inputs.
 *  mode="live"     Reserved for the Stripe Payment Element: render `children` (the
 *                  <PaymentElement/> from @stripe/react-stripe-js) inside the same chrome.
 *
 * Swap-in later: <DepositPanel mode="live" price={…}><PaymentElement/></DepositPanel>
 */
import * as React from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { depositFor, formatPrice, DEPOSIT_PERCENT } from "@/lib/catalogue";
import { Eyebrow, ComingSoonBadge } from "@/components/ui/glass";

export interface DepositPanelProps {
  mode: "preview" | "live";
  /** full treatment price in GBP; 0 = complimentary */
  price: number;
  className?: string;
  /** live mode: the Stripe Payment Element */
  children?: React.ReactNode;
}

export function DepositPanel({ mode, price, className, children }: DepositPanelProps) {
  const free = price === 0;
  const deposit = depositFor(price);
  const balance = price - deposit;

  return (
    <section
      aria-label="Deposit"
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
          {free ? "Complimentary" : `${DEPOSIT_PERCENT}% deposit`}
        </Eyebrow>

        {free ? (
          <p className="max-w-md font-sans text-[0.9375rem] leading-snug text-foreground">Your consultation is complimentary — no deposit needed.</p>
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-display text-[1.75rem] leading-none text-foreground">{formatPrice(deposit)}</p>
              <p className="mt-2 font-sans text-[0.875rem] text-ora-fog">
                {DEPOSIT_PERCENT}% deposit secures your booking · balance{" "}
                <span className="text-foreground">{formatPrice(balance)}</span> at the clinic
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-sans text-[0.8125rem]">
              <dt className="text-ora-fog">Treatment</dt>
              <dd className="text-right text-foreground">{formatPrice(price)}</dd>
              <dt className="text-ora-fog">Due today</dt>
              <dd className="text-right font-medium text-foreground">{formatPrice(deposit)}</dd>
              <dt className="text-ora-fog">At the clinic</dt>
              <dd className="text-right text-foreground">{formatPrice(balance)}</dd>
            </dl>
          </div>
        )}

        {!free && (
          <div className="mt-5">
            {mode === "live" ? (
              <div className="rounded-2xl border border-glass-border-warm bg-ora-cream/70 p-4">{children}</div>
            ) : (
              <div
                role="status"
                className="flex flex-col gap-4 rounded-2xl border border-dashed border-ora-bronze/50 bg-ora-bone/40 p-5 sm:flex-row sm:items-center"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ora-bronze/40 bg-ora-bronze/10 text-ora-bronze">
                  <Lock className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-sans text-[0.9375rem] font-medium text-foreground">Payments launching soon</p>
                    <ComingSoonBadge label="Card payments" />
                  </div>
                  <p className="mt-1 font-sans text-[0.8125rem] leading-relaxed text-ora-fog">
                    Your booking is held <span className="text-foreground">without a deposit for now</span>. Nothing is charged today —
                    the {DEPOSIT_PERCENT}% deposit step arrives once secure card payments are switched on.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-5 flex items-center gap-2 font-sans text-[0.75rem] text-ora-fog">
          <ShieldCheck className="h-3.5 w-3.5 text-ora-bronze" aria-hidden />
          You'll receive a confirmation by email once your booking is placed.
        </p>
      </div>
    </section>
  );
}
