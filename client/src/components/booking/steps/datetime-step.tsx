/**
 * Step 2 — date & time.
 * 14-day horizontal strip (open 7 days) → GHL free-slots for the chosen day,
 * grouped Morning / Afternoon / Evening. Skeleton shimmer while loading.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDuration, formatPrice, type ResolvedService } from "@/lib/catalogue";
import { useMotionSafe, spring, easeLuxury } from "@/lib/motion";
import { useSlots, useVisitSlots } from "../api";
import type { VisitPart } from "../types";
import { upcomingDays, formatTime, dayPart, formatLongDate, type DayPart } from "../time";
import { StepHeader, StepNav } from "../step-shell";
import { WaitlistPanel } from "../waitlist/waitlist-panel";

interface Props {
  service: ResolvedService;
  /** more treatments in the same visit (back-to-back) */
  extras?: ResolvedService[];
  onAddAnother?: () => void;
  onRemoveExtra?: (id: string) => void;
  date?: string;
  slot?: string;
  onChange: (next: { date?: string; slot?: string; plan?: VisitPart[] }) => void;
  onBack: () => void;
  onNext: () => void;
}

const PARTS: DayPart[] = ["Morning", "Afternoon", "Evening"];

export function DateTimeStep({ service, extras = [], onAddAnother, onRemoveExtra, date, slot, onChange, onBack, onNext }: Props) {
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

  const single = useSlots(service.ghlCalendarId, date);
  const visitServices = React.useMemo(() => [service, ...extras], [service, extras]);
  const visit = useVisitSlots(extras.length ? visitServices : [], extras.length ? date : undefined);
  /** One treatment → its free slots. Several → only start times where all of them fit back-to-back. */
  const slots = extras.length
    ? { data: visit.options?.map((o) => o.start), isLoading: visit.isLoading, isError: visit.isError, isFetching: visit.isFetching, refetch: visit.refetch }
    : single;
  const pick = (iso: string) => onChange({ date, slot: iso, plan: extras.length ? visit.options?.find((o) => o.start === iso)?.plan.slice(1) : undefined });
  const totalMins = visitServices.reduce((n, x) => n + x.duration, 0);

  const grouped = React.useMemo(() => {
    const map: Record<DayPart, string[]> = { Morning: [], Afternoon: [], Evening: [] };
    for (const iso of slots.data ?? []) map[dayPart(iso)].push(iso);
    return map;
  }, [slots.data]);

  const scrollStrip = (dir: 1 | -1) => stripRef.current?.scrollBy({ left: dir * 240, behavior: m.reduced ? "auto" : "smooth" });

  const noCalendar = !service.ghlCalendarId;

  return (
    <div>
      <StepHeader step={1} title="When suits you?" lede="Manchester time. Mon–Sat 10am–7:30pm, Sun 10am–5pm." />

      {/* The visit: one treatment, or several back-to-back */}
      <div className="mb-6 rounded-2xl border border-glass-border-warm bg-ora-cream/50 p-4 sm:p-5" data-testid="visit-list">
        <p className="mb-2 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-bronze">Your visit{extras.length ? ` · ${extras.length + 1} treatments · ${formatDuration(totalMins)}` : ""}</p>
        <ul className="space-y-1.5">
          {visitServices.map((x, i) => (
            <li key={x.id} className="flex items-center gap-3 font-sans text-[0.9rem] text-foreground">
              <span className="min-w-0 flex-1 truncate">{x.name}</span>
              <span className="shrink-0 tabular-nums text-ora-fog">{formatDuration(x.duration)} · {x.price === 0 ? "POA" : formatPrice(x.price)}</span>
              {i > 0 && onRemoveExtra && (
                <button type="button" aria-label={`Remove ${x.name}`} onClick={() => onRemoveExtra(x.id)} className="focus-ring inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ora-fog hover:text-foreground"><X className="h-3.5 w-3.5" aria-hidden /></button>
              )}
            </li>
          ))}
        </ul>
        {onAddAnother && extras.length < 3 && (
          <button type="button" onClick={onAddAnother} data-testid="add-another" className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-full border border-ora-bronze/50 px-3.5 py-1.5 font-sans text-[0.8125rem] text-foreground transition-colors hover:border-ora-bronze hover:bg-ora-bronze/10">
            <Plus className="h-3.5 w-3.5 text-ora-bronze" aria-hidden /> Add another treatment
          </button>
        )}
        {extras.length > 0 && <p className="mt-2 font-sans text-[0.75rem] text-ora-fog">Booked one after another. The times below are when your first treatment starts.</p>}
      </div>

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
          date ? (extras.length
            ? <EmptyState title="No time that day fits all your treatments" body="Try another day, or remove a treatment to see more times." />
            : <WaitlistPanel service={service} date={date} />) : null
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
                          onClick={() => pick(iso)}
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
