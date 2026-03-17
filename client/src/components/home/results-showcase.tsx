import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import beforeAfterImage from "@assets/before-after-results_1770213665903.png";

const results = [
  {
    id: 1,
    treatment: "Skin Rejuvenation",
    category: "Aesthetics",
    description: "Profhilo treatment — 2 sessions",
    image: beforeAfterImage,
  },
  {
    id: 2,
    treatment: "Anti-Aging",
    category: "Aesthetics",
    description: "Polynucleotide therapy transformation",
    image: beforeAfterImage,
  },
  {
    id: 3,
    treatment: "Facial Enhancement",
    category: "Aesthetics",
    description: "Natural enhancement with dermal fillers",
    image: beforeAfterImage,
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
      {/* Card container */}
      <div className="relative overflow-hidden rounded-xl img-zoom">
        <div className="aspect-square overflow-hidden">
          <img
            src={result.image}
            alt={`${result.treatment} before and after result`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
            loading="lazy"
          />
        </div>

        {/* Dark gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(18,12,8,0.85) 0%, transparent 60%)",
          }}
        />

        {/* Category badge — top left */}
        <div className="absolute top-4 left-4">
          <span className="glass-card-sm px-3 py-1 text-[10px] tracking-widest uppercase font-light text-white/80">
            {result.category}
          </span>
        </div>

        {/* Content — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="glass-card p-4">
            <h3
              className="font-display text-lg text-white mb-1"
              style={{ fontWeight: 300, letterSpacing: "0.03em" }}
            >
              {result.treatment}
            </h3>
            <p className="text-white/50 text-xs font-light mb-3">
              {result.description}
            </p>
            <span
              className="text-[10px] tracking-widest uppercase font-light flex items-center gap-1.5 transition-all duration-300 group-hover:gap-2.5"
              style={{ color: "var(--ora-bronze)" }}
            >
              View gallery <ArrowRight size={10} />
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
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none hidden sm:block"
          style={{
            background: "linear-gradient(to right, hsl(var(--ora-milk)), transparent)",
          }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none hidden sm:block"
          style={{
            background: "linear-gradient(to left, hsl(var(--ora-milk)), transparent)",
          }}
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
