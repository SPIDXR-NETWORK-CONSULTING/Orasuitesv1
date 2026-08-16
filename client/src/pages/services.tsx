/**
 * /services — Treatments & prices.
 * Hero (55vh) → sticky category tabs → one split panel per LIVE category
 * (image | grouped price list, rows → /book?service=<id>) → coming-soon strip
 * → consultation CTA. All prices/durations come from shared/catalogue.json.
 */
import * as React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { Section, Container } from "@/components/ui/section";
import { Eyebrow, DisplayHeading, GlassPill } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { useSEO, servicesJsonLd, breadcrumbJsonLd, SITE_URL } from "@/hooks/use-seo";
import { useMotionSafe, easeLuxury } from "@/lib/motion";
import {
  liveCategories,
  comingSoonCategories,
  allServices,
  findService,
  formatPrice,
  formatDuration,
  fromPrice,
  teamFor,
} from "@/lib/catalogue";
import { CategoryTabs } from "@/components/services/category-tabs";
import { CategoryPanel } from "@/components/services/category-panel";
import { ComingSoonStrip, type SoonItem } from "@/components/services/coming-soon-strip";

import heroBannerImage from "@assets/ora-hero-zebra-crossing.jpg";
import aestheticsImage from "@assets/service-aesthetics-skincare.jpg";
import nailsImage from "@assets/service-nails-gold.jpg";
import hairImage from "@assets/service-hair-blowout.jpg";
import laserImage from "@assets/service-led-laser.jpg";
import wellnessImage from "@assets/service-wellness-facial.jpg";
import makeupImage from "@assets/service-facial.jpg";

/* Presentation-only metadata per category (images + copy). Prices never live here. */
const PANEL_META: Record<string, { image: string; alt: string; blurb: string }> = {
  aesthetics: {
    image: aestheticsImage,
    alt: "Nurse-led aesthetic treatment in a calm, warm-toned ORÁ treatment room",
    blurb: "Nurse-led, regenerative and honest. Anti-wrinkle, fillers, skin boosters and facials — starting with a complimentary consultation.",
  },
  nails: {
    image: nailsImage,
    alt: "Freshly finished gel manicure with a soft gold accent at ORÁ Suites",
    blurb: "BIAB, gel extensions, manicures and pedicures by nail artists who take their time.",
  },
};

const SOON_META: Record<string, { image?: string; line: string }> = {
  hair: { image: hairImage, line: "Cuts, colour and styling — coming to the ORÁ salon floor." },
  makeup: { image: makeupImage, line: "Occasion and bridal makeup, inside the sanctuary." },
  laser: { image: laserImage, line: "Laser hair removal, launching at 45 Deansgate." },
  wellness: { image: wellnessImage, line: "Massage and restorative rituals for body and mind." },
};

const CONSULTATION_ID = "aesthetics/consultation";

export default function ServicesPage() {
  const m = useMotionSafe();
  const live = React.useMemo(liveCategories, []);
  const soon = React.useMemo(comingSoonCategories, []);
  const consultation = React.useMemo(() => findService(CONSULTATION_ID) ?? findService("Consultation"), []);
  const aestheticsTeam = React.useMemo(() => {
    const names = teamFor("aesthetics").map((t) => t.short);
    return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names[0] ?? "our nurse";
  }, []);
  const [hashId, setHashId] = React.useState<string>(() => (typeof window !== "undefined" ? window.location.hash.slice(1) : ""));

  React.useEffect(() => {
    const onHash = () => setHashId(window.location.hash.slice(1));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useSEO({
    title: "Aesthetics & Nail Treatments Manchester | ORÁ Suites Prices",
    description:
      "Full treatment menu and prices at ORÁ Suites, Manchester's women-only sanctuary on Deansgate: nurse-led anti-wrinkle, fillers, skin boosters, facials, BIAB, gel extensions, manicures and pedicures. Hair, makeup and laser launching soon.",
    path: "/services",
    jsonLd: [
      breadcrumbJsonLd([{ name: "Services", path: "/services" }]),
      servicesJsonLd(
        allServices()
          .filter((s) => s.live)
          .map((s) => ({ name: s.name, price: s.price, category: s.categoryTitle, url: `${SITE_URL}/book?service=${encodeURIComponent(s.id)}` })),
      ),
    ],
  });

  const soonItems: SoonItem[] = soon.map((c) => ({
    category: c,
    image: SOON_META[c.id]?.image,
    line: SOON_META[c.id]?.line ?? "Launching soon at ORÁ.",
  }));

  return (
    <Layout>
      {/* ── Hero (55vh) ─────────────────────────────────── */}
      <section className="relative flex min-h-[55vh] items-end overflow-hidden band-dark" aria-labelledby="services-h1">
        <img
          src={heroBannerImage}
          alt="The ORÁ Suites entrance on Deansgate, Manchester"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-deep)_0%,var(--overlay-dark)_40%,rgba(18,12,8,0.25)_100%)]" />
        <div aria-hidden className="grain absolute inset-0" />
        <Container className="relative z-[2] pb-16 pt-40 md:pb-20">
          <motion.div variants={m.stagger(0.08)} initial="hidden" animate="show" className="max-w-4xl">
            <Eyebrow reveal as="p" rule className="mb-5">
              Treatments & prices
            </Eyebrow>
            <DisplayHeading as="h1" size="lg" tone="cream" onMount id="services-h1" className="text-display-lg">
              {"Aesthetics & nails in Manchester —\nour treatments & prices"}
            </DisplayHeading>
            <motion.p variants={m.fadeUp} className="lede mt-6 max-w-2xl text-ora-smoke">
              Prices shown in full. Tap any treatment to book it online.
            </motion.p>
            <motion.div variants={m.fadeUp} className="mt-7 flex flex-wrap gap-2">
              {live.map((c) => {
                const from = fromPrice(c.id);
                return (
                  <GlassPill key={c.id} as="a" href={`#${c.id}`} tone="light" className="text-ora-cream">
                    {c.title}
                    {from !== undefined && <span className="text-ora-bronze">from {formatPrice(from)}</span>}
                  </GlassPill>
                );
              })}
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Tabs + panels share one wrapper so the sticky bar sticks for the whole menu */}
      <div className="relative">
      {/* ── Sticky category tabs — overlaps the hero edge ── */}
      <CategoryTabs live={live} soon={soon} />

      {/* ── One split panel per live category ───────────── */}
      {live.map((c, i) => {
        const meta = PANEL_META[c.id] ?? PANEL_META.aesthetics;
        return (
          <CategoryPanel
            key={c.id}
            category={c}
            image={{ src: meta.image, alt: meta.alt }}
            blurb={meta.blurb}
            flip={i % 2 === 1}
            tone={i % 2 === 0 ? "milk" : "sand"}
            forceOpen={hashId === c.id}
          />
        );
      })}

      {/* ── Coming soon ─────────────────────────────────── */}
      <ComingSoonStrip items={soonItems} />
      </div>

      {/* ── Consultation CTA ────────────────────────────── */}
      <Section tone="bone" pad="lg" mesh grain>
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <motion.div variants={m.stagger(0.08)} className="lg:col-span-7">
            <Eyebrow reveal as="p" rule className="mb-4">
              Not sure where to start?
            </Eyebrow>
            <DisplayHeading as="h2" size="md" inherit className="text-display-md">
              {"Book a free consultation.\nNurse-led. No pressure."}
            </DisplayHeading>
            <motion.p variants={m.fadeUp} className="lede mt-5 max-w-xl">
              {consultation ? formatDuration(consultation.duration) : "Time"} with {aestheticsTeam} to talk through your goals and build a plan that suits your face, your budget and your diary.
            </motion.p>
          </motion.div>
          <motion.div
            variants={m.fadeUp}
            className="lg:col-span-5 lg:justify-self-end"
            whileHover={m.reduced ? undefined : { y: -4, transition: { duration: 0.45, ease: easeLuxury } }}
          >
            <div className="glass-warm rounded-3xl bg-ora-cream/50 p-6 sm:p-8">
              <p className="font-sans text-[0.71875rem] uppercase tracking-[0.25em] text-ora-bronze">Consultation</p>
              <p className="mt-2 font-display text-[2rem] leading-none text-foreground">
                Complimentary{" "}
                {consultation && <span className="font-sans text-[0.875rem] tracking-normal text-ora-fog">· {formatDuration(consultation.duration)}</span>}
              </p>
              <Button asChild size="lg" className="mt-6 w-full sm:w-auto" data-testid="button-services-consultation">
                <Link href={consultation ? `/book?service=${encodeURIComponent(consultation.id)}` : "/book"}>
                  Book your free consultation <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Section>
    </Layout>
  );
}
