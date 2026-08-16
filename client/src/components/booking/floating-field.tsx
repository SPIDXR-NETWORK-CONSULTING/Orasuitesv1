/**
 * FloatingField — glass input with a label that floats on focus / when filled.
 * Works for <input> and <textarea>. Bronze focus ring, inline error, aria wired.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface BaseProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

type InputProps = BaseProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "placeholder"> & { as?: "input" };
type TextareaProps = BaseProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "placeholder"> & { as: "textarea" };

export type FloatingFieldProps = InputProps | TextareaProps;

const fieldBase =
  "peer w-full rounded-2xl border bg-ora-cream/55 px-5 pb-3 pt-6 font-sans text-[0.9375rem] text-foreground " +
  "placeholder-transparent outline-none backdrop-blur-glass-sm shadow-[var(--glass-highlight)] " +
  "transition-[border-color,box-shadow,background-color] duration-450 ease-luxury " +
  "focus:border-ora-bronze focus:bg-ora-cream/80 focus:shadow-glow-bronze" +
  "autofill:bg-ora-cream/80";

const labelBase =
  "pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-sans text-[0.9375rem] text-ora-fog " +
  "transition-all duration-300 ease-luxury " +
  "peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[0.6875rem] peer-focus:uppercase peer-focus:tracking-[0.18em] peer-focus:text-ora-bronze " +
  "peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[0.6875rem] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.18em]";

export const FloatingField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, FloatingFieldProps>(
  function FloatingField(props, ref) {
    const { id, label, error, hint, className } = props;
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
    const invalid = Boolean(error);

    return (
      <div className={cn("relative", className)}>
        {props.as === "textarea" ? (
          (() => {
            const { as: _as, id: _i, label: _l, error: _e, hint: _h, className: _c, ...rest } = props;
            return (
              <textarea
                ref={ref as React.Ref<HTMLTextAreaElement>}
                id={id}
                placeholder=" "
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className={cn(fieldBase, "min-h-[7.5rem] resize-y leading-relaxed", invalid ? "border-destructive/60" : "border-glass-border-warm")}
                {...rest}
              />
            );
          })()
        ) : (
          (() => {
            const { as: _as, id: _i, label: _l, error: _e, hint: _h, className: _c, ...rest } = props as InputProps;
            return (
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                id={id}
                placeholder=" "
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className={cn(fieldBase, "h-14", invalid ? "border-destructive/60" : "border-glass-border-warm")}
                {...rest}
              />
            );
          })()
        )}
        <label
          htmlFor={id}
          className={cn(labelBase, props.as === "textarea" && "top-6 peer-focus:top-3 peer-[:not(:placeholder-shown)]:top-3", invalid && "text-destructive")}
        >
          {label}
        </label>
        {error ? (
          <p id={`${id}-error`} role="alert" className="mt-1.5 pl-1 font-sans text-[0.75rem] text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="mt-1.5 pl-1 font-sans text-[0.75rem] text-ora-fog">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
