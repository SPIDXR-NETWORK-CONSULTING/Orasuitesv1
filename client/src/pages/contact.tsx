import * as React from "react";
import { z } from "zod";
import { Link } from "wouter";
import { ArrowRight, Clock, Mail, MapPin } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { Section } from "@/components/ui/section";
import { GlassCard, DisplayHeading } from "@/components/ui/glass";
import { Reveal } from "@/lib/motion";
import { categories } from "@/lib/catalogue";
import { useSEO, defaultBusinessJsonLd, breadcrumbJsonLd } from "@/hooks/use-seo";
import {
  FloatingInput,
  FloatingSelect,
  FloatingTextarea,
  SubmitButton,
  SuccessPanel,
  type SubmitState,
} from "@/components/forms/floating-field";

import warmImage from "@assets/contact-hero-nails.jpg";

/* ── validation ────────────────────────────────────────── */
const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name."),
  email: z.string().trim().email("That email doesn't look right."),
  phone: z.string().trim().max(30, "That number looks too long.").optional().or(z.literal("")),
  service: z.string().min(1, "Choose what this is about."),
  message: z.string().trim().min(10, "A sentence or two helps us help you."),
});
type ContactValues = z.infer<typeof contactSchema>;
type Errors = Partial<Record<keyof ContactValues, string>>;

const SERVICE_OPTIONS = [...categories.map((c) => c.title), "Room rental", "Something else"];

/* ── form ──────────────────────────────────────────────── */
/**
 * Prefill from `/contact?service=<category title>&treatment=<treatment name>`,
 * the link used by every price row in a category that is not open for online
 * booking. Without this the client would land on a blank form having already
 * told us what they wanted.
 */
function prefillFromQuery(): { service: string; message: string } {
  if (typeof window === "undefined") return { service: "", message: "" };
  const q = new URLSearchParams(window.location.search);
  const service = q.get("service") ?? "";
  const treatment = q.get("treatment") ?? "";
  return {
    service: SERVICE_OPTIONS.includes(service) ? service : "",
    message: treatment ? `I'd like to book ${treatment}. Please let me know your next availability.` : "",
  };
}

function EnquiryForm() {
  const [values, setValues] = React.useState<ContactValues>(() => ({ name: "", email: "", phone: "", ...prefillFromQuery() }));
  const [errors, setErrors] = React.useState<Errors>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof ContactValues, boolean>>>({});
  const [state, setState] = React.useState<SubmitState>("idle");
  const [serverError, setServerError] = React.useState<string | null>(null);

  const validate = React.useCallback((v: ContactValues): Errors => {
    const r = contactSchema.safeParse(v);
    if (r.success) return {};
    const out: Errors = {};
    for (const issue of r.error.issues) {
      const k = issue.path[0] as keyof ContactValues;
      if (!out[k]) out[k] = issue.message;
    }
    return out;
  }, []);

  const set = (k: keyof ContactValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...values, [k]: e.target.value };
    setValues(next);
    if (touched[k]) setErrors(validate(next));
  };
  const blur = (k: keyof ContactValues) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(values));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    setTouched({ name: true, email: true, phone: true, service: true, message: true });
    if (Object.keys(errs).length) return;
    setState("loading");
    setServerError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || undefined,
          service: values.service,
          message: values.message.trim(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("success");
    } catch {
      setState("error");
      setServerError("Something went wrong on our side. Please try again, or email admin@orasuites.com.");
    }
  }

  const reset = () => {
    setValues({ name: "", email: "", phone: "", service: "", message: "" });
    setErrors({});
    setTouched({});
    setState("idle");
  };

  if (state === "success") {
    return (
      <SuccessPanel
        title="Message received."
        body={<>Thank you, {values.name.split(" ")[0]}. We reply within one working day.</>}
        onReset={reset}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby={serverError ? "contact-server-error" : undefined}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatingInput label="Your name" name="name" autoComplete="name" required value={values.name} onChange={set("name")} onBlur={blur("name")} error={touched.name ? errors.name : undefined} />
        <FloatingInput label="Email" name="email" type="email" autoComplete="email" inputMode="email" required value={values.email} onChange={set("email")} onBlur={blur("email")} error={touched.email ? errors.email : undefined} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatingInput label="Phone (optional)" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={values.phone ?? ""} onChange={set("phone")} onBlur={blur("phone")} error={touched.phone ? errors.phone : undefined} />
        <FloatingSelect label="What's this about?" name="service" required value={values.service} onChange={set("service")} onBlur={blur("service")} error={touched.service ? errors.service : undefined} placeholder="Choose one">
          {SERVICE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FloatingSelect>
      </div>
      <FloatingTextarea label="Your message" name="message" rows={4} required value={values.message} onChange={set("message")} onBlur={blur("message")} error={touched.message ? errors.message : undefined} />

      {serverError && (
        <p id="contact-server-error" role="alert" className="rounded-2xl border border-[#b5533c]/30 bg-[#b5533c]/[.06] px-4 py-3 font-sans text-[0.85rem] text-[#8f3f2c]">
          {serverError}
        </p>
      )}

      <div className="flex flex-col-reverse items-start gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans text-[0.75rem] text-ora-fog">
          We only use your details to reply.{" "}
          <Link href="/privacy" className="text-ora-bronze underline-offset-4 hover:underline">
            Privacy
          </Link>
        </p>
        <SubmitButton state={state === "error" ? "idle" : state} idleLabel="Send message" successLabel="Sent" icon={<ArrowRight className="h-4 w-4" aria-hidden />} className="w-full sm:w-auto" />
      </div>
    </form>
  );
}

/* ── page ──────────────────────────────────────────────── */
export default function ContactPage() {
  useSEO({
    title: "Contact ORÁ Suites | 49 Deansgate, Manchester",
    description:
      "Get in touch with ORÁ Suites at 49 Deansgate, Manchester M3 2AY. Ask about aesthetics, nails or room rentals — we reply within one working day.",
    jsonLd: [defaultBusinessJsonLd(), breadcrumbJsonLd([{ name: "Contact", path: "/contact" }])],
  });

  return (
    <Layout padTop lightHeader>
      <Section tone="milk" mesh grain pad="sm" className="pt-6 md:pt-10" animate={false}>
        <Reveal className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <DisplayHeading as="h1" size="xl" plain>
            Contact
          </DisplayHeading>
          <p className="mt-3 font-sans text-[0.95rem] leading-[1.55] text-ora-fog sm:text-base">Questions about a treatment, nails or a room — we reply within one working day.</p>
        </Reveal>

        <div className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-12">
          {/* info card */}
          <Reveal className="lg:col-span-5">
            <GlassCard tone="light" padding="none" radius="lg" staticCard className="flex h-full flex-col overflow-hidden bg-white/55">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={warmImage}
                  alt="Freshly manicured nails at ORÁ Suites, Deansgate Manchester"
                  width={1086}
                  height={1448}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <ul className="flex flex-1 flex-col justify-center gap-5 p-6 font-sans text-[0.95rem] text-ora-fog">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ora-bronze" aria-hidden />
                  <div>
                    <p className="text-foreground">49 Deansgate, Manchester M3 2AY</p>
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=49+Deansgate+Manchester+M3+2AY"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-[0.75rem] uppercase tracking-[0.16em] text-ora-bronze underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze rounded"
                    >
                      Directions <ArrowRight className="h-3 w-3" aria-hidden />
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ora-bronze" aria-hidden />
                  <div data-testid="text-hours">
                    <p className="text-foreground">Every day, 10am – 5pm</p>
                    <p className="mt-0.5 text-[0.875rem]">Including weekends</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ora-bronze" aria-hidden />
                  <a href="mailto:admin@orasuites.com" className="text-foreground underline-offset-4 hover:text-ora-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze rounded" data-testid="link-email">
                    admin@orasuites.com
                  </a>
                </li>
              </ul>
            </GlassCard>
          </Reveal>

          {/* form */}
          <Reveal delay={0.06} className="lg:col-span-7">
            <GlassCard tone="strong" padding="md" radius="lg" staticCard className="h-full bg-white/55">
              <EnquiryForm />
            </GlassCard>
          </Reveal>
        </div>

        {/* map */}
        <Reveal delay={0.1} className="mx-auto mt-5 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/40 p-1.5 shadow-glass backdrop-blur-glass-sm">
            <iframe
              title="Map showing ORÁ Suites at 49 Deansgate, Manchester M3 2AY"
              src="https://www.google.com/maps?q=49+Deansgate+Manchester+M3+2AY&output=embed"
              className="h-[280px] w-full rounded-xl border-0 grayscale-[35%] transition-[filter] duration-700 ease-luxury hover:grayscale-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Reveal>
      </Section>
    </Layout>
  );
}
