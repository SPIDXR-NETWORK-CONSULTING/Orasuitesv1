/**
 * Booking summary — sticky glass rail on lg+, collapsible bottom sheet on mobile.
 * Reads only from BookingState; never computes prices itself (catalogue helpers).
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass";
import { depositFor, formatDuration, formatPrice, DEPOSIT_PERCENT } from "@/lib/catalogue";
import { useMotionSafe, spring, easeLuxury } from "@/lib/motion";
import { formatLongDate, formatTime } from "./time";
import type { BookingState } from "./types";

function Row({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-fog">{label}</dt>
      <dd className={cn("text-right font-sans text-[0.875rem]", muted ? "text-ora-smoke" : "text-foreground")}>{value}</dd>
    </div>
  );
}

function SummaryBody({ state, compact = false }: { state: BookingState; compact?: boolean }) {
  const s = state.service;
  const isFree = s ? s.price === 0 : false;
  const deposit = s ? depositFor(s.price) : 0;

  return (
    <div>
      {s ? (
        <div className={cn("min-w-0", compact ? "mb-2" : "mb-3")}>
          <p className="font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-fog">{s.categoryTitle} · {s.groupName}</p>
          <p className="mt-1 font-display text-[1.125rem] leading-tight text-foreground">{s.name}</p>
        </div>
      ) : (
        <p className="font-sans text-[0.9375rem] text-ora-fog">Choose a treatment to begin.</p>
      )}

      {s && (
        <dl className="divide-y divide-ora-greige/70 border-t border-ora-greige/70">
          <Row
            label="Price"
            value={<span className="font-medium">{isFree ? "Complimentary" : formatPrice(s.price)}</span>}
          />
          <Row
            label="Duration"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-ora-bronze" aria-hidden />
                {formatDuration(s.duration)}
              </span>
            }
          />
          <Row
            label="When"
            value={
              state.date && state.slot ? (
                <span>
                  {formatLongDate(state.date)}
                  <br />
                  <span className="text-ora-bronze">{formatTime(state.slot)}</span>
                </span>
              ) : state.date ? (
                <span className="text-ora-smoke">{formatLongDate(state.date)}</span>
              ) : (
                <span className="text-ora-smoke">Not chosen yet</span>
              )
            }
          />
          {!isFree && (
            <Row
              label={`${DEPOSIT_PERCENT}% deposit`}
              value={
                <span>
                  <span className="font-medium">{formatPrice(deposit)}</span>
                  <span className="block font-sans text-[0.75rem] text-ora-fog">balance {formatPrice(s.price - deposit)} at the clinic</span>
                </span>
              }
            />
          )}
        </dl>
      )}

      {!compact && (
        <p className="mt-4 flex items-start gap-2 font-sans text-[0.75rem] leading-relaxed text-ora-fog">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ora-bronze" aria-hidden />
          ORÁ Suites · 45 Deansgate, Manchester M3 2AY
        </p>
      )}
    </div>
  );
}

/* ── Desktop rail ───────────────────────────────────────── */
export function SummaryRail({ state, className }: { state: BookingState; className?: string }) {
  return (
    <aside aria-label="Your booking" className={cn("hidden lg:block", className)}>
      <div className="sticky top-28">
        <GlassCard tone="strong" padding="sm" radius="lg" staticCard className="bg-ora-cream/55">
          <p className="mb-3 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">Your booking</p>
          <SummaryBody state={state} />
        </GlassCard>
      </div>
    </aside>
  );
}

/* ── Mobile bottom sheet ────────────────────────────────── */
export function SummarySheet({ state }: { state: BookingState }) {
  const [open, setOpen] = React.useState(false);
  const m = useMotionSafe();
  const s = state.service;
  if (!s) return null;
  const isFree = s.price === 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Close summary"
            className="fixed inset-0 bg-ora-deep/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      <motion.div
        layout={!m.reduced}
        transition={spring.drawer}
        className="relative mx-3 mb-3 overflow-hidden rounded-3xl border border-glass-border-warm bg-ora-cream/85 shadow-glass backdrop-blur-glass"
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="booking-summary-sheet"
          onClick={() => setOpen((o) => !o)}
          className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="min-w-0">
            <span className="block font-sans text-[0.625rem] uppercase tracking-[0.2em] text-ora-bronze">Your booking</span>
            <span className="block truncate font-display text-[1.0625rem] text-foreground">{s.name}</span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="font-display text-[1.125rem] text-foreground">{isFree ? "Free" : formatPrice(s.price)}</span>
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.4, ease: easeLuxury }} className="text-ora-fog">
              <ChevronUp className="h-4 w-4" aria-hidden />
            </motion.span>
          </span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="booking-summary-sheet"
              initial={m.reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={m.reduced ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: easeLuxury }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                <SummaryBody state={state} compact />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
