import * as React from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassPill, Eyebrow, DisplayHeading, SectionIntro, IconOrb } from "@/components/ui/glass";
import { Reveal, Stagger, useMotionSafe, spring, viewportOnce } from "@/lib/motion";
import { allTeam, categories, type TeamMember } from "@/lib/catalogue";
import { useSEO, defaultBusinessJsonLd, breadcrumbJsonLd, SITE_URL } from "@/hooks/use-seo";
import { FeatherIcon, DiamondLeafIcon, StarClusterIcon, LotusIcon } from "@/components/icons/OraIcons";

import hallwayImage from "@assets/ora-hallway.jpg";
import streetImage from "@assets/ora-hero-zebra-crossing.jpg";
import megImage from "@assets/about-meg-ceo.jpg";
import coffeeImage from "@assets/community-coffee.jpg";
import newspaperImage from "@assets/community-newspaper.jpg";

/* ── content ───────────────────────────────────────────── */
const values = [
  {
    Icon: FeatherIcon,
    title: "Intentional care",
    body: "Nothing is rushed. Every treatment is performed with attention and time — beauty is cultivated, not chased.",
  },
  {
    Icon: DiamondLeafIcon,
    title: "Safety first",
    body: "Nurse-led. Certified practitioners, medical-grade products, honest consultations before anything else.",
  },
  {
    Icon: StarClusterIcon,
    title: "Transformation",
    body: "Not just treatments — confidence. You should leave feeling more yourself, never less.",
  },
  {
    Icon: LotusIcon,
    title: "Community",
    body: "A women-only space where mums, students, practitioners and everyday people pause, connect and breathe.",
  },
];

const community = [
  { title: "Come as you are", body: "Busy mum, young professional, or simply in need of a moment — no pressure, no judgement. Just care." },
  { title: "Refreshments on us", body: "Matcha, herbal teas and more while you wait. Your time here should feel like a treat from the first minute." },
  { title: "A place to connect", body: "Soft events, social mornings and practitioner meet-ups through the year. Come alone, leave with a community." },
];

/** Which category each team member belongs to (for the small tag). */
function categoryLabelFor(member: TeamMember): string | undefined {
  return categories.find((c) => c.team.includes(member.key))?.title;
}

/* ── page ──────────────────────────────────────────────── */
export default function AboutPage() {
  const m = useMotionSafe();
  const team = React.useMemo(() => allTeam(), []);
  const meg = team.find((t) => t.key === "meg") ?? team[0];
  const others = team.filter((t) => t.key !== "meg");

  useSEO({
    title: "About ORÁ Suites | Meg Cauli's Women-Only Clinic, Deansgate Manchester",
    description:
      "Meet Meg Cauli, founder of ORÁ Suites — Manchester's women-only sanctuary for beauty & wellness at 45 Deansgate. Nurse-led aesthetics, luxury nails and a warm, private space built for women.",
    jsonLd: [
      defaultBusinessJsonLd({
        founder: { "@type": "Person", name: "Meg Cauli", jobTitle: "Founder & Aesthetic Practitioner", worksFor: { "@id": `${SITE_URL}/#business` } },
      }),
      breadcrumbJsonLd([{ name: "About", path: "/about" }]),
    ],
  });

  return (
    <Layout padTop lightHeader>
      {/* ── 1. Hero — Meg ─────────────────────────────────── */}
      <Section tone="milk" mesh grain pad="sm" className="overflow-hidden pt-4 md:pt-8" animate={false}>
        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-8">
          {/* text */}
          <div className="order-2 lg:order-1 lg:col-span-5 lg:pb-16">
            <motion.div variants={m.stagger(0.1)} initial="hidden" animate="show">
              <Eyebrow reveal as="p" rule className="mb-6">
                Founder · Aesthetic practitioner
              </Eyebrow>
              <DisplayHeading as="h1" size="xl" inherit>
                {"Meg\nCauli."}
              </DisplayHeading>
              <motion.p variants={m.fadeUp} className="lede mt-7 max-w-md">
                Nurse-led. Women-only. Built on Deansgate by a practitioner who wanted somewhere calmer, kinder and more honest than the clinics she trained in.
              </motion.p>
              <motion.div variants={m.fadeUp} className="mt-8 flex flex-wrap gap-2.5">
                <GlassPill tone="bronze" size="sm" className="bg-white/50">Nearly 10 years in aesthetics</GlassPill>
                <GlassPill tone="bronze" size="sm" className="bg-white/50">Medical-grade skincare</GlassPill>
                <GlassPill tone="bronze" size="sm" className="bg-white/50">45 Deansgate</GlassPill>
              </motion.div>
            </motion.div>
          </div>

          {/* portrait — bleeds past the column edge on desktop */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <motion.figure
              initial={m.reduced ? false : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative -mx-5 sm:-mx-8 lg:mx-0 lg:-mr-[14vw] lg:ml-6"
            >
              <div className="img-zoom relative aspect-[4/5] overflow-hidden rounded-none sm:rounded-[2rem] lg:rounded-r-none lg:rounded-l-[2.5rem] shadow-luxury max-h-[82vh]">
                <img
                  src={megImage}
                  alt="Meg Cauli, founder and aesthetic practitioner at ORÁ Suites, photographed in the clinic on Deansgate, Manchester"
                  width={1536}
                  height={2048}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="h-full w-full object-cover object-top"
                />
                <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,var(--overlay-dark),transparent)]" />
              </div>
              <figcaption className="absolute bottom-6 left-6 sm:left-8 lg:left-10 lg:bottom-10">
                <GlassCard tone="strong" padding="sm" radius="xl" staticCard className="on-dark inline-block bg-ora-deep/60 border-ora-bronze/25 text-ora-cream">
                  <p className="font-display text-xl leading-none">Meg Cauli</p>
                  <p className="mt-1.5 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">Founder · ORÁ Suites</p>
                </GlassCard>
              </figcaption>
            </motion.figure>
          </div>
        </div>
      </Section>

      {/* ── 2. Origin story — pull-quote editorial ─────────── */}
      <Section tone="sand" grain pad="md" animate={false}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* narrow image column */}
          <Reveal variant="scale" className="lg:col-span-4">
            <div className="img-zoom relative aspect-[3/4] overflow-hidden rounded-[2rem] shadow-luxury lg:-ml-8 lg:mt-24">
              <img
                src={hallwayImage}
                alt="The warm, softly lit hallway of ORÁ Suites leading to private treatment rooms"
                width={1206}
                height={1609}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>

          {/* quote + copy */}
          <div className="lg:col-span-7 lg:col-start-6">
            <SectionIntro
              eyebrow="Our story"
              heading={"Manchester's women-only sanctuary.\nBuilt by a nurse."}
              size="md"
              className="mb-10 md:mb-12 lg:mb-14"
            />
            <Stagger className="space-y-10">
              <Reveal inherit as="figure" className="relative border-l border-ora-bronze/60 pl-6 sm:pl-8">
                <blockquote className="font-display text-[clamp(1.6rem,3vw,2.6rem)] leading-[1.15] tracking-[-0.01em] text-foreground">
                  “This is your space. <em className="italic text-ora-bronze">To breathe. To transform. To become.</em>”
                </blockquote>
              </Reveal>
              <Reveal inherit className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-5 font-sans text-[1rem] leading-[1.7] text-ora-fog">
                  <p>
                    ORÁ is not a clinic. It's a sanctuary — a place where women come to pause, breathe and transform. Where every treatment is a ritual, and care is intentional. Where you are seen, heard and held.
                  </p>
                  <p>
                    We believe beauty isn't chased. It's cultivated — from the inside out, with intention and with time.
                  </p>
                </div>
                <div className="space-y-5 font-sans text-[1rem] leading-[1.7] text-ora-fog">
                  <p>
                    Founded on Deansgate to fill a gap: advanced aesthetics, luxury beauty and holistic wellness under one roof, in a space designed for excellence and discretion — for women only.
                  </p>
                  <p className="font-display text-lg italic text-foreground">
                    “With nearly ten years in the industry, I began as a skincare and medical-grade specialist — and I've never stopped studying. My approach to injectables is natural and health-first.” — Meg
                  </p>
                </div>
              </Reveal>
              <Reveal inherit className="flex flex-wrap gap-2.5">
                {["Advanced injectables", "Medical-grade skincare", "Anti-ageing", "Natural filler technique"].map((s) => (
                  <GlassPill key={s} tone="light" size="sm" className="bg-white/60 text-foreground">
                    {s}
                  </GlassPill>
                ))}
              </Reveal>
            </Stagger>
          </div>
        </div>
      </Section>

      {/* ── 3. The team — dark band, glass cards ──────────── */}
      <Section tone="dark" mesh grain pad="md" animate={false}>
        <SectionIntro
          eyebrow="The team"
          heading={"Small on purpose.\nExpert by design."}
          tone="cream"
          lede="Aesthetics with Meg and Daniela. Nails with Soli, Ruslana and Diana. Every practitioner is chosen for skill and for the way she makes you feel."
        />
        <Stagger gap={0.1} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {/* Meg — portrait card, spans two columns */}
          <GlassCard inherit hover tone="dark" padding="none" radius="xl" className="group sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="img-zoom relative aspect-[4/5] overflow-hidden lg:h-full">
              <img
                src={megImage}
                alt={`${meg.name}, ${meg.role} at ORÁ Suites`}
                width={1536}
                height={2048}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top"
              />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(to_top,var(--overlay-deep),transparent)]" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">{categoryLabelFor(meg) ?? "Aesthetics"}</p>
                <p className="mt-2 font-display text-2xl text-ora-cream">{meg.name}</p>
                <p className="mt-1 font-sans text-[0.875rem] text-ora-smoke">{meg.role}</p>
              </div>
            </div>
          </GlassCard>

          {others.map((t, i) => (
            <GlassCard
              key={t.key}
              inherit
              hover
              tone="dark"
              padding="md"
              radius="xl"
              className={["lg:col-span-2 flex flex-col justify-between min-h-[15rem]", i % 2 === 1 ? "lg:translate-y-6" : ""].join(" ")}
            >
              <div className="flex items-start justify-between">
                <IconOrb size="lg" tone="bronze" initials={t.initials} aria-hidden />
                <span className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">{categoryLabelFor(t)}</span>
              </div>
              <div className="mt-8">
                <p className="font-display text-2xl text-ora-cream">{t.name}</p>
                <p className="mt-1 font-sans text-[0.875rem] text-ora-smoke">{t.role}</p>
              </div>
            </GlassCard>
          ))}
        </Stagger>
      </Section>

      {/* ── 4. Community — asymmetric collage ─────────────── */}
      <Section tone="bone" grain pad="md" animate={false}>
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="relative lg:col-span-7">
            <Reveal variant="scale" className="relative">
              <div className="img-zoom relative w-[78%] overflow-hidden rounded-[2rem] shadow-luxury aspect-[3/4]">
                <img
                  src={newspaperImage}
                  alt="Two women relaxing on a sofa at ORÁ Suites reading the ORÁ Gazette"
                  width={1536}
                  height={2048}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </Reveal>
            <Reveal variant="right" delay={0.15} className="absolute right-0 top-[38%] w-[46%]">
              <div className="img-zoom relative overflow-hidden rounded-[1.5rem] border-[6px] border-ora-bone shadow-luxury aspect-[3/4]">
                <img
                  src={coffeeImage}
                  alt="ORÁ-branded matcha and coffee cups served to clients in the lounge"
                  width={1086}
                  height={1448}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={0.3} className="absolute -bottom-6 left-[6%] sm:left-[10%]">
              <GlassCard tone="strong" padding="sm" radius="full" staticCard className="bg-white/70 px-5">
                <p className="font-sans text-[0.75rem] uppercase tracking-[0.18em] text-ora-bronze">Women only · Always welcome</p>
              </GlassCard>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <SectionIntro
              eyebrow="A space for everyone"
              heading={"More than a clinic.\nA community."}
              size="md"
              className="mb-8 md:mb-10 lg:mb-10"
            />
            <Stagger as="ul" className="divide-y divide-ora-greige/70 border-y border-ora-greige/70">
              {community.map((c) => (
                <Reveal inherit as="li" key={c.title} className="group flex gap-5 py-6">
                  <span aria-hidden className="mt-2.5 h-px w-8 shrink-0 bg-ora-bronze transition-[width] duration-450 ease-luxury group-hover:w-12" />
                  <div>
                    <h3 className="font-display text-xl text-foreground">{c.title}</h3>
                    <p className="mt-2 font-sans text-[0.95rem] leading-relaxed text-ora-fog">{c.body}</p>
                  </div>
                </Reveal>
              ))}
            </Stagger>
          </div>
        </div>
      </Section>

      {/* ── 5. Values — horizontal scroll-snap strip ──────── */}
      <Section tone="milk" mesh grain pad="md" contain={false} animate={false} className="overflow-hidden">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionIntro eyebrow="What we stand for" heading={"Four things\nwe never compromise."} size="md" className="mb-0 md:mb-0 lg:mb-0" />
            <Reveal className="hidden md:block">
              <p className="mb-2 font-sans text-[0.75rem] uppercase tracking-[0.18em] text-ora-fog">Scroll →</p>
            </Reveal>
          </div>
        </Container>
        <motion.ul
          variants={m.stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:px-8 lg:px-[max(3rem,calc((100vw-1280px)/2+3rem))] md:mt-14"
          aria-label="ORÁ values"
        >
          {values.map(({ Icon, title, body }, i) => (
            <li key={title} className={["w-[80vw] max-w-[380px] shrink-0 snap-start", i % 2 === 1 ? "md:mt-10" : ""].join(" ")}>
            <GlassCard inherit hover tone="warm" padding="lg" radius="xl" className="h-full bg-white/55">
              <IconOrb size="lg" tone="bronze">
                <Icon size={28} />
              </IconOrb>
              <p className="mt-10 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">0{i + 1}</p>
              <h3 className="mt-2 font-display text-2xl text-foreground">{title}</h3>
              <p className="mt-3 font-sans text-[0.95rem] leading-relaxed text-ora-fog">{body}</p>
            </GlassCard>
            </li>
          ))}
          {/* the strip bleeds to the viewport edge — see-through spacer keeps the last card fully snappable */}
          <li aria-hidden className="w-2 shrink-0" />
        </motion.ul>
      </Section>

      {/* ── 6. CTA → /book ─────────────────────────────────── */}
      <Section tone="chocolate" mesh grain pad="lg" className="overflow-hidden" animate={false}>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] opacity-[.18] lg:block">
          <img src={streetImage} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--ora-chocolate)),transparent_60%)]" />
        </div>
        <motion.div variants={m.stagger(0.1)} initial="hidden" whileInView="show" viewport={viewportOnce} className="relative max-w-3xl">
          <Eyebrow reveal as="p" rule className="mb-6">
            Ready when you are
          </Eyebrow>
          <DisplayHeading as="h2" size="lg" tone="cream" inherit>
            {"Come and meet us.\nDeansgate, Manchester."}
          </DisplayHeading>
          <motion.p variants={m.fadeUp} className="lede mt-6 max-w-xl">
            Book a consultation with Meg or the team — nurse-led aesthetics, luxury nails, women only.
          </motion.p>
          <motion.div variants={m.fadeUp} className="mt-10 flex flex-wrap gap-4">
            <motion.span whileHover={m.hoverButton} whileTap={m.tapButton} transition={spring.snappy} className="inline-flex">
              <Button asChild size="xl" variant="primary">
                <Link href="/book" data-testid="button-about-book">
                  Book a consultation <ArrowRight aria-hidden />
                </Link>
              </Button>
            </motion.span>
            <Button asChild size="xl" variant="ghost">
              <Link href="/contact">Ask a question</Link>
            </Button>
          </motion.div>
        </motion.div>
      </Section>
    </Layout>
  );
}
