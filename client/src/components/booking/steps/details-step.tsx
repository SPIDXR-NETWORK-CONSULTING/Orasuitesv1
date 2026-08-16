/**
 * Step 4 — your details. Floating-label glass fields, zod validation, inline errors.
 */
import * as React from "react";
import { z } from "zod";
import { Link } from "wouter";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingField } from "../floating-field";
import { StepHeader, StepNav } from "../step-shell";
import type { BookingDetails } from "../types";

/** UK mobiles + landlines: 07…, 01/02/03…, or +44 forms. Spaces allowed. */
const UK_PHONE = /^(?:(?:\+44\s?|0)(?:\d\s?){9,10})$/;

export const detailsSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(UK_PHONE, "Enter a valid UK phone number (e.g. 07123 456789)"),
  notes: z.string().trim().max(500, "Please keep notes under 500 characters"),
  consent: z.literal(true, { errorMap: () => ({ message: "Please agree so we can hold your appointment" }) }),
});

export type DetailsErrors = Partial<Record<keyof BookingDetails, string>>;

export function validateDetails(d: BookingDetails): DetailsErrors {
  const r = detailsSchema.safeParse(d);
  if (r.success) return {};
  const out: DetailsErrors = {};
  for (const issue of r.error.issues) {
    const k = issue.path[0] as keyof BookingDetails;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}

/** Normalise to E.164 (+44…) for GHL. */
export function normaliseUkPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+44")) return digits;
  if (digits.startsWith("0")) return `+44${digits.slice(1)}`;
  return digits;
}

interface Props {
  value: BookingDetails;
  onChange: (v: BookingDetails) => void;
  onBack: () => void;
  onNext: () => void;
}

export function DetailsStep({ value, onChange, onBack, onNext }: Props) {
  const [touched, setTouched] = React.useState<Partial<Record<keyof BookingDetails, boolean>>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const errors = React.useMemo(() => validateDetails(value), [value]);
  const show = (k: keyof BookingDetails) => (submitted || touched[k]) && errors[k];

  const set = (k: keyof BookingDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const blur = (k: keyof BookingDetails) => () => setTouched((t) => ({ ...t, [k]: true }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length === 0) onNext();
    else {
      const first = Object.keys(errors)[0];
      document.getElementById(`bk-${first}`)?.focus();
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <StepHeader step={3} title="A few details" lede="So we can confirm your appointment and send a reminder." />

      <div className="grid gap-4 sm:grid-cols-2">
        <FloatingField id="bk-name" label="Full name" autoComplete="name" value={value.name} onChange={set("name")} onBlur={blur("name")} error={show("name") || undefined} className="sm:col-span-2" />
        <FloatingField id="bk-email" label="Email" type="email" inputMode="email" autoComplete="email" value={value.email} onChange={set("email")} onBlur={blur("email")} error={show("email") || undefined} />
        <FloatingField id="bk-phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" value={value.phone} onChange={set("phone")} onBlur={blur("phone")} error={show("phone") || undefined} hint={show("phone") ? undefined : "UK number — we'll text your reminder"} />
        <FloatingField
          as="textarea"
          id="bk-notes"
          label="Anything we should know? (optional)"
          value={value.notes}
          onChange={set("notes")}
          onBlur={blur("notes")}
          error={show("notes") || undefined}
          className="sm:col-span-2"
        />
      </div>

      <label htmlFor="bk-consent" className="mt-6 flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
          <input
            id="bk-consent"
            type="checkbox"
            checked={value.consent}
            onChange={set("consent")}
            onBlur={blur("consent")}
            aria-invalid={show("consent") ? true : undefined}
            aria-describedby={show("consent") ? "bk-consent-error" : undefined}
            className="peer absolute inset-0 h-5 w-5 cursor-pointer opacity-0"
          />
          <span
            aria-hidden
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-md border transition-[background-color,border-color,box-shadow] duration-300 ease-luxury peer-focus-visible:shadow-[0_0_0_2px_hsl(var(--ora-milk)),0_0_0_4px_var(--ora-bronze)]",
              value.consent ? "border-ora-bronze bg-ora-bronze text-ora-cream" : "border-ora-smoke bg-ora-cream/60",
              show("consent") && !value.consent && "border-destructive",
            )}
          >
            <Check className={cn("h-3 w-3 transition-opacity", value.consent ? "opacity-100" : "opacity-0")} strokeWidth={3} />
          </span>
        </span>
        <span className="font-sans text-[0.875rem] leading-relaxed text-ora-fog">
          I'm happy for ORÁ Suites to contact me about this appointment, and I've read the{" "}
          <Link href="/privacy" className="text-ora-bronze underline-offset-4 hover:underline">
            privacy policy
          </Link>
          .
        </span>
      </label>
      {show("consent") && (
        <p id="bk-consent-error" role="alert" className="mt-1.5 pl-8 font-sans text-[0.75rem] text-destructive">
          {errors.consent}
        </p>
      )}

      <StepNav onBack={onBack} nextType="submit" nextLabel="Review & confirm" />
    </form>
  );
}
