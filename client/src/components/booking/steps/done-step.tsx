/**
 * Done — confirmation. Animated check-draw, summary card, add-to-calendar (.ics), back home.
 */
import * as React from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { CalendarPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, GlassCard } from "@/components/ui/glass";
import { formatDuration, formatPrice, type ResolvedService } from "@/lib/catalogue";
import { useMotionSafe, easeLuxury } from "@/lib/motion";
import { icsDataUrl } from "../ics";
import { addMinutesIso, formatLongDate, formatTime } from "../time";
import type { BookingState } from "../types";

interface Props {
  state: BookingState & { service: ResolvedService; date: string; slot: string };
  appointmentId?: string;
}

export function DoneStep({ state, appointmentId }: Props) {
  const m = useMotionSafe();
  const s = state.service;
  const free = s.price === 0;
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    const t = window.setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 80);
    return () => window.clearTimeout(t);
  }, []);

  const endIso = addMinutesIso(state.slot, s.duration);
  const ics = React.useMemo(
    () =>
      icsDataUrl({
        title: `${s.name} — ORÁ Suites`,
        description: `${s.categoryTitle} · ${formatDuration(s.duration)}`,
        location: "ORÁ Suites, 49 Deansgate, Manchester M3 2AY",
        startIso: state.slot,
        endIso,
        uid: appointmentId ? `${appointmentId}@orasuites.com` : undefined,
      }),
    [s, state.slot, endIso, appointmentId],
  );

  return (
    <div className="text-center">
      {/* Check draw */}
      <motion.div
        initial={m.reduced ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: easeLuxury }}
        className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-ora-bronze/40 bg-ora-bronze/10 shadow-glow-bronze"
        aria-hidden
      >
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
          <motion.circle
            cx="24"
            cy="24"
            r="21"
            stroke="var(--ora-bronze)"
            strokeWidth="1.25"
            initial={m.reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: easeLuxury }}
          />
          <motion.path
            d="M14 25.5l6.5 6.5L34 18"
            stroke="var(--ora-bronze)"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={m.reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: easeLuxury, delay: 0.5 }}
          />
        </svg>
      </motion.div>

      <Eyebrow as="p" className="mb-4 justify-center">
        {free ? "Consultation booked" : "Booking placed"}
      </Eyebrow>
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-[1.15] tracking-[-0.01em] text-foreground outline-none">
        See you soon, {state.details.name.split(" ")[0]}.
      </h2>
      <p className="mx-auto mt-3 max-w-md font-sans text-[0.9375rem] leading-relaxed text-ora-fog">
        We've sent a confirmation to <span className="text-foreground">{state.details.email}</span>. Bring yourself — we'll take care of the rest.
      </p>

      <GlassCard tone="strong" padding="md" radius="lg" staticCard className="mx-auto mt-8 max-w-md bg-ora-cream/60 text-left">
        <p className="font-display text-[1.125rem] leading-tight text-foreground">{s.name}</p>
        <p className="mt-1 font-sans text-[0.8125rem] text-ora-fog">
          {s.categoryTitle} · {formatDuration(s.duration)} · {free ? "Complimentary" : formatPrice(s.price)}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ora-greige/70 pt-5 font-sans text-[0.875rem]">
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-ora-bronze">When</p>
            <p className="mt-1 text-foreground">{formatLongDate(state.date)}</p>
            <p className="text-ora-bronze">{formatTime(state.slot)}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-ora-bronze">Where</p>
            <p className="mt-1 text-foreground">49 Deansgate</p>
            <p className="text-ora-fog">Manchester M3 2AY</p>
          </div>
        </div>
        {appointmentId && <p className="mt-4 font-mono text-[0.6875rem] text-ora-smoke">Ref {appointmentId}</p>}
      </GlassCard>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild variant="ghost" size="lg">
          <a href={ics} download="ora-suites-appointment.ics">
            <CalendarPlus aria-hidden /> Add to calendar
          </a>
        </Button>
        <Button asChild size="lg">
          <Link href="/">
            Back to home <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
