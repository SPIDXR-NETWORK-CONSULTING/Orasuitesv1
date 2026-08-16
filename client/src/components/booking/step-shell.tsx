/**
 * Step chrome shared by every booking step:
 *  - StepHeader: eyebrow ("Step 2 of 5") + Playfair title + optional lede; title receives focus on mount
 *  - StepNav: back / continue row
 *  - StepProgress: scaleX bar + labels
 *  - ChoiceCard: selectable glass card (radio semantics)
 */
import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/glass";
import { useMotionSafe, easeLuxury, spring } from "@/lib/motion";
import { STEPS } from "./types";

/* ── Header ─────────────────────────────────────────────── */
export function StepHeader({
  step,
  title,
  lede,
  children,
}: {
  step: number;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    // Move focus to the new step heading (screen readers + keyboard users)
    const t = window.setTimeout(() => ref.current?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <header className="mb-8 md:mb-10">
      <Eyebrow as="p" rule className="mb-4">
        Step {step + 1} of {STEPS.length}
      </Eyebrow>
      <h2 ref={ref} tabIndex={-1} className="text-display-sm font-display text-foreground outline-none md:text-display-md">
        {title}
      </h2>
      {lede && <p className="lede mt-4 max-w-xl text-[1rem] md:text-[1.0625rem]">{lede}</p>}
      {children}
    </header>
  );
}

/* ── Nav ────────────────────────────────────────────────── */
export function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  nextType = "button",
  loading,
  hint,
  className,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: React.ReactNode;
  nextDisabled?: boolean;
  nextType?: "button" | "submit";
  loading?: boolean;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-center gap-4">
        {onBack && (
          <Button type="button" variant="link" size="sm" onClick={onBack} className="text-ora-fog hover:text-foreground">
            <ArrowLeft aria-hidden />
            Back
          </Button>
        )}
        {hint && <p className="font-sans text-[0.75rem] text-ora-fog">{hint}</p>}
      </div>
      <Button
        type={nextType}
        size="lg"
        onClick={onNext}
        disabled={nextDisabled || loading}
        aria-busy={loading || undefined}
        className="sm:min-w-[11rem]"
      >
        {loading ? "One moment…" : nextLabel}
        {!loading && <ArrowRight aria-hidden className="transition-transform duration-450 ease-luxury group-hover/btn:translate-x-0.5" />}
      </Button>
    </div>
  );
}

/* ── Progress ───────────────────────────────────────────── */
export function StepProgress({ current, onJump }: { current: number; onJump?: (i: number) => void }) {
  const m = useMotionSafe();
  const pct = Math.min(1, (current + 1) / STEPS.length);
  return (
    <nav aria-label="Booking progress" className="mb-10 md:mb-14">
      <div className="relative h-px w-full overflow-hidden rounded-full bg-ora-greige">
        <motion.div
          className="absolute inset-y-0 left-0 origin-left bg-ora-bronze"
          initial={false}
          animate={{ scaleX: pct }}
          transition={m.reduced ? { duration: 0 } : { duration: 0.8, ease: easeLuxury }}
          style={{ width: "100%" }}
        />
      </div>
      <ol className="mt-4 flex items-center gap-3 sm:grid sm:grid-cols-5 sm:gap-2">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = done && onJump;
          const Comp = clickable ? "button" : "span";
          return (
            <li key={s.key} className={cn("min-w-0", active ? "flex-1" : "shrink-0")}>
              <Comp
                type={clickable ? "button" : undefined}
                onClick={clickable ? () => onJump?.(i) : undefined}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "focus-ring flex w-full items-center gap-2 rounded-md font-sans text-[0.6875rem] uppercase tracking-[0.18em] transition-colors duration-450 ease-luxury sm:text-[0.75rem]",
                  active ? "text-foreground" : done ? "text-ora-bronze hover:text-foreground" : "text-ora-smoke",
                  clickable && "cursor-pointer",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[0.55rem] transition-colors duration-450",
                    active ? "border-ora-bronze bg-ora-bronze text-ora-cream" : done ? "border-ora-bronze bg-ora-bronze/15 text-ora-bronze" : "border-ora-greige",
                  )}
                >
                  {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                </span>
                <span className={cn("truncate", !active && "hidden sm:inline")}>{s.label}</span>
              </Comp>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── ChoiceCard ─────────────────────────────────────────── */
export interface ChoiceCardProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  selected?: boolean;
  onSelect?: () => void;
  layoutId?: string;
  padding?: "sm" | "md";
}

/** Radio-style glass card. Selected = bronze hairline + soft glow + check pip. */
export const ChoiceCard = React.forwardRef<HTMLButtonElement, ChoiceCardProps>(function ChoiceCard(
  { selected = false, onSelect, className, children, padding = "md", disabled, ...rest },
  ref,
) {
  const m = useMotionSafe();
  return (
    <motion.button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onSelect}
      whileHover={!disabled && !m.reduced ? { y: -4, scale: 1.01, transition: spring.soft } : undefined}
      whileTap={!disabled && !m.reduced ? { scale: 0.99 } : undefined}
      className={cn(
        "focus-ring group/choice relative w-full rounded-2xl border text-left transition-[border-color,box-shadow,background-color] duration-450 ease-luxury",
        "bg-ora-cream/45 backdrop-blur-glass-sm shadow-[var(--glass-highlight)]",
        selected
          ? "border-ora-bronze bg-ora-cream/75 shadow-glow-bronze"
          : "border-glass-border-warm hover:border-ora-bronze/60 hover:bg-ora-cream/65",
        disabled && "cursor-not-allowed opacity-50",
        padding === "md" ? "p-5" : "p-4",
        className,
      )}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute right-4 top-4 inline-flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-450 ease-luxury",
          selected ? "scale-100 border-ora-bronze bg-ora-bronze text-ora-cream opacity-100" : "scale-75 border-ora-greige opacity-0 group-hover/choice:opacity-60",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </motion.button>
  );
});
