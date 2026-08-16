import * as React from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Maximize2 } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { GlassCard, DisplayHeading, BeforeAfterSlider } from "@/components/ui/glass";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Reveal, useMotionSafe, spring, easeLuxury } from "@/lib/motion";
import { useSEO, defaultBusinessJsonLd, breadcrumbJsonLd } from "@/hooks/use-seo";

import lipFillerImg from "@assets/result-lip-filler-new.jpg";
import polynucleotideImg from "@assets/service-polynucleotide.jpg";
import hydrofacialImg from "@assets/result-hydrofacial.jpg";
import underEyeImg from "@assets/result-under-eye-new.jpg";
import microneedlingImg from "@assets/result-microneedling.jpg";
import chinFillerImg from "@assets/result-chin-filler.jpg";

/* ── data ──────────────────────────────────────────────── */
type Category = "Aesthetics" | "Skin";
type Kind = "compare" | "single";

interface ResultItem {
  id: string;
  treatment: string;
  category: Category;
  /** compare = stacked before (top) / after (bottom) pair → slider in the lightbox */
  kind: Kind;
  image: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

/* 6 items = full rows at 3-up (All) and 3 each per filter — no orphans. */
const RESULTS: ResultItem[] = [
  { id: "lip-filler", treatment: "Lip filler", category: "Aesthetics", kind: "compare", image: lipFillerImg, width: 1206, height: 1198, alt: "Lip filler before and after: subtle added volume and a more defined lip border", caption: "Before and after — natural volume and definition." },
  { id: "under-eye", treatment: "Under-eye filler", category: "Aesthetics", kind: "compare", image: underEyeImg, width: 736, height: 736, alt: "Under-eye filler before and after: hollows softened, area looks brighter and more rested", caption: "Before and after — tear-trough correction." },
  { id: "chin-filler", treatment: "Chin filler", category: "Aesthetics", kind: "compare", image: chinFillerImg, width: 1206, height: 1210, alt: "Chin filler before and after: improved projection and a more balanced profile", caption: "Before and after — profile balance." },
  { id: "polynucleotide", treatment: "Polynucleotides", category: "Skin", kind: "single", image: polynucleotideImg, width: 2048, height: 1536, alt: "A practitioner injecting polynucleotide treatment into a client's cheek", caption: "Treatment in progress — not a before/after." },
  { id: "hydrafacial", treatment: "HydraFacial", category: "Skin", kind: "single", image: hydrofacialImg, width: 1206, height: 1297, alt: "A client relaxing during a HydraFacial treatment at ORÁ Suites", caption: "Treatment in progress — results build over sessions." },
  { id: "microneedling", treatment: "Microneedling", category: "Skin", kind: "single", image: microneedlingImg, width: 1206, height: 1522, alt: "A client's face immediately after microneedling, showing the expected temporary flush", caption: "Immediately after — the flush settles in 24–48 hours." },
];

const FILTERS: ("All" | Category)[] = ["All", "Aesthetics", "Skin"];

/* Stacked composites: top half = before, bottom half = after. */
const STACKED_SLIDER_CLASSES = "[&_img:nth-of-type(1)]:object-top [&_img:nth-of-type(2)]:object-bottom rounded-xl";
const STACKED_RATIO = "aspect-[2.06/1]";

/* ── card ──────────────────────────────────────────────── */
function ResultCard({ item, onOpen }: { item: ResultItem; onOpen: () => void }) {
  const m = useMotionSafe();
  const isCompare = item.kind === "compare";

  return (
    <motion.article
      layout
      initial={m.reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={m.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: easeLuxury }}
      className="group relative h-full"
      data-testid={`card-result-${item.id}`}
    >
      <GlassCard staticCard hover tone="light" padding="none" radius="lg" className="flex h-full flex-col overflow-hidden bg-white/55">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${item.treatment} ${isCompare ? "before and after" : "photo"}`}
          className="relative block w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ora-bronze"
        >
          <div className="aspect-square">
            <img src={item.image} alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
          {isCompare && (
            <>
              <span className="pointer-events-none absolute left-3 top-3 glass-pill px-3 py-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ora-cream">Before</span>
              <span className="pointer-events-none absolute left-3 top-1/2 mt-3 glass-pill px-3 py-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ora-cream">After</span>
            </>
          )}
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full glass-strong text-ora-cream opacity-0 transition-opacity duration-450 ease-luxury group-hover:opacity-100 group-focus-within:opacity-100">
            <Maximize2 className="h-4 w-4" aria-hidden />
          </span>
        </button>

        <div className="flex flex-1 flex-col p-5 text-center">
          <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">{item.category}</p>
          <h3 className="mt-1.5 font-display text-[1.1rem] text-foreground" data-testid={`text-result-title-${item.id}`}>
            {item.treatment}
          </h3>
          <p className="mt-1.5 font-sans text-[0.875rem] leading-[1.5] text-ora-fog">{item.caption}</p>
        </div>
      </GlassCard>
    </motion.article>
  );
}

/* ── lightbox ──────────────────────────────────────────── */
function Lightbox({ item, onClose }: { item: ResultItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl gap-0 border-0 bg-transparent p-0 shadow-none text-ora-cream focus:outline-none [&>button]:right-3 [&>button]:top-3 [&>button]:z-20 [&>button]:h-10 [&>button]:w-10 [&>button]:rounded-full [&>button]:glass-strong [&>button]:opacity-100 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button_svg]:h-4 [&>button_svg]:w-4">
        {item && (
          <div className="on-dark overflow-hidden rounded-2xl border border-white/15 bg-ora-deep/85 shadow-glow-bronze-lg backdrop-blur-glass">
            {item.kind === "compare" ? (
              <div className="p-2 sm:p-4">
                <BeforeAfterSlider
                  before={{ src: item.image, alt: `Before — ${item.alt}`, width: item.width, height: item.height }}
                  after={{ src: item.image, alt: `After — ${item.alt}`, width: item.width, height: item.height }}
                  ratioClassName={STACKED_RATIO}
                  className={STACKED_SLIDER_CLASSES}
                />
              </div>
            ) : (
              <div className="max-h-[70vh] p-2 sm:p-4">
                <img src={item.image} alt={item.alt} width={item.width} height={item.height} className="mx-auto max-h-[66vh] w-auto max-w-full rounded-xl object-contain" />
              </div>
            )}
            <div className="px-6 pb-6 pt-2 text-center">
              <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">{item.category}</p>
              <DialogTitle className="mt-1 font-display text-xl font-normal text-ora-cream">{item.treatment}</DialogTitle>
              <DialogDescription className="mt-1 font-sans text-[0.9rem] text-ora-smoke">
                {item.caption}
                {item.kind === "compare" ? " Drag to compare." : ""}
              </DialogDescription>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── page ──────────────────────────────────────────────── */
export default function ResultsPage() {
  const m = useMotionSafe();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All");
  const [open, setOpen] = React.useState<ResultItem | null>(null);

  const visible = React.useMemo(() => (filter === "All" ? RESULTS : RESULTS.filter((r) => r.category === filter)), [filter]);

  useSEO({
    title: "Results | Aesthetics & Skin at ORÁ Suites, Manchester",
    description:
      "Before-and-after results and treatment photos from ORÁ Suites, 45 Deansgate, Manchester — lip, chin and under-eye filler, polynucleotides, HydraFacial and microneedling. Shared with consent; results vary.",
    jsonLd: [defaultBusinessJsonLd(), breadcrumbJsonLd([{ name: "Results", path: "/results" }])],
  });

  return (
    <Layout padTop lightHeader>
      <Section tone="milk" mesh grain pad="sm" className="pt-6 md:pt-10" animate={false}>
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <DisplayHeading as="h1" size="xl" plain>
            Results
          </DisplayHeading>
          <p className="mt-3 font-sans text-[0.95rem] leading-[1.55] text-ora-fog sm:text-base">Real photos from our treatment rooms. Shared with consent — results vary.</p>
        </Reveal>

        <Reveal className="mb-8 flex justify-center md:mb-10">
          <div role="group" aria-label="Filter results by category" className="flex flex-wrap justify-center gap-2.5">
            {FILTERS.map((f) => {
              const active = f === filter;
              return (
                <motion.button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={active}
                  whileHover={m.reduced ? undefined : { scale: 1.03 }}
                  whileTap={m.reduced ? undefined : { scale: 0.97 }}
                  transition={spring.snappy}
                  className={[
                    "inline-flex items-center rounded-full border px-4 py-2 font-sans text-[0.8125rem] font-medium transition-[background-color,color,border-color,box-shadow] duration-450 ease-luxury focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze",
                    active ? "border-ora-bronze bg-ora-deep text-ora-cream shadow-glow-bronze" : "border-ora-greige/80 bg-white/50 text-foreground hover:border-ora-taupe/70",
                  ].join(" ")}
                >
                  {f}
                </motion.button>
              );
            })}
          </div>
        </Reveal>

        <LayoutGroup>
          <motion.div layout className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((item) => (
                <ResultCard key={item.id} item={item} onOpen={() => setOpen(item)} />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        <Reveal className="mt-10 text-center">
          <p className="mx-auto max-w-xl font-sans text-[0.8rem] leading-[1.55] text-ora-fog">
            Individual results vary. Every aesthetic treatment starts with a consultation. All images shared with client permission.
          </p>
          <Button asChild variant="link" className="mt-4 h-auto py-1 text-[0.85rem] uppercase tracking-[0.16em]">
            <Link href="/book" data-testid="button-results-book">
              Book a consultation <ArrowRight aria-hidden />
            </Link>
          </Button>
        </Reveal>
      </Section>

      <Lightbox item={open} onClose={() => setOpen(null)} />
    </Layout>
  );
}
