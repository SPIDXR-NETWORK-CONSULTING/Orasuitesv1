/**
 * BookingFlow — the stepper state machine for /book.
 *
 *  Service → Time → Details → Confirm (deposit preview) → Done
 *
 * URL `?service=<id>` (id = `${categoryId}/${slug}`, also accepts a GHL calendarId
 * or an exact/slugified name via findService) preselects the treatment and opens Time.
 * Choosing a service auto-advances to Time. Steps slide x:40→0 (AnimatePresence
 * mode="wait"); Back supported; focus moves to each step heading; reduced motion honoured.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearch, useLocation } from "wouter";
import { findService, type ResolvedService } from "@/lib/catalogue";
import { useMotionSafe, easeLuxury } from "@/lib/motion";
import { useCreateBooking } from "./api";
import { addMinutesIso } from "./time";
import { StepProgress } from "./step-shell";
import { SummaryRail, SummarySheet } from "./summary";
import { ServiceStep } from "./steps/service-step";
import { DateTimeStep } from "./steps/datetime-step";
import { DetailsStep, normaliseUkPhone } from "./steps/details-step";
import { ConfirmStep } from "./steps/confirm-step";
import { DoneStep } from "./steps/done-step";
import { EMPTY_DETAILS, type BookingState } from "./types";

const DONE = 4;

export function BookingFlow() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const m = useMotionSafe();

  const preselected = React.useMemo<ResolvedService | undefined>(() => {
    const id = new URLSearchParams(search).get("service");
    if (!id) return undefined;
    const s = findService(id);
    return s && s.live ? s : undefined;
  }, [search]);

  const initialCategory = React.useMemo(() => new URLSearchParams(search).get("category") ?? undefined, [search]);

  const [step, setStep] = React.useState<number>(preselected ? 1 : 0);
  const [dir, setDir] = React.useState<1 | -1>(1);
  const [state, setState] = React.useState<BookingState>({ service: preselected, details: EMPTY_DETAILS });
  const [appointmentId, setAppointmentId] = React.useState<string | undefined>();

  const booking = useCreateBooking();
  const topRef = React.useRef<HTMLDivElement>(null);

  const go = React.useCallback(
    (next: number) => {
      setDir((prev) => (next > step ? 1 : next < step ? -1 : prev));
      setStep(next);
      // keep the stepper in view on step change (mobile especially)
      const top = topRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 96, behavior: m.reduced ? "auto" : "smooth" });
    },
    [step, m.reduced],
  );

  const patch = (p: Partial<BookingState>) => setState((s) => ({ ...s, ...p }));

  /** Select a treatment and move straight on to Time. */
  const selectService = (s: ResolvedService) => {
    // changing service invalidates the slot (calendar differs)
    patch({ service: s, slot: undefined });
    const qs = new URLSearchParams(search);
    qs.set("service", s.id);
    qs.delete("category");
    navigate(`/book?${qs.toString()}`, { replace: true });
    go(1);
  };

  const confirm = () => {
    const s = state.service;
    if (!s || !s.ghlCalendarId || !state.slot) return;
    booking.mutate(
      {
        name: state.details.name.trim(),
        email: state.details.email.trim(),
        phone: normaliseUkPhone(state.details.phone),
        notes: state.details.notes.trim(),
        calendarId: s.ghlCalendarId,
        serviceName: s.name,
        startTime: state.slot,
        endTime: addMinutesIso(state.slot, s.duration),
      },
      {
        onSuccess: (res) => {
          setAppointmentId(res.appointmentId);
          go(DONE);
        },
      },
    );
  };

  const variants = {
    enter: (d: 1 | -1) => (m.reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 * d }),
    center: { opacity: 1, x: 0 },
    exit: (d: 1 | -1) => (m.reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 * d }),
  };

  const ready = state.service && state.date && state.slot;

  return (
    <div ref={topRef} className="mx-auto grid max-w-2xl gap-8 lg:max-w-[62rem] lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
      <div className="min-w-0">
        {step < DONE && <StepProgress current={step} onJump={(i) => go(i)} />}
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: easeLuxury }}
          >
            {step === 0 && <ServiceStep selected={state.service} initialCategory={initialCategory} onSelect={selectService} />}
            {step === 1 && state.service && (
              <DateTimeStep service={state.service} date={state.date} slot={state.slot} onChange={(n) => patch(n)} onBack={() => go(0)} onNext={() => go(2)} />
            )}
            {step === 2 && <DetailsStep value={state.details} onChange={(d) => patch({ details: d })} onBack={() => go(1)} onNext={() => go(3)} />}
            {step === 3 && ready && (
              <ConfirmStep
                state={state as BookingState & { service: ResolvedService; date: string; slot: string }}
                onBack={() => go(2)}
                onEdit={(i) => go(i)}
                onConfirm={confirm}
                loading={booking.isPending}
                error={booking.isError ? booking.error.message.replace(/^\d{3}:\s*/, "") : null}
              />
            )}
            {step === DONE && ready && (
              <DoneStep state={state as BookingState & { service: ResolvedService; date: string; slot: string }} appointmentId={appointmentId} />
            )}
            {/* Guard: if state is missing for the step (e.g. refresh), send back to the start */}
            {(step === 1 && !state.service) || (step >= 3 && !ready) ? <Recover onReset={() => go(0)} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {step < DONE && (
        <>
          <SummaryRail state={state} />
          <SummarySheet state={state} />
        </>
      )}
    </div>
  );
}

function Recover({ onReset }: { onReset: () => void }) {
  React.useEffect(() => {
    onReset();
  }, [onReset]);
  return null;
}
