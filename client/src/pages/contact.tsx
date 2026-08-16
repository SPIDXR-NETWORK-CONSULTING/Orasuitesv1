import * as React from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Clock, Mail, MapPin } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { Section } from "@/components/ui/section";
import { GlassCard, GlassPill, Eyebrow, DisplayHeading } from "@/components/ui/glass";
import { Reveal, Stagger, useMotionSafe, spring } from "@/lib/motion";
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
  phone: z
    .string()
    .trim()
    .max(30, "That number looks too long.")
    .optional()
    .or(z.literal("")),
  service: z.string().min(1, "Choose what this is about."),
  message: z.string().trim().min(10, "A sentence or two helps us help you."),
});
type ContactValues = z.infer<typeof contactSchema>;
type Errors = Partial<Record<keyof ContactValues, string>>;

const SERVICE_OPTIONS = [...categories.map((c) => c.title), "Room rental", "Something else"];

const HOURS = [
  { day: "Monday – Saturday", time: "9am – 7pm" },
  { day: "Sunday", time: "Closed" },
];

/* ── form ──────────────────────────────────────────────── */
function EnquiryForm() {
  const [values, setValues] = React.useState<ContactValues>({ name: "", email: "", phone: "", service: "", message: "" });
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
        body={
          <>
            Thank you, {values.name.split(" ")[0]}. We reply within one working day — usually much sooner.
          </>
        }
        onReset={reset}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-describedby={serverError ? "contact-server-error" : undefined}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingInput label="Your name" name="name" autoComplete="name" required value={values.name} onChange={set("name")} onBlur={blur("name")} error={touched.name ? errors.name : undefined} />
        <FloatingInput label="Email" name="email" type="email" autoComplete="email" inputMode="email" required value={values.email} onChange={set("email")} onBlur={blur("email")} error={touched.email ? errors.email : undefined} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingInput label="Phone (optional)" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={values.phone ?? ""} onChange={set("phone")} onBlur={blur("phone")} error={touched.phone ? errors.phone : undefined} />
        <FloatingSelect label="What's this about?" name="service" required value={values.service} onChange={set("service")} onBlur={blur("service")} error={touched.service ? errors.service : undefined} placeholder="Choose one">
          {SERVICE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FloatingSelect>
      </div>
      <FloatingTextarea label="Your message" name="message" rows={5} required value={values.message} onChange={set("message")} onBlur={blur("message")} error={touched.message ? errors.message : undefined} />

      {serverError && (
        <p id="contact-server-error" role="alert" className="rounded-2xl border border-[#b5533c]/30 bg-[#b5533c]/[.06] px-4 py-3 font-sans text-[0.85rem] text-[#8f3f2c]">
          {serverError}
        </p>
      )}

      <div className="flex flex-col-reverse items-start gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans text-[0.75rem] leading-relaxed text-ora-fog">
          We only use your details to reply to you.{" "}
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
  const m = useMotionSafe();

  useSEO({
    title: "Contact ORÁ Suites | Women-Only Clinic, 45 Deansgate Manchester",
    description:
      "Get in touch with ORÁ Suites — Manchester's women-only sanctuary for beauty & wellness at 45 Deansgate, M3 2AY. Ask about aesthetics, nails or room rentals. We reply within one working day.",
    jsonLd: [defaultBusinessJsonLd(), breadcrumbJsonLd([{ name: "Contact", path: "/contact" }])],
  });

  return (
    <Layout padTop lightHeader>
      {/* ── Intro (no tall hero — straight into the two columns) ── */}
      <Section tone="milk" mesh grain pad="sm" className="pb-0 md:pb-0" animate={false}>
        <div className="max-w-3xl">
          <Eyebrow as="p" rule className="mb-5">
            Contact · Deansgate, Manchester
          </Eyebrow>
          <DisplayHeading as="h1" size="lg" onMount>
            {"Say hello.\nWe'd love to hear from you."}
          </DisplayHeading>
          <motion.p
            variants={m.fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.25 }}
            className="lede mt-6 max-w-xl"
          >
            Questions about a treatment, a nail appointment, or renting a room at Manchester's women-only sanctuary — one message reaches the whole ORÁ team.
          </motion.p>
        </div>
      </Section>

      <Section tone="milk" mesh grain pad="md" className="pt-12 md:pt-16" animate={false}>
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ── Left: warm image + glass info card + map ── */}
          <div className="relative lg:col-span-5">
            <Reveal variant="scale" className="relative">
              <div className="img-zoom relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-luxury">
                <img
                  src={warmImage}
                  alt="Freshly manicured nails resting on a cream towel at ORÁ Suites, Deansgate Manchester"
                  width={1086}
                  height={1448}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover object-top"
                />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-deep)_0%,var(--overlay-dark)_38%,transparent_75%)]" />
              </div>

              {/* glass info card — deliberately overlaps the image edge on desktop */}
              <GlassCard
                tone="strong"
                padding="md"
                radius="xl"
                staticCard
                className="on-dark relative -mt-24 mx-4 sm:mx-6 lg:-mr-10 lg:ml-8 lg:-mt-40 text-ora-cream bg-ora-deep/70 border-ora-bronze/25"
              >
                <Eyebrow as="p" className="mb-4">
                  Find us
                </Eyebrow>
                <ul className="space-y-5">
                  <li className="flex gap-4">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ora-bronze/15 text-ora-bronze ring-1 ring-ora-bronze/40">
                      <MapPin className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="font-display text-xl leading-tight">45 Deansgate</p>
                      <p className="mt-1 font-sans text-[0.9rem] text-ora-smoke">Manchester M3 2AY</p>
                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=45+Deansgate+Manchester+M3+2AY"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 font-sans text-[0.75rem] uppercase tracking-[0.18em] text-ora-bronze underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze rounded"
                      >
                        Directions <ArrowRight className="h-3 w-3" aria-hidden />
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ora-bronze/15 text-ora-bronze ring-1 ring-ora-bronze/40">
                      <Mail className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-smoke">Email</p>
                      <a
                        href="mailto:admin@orasuites.com"
                        className="mt-1 inline-block font-sans text-[1rem] text-ora-cream underline-offset-4 hover:text-ora-bronze hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze rounded"
                        data-testid="link-email"
                      >
                        admin@orasuites.com
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ora-bronze/15 text-ora-bronze ring-1 ring-ora-bronze/40">
                      <Clock className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="w-full">
                      <p className="font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-smoke">Opening hours</p>
                      <dl className="mt-1.5 space-y-1 font-sans text-[0.9rem]" data-testid="text-hours">
                        {HOURS.map((h) => (
                          <div key={h.day} className="flex items-baseline justify-between gap-6">
                            <dt className="text-ora-cream/90">{h.day}</dt>
                            <dd className="text-ora-smoke tabular-nums">{h.time}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </li>
                </ul>
              </GlassCard>
            </Reveal>

            {/* map */}
            <Reveal delay={0.1} className="mt-8 lg:mt-10">
              <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-1.5 shadow-glass backdrop-blur-glass-sm">
                <iframe
                  title="Map showing ORÁ Suites at 45 Deansgate, Manchester M3 2AY"
                  src="https://www.google.com/maps?q=45+Deansgate+Manchester+M3+2AY&output=embed"
                  className="h-56 w-full rounded-[1.25rem] border-0 grayscale-[35%] contrast-[1.02] transition-[filter] duration-700 ease-luxury hover:grayscale-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>

          {/* ── Right: booking pill + form ── */}
          <div className="lg:col-span-7 lg:pl-6">
            <Stagger className="space-y-6">
              <Reveal inherit>
                <Link href="/book" className="group inline-flex focus-visible:outline-none">
                  <GlassPill
                    as="span"
                    tone="bronze"
                    className="bg-white/60 py-2.5 pl-4 pr-3 text-[0.8125rem] text-foreground shadow-glass group-focus-visible:ring-2 group-focus-visible:ring-ora-bronze"
                    icon={<span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ora-bronze animate-pulse" />}
                  >
                    Ready to book? Skip the form
                    <motion.span
                      aria-hidden
                      className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ora-deep text-ora-cream"
                      whileHover={m.reduced ? undefined : { x: 2 }}
                      transition={spring.snappy}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </motion.span>
                  </GlassPill>
                </Link>
              </Reveal>

              <GlassCard inherit tone="strong" padding="lg" radius="2xl" className="bg-white/55">
                <div className="mb-8">
                  <Eyebrow as="p" className="mb-3">
                    Send an enquiry
                  </Eyebrow>
                  <h2 className="font-display text-display-sm text-foreground">Tell us what you need.</h2>
                  <p className="mt-2 font-sans text-[0.95rem] text-ora-fog">We reply by email within one working day. No phone line yet — email is fastest.</p>
                </div>
                <EnquiryForm />
              </GlassCard>
            </Stagger>
          </div>
        </div>
      </Section>

      {/* ── Closing band ── */}
      <Section tone="chocolate" mesh grain pad="sm">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <Reveal>
              <p className="font-display text-display-sm text-ora-cream">
                Manchester's women-only sanctuary <em className="italic text-ora-bronze">for beauty &amp; wellness.</em>
              </p>
            </Reveal>
            <Reveal delay={0.1} className="flex flex-wrap gap-3">
              <GlassPill tone="light" size="sm" as="span">
                45 Deansgate
              </GlassPill>
              <GlassPill tone="light" size="sm" as="span">
                Mon–Sat 9–7
              </GlassPill>
              <GlassPill tone="light" size="sm" as="span">
                Women only
              </GlassPill>
            </Reveal>
        </div>
      </Section>
    </Layout>
  );
}
