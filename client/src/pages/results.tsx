import { useState, useRef } from "react";
import { Layout } from "@/components/layout/layout";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import beforeAfterImage from "@assets/before-after-results_1770213665903.png";
import aestheticsImage from "@assets/service-aesthetics_1770213665902.png";
import hairImage from "@assets/service-hair_1770213665902.png";
import heroImage from "@assets/hero-image_1770213665902.png";

// Different images + aspect ratios for visual variety
const results = [
  { id: 1, treatment: "Profhilo Treatment", description: "Visible improvement in skin hydration and firmness after 2 sessions", category: "Aesthetics", image: aestheticsImage, tall: true },
  { id: 2, treatment: "Polynucleotide Therapy", description: "Enhanced skin quality and reduced fine lines over 6 weeks", category: "Aesthetics", image: beforeAfterImage, tall: false },
  { id: 3, treatment: "Scalp Health Restoration", description: "Rebalanced scalp microbiome and visibly reduced flaking", category: "Korean Head Spa", image: heroImage, tall: false },
  { id: 4, treatment: "Dermal Fillers", description: "Natural enhancement maintaining full facial harmony", category: "Aesthetics", image: beforeAfterImage, tall: false },
  { id: 5, treatment: "Hair Growth Protocol", description: "Measurable density improvement over 4-week ritual programme", category: "Korean Head Spa", image: heroImage, tall: true },
  { id: 6, treatment: "Balayage & Colour", description: "Seamless colour melt with zero brassy tones", category: "Hair", image: hairImage, tall: false },
  { id: 7, treatment: "Laser Hair Removal", description: "Smooth, lasting results after a 6-session course", category: "Laser", image: aestheticsImage, tall: false },
  { id: 8, treatment: "Anti-Aging Treatment", description: "Reduced wrinkles and improved skin elasticity", category: "Aesthetics", image: beforeAfterImage, tall: true },
  { id: 9, treatment: "Density & Shine", description: "Monthly membership client — 3-month transformation", category: "Korean Head Spa", image: heroImage, tall: false },
];

const categories = ["All", "Aesthetics", "Korean Head Spa", "Hair", "Laser"];

// Tints per category for visual distinction
const categoryTints: Record<string, string> = {
  Aesthetics: "rgba(180,120,80,0.3)",
  "Korean Head Spa": "rgba(100,130,160,0.3)",
  Hair: "rgba(160,140,100,0.3)",
  Laser: "rgba(120,100,160,0.3)",
};

interface ResultCardProps {
  result: (typeof results)[0];
  index: number;
}

function ResultCard({ result, index }: ResultCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const tint = categoryTints[result.category] ?? "rgba(185,136,103,0.2)";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      data-testid={`card-result-${result.id}`}
      className="group break-inside-avoid mb-5"
    >
      <div className="relative overflow-hidden rounded-xl img-zoom">
        {/* Aspect ratio varies: tall cards use 3/4, others use square */}
        <div className={`overflow-hidden ${result.tall ? "aspect-[3/4]" : "aspect-square"}`}>
          <img
            src={result.image}
            alt={`${result.treatment} before and after`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {/* Category tint overlay */}
          <div
            className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-60"
            style={{ background: tint, mixBlendMode: "overlay" }}
          />
        </div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(18,12,8,0.88) 0%, rgba(18,12,8,0.15) 50%, transparent 100%)" }}
        />

        {/* Before/After + Category badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <span className="glass-card-sm px-3 py-1 text-[9px] tracking-[0.25em] uppercase font-light text-white/75">
            Before → After
          </span>
          <span
            className="self-start text-[9px] tracking-[0.2em] uppercase font-light px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(185,136,103,0.15)",
              border: "1px solid rgba(185,136,103,0.25)",
              color: "var(--ora-bronze)",
            }}
          >
            {result.category}
          </span>
        </div>

        {/* Info panel */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="glass-card p-4">
            <h3
              className="font-display text-base text-white mb-1"
              data-testid={`text-result-title-${result.id}`}
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              {result.treatment}
            </h3>
            <p className="text-white/45 text-xs font-light leading-relaxed mb-2">{result.description}</p>
            <span
              className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-light transition-all duration-300 group-hover:gap-2.5"
              style={{ color: "var(--ora-bronze)" }}
            >
              View gallery <ArrowRight size={9} />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResultsPage() {
  useSEO({
    title: "Client Results & Transformations | ORÁ. Manchester",
    description:
      "See real before and after results from Ora Suites clients. Aesthetics, Korean Head Spa, hair, and laser treatments. Real results, real confidence.",
  });

  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? results
      : results.filter((r) => r.category === activeCategory);

  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const ctaRef = useRef<HTMLDivElement>(null);
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden" style={{ background: "hsl(var(--ora-bone))" }}>
        <div className="absolute inset-0 dot-grid-bg opacity-40" aria-hidden="true" />
        <div ref={heroRef} className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
            Client Transformations
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl sm:text-6xl text-foreground leading-tight mb-6"
            style={{ fontWeight: 300, letterSpacing: "0.02em" }}
          >
            Real results.{" "}
            <span style={{ fontStyle: "italic" }}>Real confidence.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-ora-fog text-lg font-light max-w-2xl"
          >
            Every transformation tells a story. Real outcomes from our clients across aesthetics, Korean Head Spa, hair, and laser.
          </motion.p>
        </div>
      </section>

      {/* Sticky filter bar */}
      <section
        className="py-5 sticky top-[60px] z-30"
        style={{ background: "hsl(var(--ora-milk))", borderBottom: "1px solid rgba(185,136,103,0.12)" }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                data-testid={`button-filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setActiveCategory(cat)}
                className="px-5 py-2 text-xs font-light tracking-widest uppercase transition-all duration-300 rounded-full"
                style={{
                  background: activeCategory === cat ? "var(--ora-bronze)" : "transparent",
                  color: activeCategory === cat ? "white" : "hsl(var(--ora-fog))",
                  border: activeCategory === cat
                    ? "1px solid var(--ora-bronze)"
                    : "1px solid rgba(185,136,103,0.22)",
                  letterSpacing: "0.08em",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Masonry results grid */}
      <section className="py-16 md:py-24" style={{ background: "hsl(var(--ora-milk))" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="columns-1 sm:columns-2 lg:columns-3 gap-5"
            >
              {filtered.map((result, i) => (
                <ResultCard key={result.id} result={result} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-ora-fog font-light">No results in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12" style={{ background: "hsl(var(--ora-bone))" }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
          <div
            className="glass-card-warm p-6 md:p-8 space-y-4 text-sm font-light"
            data-testid="text-disclaimer"
            style={{ color: "hsl(var(--ora-fog))" }}
          >
            <p>
              <span className="text-foreground font-normal">Individual Results May Vary:</span>{" "}
              Results shown are examples of what our treatments can achieve. Individual outcomes depend on skin type, age, lifestyle, and aftercare adherence.
            </p>
            <p>
              <span className="text-foreground font-normal">Consultation Required:</span>{" "}
              All aesthetic treatments begin with a thorough practitioner consultation. Realistic expectations are always discussed in advance.
            </p>
            <p>
              <span className="text-foreground font-normal">Client Consent:</span>{" "}
              All before and after images are shared with express written permission from our clients.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-24" style={{ background: "hsl(var(--ora-milk))" }}>
        <div className="max-w-2xl mx-auto px-6 sm:px-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
            Begin Yours
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl sm:text-5xl text-foreground mb-6 leading-tight"
            style={{ fontWeight: 300, letterSpacing: "0.02em" }}
          >
            Your transformation{" "}
            <span style={{ fontStyle: "italic" }}>awaits.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-ora-fog text-base font-light mb-10"
          >
            Book a consultation and let us build a personalised treatment plan for your goals.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/contact">
              <button
                data-testid="button-results-book"
                className="px-8 py-4 text-sm font-medium transition-all"
                style={{
                  background: "var(--ora-bronze)",
                  color: "white",
                  borderRadius: "9999px",
                  letterSpacing: "0.06em",
                  border: "1px solid var(--ora-bronze)",
                }}
              >
                Book Your Consultation
              </button>
            </Link>
            <Link href="/korean-head-spa">
              <button
                className="glass-pill px-8 py-4 text-sm font-medium hover-bronze transition-all inline-flex items-center gap-2"
                style={{ color: "hsl(var(--ora-fog))", letterSpacing: "0.06em" }}
              >
                Reserve a Ritual <ArrowRight size={13} />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
