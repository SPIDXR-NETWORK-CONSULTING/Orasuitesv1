import * as React from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { ArrowRight, Check } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassPill, DisplayHeading, IconOrb } from "@/components/ui/glass";
import { Reveal, Stagger, useMotionSafe, easeLuxury } from "@/lib/motion";
import { useSEO, defaultBusinessJsonLd, breadcrumbJsonLd, SITE_URL } from "@/hooks/use-seo";
import {
  SpaStoneIcon,
  StarClusterIcon,
  InfinityLoopIcon,
  DiamondLeafIcon,
  WaterDropIcon,
  OraMarkIcon,
  CrescentIcon,
  LotusIcon,
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
    features: ["Up to 4 hours", "All amenities included", "Same-day booking available"],
    image: roomRentalPractitioner,
    imageAlt: "A practitioner performing a treatment in a private ORÁ room",
  },
  {
    id: "day",
    name: "Full day",
    price: "£130",
    period: "per day",
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
    features: ["Dedicated room", "Full access", "Premium marketing", "Client referrals"],
    image: roomRentalWelcome,
    imageAlt: "The welcoming ORÁ reception where practitioners' clients are greeted",
  },
];

const INCLUDED = [
  { Icon: StarClusterIcon, title: "Marketing exposure", line: "Featured across ORÁ channels" },
  { Icon: InfinityLoopIcon, title: "Automated booking system", line: "Clients book online, 24/7" },
  { Icon: SpaStoneIcon, title: "Furnished treatment rooms", line: "Bed, storage, soft lighting" },
  { Icon: LotusIcon, title: "Community access", line: "Practitioner network and events" },
  { Icon: CrescentIcon, title: "Wi-Fi", line: "High-speed throughout" },
  { Icon: WaterDropIcon, title: "Shared facilities", line: "Kitchenette and staff areas" },
  { Icon: OraMarkIcon, title: "Around-the-clock concierge", line: "Support whenever you need it" },
  { Icon: DiamondLeafIcon, title: "Clinic-app integration", line: "Manage everything in one place" },
];

const PRACTICE_TYPES = ["Aesthetic treatments", "Massage therapy", "IV drip therapy", "Hair & beauty", "Holistic wellness", "Consultations", "Other"];
const PLAN_OPTIONS = ["Half day", "Full day", "Monthly rental"];

/* ── schema ────────────────────────────────────────────── */
const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name."),
  email: z.string().trim().email("That email doesn't look right."),
  phone: z.string().trim().min(7, "A phone number helps us call you back."),
  practiceType: z.string().min(1, "Choose your practice type."),
  plan: z.string().min(1, "Choose a preferred plan."),
  startDate: z.string().min(1, "Pick a preferred start date."),
  hasInsurance: z.enum(["yes", "no"], { errorMap: () => ({ message: "Let us know about insurance." }) }),
  message: z.string().trim().max(1000, "Keep it under 1000 characters.").optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;
type Errors = Partial<Record<keyof Values, string>>;
const EMPTY: Values = { name: "", email: "", phone: "", practiceType: "", plan: "", startDate: "", hasInsurance: "" as unknown as "yes", message: "" };

function zodErrors(v: unknown): Errors {
  const r = schema.safeParse(v);
  if (r.success) return {};
  const out: Errors = {};
  for (const issue of r.error.issues) {
    const k = issue.path[0] as keyof Values;
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

/* ── form ──────────────────────────────────────────────── */
function RoomEnquiryForm() {
  const [values, setValues] = React.useState<Values>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const [state, setState] = React.useState<SubmitState>("idle");
  const [serverError, setServerError] = React.useState<string | null>(null);

  const minDate = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }, []);

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((prev) => ({ ...prev, [k]: e.target.value }) as Values);
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = zodErrors(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("loading");
    setServerError(null);

    const message = [
      "[Room Rental Enquiry]",
      `Name: ${values.name.trim()}`,
      `Email: ${values.email.trim()}`,
      `Phone: ${values.phone.trim()}`,
      `Practice type: ${values.practiceType}`,
      `Preferred plan: ${values.plan}`,
      `Preferred start date: ${values.startDate}`,
      `Professional insurance: ${values.hasInsurance}`,
      values.message ? `Message: ${values.message.trim()}` : "",
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

  if (state === "success") {
    return (
      <SuccessPanel
        title="Enquiry received."
        body={
          <>
            We'll reply to <span className="text-foreground">{values.email}</span> within one working day.
          </>
        }
        onReset={() => {
          setValues(EMPTY);
          setErrors({});
          setState("idle");
        }}
        resetLabel="Send another enquiry"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FloatingInput label="Full name" name="name" autoComplete="name" required value={values.name} onChange={set("name")} error={errors.name} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingInput label="Email" name="email" type="email" inputMode="email" autoComplete="email" required value={values.email} onChange={set("email")} error={errors.email} />
        <FloatingInput label="Phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required value={values.phone} onChange={set("phone")} error={errors.phone} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingSelect label="Practice type" name="practiceType" required value={values.practiceType} onChange={set("practiceType")} error={errors.practiceType} placeholder="Select">
          {PRACTICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FloatingSelect>
        <FloatingSelect label="Preferred plan" name="plan" required value={values.plan} onChange={set("plan")} error={errors.plan} placeholder="Select">
          {PLAN_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </FloatingSelect>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingInput label="Preferred start date" name="startDate" type="date" min={minDate} required value={values.startDate} onChange={set("startDate")} error={errors.startDate} />
        <ChoiceGroup
          label="Professional insurance?"
          name="hasInsurance"
          required
          value={values.hasInsurance ?? ""}
          onChange={(v) => {
            setValues((prev) => ({ ...prev, hasInsurance: v as "yes" | "no" }));
            setErrors((er) => ({ ...er, hasInsurance: undefined }));
          }}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          error={errors.hasInsurance}
        />
      </div>
      <FloatingTextarea label="Message (optional)" name="message" rows={4} value={values.message ?? ""} onChange={set("message")} error={errors.message} />

      {serverError && (
        <p role="alert" className="rounded-2xl border border-[#b5533c]/30 bg-[#b5533c]/[.06] px-4 py-3 font-sans text-[0.85rem] text-[#8f3f2c]">
          {serverError}
        </p>
      )}

      <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row sm:justify-between">
        <p className="font-sans text-[0.75rem] text-ora-fog">Insurance is required to rent a room. We reply within one working day.</p>
        <SubmitButton state={state === "error" ? "idle" : state} idleLabel="Send enquiry" successLabel="Sent" icon={<ArrowRight className="h-4 w-4" aria-hidden />} className="w-full whitespace-nowrap sm:w-auto" />
      </div>
    </form>
  );
}

/* ── page ──────────────────────────────────────────────── */
export default function RoomRentalsPage() {
  const m = useMotionSafe();

  useSEO({
    title: "Treatment Room Rental Manchester | Practitioner Rooms at ORÁ Suites, Deansgate",
    description:
      "Rent a fully equipped treatment room at ORÁ Suites, 45 Deansgate, Manchester. Half day from £75, full day £130, monthly £1,200 — furnished rooms, booking system, Wi-Fi and marketing included.",
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
      <section className="relative flex min-h-[52vh] items-center overflow-hidden band-dark">
        <motion.img
          src={roomRentalHero}
          alt="The hallway at ORÁ Suites, Deansgate — private treatment rooms either side"
          width={1206}
          height={1609}
          fetchPriority="high"
          decoding="async"
          initial={m.reduced ? false : { scale: 1.06, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: easeLuxury }}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div aria-hidden className="absolute inset-0 bg-[var(--overlay-dark)]" />
        <Container className="relative z-[2] pb-16 pt-32 text-center md:pb-20 md:pt-36">
          <motion.div variants={m.stagger(0.08)} initial="hidden" animate="show" className="mx-auto max-w-2xl">
            <DisplayHeading as="h1" size="xl" tone="cream" inherit>
              Room rentals
            </DisplayHeading>
            <motion.p variants={m.fadeUp} className="mt-4 font-sans text-[0.95rem] leading-[1.55] text-ora-smoke sm:text-base">
              Furnished treatment rooms for practitioners at 45 Deansgate, Manchester.
            </motion.p>
            <motion.div variants={m.fadeUp} className="mt-7 flex flex-wrap justify-center gap-2.5">
              {PLANS.map((p) => (
                <GlassPill key={p.id} tone="light" as="a" href="#pricing" className="text-ora-cream">
                  <span className="font-display text-base">{p.price}</span>
                  <span className="text-ora-smoke">{p.name.toLowerCase()}</span>
                </GlassPill>
              ))}
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* ── 2. Pricing ─────────────────────────────────────── */}
      <Section id="pricing" tone="milk" mesh grain pad="sm" className="scroll-mt-24" animate={false}>
        <Reveal className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <DisplayHeading as="h2" size="lg" plain>
            Pricing
          </DisplayHeading>
          <p className="mt-3 font-sans text-[0.95rem] leading-[1.55] text-ora-fog sm:text-base">Same room, same support — choose the rhythm that suits you.</p>
        </Reveal>
        <Stagger className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <GlassCard
              key={p.id}
              inherit
              hover
              tone="light"
              padding="none"
              radius="lg"
              className="flex flex-col overflow-hidden bg-white/55"
              data-testid={`card-pricing-${p.id}`}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={p.image} alt={p.imageAlt} width={2048} height={1536} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                {p.popular && (
                  <span className="absolute left-4 top-4 rounded-full border border-ora-bronze/50 bg-ora-deep px-3 py-1 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-cream">
                    Most popular
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6 text-center text-foreground">
                <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">{p.name}</p>
                <div className="mt-2 flex items-baseline justify-center gap-2">
                  <span className="font-display text-[2rem] leading-none tracking-[-0.02em]" data-testid={`price-${p.id}`}>
                    {p.price}
                  </span>
                  <span className="font-sans text-[0.8125rem] text-ora-fog">{p.period}</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2 border-t border-ora-bronze/25 pt-5 text-left">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 font-sans text-[0.9rem] text-ora-fog">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ora-bronze/15 text-ora-bronze ring-1 ring-ora-bronze/40">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button asChild variant={p.popular ? "primary" : "ghost"} className="w-full">
                    <a href="#enquiry" data-testid={`button-pricing-${p.id}`}>
                      Enquire <ArrowRight aria-hidden />
                    </a>
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </Stagger>
      </Section>

      {/* ── 3. What's included ─────────────────────────────── */}
      <Section tone="sand" grain pad="sm" animate={false}>
        <Reveal className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <DisplayHeading as="h2" size="lg" plain>
            What's included
          </DisplayHeading>
        </Reveal>
        <Stagger className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map(({ Icon, title, line }) => (
            <GlassCard key={title} inherit tone="light" padding="md" radius="lg" className="flex flex-col items-center bg-white/55 text-center">
              <IconOrb size="md" tone="bronze">
                <Icon size={22} />
              </IconOrb>
              <h3 className="mt-4 font-display text-[1.05rem] text-foreground">{title}</h3>
              <p className="mt-1.5 font-sans text-[0.85rem] text-ora-fog">{line}</p>
            </GlassCard>
          ))}
        </Stagger>
      </Section>

      {/* ── 4. Enquiry ─────────────────────────────────────── */}
      <Section id="enquiry" tone="milk" mesh grain pad="sm" className="scroll-mt-20" animate={false}>
        <Reveal className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <DisplayHeading as="h2" size="lg" plain>
            Enquire about a room
          </DisplayHeading>
          <p className="mt-3 font-sans text-[0.95rem] leading-[1.55] text-ora-fog sm:text-base">Tell us a little about your practice and preferred plan.</p>
        </Reveal>
        <Reveal className="mx-auto max-w-2xl">
          <GlassCard tone="strong" padding="lg" radius="lg" staticCard className="bg-white/60">
            <RoomEnquiryForm />
          </GlassCard>
        </Reveal>
      </Section>
    </Layout>
  );
}
