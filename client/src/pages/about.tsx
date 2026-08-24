import * as React from "react";
import { Link } from "wouter";
import { ArrowRight, Clock, MapPin } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { GlassCard, DisplayHeading, IconOrb } from "@/components/ui/glass";
import { Reveal, Stagger } from "@/lib/motion";
import { useSEO, defaultBusinessJsonLd, breadcrumbJsonLd, SITE_URL } from "@/hooks/use-seo";
import { FeatherIcon, DiamondLeafIcon, StarClusterIcon, LotusIcon } from "@/components/icons/OraIcons";

import hallwayImage from "@assets/ora-hallway.jpg";
import megImage from "@assets/about-meg-ceo.jpg";
import coffeeImage from "@assets/community-coffee.jpg";
import newspaperImage from "@assets/community-newspaper.jpg";

/* ── content ───────────────────────────────────────────── */
const values = [
  { Icon: FeatherIcon, title: "Intentional care", line: "Nothing rushed. Every treatment given time." },
  { Icon: DiamondLeafIcon, title: "Safety first", line: "Certified practitioners, medical-grade products." },
  { Icon: StarClusterIcon, title: "Honest results", line: "Natural, considered — never overdone." },
  { Icon: LotusIcon, title: "Warm welcome", line: "A calm space where everyone belongs." },
];

/** Centred heading + one line. Plain (no split reveal) per v2. */
function Heading({ as = "h2", size = "lg", title, line, className = "" }: { as?: "h1" | "h2"; size?: "xl" | "lg"; title: string; line?: string; className?: string }) {
  return (
    <Reveal className={["mx-auto max-w-2xl text-center", className].join(" ")}>
      <DisplayHeading as={as} size={size} plain>
        {title}
      </DisplayHeading>
      {line && <p className="mt-3 font-sans text-[0.95rem] leading-[1.55] text-ora-fog sm:text-base">{line}</p>}
    </Reveal>
  );
}

/* ── page ──────────────────────────────────────────────── */
export default function AboutPage() {
  useSEO({
    title: "About ORÁ Suites | Nurse-Led Aesthetics & Luxury Nails, Deansgate Manchester",
    description:
      "ORÁ Suites is a calm, private clinic at 49 Deansgate, Manchester — nurse-led aesthetics and luxury nails in a space designed to slow down, connect and feel looked after.",
    jsonLd: [
      defaultBusinessJsonLd({
        founder: { "@type": "Person", name: "Meg Cauli", worksFor: { "@id": `${SITE_URL}/#business` } },
      }),
      breadcrumbJsonLd([{ name: "About", path: "/about" }]),
    ],
  });

  return (
    <Layout padTop lightHeader>
      {/* ── 1. Intro + founder ───────────────────────────── */}
      <Section tone="milk" mesh grain pad="sm" animate={false} className="pt-6 md:pt-10">
        <Heading as="h1" size="xl" title="About ORÁ" line="Nurse-led aesthetics and luxury nails, 49 Deansgate, Manchester." className="mb-10 md:mb-14" />

        <div className="mx-auto grid max-w-4xl items-center gap-8 md:grid-cols-2 md:gap-12">
          <Reveal>
            <div className="overflow-hidden rounded-2xl shadow-luxury">
              <img
                src={megImage}
                alt="Inside ORÁ Suites on Deansgate, Manchester"
                width={1536}
                height={2048}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="aspect-[4/5] h-auto w-full object-cover object-top"
              />
            </div>
          </Reveal>
          <Reveal delay={0.08} className="text-center md:text-left">
            <p className="font-display text-display-md text-foreground">Founded by Meg Cauli</p>
            <p className="mt-4 font-sans text-[0.95rem] leading-[1.6] text-ora-fog sm:text-base">
              ORÁ was created to be a calmer kind of clinic — private rooms, considered treatments and a space that feels like a pause in the middle of the city.
              Nurse-led aesthetics and luxury nails, delivered with time and honesty.
            </p>
            <Button asChild variant="link" className="mt-6 h-auto py-1 text-[0.85rem] uppercase tracking-[0.16em]">
              <Link href="/services">
                Our services <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </div>
      </Section>

      {/* ── 2. Community ─────────────────────────────────── */}
      <Section tone="sand" grain pad="sm" animate={false}>
        <Heading title="More than a clinic — a community" line="Refreshments, a place to sit, and time that is yours." className="mb-8 md:mb-10" />
        <Stagger className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {[
            { src: newspaperImage, alt: "Clients relaxing on the sofa in the ORÁ lounge", w: 1536, h: 2048 },
            { src: coffeeImage, alt: "ORÁ-branded matcha and coffee served in the lounge", w: 1086, h: 1448 },
          ].map((img) => (
            <Reveal inherit key={img.src}>
              <div className="overflow-hidden rounded-2xl shadow-luxury">
                <img src={img.src} alt={img.alt} width={img.w} height={img.h} loading="lazy" decoding="async" className="aspect-[4/5] h-auto w-full object-cover object-top" />
              </div>
            </Reveal>
          ))}
        </Stagger>
      </Section>

      {/* ── 3. Values ────────────────────────────────────── */}
      <Section tone="milk" mesh grain pad="sm" animate={false}>
        <Heading title="Four things we never compromise on" className="mb-8 md:mb-10" />
        <Stagger className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ Icon, title, line }) => (
            <GlassCard key={title} inherit tone="warm" padding="md" radius="lg" className="flex flex-col items-center bg-white/55 text-center">
              <IconOrb size="md" tone="bronze">
                <Icon size={22} />
              </IconOrb>
              <h3 className="mt-5 font-display text-[1.1rem] text-foreground">{title}</h3>
              <p className="mt-2 font-sans text-[0.9rem] leading-[1.5] text-ora-fog">{line}</p>
            </GlassCard>
          ))}
        </Stagger>
      </Section>

      {/* ── 4. Come and meet us ──────────────────────────── */}
      <Section tone="bone" grain pad="sm" animate={false}>
        <div className="mx-auto grid max-w-4xl items-center gap-8 md:grid-cols-2 md:gap-12">
          <Reveal>
            <div className="overflow-hidden rounded-2xl shadow-luxury">
              <img
                src={hallwayImage}
                alt="The hallway at ORÁ Suites leading to private treatment rooms"
                width={1206}
                height={1609}
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] h-auto w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.08} className="text-center md:text-left">
            <DisplayHeading as="h2" size="lg" plain>
              Come and meet us
            </DisplayHeading>
            <ul className="mt-6 space-y-4 font-sans text-[0.95rem] text-ora-fog">
              <li className="flex items-start justify-center gap-3 md:justify-start">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ora-bronze" aria-hidden />
                <span>
                  <span className="text-foreground">49 Deansgate</span>, Manchester M3 2AY
                </span>
              </li>
              <li className="flex items-start justify-center gap-3 md:justify-start">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ora-bronze" aria-hidden />
                <span>Every day, 10am – 5pm</span>
              </li>
            </ul>
            <div className="mt-7 flex justify-center md:justify-start">
              <Button asChild size="lg" variant="primary">
                <Link href="/book" data-testid="button-about-book">
                  Book now <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>
    </Layout>
  );
}
