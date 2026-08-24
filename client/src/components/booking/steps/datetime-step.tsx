/**
 * Step 2 — date & time.
 * 14-day horizontal strip (open 7 days) → GHL free-slots for the chosen day,
 * grouped Morning / Afternoon / Evening. Skeleton shimmer while loading.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ResolvedService } from "@/lib/catalogue";
import { useMotionSafe, spring, easeLuxury } from "@/lib/motion";
import { useSlots } from "../api";
import { upcomingDays, formatTime, dayPart, formatLongDate, type DayPart } from "../time";
import { StepHeader, StepNav } from "../step-shell";
import { WaitlistPanel } from "../waitlist/waitlist-panel";

interface Props {
  service: ResolvedService;
  date?: string;
  slot?: string;
  onChange: (next: { date?: string; slot?: string }) => void;
  onBack: () => void;
  onNext: () => void;
}

const PARTS: DayPart[] = ["Morning", "Afternoon", "Evening"];

export function DateTimeStep({ service, date, slot, onChange, onBack, onNext }: Props) {
  const m = useMotionSafe();
  const days = React.useMemo(() => upcomingDays(14), []);
  const stripRef = React.useRef<HTMLDivElement>(null);

  // Auto-select the first open day so the visitor sees times immediately
  React.useEffect(() => {
    if (!date) {
      const first = days.find((d) => !d.closed);
      if (first) onChange({ date: first.ymd, slot: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slots = useSlots(service.ghlCalendarId, date);

  const grouped = React.useMemo(() => {
    const map: Record<DayPart, string[]> = { Morning: [], Afternoon: [], Evening: [] };
    for (const iso of slots.data ?? []) map[dayPart(iso)].push(iso);
    return map;
  }, [slots.data]);

  const scrollStrip = (dir: 1 | -1) => stripRef.current?.scrollBy({ left: dir * 240, behavior: m.reduced ? "auto" : "smooth" });

  const noCalendar = !service.ghlCalendarId;

  return (
    <div>
      <StepHeader step={1} title="When suits you?" lede="Manchester time. Open every day, 10am – 5pm." />

      {/* Date strip */}
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-sans text-[0.71875rem] uppercase tracking-[0.25em] text-ora-bronze">Next 14 days</p>
          <div className="hidden gap-1 sm:flex">
            <button type="button" aria-label="Earlier dates" onClick={() => scrollStrip(-1)} className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-ora-greige text-ora-fog transition-colors hover:border-ora-bronze hover:text-foreground">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" aria-label="Later dates" onClick={() => scrollStrip(1)} className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-ora-greige text-ora-fog transition-colors hover:border-ora-bronze hover:text-foreground">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div
          ref={stripRef}
          role="radiogroup"
          aria-label="Choose a date"
          className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {days.map((d) => {
            const active = d.ymd === date;
            return (
              <button
                key={d.ymd}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={d.closed || undefined}
                disabled={d.closed}
                onClick={() => onChange({ date: d.ymd, slot: undefined })}
                className={cn(
                  "focus-ring relative flex w-[3.75rem] shrink-0 snap-start flex-col items-center rounded-xl border px-2 py-2.5 font-sans transition-[border-color,background-color,color] duration-450 ease-luxury",
                  d.closed
                    ? "cursor-not-allowed border-ora-greige/60 text-ora-smoke/70 line-through decoration-ora-smoke/50"
                    : active
                      ? "border-ora-bronze text-ora-cream"
                      : "border-glass-border-warm bg-ora-cream/45 text-foreground hover:border-ora-bronze/60",
                )}
              >
                {active && !d.closed && (
                  <motion.span
                    layoutId="book-day-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-ora-taupe shadow-luxury"
                    transition={m.reduced ? { duration: 0 } : spring.snappy}
                  />
                )}
                <span className="relative z-[1] text-[0.625rem] uppercase tracking-[0.18em] opacity-80">{d.isToday ? "Today" : d.weekdayShort}</span>
                <span className="relative z-[1] mt-1 font-display text-[1.25rem] leading-none">{d.dayNum}</span>
                <span className="relative z-[1] mt-1 text-[0.625rem] uppercase tracking-[0.12em] opacity-70">{d.monthShort}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      <div className="mt-6 min-h-[10rem]" aria-live="polite" aria-busy={slots.isFetching || undefined}>
        {date && (
          <p className="mb-4 font-sans text-[0.9375rem] text-foreground">
            {formatLongDate(date)}
            {slot && (
              <span className="text-ora-bronze"> · {formatTime(slot)}</span>
            )}
          </p>
        )}

        {noCalendar ? (
          <EmptyState title="Online times aren't available for this treatment yet" body="Please email admin@orasuites.com and we'll arrange it for you." />
        ) : slots.isLoading ? (
          <SlotSkeleton />
        ) : slots.isError ? (
          <EmptyState title="We couldn't load times" body="Please check your connection and try again.">
            <Button type="button" variant="ghost" size="sm" onClick={() => slots.refetch()}>
              <RefreshCw aria-hidden /> Try again
            </Button>
          </EmptyState>
        ) : (slots.data?.length ?? 0) === 0 ? (
          date ? <WaitlistPanel service={service} date={date} /> : null
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={date}
              initial={m.reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={m.reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.35, ease: easeLuxury }}
              className="space-y-5"
              role="radiogroup"
              aria-label="Choose a time"
            >
              {PARTS.filter((p) => grouped[p].length).map((p) => (
                <div key={p}>
                  <p className="mb-3 flex items-center gap-3 font-sans text-[0.71875rem] uppercase tracking-[0.25em] text-ora-bronze">
                    <span aria-hidden className="inline-block h-px w-6 bg-ora-bronze" />
                    {p}
                  </p>
                  <motion.div variants={m.stagger(0.03)} initial="hidden" animate="show" className="flex flex-wrap gap-2">
                    {grouped[p].map((iso) => {
                      const active = iso === slot;
                      return (
                        <motion.button
                          key={iso}
                          variants={m.fadeUp}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => onChange({ date, slot: iso })}
                          whileHover={m.reduced ? undefined : { y: -2, transition: spring.snappy }}
                          whileTap={m.reduced ? undefined : { scale: 0.97 }}
                          className={cn(
                            "focus-ring relative min-w-[4.5rem] rounded-full border px-3.5 py-2 font-sans text-[0.875rem] tabular-nums transition-[border-color,color,background-color] duration-450 ease-luxury",
                            active ? "border-ora-bronze text-ora-cream" : "border-glass-border-warm bg-ora-cream/45 text-foreground hover:border-ora-bronze/70",
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="book-slot-pill"
                              aria-hidden
                              className="absolute inset-0 rounded-full bg-ora-taupe shadow-luxury"
                              transition={m.reduced ? { duration: 0 } : spring.snappy}
                            />
                          )}
                          <span className="relative z-[1]">{formatTime(iso)}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <StepNav onBack={onBack} onNext={onNext} nextDisabled={!slot} hint={slot ? undefined : "Choose a time to continue"} />
    </div>
  );
}

function SlotSkeleton() {
  return (
    <div className="space-y-7" aria-hidden>
      {[5, 4].map((n, gi) => (
        <div key={gi}>
          <div className="mb-3 h-2.5 w-24 rounded-full bg-ora-greige/70" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} className="relative h-10 w-20 overflow-hidden rounded-full bg-ora-greige/50">
                <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-ora-cream/70 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <style>{`@keyframes shimmer{100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}

function EmptyState({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ora-greige px-6 py-10 text-center">
      <p className="font-display text-[1.25rem] text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm font-sans text-[0.875rem] text-ora-fog">{body}</p>
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}
