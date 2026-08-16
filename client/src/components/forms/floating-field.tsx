/**
 * ORÁ floating-label form primitives (glass, bronze focus, motion-aware).
 *
 *  FloatingInput     text/email/tel/date input with a label that lifts on focus/value
 *  FloatingTextarea  same, multi-line
 *  FloatingSelect    native select with lifted label + bronze chevron
 *  ChoiceGroup       pill radio group (e.g. Yes / No)
 *  FieldError        small bronze-red error line (aria-live)
 *  SubmitButton      spring submit with sending / success morph
 *
 * Owned by agent 4 (About / Contact / Room rentals). Colours are tokens only.
 */
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring, useMotionSafe } from "@/lib/motion";

/* ── shared styles ─────────────────────────────────────── */
const fieldBase =
  "peer w-full rounded-2xl border bg-white/55 px-5 pt-6 pb-2.5 font-sans text-[0.95rem] text-foreground " +
  "backdrop-blur-glass-sm shadow-[inset_0_1px_0_rgba(255,255,255,.6)] " +
  "border-ora-greige/70 placeholder-transparent outline-none " +
  "transition-[border-color,box-shadow,background-color] duration-450 ease-luxury " +
  "hover:border-ora-taupe/60 focus:border-ora-bronze focus:bg-white/80 focus:shadow-[0_0_0_4px_rgba(185,136,103,.14)] " +
  "disabled:opacity-60 " +
  "[.band-dark_&]:bg-white/[.07] [.band-dark_&]:border-white/15 [.band-dark_&]:text-ora-cream [.band-dark_&]:focus:bg-white/[.12]";

const labelBase =
  "pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 origin-left font-sans text-[0.95rem] text-ora-fog " +
  "transition-all duration-300 ease-luxury " +
  "peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[0.6875rem] peer-focus:uppercase peer-focus:tracking-[0.18em] peer-focus:text-ora-bronze " +
  "peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[0.6875rem] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.18em] " +
  "[.band-dark_&]:text-ora-smoke";

const errorBorder = "border-[#b5533c]/70 focus:border-[#b5533c] focus:shadow-[0_0_0_4px_rgba(181,83,60,.14)]";

/* ── FloatingInput ─────────────────────────────────────── */
export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}
export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(function FloatingInput(
  { label, error, hint, id, className, wrapperClassName, required, ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? `f-${autoId}`;
  const errId = `${inputId}-err`;
  const hintId = `${inputId}-hint`;
  // date/time inputs never report :placeholder-shown, so keep the label lifted
  const alwaysLifted = rest.type === "date" || rest.type === "time" || rest.type === "datetime-local";
  return (
    <div className={cn("relative", wrapperClassName)}>
      <input
        ref={ref}
        id={inputId}
        placeholder=" "
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : hint ? hintId : undefined}
        className={cn(fieldBase, error && errorBorder, className)}
        {...rest}
      />
      <label
        htmlFor={inputId}
        className={cn(labelBase, alwaysLifted && "top-3 translate-y-0 text-[0.6875rem] uppercase tracking-[0.18em]")}
      >
        {label}
        {required && <span aria-hidden className="ml-0.5 text-ora-bronze">*</span>}
      </label>
      <FieldError id={errId} message={error} />
      {!error && hint && (
        <p id={hintId} className="mt-1.5 pl-1 font-sans text-[0.75rem] text-ora-fog">
          {hint}
        </p>
      )}
    </div>
  );
});

/* ── FloatingTextarea ──────────────────────────────────── */
export interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  wrapperClassName?: string;
}
export const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(function FloatingTextarea(
  { label, error, id, className, wrapperClassName, required, rows = 4, ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? `f-${autoId}`;
  const errId = `${inputId}-err`;
  return (
    <div className={cn("relative", wrapperClassName)}>
      <textarea
        ref={ref}
        id={inputId}
        placeholder=" "
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={cn(fieldBase, "resize-none pt-7 leading-relaxed", error && errorBorder, className)}
        {...rest}
      />
      <label htmlFor={inputId} className={cn(labelBase, "top-6")}>
        {label}
        {required && <span aria-hidden className="ml-0.5 text-ora-bronze">*</span>}
      </label>
      <FieldError id={errId} message={error} />
    </div>
  );
});

/* ── FloatingSelect ────────────────────────────────────── */
export interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  wrapperClassName?: string;
  placeholder?: string;
  children: React.ReactNode;
}
export const FloatingSelect = React.forwardRef<HTMLSelectElement, FloatingSelectProps>(function FloatingSelect(
  { label, error, id, className, wrapperClassName, required, placeholder = "Select…", value, children, ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? `f-${autoId}`;
  const errId = `${inputId}-err`;
  const hasValue = value !== undefined && value !== "";
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        ref={ref}
        id={inputId}
        required={required}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={cn(fieldBase, "appearance-none pr-12", !hasValue && "text-transparent", error && errorBorder, className)}
        {...rest}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {children}
      </select>
      <label
        htmlFor={inputId}
        className={cn(
          labelBase,
          hasValue && "top-3 translate-y-0 text-[0.6875rem] uppercase tracking-[0.18em]",
        )}
      >
        {label}
        {required && <span aria-hidden className="ml-0.5 text-ora-bronze">*</span>}
      </label>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-ora-bronze transition-transform duration-300 peer-focus:rotate-180"
      />
      <FieldError id={errId} message={error} />
    </div>
  );
});

/* ── ChoiceGroup (pill radios) ─────────────────────────── */
export interface ChoiceOption {
  value: string;
  label: string;
}
export interface ChoiceGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: ChoiceOption[];
  error?: string;
  required?: boolean;
  className?: string;
}
export function ChoiceGroup({ label, name, value, onChange, options, error, required, className }: ChoiceGroupProps) {
  const m = useMotionSafe();
  const groupId = React.useId();
  return (
    <fieldset className={cn("min-w-0", className)} aria-describedby={error ? `${groupId}-err` : undefined}>
      <legend className="mb-3 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-bronze">
        {label}
        {required && <span aria-hidden className="ml-0.5">*</span>}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <motion.label
              key={o.value}
              whileHover={m.reduced ? undefined : { scale: 1.02 }}
              whileTap={m.reduced ? undefined : { scale: 0.98 }}
              transition={spring.snappy}
              className={cn(
                "relative inline-flex cursor-pointer select-none items-center gap-2 rounded-full border px-5 py-2.5 font-sans text-[0.875rem]",
                "transition-[border-color,background-color,color,box-shadow] duration-450 ease-luxury",
                "has-[:focus-visible]:shadow-[0_0_0_2px_hsl(var(--ora-milk)),0_0_0_4px_var(--ora-bronze)]",
                active
                  ? "border-ora-bronze bg-ora-deep text-ora-cream shadow-glow-bronze"
                  : "border-ora-greige/80 bg-white/50 text-foreground hover:border-ora-taupe/70 [.band-dark_&]:bg-white/[.06] [.band-dark_&]:border-white/15 [.band-dark_&]:text-ora-cream",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={active}
                onChange={() => onChange(o.value)}
                className="sr-only"
                required={required}
              />
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                  active ? "bg-ora-bronze" : "bg-ora-greige",
                )}
              />
              {o.label}
            </motion.label>
          );
        })}
      </div>
      <FieldError id={`${groupId}-err`} message={error} />
    </fieldset>
  );
}

/* ── FieldError ────────────────────────────────────────── */
export function FieldError({ id, message }: { id?: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-1.5 pl-1 font-sans text-[0.75rem] text-[#b5533c] [.band-dark_&]:text-[#e0917a]"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/* ── SubmitButton (spring + morph) ─────────────────────── */
export type SubmitState = "idle" | "loading" | "success" | "error";
export interface SubmitButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  state: SubmitState;
  idleLabel: string;
  loadingLabel?: string;
  successLabel?: string;
  /** dark = chocolate fill (default), bronze = bronze outline glow */
  tone?: "dark" | "cream";
  icon?: React.ReactNode;
}
export function SubmitButton({
  state,
  idleLabel,
  loadingLabel = "Sending…",
  successLabel = "Sent",
  tone = "dark",
  icon,
  className,
  disabled,
  ...rest
}: SubmitButtonProps) {
  const m = useMotionSafe();
  const isBusy = state === "loading";
  const isDone = state === "success";
  return (
    <motion.button
      type="submit"
      disabled={disabled || isBusy || isDone}
      whileHover={!m.reduced && !isBusy && !isDone ? { scale: 1.03 } : undefined}
      whileTap={!m.reduced && !isBusy && !isDone ? { scale: 0.98 } : undefined}
      transition={spring.snappy}
      layout
      aria-live="polite"
      className={cn(
        "relative inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 overflow-hidden rounded-full px-8 font-sans text-[0.9375rem] font-medium tracking-[0.02em]",
        "transition-[background-color,color,border-color,box-shadow] duration-450 ease-luxury focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        tone === "dark" &&
          "border border-ora-bronze/40 bg-ora-deep text-ora-cream shadow-luxury hover:border-ora-bronze hover:shadow-glow-bronze",
        tone === "cream" && "border border-ora-cream/30 bg-ora-cream text-ora-deep hover:shadow-glow-bronze",
        isDone && "border-ora-bronze bg-ora-bronze text-ora-deep",
        className,
      )}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isBusy ? (
          <motion.span key="busy" className="inline-flex items-center gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {loadingLabel}
          </motion.span>
        ) : isDone ? (
          <motion.span key="done" className="inline-flex items-center gap-2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring.snappy}>
            <Check className="h-4 w-4" aria-hidden />
            {successLabel}
          </motion.span>
        ) : (
          <motion.span key="idle" className="inline-flex items-center gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {idleLabel}
            {icon}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ── SuccessPanel ──────────────────────────────────────── */
export interface SuccessPanelProps {
  title: string;
  body: React.ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}
export function SuccessPanel({ title, body, onReset, resetLabel = "Send another", className }: SuccessPanelProps) {
  const m = useMotionSafe();
  return (
    <motion.div
      role="status"
      initial={m.reduced ? false : { opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...spring.soft }}
      className={cn("flex flex-col items-center gap-4 py-10 text-center", className)}
    >
      <motion.span
        initial={m.reduced ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...spring.snappy, delay: 0.1 }}
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-ora-bronze/15 text-ora-bronze ring-1 ring-ora-bronze/40 animate-bronze-pulse"
      >
        <Check className="h-7 w-7" aria-hidden />
      </motion.span>
      <p className="font-display text-display-sm text-foreground">{title}</p>
      <div className="max-w-sm font-sans text-[0.95rem] leading-relaxed text-ora-fog">{body}</div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-2 font-sans text-[0.8125rem] uppercase tracking-[0.18em] text-ora-bronze underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze rounded"
        >
          {resetLabel}
        </button>
      )}
    </motion.div>
  );
}
