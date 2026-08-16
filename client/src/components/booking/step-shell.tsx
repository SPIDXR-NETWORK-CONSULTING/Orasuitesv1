/**
 * Step chrome shared by every booking step:
 *  - StepHeader: "Step 2 of 4" + small Playfair title + optional lede; title receives focus on mount
 *  - StepNav: back / continue row
 *  - StepProgress: 4 dots + labels
 *  - ChoiceCard: selectable glass card (radio semantics)
 */
import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    <header className="mb-6 text-center md:mb-8">
      <p className="mb-2 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">
        Step {step + 1} of {STEPS.length}
      </p>
      <h2
        ref={ref}
        tabIndex={-1}
        className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-[1.15] tracking-[-0.01em] text-foreground outline-none"
      >
        {title}
      </h2>
      {lede && <p className="mx-auto mt-2 max-w-md font-sans text-[0.9375rem] leading-relaxed text-ora-fog">{lede}</p>}
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
    <div className={cn("mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
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
        size="default"
        onClick={onNext}
        disabled={nextDisabled || loading}
        aria-busy={loading || undefined}
        className="sm:min-w-[10rem]"
      >
        {loading ? "One moment…" : nextLabel}
        {!loading && <ArrowRight aria-hidden className="transition-transform duration-450 ease-luxury group-hover/btn:translate-x-0.5" />}
      </Button>
    </div>
  );
}

/* ── Progress — 4 dots + labels ─────────────────────────── */
export function StepProgress({ current, onJump }: { current: number; onJump?: (i: number) => void }) {
  const m = useMotionSafe();
  return (
    <nav aria-label="Booking progress" className="mb-8 md:mb-10">
      <ol className="flex items-center justify-center gap-2 sm:gap-3">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = done && onJump;
          const Comp = clickable ? "button" : "span";
          return (
            <React.Fragment key={s.key}>
              {i > 0 && (
                <li aria-hidden className="relative h-px w-6 overflow-hidden bg-ora-greige sm:w-10">
                  <motion.span
                    className="absolute inset-y-0 left-0 w-full origin-left bg-ora-bronze"
                    initial={false}
                    animate={{ scaleX: i <= current ? 1 : 0 }}
                    transition={m.reduced ? { duration: 0 } : { duration: 0.6, ease: easeLuxury }}
                  />
                </li>
              )}
              <li>
                <Comp
                  type={clickable ? "button" : undefined}
                  onClick={clickable ? () => onJump?.(i) : undefined}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "focus-ring flex items-center gap-2 rounded-md font-sans text-[0.6875rem] uppercase tracking-[0.16em] transition-colors duration-450 ease-luxury",
                    active ? "text-foreground" : done ? "text-ora-bronze hover:text-foreground" : "text-ora-smoke",
                    clickable && "cursor-pointer",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-450",
                      active ? "border-ora-bronze bg-ora-bronze text-ora-cream" : done ? "border-ora-bronze bg-ora-bronze/15 text-ora-bronze" : "border-ora-greige",
                    )}
                  >
                    {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                  </span>
                  <span className={cn(!active && "hidden sm:inline")}>{s.label}</span>
                </Comp>
              </li>
            </React.Fragment>
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
