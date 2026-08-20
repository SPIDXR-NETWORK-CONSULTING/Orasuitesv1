/**
 * WaitlistPanel — shown in the Time step when the chosen day has no slots left.
 *
 * Restraint rules (DESIGN_BRIEF.md): one glass card, centred, one heading, one
 * short line, three fields, one button. No eyebrow, no illustration, no second
 * call to action. The success state is calm and replaces the form in place.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResolvedService } from "@/lib/catalogue";
import { useMotionSafe, easeLuxury } from "@/lib/motion";
import { FloatingField } from "../floating-field";
import { formatLongDate } from "../time";
import { normaliseUkPhone } from "../steps/details-step";
import { readPrefill, useJoinWaitlist, writePrefill, type WaitlistContact } from "./use-waitlist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Props {
  service: ResolvedService;
  date: string;
  /** Optional override for the prefill (falls back to this session's details). */
  defaults?: Partial<WaitlistContact>;
}

export function WaitlistPanel({ service, date, defaults }: Props) {
  const m = useMotionSafe();
  const join = useJoinWaitlist();
  const day = React.useMemo(() => formatLongDate(date), [date]);

  const [value, setValue] = React.useState<WaitlistContact>(() => ({ ...readPrefill(), ...pickDefaults(defaults) }));
  const [touched, setTouched] = React.useState(false);

  // A different day is a fresh request — reset the outcome, keep the details.
  React.useEffect(() => {
    join.reset();
    setTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, service.id]);

  const set = (patch: Partial<WaitlistContact>) => setValue((v) => ({ ...v, ...patch }));

  const nameError = touched && value.name.trim().length < 2 ? "Please tell us your name" : undefined;
  const emailError = touched && !EMAIL_RE.test(value.email.trim()) ? "We need a valid email to reach you" : undefined;
  const valid = value.name.trim().length >= 2 && EMAIL_RE.test(value.email.trim());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || join.isPending) return;
    const trimmed: WaitlistContact = {
      name: value.name.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
    };
    writePrefill(trimmed);
    join.mutate({
      serviceId: service.id,
      date,
      name: trimmed.name,
      email: trimmed.email,
      ...(trimmed.phone ? { phone: normaliseUkPhone(trimmed.phone) } : {}),
    });
  };

  const done = join.isSuccess;

  return (
    <motion.div
      initial={m.reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeLuxury }}
      className="rounded-2xl border border-glass-border-warm bg-ora-cream/45 px-6 py-8 text-center shadow-[var(--glass-highlight)] backdrop-blur-glass-sm sm:px-8"
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={m.reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={m.reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.35, ease: easeLuxury }}
          >
            <span
              aria-hidden
              className="mx-auto mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ora-bronze bg-ora-bronze text-ora-cream"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <p className="font-display text-[1.25rem] leading-[1.15] text-foreground" role="status">
              {join.data?.already ? "You're already on the list" : "You're on the list"}
            </p>
            <p className="mx-auto mt-2 max-w-sm font-sans text-[0.875rem] leading-relaxed text-ora-fog">
              We'll email you the moment something frees up on {day}. First to book keeps the time.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={false}
            exit={m.reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25, ease: easeLuxury }}
          >
            <p className="font-display text-[1.25rem] leading-[1.15] text-foreground">No times left on {day}</p>
            <p className="mx-auto mt-2 max-w-sm font-sans text-[0.875rem] leading-relaxed text-ora-fog">
              Join the waiting list and we'll email you the moment something frees up.
            </p>

            <form onSubmit={submit} noValidate className="mx-auto mt-6 max-w-sm space-y-3 text-left">
              <FloatingField
                id="waitlist-name"
                label="Full name"
                autoComplete="name"
                value={value.name}
                error={nameError}
                onChange={(e) => set({ name: e.target.value })}
              />
              <FloatingField
                id="waitlist-email"
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={value.email}
                error={emailError}
                onChange={(e) => set({ email: e.target.value })}
              />
              <FloatingField
                id="waitlist-phone"
                label="Phone (optional)"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={value.phone}
                onChange={(e) => set({ phone: e.target.value })}
              />

              {join.isError && (
                <p role="alert" className="pl-1 font-sans text-[0.75rem] text-destructive">
                  {join.error.message}
                </p>
              )}

              <Button type="submit" size="default" disabled={join.isPending} aria-busy={join.isPending || undefined} className="w-full">
                {join.isPending ? "One moment…" : "Join the waiting list"}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Only override the fields the caller actually supplied. */
function pickDefaults(defaults?: Partial<WaitlistContact>): Partial<WaitlistContact> {
  if (!defaults) return {};
  const out: Partial<WaitlistContact> = {};
  for (const key of ["name", "email", "phone"] as const) {
    const v = defaults[key];
    if (typeof v === "string" && v.trim()) out[key] = v;
  }
  return out;
}
