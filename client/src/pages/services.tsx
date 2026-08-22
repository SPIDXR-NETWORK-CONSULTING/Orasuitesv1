/**
 * /services — Treatments and prices (v2, restraint pass).
 * 40vh hero → centred 5-tile category selector → ONE price list open at a time,
 * expanded in place below the tiles (default Aesthetics; `#nails` opens Nails)
 * → one small consultation link line. Prices come from shared/catalogue.json.
 */
import * as React from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { Section, Container } from "@/components/ui/section";
import { useSEO, servicesJsonLd, breadcrumbJsonLd, SITE_URL } from "@/hooks/use-seo";
import { useMotionSafe, easeLuxury } from "@/lib/motion";
import { categories, liveCategories, allServices, findService, type CategoryId } from "@/lib/catalogue";
import { CategorySelector, type CategoryTile } from "@/components/services/category-selector";
import { PriceList } from "@/components/services/price-list";

import heroBannerImage from "@assets/ora-hero-zebra-crossing.jpg";
import aestheticsImage from "@assets/service-aesthetics-skincare.jpg";
import nailsImage from "@assets/service-nails-gold.jpg";
import ivImage from "@assets/service-iv-drips.jpg";
import hairImage from "@assets/service-hair-blowout.jpg";
import makeupImage from "@assets/service-wellness-facial.jpg";
import laserImage from "@assets/service-led-laser.jpg";

/* Approved image per category (brief v2 map). Prices never live here. */
const TILE_ART: Record<string, { image: string; alt: string }> = {
  aesthetics: { image: aestheticsImage, alt: "Aesthetic skincare treatment at ORÁ Suites" },
  nails: { image: nailsImage, alt: "Gel manicure with a gold accent at ORÁ Suites" },
  "iv-therapy": { image: ivImage, alt: "IV therapy drip bags prepared at ORÁ Suites" },
  hair: { image: hairImage, alt: "Hair blow-dry" },
  makeup: { image: makeupImage, alt: "Facial and makeup treatment" },
  laser: { image: laserImage, alt: "LED and laser treatment" },
};
const TILE_ORDER = ["aesthetics", "nails", "iv-therapy", "hair", "makeup", "laser"];

const CONSULTATION_ID = "aesthetics/consultation";

function categoryFromHash(): CategoryId | undefined {
  if (typeof window === "undefined") return undefined;
  const id = window.location.hash.slice(1);
  return id && liveCategories().some((c) => c.id === id) ? id : undefined;
}

export default function ServicesPage() {
  const m = useMotionSafe();
  const live = React.useMemo(liveCategories, []);
  const consultation = React.useMemo(() => findService(CONSULTATION_ID) ?? findService("Consultation"), []);
  const [active, setActive] = React.useState<CategoryId>(() => categoryFromHash() ?? live[0]?.id ?? "aesthetics");

  React.useEffect(() => {
    const onHash = () => {
      const id = categoryFromHash();
      if (id) setActive(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const select = (id: CategoryId) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  useSEO({
    title: "Treatments & Prices | ORÁ Suites Manchester",
    description:
      "Full treatment menu and prices at ORÁ Suites, 49 Deansgate, Manchester: nurse-led anti-wrinkle, fillers, skin boosters and facials, IV therapy drips, plus BIAB, gel extensions, manicures and pedicures. Hair, makeup and laser coming soon.",
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

  const tiles: CategoryTile[] = TILE_ORDER.map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ category: c, image: TILE_ART[c.id].image, alt: TILE_ART[c.id].alt }));

  const activeCategory = live.find((c) => c.id === active) ?? live[0];

  return (
    <Layout>
      {/* ── Hero (40vh) ─────────────────────────────────── */}
      <section className="band-dark relative flex min-h-[40vh] items-center overflow-hidden" aria-labelledby="services-h1">
        <img
          src={heroBannerImage}
          alt="The ORÁ Suites entrance on Deansgate, Manchester"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-deep)_0%,var(--overlay-dark)_50%,rgba(18,12,8,0.35)_100%)]" />
        <Container className="relative z-[2] pb-12 pt-32 text-center md:pb-14">
          <motion.div variants={m.stagger(0.06)} initial="hidden" animate="show">
            <motion.h1
              id="services-h1"
              variants={m.fadeUp}
              className="font-display text-[clamp(1.9rem,3.2vw,2.75rem)] font-normal leading-[1.15] tracking-[-0.01em] text-ora-cream"
            >
              Treatments and prices
            </motion.h1>
            <motion.p variants={m.fadeUp} className="mx-auto mt-3 max-w-md font-sans text-[0.9375rem] text-ora-smoke">
              Choose a category. Tap any treatment to book it online.
            </motion.p>
          </motion.div>
        </Container>
      </section>

      {/* ── Category selector + one open price list ───────── */}
      <Section tone="milk" pad="sm" mesh grain animate={false}>
        <motion.div variants={m.stagger(0.06)} initial="hidden" animate="show">
          <CategorySelector tiles={tiles} active={activeCategory.id} onSelect={select} />
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeCategory.id}
            initial={m.reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={m.reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: easeLuxury }}
            className="overflow-hidden"
          >
            <div className="pt-10 md:pt-12">
              <PriceList category={activeCategory} />
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="mt-12 text-center font-sans text-[0.9375rem] text-ora-fog">
          Not sure where to start?{" "}
          <Link
            href={consultation ? `/book?service=${encodeURIComponent(consultation.id)}` : "/book"}
            className="focus-ring inline-flex items-center gap-1 text-ora-bronze underline-offset-4 hover:underline"
            data-testid="link-services-consultation"
          >
            Book a free consultation <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </p>
      </Section>
    </Layout>
  );
}
