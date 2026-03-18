import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import profhiloImg from "@assets/result-profhilo-skin_ora.png";
import polyImg from "@assets/result-polynucleotide-antiaging_ora.png";
import fillersImg from "@assets/result-dermal-fillers_ora.png";

// Each result has a category-specific overlay tint and copy
const results = [
  {
    id: 1,
    treatment: "Skin Rejuvenation",
    category: "Aesthetics",
    description: "Profhilo treatment — 2 sessions",
    result: "Visibly plumper, hydrated skin with restored elasticity and tone.",
    tint: "rgba(180,120,80,0.35)",
    image: profhiloImg,
    tag: "Before → After",
  },
  {
    id: 2,
    treatment: "Anti-Aging",
    category: "Aesthetics",
    description: "Polynucleotide therapy transformation",
    result: "Reduced fine lines, improved skin texture and cellular renewal.",
    tint: "rgba(100,90,120,0.3)",
    image: polyImg,
    tag: "Before → After",
  },
  {
    id: 3,
    treatment: "Facial Enhancement",
    category: "Aesthetics",
    description: "Natural enhancement with dermal fillers",
    result: "Symmetry restored with zero-overfill technique for a natural lift.",
    tint: "rgba(80,120,100,0.3)",
    image: fillersImg,
    tag: "Before → After",
  },
];

interface ResultCardProps {
  result: (typeof results)[0];
  index: number;
}

function ResultCard({ result, index }: ResultCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex-shrink-0 w-72 sm:w-80"
    >
      <div className="relative overflow-hidden rounded-xl img-zoom">
        <div className="aspect-square overflow-hidden relative">
          {/* Image */}
          <img
            src={result.image}
            alt={`${result.treatment} before and after result`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {/* Category-specific colour tint — unique per result */}
          <div
            className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-70"
            style={{ background: result.tint, mixBlendMode: "overlay" }}
          />
        </div>

        {/* Dark gradient to bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(18,12,8,0.9) 0%, rgba(18,12,8,0.2) 50%, transparent 100%)",
          }}
        />

        {/* Before/After label — top left */}
        <div className="absolute top-4 left-4">
          <span className="glass-card-sm px-3 py-1 text-[9px] tracking-[0.25em] uppercase font-light text-white/80">
            {result.tag}
          </span>
        </div>

        {/* Category badge — top right */}
        <div className="absolute top-4 right-4">
          <span
            className="text-[9px] tracking-[0.2em] uppercase font-light px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(185,136,103,0.15)",
              border: "1px solid rgba(185,136,103,0.25)",
              color: "var(--ora-bronze)",
            }}
          >
            {result.category}
          </span>
        </div>

        {/* Content — bottom glass panel */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="glass-card p-4">
            <h3
              className="font-display text-lg text-white mb-1"
              style={{ fontWeight: 300, letterSpacing: "0.03em" }}
            >
              {result.treatment}
            </h3>
            <p className="text-white/45 text-xs font-light mb-1">{result.description}</p>
            <p className="text-white/30 text-[10px] font-light leading-relaxed mb-3">{result.result}</p>
            <span
              className="text-[10px] tracking-widest uppercase font-light flex items-center gap-1.5 transition-all duration-300 group-hover:gap-2.5"
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

export function ResultsShowcaseSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section
      id="results"
      className="py-20 md:py-28 overflow-hidden"
      style={{ background: "hsl(var(--ora-milk))" }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 mb-12">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 32 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
        >
          <div>
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              Client Transformations
            </p>
            <h2
              className="font-display text-4xl sm:text-5xl text-foreground leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              Real results.{" "}
              <span style={{ fontStyle: "italic" }}>Real confidence.</span>
            </h2>
          </div>
          <Link href="/results">
            <button
              data-testid="button-view-more-results"
              className="text-ora-fog text-sm font-light hover-bronze transition-all inline-flex items-center gap-2 flex-shrink-0"
              style={{ letterSpacing: "0.04em" }}
            >
              View all results <ArrowRight size={13} />
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Horizontal scroll strip */}
      <div className="relative">
        {/* Fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none hidden sm:block"
          style={{ background: "linear-gradient(to right, hsl(var(--ora-milk)), transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none hidden sm:block"
          style={{ background: "linear-gradient(to left, hsl(var(--ora-milk)), transparent)" }}
        />

        <div
          className="flex gap-5 px-6 sm:px-10 lg:px-16 overflow-x-auto pb-4"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {results.map((result, i) => (
            <div key={result.id} style={{ scrollSnapAlign: "start" }}>
              <ResultCard result={result} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
