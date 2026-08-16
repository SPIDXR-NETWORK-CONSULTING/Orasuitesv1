import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassPill, Eyebrow, DisplayHeading, SectionIntro, IconOrb } from "@/components/ui/glass";
import { Reveal, Stagger, useMotionSafe, spring, easeLuxury } from "@/lib/motion";
import { useSEO, defaultBusinessJsonLd, breadcrumbJsonLd, SITE_URL } from "@/hooks/use-seo";
import {
  SpaStoneIcon,
  StarClusterIcon,
  InfinityLoopIcon,
  DiamondLeafIcon,
  WaterDropIcon,
  OraMarkIcon,
  FeatherIcon,
  CrescentIcon,
} from "@/components/icons/OraIcons";
import {
  FloatingInput,
  FloatingSelect,
  FloatingTextarea,
  ChoiceGroup,
  SubmitButton,
  SuccessPanel,
  type SubmitState,
} from "@/components/forms/floating-field";

import roomRentalHero from "@assets/ora-hallway.jpg";
import roomRentalPractitioner from "@assets/room-rental-practitioner.jpg";
import roomRentalIncluded from "@assets/room-rental-included.jpg";
import roomRentalWelcome from "@assets/room-rental-welcome.jpg";

/* ── content (prices unchanged from the live page) ─────── */
interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  blurb: string;
  popular?: boolean;
  features: string[];
  image: string;
  imageAlt: string;
}
const PLANS: Plan[] = [
  {
    id: "half-day",
    name: "Half day",
    price: "£75",
    period: "per half day",
    blurb: "For occasional sessions",
    features: ["Up to 4 hours", "All amenities included", "Same-day booking available"],
    image: roomRentalPractitioner,
    imageAlt: "A practitioner performing a treatment in a private ORÁ room",
  },
  {
    id: "day",
    name: "Full day",
    price: "£130",
    period: "per day",
    blurb: "For regular practitioners",
    popular: true,
    features: ["Full day access, 9am–7pm", "Priority booking", "Marketing inclusion"],
    image: roomRentalIncluded,
    imageAlt: "A fully equipped ORÁ treatment room with bed, storage and soft lighting",
  },
  {
    id: "month",
    name: "Monthly",
    price: "£1,200",
    period: "per month",
    blurb: "For established practitioners",
    features: ["Dedicated room", "Full access", "Premium marketing", "Client referrals"],
    image: roomRentalWelcome,
    imageAlt: "The welcoming ORÁ reception where practitioners' clients are greeted",
  },
];

const INCLUDED = [
  { Icon: SpaStoneIcon, title: "Furnished treatment room", body: "Professional-grade bed, storage and a calm, finished space." },
  { Icon: OraMarkIcon, title: "Reception & waiting lounge", body: "Your clients are greeted, seated and looked after." },
  { Icon: InfinityLoopIcon, title: "Booking support", body: "Scheduling help and front-of-house admin, so you can treat." },
  { Icon: StarClusterIcon, title: "Marketing exposure", body: "Featured across ORÁ channels and referred to our client base." },
  { Icon: FeatherIcon, title: "Towels & linens", body: "Fresh linens provided — nothing to carry in or out." },
  { Icon: WaterDropIcon, title: "Shared facilities", body: "Kitchenette, refreshments and staff areas." },
  { Icon: CrescentIcon, title: "Climate & WiFi", body: "Climate-controlled rooms with high-speed WiFi throughout." },
  { Icon: DiamondLeafIcon, title: "Deansgate address", body: "45 Deansgate, M3 2AY — central, credible, easy for clients." },
];

const SPECIALISMS = ["Massage therapy", "IV drip therapy", "Aesthetic treatments", "Consultations", "Hair & beauty", "Holistic wellness", "Other"];
const DURATIONS = ["Half day", "Full day", "Monthly rental"];

/* ── stepper schema ────────────────────────────────────── */
const step1 = z.object({
  name: z.string().trim().min(2, "Please tell us your name."),
  email: z.string().trim().email("That email doesn't look right."),
  phone: z.string().trim().min(7, "A phone number helps us call you back."),
});
const step2 = z.object({
  specialism: z.string().min(1, "Choose your specialism."),
  hasInsurance: z.enum(["yes", "no"], { errorMap: () => ({ message: "Let us know about insurance." }) }),
  practice: z.string().trim().max(600, "Keep it under 600 characters.").optional().or(z.literal("")),
});
const step3 = z.object({
  duration: z.string().min(1, "Choose a rental period."),
  startDate: z.string().min(1, "Pick a preferred start date."),
  notes: z.string().trim().max(1000, "Keep it under 1000 characters.").optional().or(z.literal("")),
});
const fullSchema = step1.merge(step2).merge(step3);
type Values = z.infer<typeof fullSchema>;
type Errors = Partial<Record<keyof Values, string>>;
const STEP_SCHEMAS = [step1, step2, step3] as const;
const STEPS = [
  { key: "you", label: "You", title: "Let's start with you." },
  { key: "practice", label: "Your practice", title: "Tell us about your practice." },
  { key: "dates", label: "Dates & needs", title: "When, and what do you need?" },
] as const;

const EMPTY: Values = { name: "", email: "", phone: "", specialism: "", hasInsurance: "" as unknown as "yes", practice: "", duration: "", startDate: "", notes: "" };

function zodErrors(schema: z.ZodTypeAny, v: unknown): Errors {
  const r = schema.safeParse(v);
  if (r.success) return {};
  const out: Errors = {};
  for (const issue of r.error.issues) {
    const k = issue.path[0] as keyof Values;
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

/* ── stepper form ──────────────────────────────────────── */
function RoomEnquiryStepper() {
  const m = useMotionSafe();
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState<1 | -1>(1);
  const [values, setValues] = React.useState<Values>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const [state, setState] = React.useState<SubmitState>("idle");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const minDate = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }, []);

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...values, [k]: e.target.value } as Values;
    setValues(next);
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validateStep = (i: number) => zodErrors(STEP_SCHEMAS[i], values);

  const goNext = () => {
    const errs = validateStep(step);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setDir(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    panelRef.current?.focus({ preventScroll: true });
  };
  const goBack = () => {
    setDir(-1);
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    const errs = zodErrors(fullSchema, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("loading");
    setServerError(null);

    const message = [
      "[Room Rental Enquiry]",
      `Name: ${values.name.trim()}`,
      `Email: ${values.email.trim()}`,
      `Phone: ${values.phone.trim()}`,
      `Specialism: ${values.specialism}`,
      `Professional insurance: ${values.hasInsurance}`,
      values.practice ? `About the practice: ${values.practice.trim()}` : "",
      `Preferred duration: ${values.duration}`,
      `Preferred start date: ${values.startDate}`,
      values.notes ? `Additional notes: ${values.notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          service: "Room Rental",
          message,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("success");
    } catch {
      setState("error");
      setServerError("Something went wrong on our side. Please try again, or email admin@orasuites.com.");
    }
  }

  const insuranceNo = values.hasInsurance === "no";
  const progress = ((step + 1) / STEPS.length) * 100;

  if (state === "success") {
    return (
      <SuccessPanel
        title="Thank you — enquiry received."
        body={
          <>
            We'll reply to <span className="text-foreground">{values.email}</span> within one working day to arrange a viewing and confirm availability for {values.duration.toLowerCase()} rental.
          </>
        }
        onReset={() => {
          setValues(EMPTY);
          setErrors({});
          setStep(0);
          setState("idle");
        }}
        resetLabel="Send another enquiry"
      />
    );
  }

  const slide = {
    enter: (d: 1 | -1) => ({ x: m.reduced ? 0 : d * 48, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.45, ease: easeLuxury } },
    exit: (d: 1 | -1) => ({ x: m.reduced ? 0 : d * -48, opacity: 0, transition: { duration: 0.25, ease: easeLuxury } }),
  };

  return (
    <form onSubmit={onSubmit} noValidate className="relative">
      {/* progress */}
      <div className="mb-8">
        <ol className="flex items-center justify-between gap-2" aria-label="Enquiry steps">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-3 last:flex-none">
                <span
                  aria-current={active ? "step" : undefined}
                  className={[
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-sans text-[0.75rem] transition-[background-color,border-color,color] duration-450 ease-luxury",
                    done ? "border-ora-bronze bg-ora-bronze text-ora-deep" : active ? "border-ora-bronze bg-ora-deep text-ora-cream shadow-glow-bronze" : "border-ora-greige bg-white/60 text-ora-fog",
                  ].join(" ")}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
                <span className={["hidden font-sans text-[0.75rem] uppercase tracking-[0.16em] sm:inline", active ? "text-foreground" : "text-ora-fog"].join(" ")}>{s.label}</span>
                {i < STEPS.length - 1 && <span aria-hidden className="ml-2 hidden h-px flex-1 bg-ora-greige/80 sm:block" />}
              </li>
            );
          })}
        </ol>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-ora-greige/50" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Enquiry progress">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--ora-bronze),rgba(185,136,103,.55))]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={spring.soft}
          />
        </div>
      </div>

      {/* step panels */}
      <div ref={panelRef} tabIndex={-1} className="outline-none">
        <p className="mb-1 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">
          Step {step + 1} of {STEPS.length}
        </p>
        <h3 className="mb-6 font-display text-display-sm text-foreground">{STEPS[step].title}</h3>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="space-y-5">
              {step === 0 && (
                <>
                  <FloatingInput label="Full name" name="name" autoComplete="name" required value={values.name} onChange={set("name")} error={errors.name} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FloatingInput label="Email" name="email" type="email" inputMode="email" autoComplete="email" required value={values.email} onChange={set("email")} error={errors.email} />
                    <FloatingInput label="Phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required value={values.phone} onChange={set("phone")} error={errors.phone} />
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <FloatingSelect label="Your specialism" name="specialism" required value={values.specialism} onChange={set("specialism")} error={errors.specialism} placeholder="Select your specialism">
                    {SPECIALISMS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </FloatingSelect>
                  <ChoiceGroup
                    label="Do you hold professional insurance?"
                    name="hasInsurance"
                    required
                    value={values.hasInsurance ?? ""}
                    onChange={(v) => {
                      setValues((prev) => ({ ...prev, hasInsurance: v as "yes" | "no" }));
                      setErrors((er) => ({ ...er, hasInsurance: undefined }));
                    }}
                    options={[
                      { value: "yes", label: "Yes, I'm covered" },
                      { value: "no", label: "Not yet" },
                    ]}
                    error={errors.hasInsurance}
                  />
                  <AnimatePresence initial={false}>
                    {insuranceNo && (
                      <motion.p
                        role="status"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden rounded-2xl border border-ora-bronze/40 bg-ora-bronze/10 px-4 py-3 font-sans text-[0.85rem] leading-relaxed text-foreground"
                      >
                        Professional insurance is required to rent a room at ORÁ. Please arrange cover before enquiring — we're happy to hold a date while you do.
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <FloatingTextarea label="About your practice (optional)" name="practice" rows={3} value={values.practice ?? ""} onChange={set("practice")} error={errors.practice} />
                </>
              )}
              {step === 2 && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FloatingSelect label="Preferred duration" name="duration" required value={values.duration} onChange={set("duration")} error={errors.duration} placeholder="Select rental period">
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </FloatingSelect>
                    <FloatingInput label="Preferred start date" name="startDate" type="date" min={minDate} required value={values.startDate} onChange={set("startDate")} error={errors.startDate} hint="Minimum 48 hours' notice." />
                  </div>
                  <FloatingTextarea label="Anything else we should know? (optional)" name="notes" rows={4} value={values.notes ?? ""} onChange={set("notes")} error={errors.notes} />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {serverError && (
        <p role="alert" className="mt-5 rounded-2xl border border-[#b5533c]/30 bg-[#b5533c]/[.06] px-4 py-3 font-sans text-[0.85rem] text-[#8f3f2c]">
          {serverError}
        </p>
      )}

      {/* nav */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0 || state === "loading"}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 font-sans text-[0.8125rem] uppercase tracking-[0.16em] text-ora-fog transition-colors duration-300 hover:text-foreground disabled:pointer-events-none disabled:opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <motion.button
            type="button"
            onClick={goNext}
            whileHover={m.hoverButton}
            whileTap={m.tapButton}
            transition={spring.snappy}
            className="inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-full border border-ora-bronze/40 bg-ora-deep px-8 font-sans text-[0.9375rem] font-medium tracking-[0.02em] text-ora-cream shadow-luxury transition-[border-color,box-shadow] duration-450 ease-luxury hover:border-ora-bronze hover:shadow-glow-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze focus-visible:ring-offset-2"
          >
            Continue <ArrowRight className="h-4 w-4" aria-hidden />
          </motion.button>
        ) : (
          <SubmitButton state={state === "error" ? "idle" : state} idleLabel="Send enquiry" successLabel="Sent" disabled={insuranceNo} icon={<ArrowRight className="h-4 w-4" aria-hidden />} />
        )}
      </div>
      {insuranceNo && step === STEPS.length - 1 && (
        <p className="mt-3 text-right font-sans text-[0.75rem] text-ora-fog">Insurance is required to submit — go back to update your answer.</p>
      )}
    </form>
  );
}

/* ── page ──────────────────────────────────────────────── */
export default function RoomRentalsPage() {
  const m = useMotionSafe();

  useSEO({
    title: "Treatment Room Rental Manchester | Practitioner Rooms at ORÁ Suites, Deansgate",
    description:
      "Rent a fully equipped treatment room at ORÁ Suites, 45 Deansgate, Manchester — the women-only sanctuary for beauty & wellness. Half-day from £75, full day £130, monthly £1,200. Reception, linens, WiFi and marketing included.",
    jsonLd: [
      defaultBusinessJsonLd(),
      breadcrumbJsonLd([{ name: "Room rentals", path: "/room-rentals" }]),
      {
        "@context": "https://schema.org",
        "@type": "Offer",
        name: "Treatment room rental at ORÁ Suites",
        url: `${SITE_URL}/room-rentals`,
        priceCurrency: "GBP",
        price: 75,
        priceSpecification: [
          { "@type": "UnitPriceSpecification", price: 75, priceCurrency: "GBP", unitText: "half day" },
          { "@type": "UnitPriceSpecification", price: 130, priceCurrency: "GBP", unitText: "day" },
          { "@type": "UnitPriceSpecification", price: 1200, priceCurrency: "GBP", unitText: "month" },
        ],
        offeredBy: { "@id": `${SITE_URL}/#business` },
      },
    ],
  });

  return (
    <Layout>
      {/* ── 1. Hero ────────────────────────────────────────── */}
      <section className="relative flex min-h-[78vh] items-end overflow-hidden band-dark">
        <motion.img
          src={roomRentalHero}
          alt="The hallway at ORÁ Suites, Deansgate — private treatment rooms either side"
          width={1206}
          height={1609}
          fetchPriority="high"
          decoding="async"
          initial={m.reduced ? false : { scale: 1.08, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: easeLuxury }}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-deep)_0%,var(--overlay-dark)_45%,rgba(18,12,8,.25)_100%)]" />
        <Container className="relative z-[2] pb-16 pt-40 md:pb-24">
          <motion.div variants={m.stagger(0.1)} initial="hidden" animate="show" className="max-w-3xl">
            <Eyebrow reveal as="p" rule className="mb-6">
              For practitioners · Manchester
            </Eyebrow>
            <DisplayHeading as="h1" size="xl" tone="cream" inherit>
              {"Your room at ORÁ.\nGrow your practice on Deansgate."}
            </DisplayHeading>
            <motion.p variants={m.fadeUp} className="lede mt-7 max-w-xl text-ora-smoke">
              Fully equipped, beautifully finished treatment rooms inside Manchester's women-only sanctuary. You bring the expertise — we bring the space, the front desk and the clients.
            </motion.p>
            <motion.div variants={m.fadeUp} className="mt-9 flex flex-wrap gap-3">
              {PLANS.map((p) => (
                <GlassPill key={p.id} tone="light" as="a" href="#pricing" className="text-ora-cream">
                  <span className="font-display text-base">{p.price}</span>
                  <span className="text-ora-smoke">{p.name.toLowerCase()}</span>
                </GlassPill>
              ))}
            </motion.div>
            <motion.div variants={m.fadeUp} className="mt-8 flex flex-wrap gap-4">
              <motion.span whileHover={m.hoverButton} whileTap={m.tapButton} transition={spring.snappy} className="inline-flex">
                <Button asChild size="lg" variant="glass">
                  <a href="#enquiry" data-testid="button-apply-now">
                    Enquire now <ArrowRight aria-hidden />
                  </a>
                </Button>
              </motion.span>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* ── 2. Pricing ─────────────────────────────────────── */}
      <Section id="pricing" tone="milk" mesh grain pad="md" className="scroll-mt-24" animate={false}>
        <SectionIntro
          eyebrow="Pricing"
          heading={"Three ways to work\nfrom Deansgate."}
          size="md"
          lede="Same room, same support — choose the rhythm that suits your practice. All plans include reception, linens, WiFi and marketing."
        />
        <Stagger gap={0.1} className="grid gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <GlassCard
              key={p.id}
              inherit
              hover
              tone={p.popular ? "dark" : "light"}
              padding="none"
              radius="xl"
              className={[
                "group flex flex-col",
                p.popular ? "bg-ora-deep/85 md:-translate-y-4" : "bg-white/55",
                i === 2 ? "md:translate-y-4" : "",
              ].join(" ")}
              data-testid={`card-pricing-${p.id}`}
            >
              <div className="img-zoom relative aspect-[16/10] overflow-hidden">
                <img src={p.image} alt={p.imageAlt} width={2048} height={1536} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-dark),transparent_60%)]" />
                {p.popular && (
                  <span className="absolute left-4 top-4 rounded-full border border-ora-bronze/50 bg-ora-deep/70 px-3 py-1 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-bronze backdrop-blur-glass-sm">
                    Most popular
                  </span>
                )}
              </div>
              <div className={["flex flex-1 flex-col p-7 sm:p-8", p.popular ? "text-ora-cream" : "text-foreground"].join(" ")}>
                <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">{p.name}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-[2.75rem] leading-none tracking-[-0.02em]" data-testid={`price-${p.id}`}>
                    {p.price}
                  </span>
                  <span className={["font-sans text-[0.8125rem]", p.popular ? "text-ora-smoke" : "text-ora-fog"].join(" ")}>{p.period}</span>
                </div>
                <p className={["mt-2 font-sans text-[0.9rem]", p.popular ? "text-ora-smoke" : "text-ora-fog"].join(" ")}>{p.blurb}</p>
                <ul className="mt-6 space-y-2.5 border-t border-ora-bronze/25 pt-6">
                  {p.features.map((f) => (
                    <li key={f} className={["flex items-center gap-3 font-sans text-[0.9rem]", p.popular ? "text-ora-cream/90" : "text-ora-fog"].join(" ")}>
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ora-bronze/15 text-ora-bronze ring-1 ring-ora-bronze/40">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-2">
                  <Button asChild variant={p.popular ? "glass" : "ghost"} className={p.popular ? "w-full" : "w-full"}>
                    <a href="#enquiry" data-testid={`button-pricing-${p.id}`}>
                      Enquire about {p.name.toLowerCase()} <ArrowRight aria-hidden />
                    </a>
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </Stagger>
        <Reveal className="mt-10">
          <p className="max-w-2xl font-sans text-[0.85rem] leading-relaxed text-ora-fog">
            All practitioners must hold valid professional insurance and relevant qualifications; we may ask for evidence before confirming any rental. Women-only clinic — practitioners and their clients are women.
          </p>
        </Reveal>
      </Section>

      {/* ── 3. What's included — dark icon grid ─────────────── */}
      <Section tone="dark" mesh grain pad="md" animate={false}>
        <SectionIntro eyebrow="What's included" heading={"Walk in with your kit.\nEverything else is here."} tone="cream" size="md" />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map(({ Icon, title, body }, i) => (
            <GlassCard key={title} inherit hover tone="dark" padding="md" radius="lg" className={["bg-white/[.05]", i % 4 === 1 || i % 4 === 3 ? "lg:translate-y-5" : ""].join(" ")}>
              <IconOrb size="md" tone="bronze">
                <Icon size={22} />
              </IconOrb>
              <h3 className="mt-6 font-display text-xl text-ora-cream">{title}</h3>
              <p className="mt-2 font-sans text-[0.9rem] leading-relaxed text-ora-smoke">{body}</p>
            </GlassCard>
          ))}
        </Stagger>
      </Section>

      {/* ── 4. Enquiry — 3-step stepper ─────────────────────── */}
      <Section id="enquiry" tone="sand" mesh grain pad="md" className="scroll-mt-20" animate={false}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <SectionIntro
              eyebrow="Enquire"
              heading={"Tell us about you.\nWe'll do the rest."}
              size="md"
              lede="Three short steps. We reply within one working day to arrange a viewing and confirm availability."
              className="mb-8 lg:mb-10"
            />
            <Reveal className="space-y-3">
              {["Viewings most weekdays", "48 hours' minimum notice", "Insurance required"].map((t) => (
                <GlassPill key={t} tone="light" size="sm" as="div" className="bg-white/60 text-foreground" icon={<Check aria-hidden />}>
                  {t}
                </GlassPill>
              ))}
            </Reveal>
          </div>
          <div className="lg:col-span-8">
            <GlassCard tone="strong" padding="lg" radius="2xl" className="bg-white/60">
              <RoomEnquiryStepper />
            </GlassCard>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
