/**
 * BookingFlow — the stepper state machine for /book.
 *
 *  Service → Practitioner → Date & time → Details → Confirm (deposit preview) → Done
 *
 * URL `?service=<id>` (id = `${categoryId}/${slug}`, also accepts a GHL calendarId
 * or an exact/slugified name via findService) preselects the treatment and opens step 2.
 * Steps slide x:40→0 (AnimatePresence mode="wait", easing luxury); Back supported;
 * focus moves to each step heading; reduced motion honoured.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearch, useLocation } from "wouter";
import { findService, teamMember, type ResolvedService } from "@/lib/catalogue";
import { useMotionSafe, easeLuxury } from "@/lib/motion";
import { useCreateBooking } from "./api";
import { addMinutesIso } from "./time";
import { StepProgress } from "./step-shell";
import { SummaryRail, SummarySheet } from "./summary";
import { ServiceStep } from "./steps/service-step";
import { PractitionerStep } from "./steps/practitioner-step";
import { DateTimeStep } from "./steps/datetime-step";
import { DetailsStep, normaliseUkPhone } from "./steps/details-step";
import { ConfirmStep } from "./steps/confirm-step";
import { DoneStep } from "./steps/done-step";
import { EMPTY_DETAILS, type BookingState } from "./types";

const DONE = 5;

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
  const [state, setState] = React.useState<BookingState>({
    service: preselected,
    practitioner: "first",
    details: EMPTY_DETAILS,
  });
  const [appointmentId, setAppointmentId] = React.useState<string | undefined>();

  const booking = useCreateBooking();
  const topRef = React.useRef<HTMLDivElement>(null);

  const go = React.useCallback((next: number) => {
    setDir((prev) => (next > step ? 1 : next < step ? -1 : prev));
    setStep(next);
    // keep the stepper in view on step change (mobile especially)
    const top = topRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 96, behavior: m.reduced ? "auto" : "smooth" });
  }, [step, m.reduced]);

  const patch = (p: Partial<BookingState>) => setState((s) => ({ ...s, ...p }));

  const selectService = (s: ResolvedService) => {
    // changing service invalidates slot (calendar differs) + practitioner (team differs)
    const sameCat = state.service?.categoryId === s.categoryId;
    patch({ service: s, slot: undefined, practitioner: sameCat ? state.practitioner : "first" });
    // reflect in URL without a navigation/transition
    const qs = new URLSearchParams(search);
    qs.set("service", s.id);
    qs.delete("category");
    navigate(`/book?${qs.toString()}`, { replace: true });
  };

  const confirm = () => {
    const s = state.service;
    if (!s || !s.ghlCalendarId || !state.slot) return;
    const pref = state.practitioner === "first" ? "" : `Preferred practitioner: ${teamMember(state.practitioner).name}. `;
    const notes = `${pref}${state.details.notes.trim()}`.trim();
    booking.mutate(
      {
        name: state.details.name.trim(),
        email: state.details.email.trim(),
        phone: normaliseUkPhone(state.details.phone),
        notes,
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
    <div ref={topRef} className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7 xl:col-span-8">
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
            {step === 0 && <ServiceStep selected={state.service} initialCategory={initialCategory} onSelect={selectService} onNext={() => go(1)} />}
            {step === 1 && state.service && (
              <PractitionerStep service={state.service} value={state.practitioner} onChange={(v) => patch({ practitioner: v })} onBack={() => go(0)} onNext={() => go(2)} />
            )}
            {step === 2 && state.service && (
              <DateTimeStep service={state.service} date={state.date} slot={state.slot} onChange={(n) => patch(n)} onBack={() => go(1)} onNext={() => go(3)} />
            )}
            {step === 3 && <DetailsStep value={state.details} onChange={(d) => patch({ details: d })} onBack={() => go(2)} onNext={() => go(4)} />}
            {step === 4 && ready && (
              <ConfirmStep
                state={state as BookingState & { service: ResolvedService; date: string; slot: string }}
                onBack={() => go(3)}
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
            {((step === 1 || step === 2) && !state.service) || (step >= 4 && !ready) ? (
              <Recover onReset={() => go(0)} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {step < DONE && (
        <>
          <SummaryRail state={state} className="lg:col-span-5 xl:col-span-4" />
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
