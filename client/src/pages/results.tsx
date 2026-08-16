import * as React from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Maximize2, MoveHorizontal } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassPill, Eyebrow, DisplayHeading, SectionIntro, BeforeAfterSlider } from "@/components/ui/glass";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Reveal, useMotionSafe, spring, easeLuxury } from "@/lib/motion";
import { useSEO, defaultBusinessJsonLd, breadcrumbJsonLd } from "@/hooks/use-seo";

import heroBannerImage from "@assets/result-hero-contour.jpg";
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
  /** compare = the image is a stacked before (top) / after (bottom) pair → interactive slider */
  kind: Kind;
  image: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** honest context line shown under single images */
  note?: string;
}

const RESULTS: ResultItem[] = [
  {
    id: "lip-filler",
    treatment: "Lip filler",
    category: "Aesthetics",
    kind: "compare",
    image: lipFillerImg,
    width: 1206,
    height: 1198,
    alt: "Lip filler before and after: subtle added volume and a more defined lip border, natural in proportion to the face",
    caption: "Natural volume and definition with precise placement.",
  },
  {
    id: "under-eye",
    treatment: "Under-eye filler",
    category: "Aesthetics",
    kind: "compare",
    image: underEyeImg,
    width: 736,
    height: 736,
    alt: "Under-eye (tear trough) filler before and after: hollows softened, under-eye area looks brighter and more rested",
    caption: "Tear-trough correction for refreshed, rested eyes.",
  },
  {
    id: "chin-filler",
    treatment: "Chin filler",
    category: "Aesthetics",
    kind: "compare",
    image: chinFillerImg,
    width: 1206,
    height: 1210,
    alt: "Chin filler before and after: improved chin projection and a more balanced lower-face profile",
    caption: "Profile enhancement and facial balance with expert contouring.",
  },
  {
    id: "polynucleotide",
    treatment: "Polynucleotide therapy",
    category: "Skin",
    kind: "single",
    image: polynucleotideImg,
    width: 2048,
    height: 1536,
    alt: "An ORÁ practitioner injecting polynucleotide treatment into a client's cheek",
    caption: "Polynucleotide treatment in progress.",
    note: "Practitioner-at-work photo — not a before/after result. Skin regeneration builds over a course of sessions.",
  },
  {
    id: "hydrafacial",
    treatment: "HydraFacial",
    category: "Skin",
    kind: "single",
    image: hydrofacialImg,
    width: 1206,
    height: 1297,
    alt: "A client relaxing during a HydraFacial treatment at ORÁ Suites, headband on, practitioner's gloved hands at her temple",
    caption: "HydraFacial in progress — deep cleanse, exfoliation and targeted hydration.",
    note: "Treatment photo. Skin looks fresher immediately; results are cumulative.",
  },
  {
    id: "microneedling",
    treatment: "Microneedling",
    category: "Skin",
    kind: "single",
    image: microneedlingImg,
    width: 1206,
    height: 1522,
    alt: "A client's face immediately after microneedling, showing the expected temporary flush that settles within a day or two",
    caption: "Immediately after microneedling — collagen induction for texture and radiance.",
    note: "Post-treatment photo. The flush is normal and settles within 24–48 hours.",
  },
];

const FILTERS: ("All" | Category)[] = ["All", "Aesthetics", "Skin"];

/* Stacked composites: show the top half as "before" and bottom half as "after". */
const STACKED_SLIDER_CLASSES = "[&_img:nth-of-type(1)]:object-top [&_img:nth-of-type(2)]:object-bottom rounded-[1.5rem]";
const STACKED_RATIO = "aspect-[2.06/1]";

/* ── card ──────────────────────────────────────────────── */
function ResultCard({ item, featured, onOpen }: { item: ResultItem; featured: boolean; onOpen: () => void }) {
  const m = useMotionSafe();
  const isCompare = item.kind === "compare";

  return (
    <motion.article
      layout
      initial={m.reduced ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={m.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.6, ease: easeLuxury }}
      className={["group relative", featured ? "sm:col-span-2" : ""].join(" ")}
      data-testid={`card-result-${item.id}`}
    >
      <GlassCard staticCard hover tone="light" padding="none" radius="xl" className="bg-white/50">
        {featured && isCompare ? (
          <div className="p-2 sm:p-3">
            <BeforeAfterSlider
              before={{ src: item.image, alt: `Before — ${item.alt}`, width: item.width, height: item.height }}
              after={{ src: item.image, alt: `After — ${item.alt}`, width: item.width, height: item.height }}
              ratioClassName={STACKED_RATIO}
              className={STACKED_SLIDER_CLASSES}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Open ${item.treatment} ${isCompare ? "before and after" : "photo"}`}
            className="img-zoom relative block w-full overflow-hidden rounded-t-[1.5rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze focus-visible:ring-inset"
          >
            <div className={isCompare ? "aspect-square" : "aspect-[4/5]"}>
              <img src={item.image} alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
            {isCompare && (
              <>
                <span className="pointer-events-none absolute left-3 top-3 glass-pill px-3 py-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ora-cream">Before</span>
                <span className="pointer-events-none absolute left-3 top-1/2 mt-3 glass-pill px-3 py-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ora-cream">After</span>
              </>
            )}
            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full glass-strong text-ora-cream opacity-0 transition-opacity duration-450 ease-luxury group-hover:opacity-100 group-focus-within:opacity-100">
              {isCompare ? <MoveHorizontal className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
            </span>
          </button>
        )}

        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">{item.category}</p>
            <h3 className="mt-1.5 font-display text-xl text-foreground" data-testid={`text-result-title-${item.id}`}>
              {item.treatment}
            </h3>
            <p className="mt-1.5 font-sans text-[0.9rem] leading-relaxed text-ora-fog">{item.caption}</p>
            {item.note && <p className="mt-2 font-sans text-[0.75rem] italic leading-relaxed text-ora-fog/90">{item.note}</p>}
          </div>
          <motion.button
            type="button"
            onClick={onOpen}
            whileHover={m.reduced ? undefined : { scale: 1.06 }}
            whileTap={m.reduced ? undefined : { scale: 0.96 }}
            transition={spring.snappy}
            aria-label={`View ${item.treatment} larger`}
            className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ora-greige/80 bg-white/60 text-ora-taupe transition-[border-color,color,box-shadow] duration-450 ease-luxury hover:border-ora-bronze hover:text-ora-bronze hover:shadow-glow-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze"
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
          </motion.button>
        </div>
      </GlassCard>
    </motion.article>
  );
}

/* ── lightbox ──────────────────────────────────────────── */
function Lightbox({ item, onClose }: { item: ResultItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl gap-0 border-0 bg-transparent p-0 shadow-none text-ora-cream focus:outline-none [&>button]:right-3 [&>button]:top-3 [&>button]:z-20 [&>button]:h-10 [&>button]:w-10 [&>button]:rounded-full [&>button]:glass-strong [&>button]:opacity-100 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button_svg]:h-4 [&>button_svg]:w-4">
        {item && (
          <div className="on-dark overflow-hidden rounded-[2rem] border border-white/15 bg-ora-deep/85 shadow-glow-bronze-lg backdrop-blur-glass">
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
                <img src={item.image} alt={item.alt} width={item.width} height={item.height} className="mx-auto max-h-[66vh] w-auto max-w-full rounded-[1.5rem] object-contain" />
              </div>
            )}
            <div className="flex flex-col gap-2 px-6 pb-6 pt-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">{item.category}</p>
                <DialogTitle className="mt-1 font-display text-2xl font-normal text-ora-cream">{item.treatment}</DialogTitle>
                <DialogDescription className="mt-1 font-sans text-[0.9rem] text-ora-smoke">
                  {item.caption}
                  {item.note ? ` ${item.note}` : ""}
                </DialogDescription>
              </div>
              {item.kind === "compare" && (
                <p className="shrink-0 font-sans text-[0.75rem] uppercase tracking-[0.18em] text-ora-smoke">Drag or use ← → to compare</p>
              )}
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
  const counts = React.useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f, f === "All" ? RESULTS.length : RESULTS.filter((r) => r.category === f).length])) as Record<string, number>,
    [],
  );

  useSEO({
    title: "Before & After Results | Aesthetics & Skin at ORÁ Suites, Manchester",
    description:
      "Real before-and-after results from ORÁ Suites, Manchester's women-only clinic on Deansgate — lip, chin and under-eye filler, polynucleotides, HydraFacial and microneedling. Shared with client consent; results vary.",
    jsonLd: [defaultBusinessJsonLd(), breadcrumbJsonLd([{ name: "Results", path: "/results" }])],
  });

  return (
    <Layout>
      {/* ── hero ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[62vh] items-end overflow-hidden band-dark">
        <motion.img
          src={heroBannerImage}
          alt="Close-up of a woman's contoured cheek and jawline after aesthetic treatment at ORÁ Suites"
          width={736}
          height={736}
          fetchPriority="high"
          decoding="async"
          initial={m.reduced ? false : { scale: 1.08, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: easeLuxury }}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-deep)_0%,var(--overlay-dark)_45%,rgba(18,12,8,.3)_100%)]" />
        <Container className="relative z-[2] pb-14 pt-40 md:pb-20">
          <motion.div variants={m.stagger(0.1)} initial="hidden" animate="show" className="max-w-3xl">
            <Eyebrow reveal as="p" rule className="mb-6">
              Results · Women-only clinic, Manchester
            </Eyebrow>
            <DisplayHeading as="h1" size="xl" tone="cream" inherit>
              {"Real results.\nQuiet confidence."}
            </DisplayHeading>
            <motion.p variants={m.fadeUp} className="lede mt-7 max-w-xl text-ora-smoke">
              Honest photos from the ORÁ treatment rooms on Deansgate — before-and-afters where we have them, treatment-in-progress where we don't. Drag to compare.
            </motion.p>
          </motion.div>
        </Container>
      </section>

      {/* ── gallery ──────────────────────────────────────── */}
      <Section tone="milk" mesh grain pad="md" animate={false}>
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <SectionIntro eyebrow="Gallery" heading={"Filter by\nwhat matters to you."} size="md" className="mb-0 md:mb-0 lg:mb-0" />
          <Reveal>
            <div role="group" aria-label="Filter results by category" className="flex flex-wrap gap-2.5">
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
                      "glass-pill inline-flex items-center gap-2 px-4 py-2 font-sans text-[0.8125rem] font-medium transition-[background-color,color,border-color,box-shadow] duration-450 ease-luxury focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze",
                      active ? "border-ora-bronze bg-ora-deep text-ora-cream shadow-glow-bronze" : "bg-white/50 text-foreground",
                    ].join(" ")}
                  >
                    {f}
                    <span className={["font-sans text-[0.6875rem] tabular-nums", active ? "text-ora-bronze" : "text-ora-fog"].join(" ")}>{counts[f]}</span>
                  </motion.button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <LayoutGroup>
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((item, i) => (
                <ResultCard key={item.id} item={item} featured={i === 0 && item.kind === "compare"} onOpen={() => setOpen(item)} />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        <Reveal className="mt-10 flex flex-wrap items-center gap-3">
          <GlassPill tone="light" size="sm" as="span" className="bg-white/60 text-foreground" icon={<MoveHorizontal aria-hidden />}>
            Before / after — drag the handle
          </GlassPill>
          <GlassPill tone="light" size="sm" as="span" className="bg-white/60 text-foreground" icon={<Maximize2 aria-hidden />}>
            Tap any card to enlarge
          </GlassPill>
        </Reveal>
      </Section>

      {/* ── CTA band ─────────────────────────────────────── */}
      <Section tone="chocolate" mesh grain pad="lg" animate={false}>
        <motion.div variants={m.stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="max-w-3xl">
          <Eyebrow reveal as="p" rule className="mb-6">
            Your turn
          </Eyebrow>
          <DisplayHeading as="h2" size="lg" tone="cream" inherit>
            {"Book a consultation.\nNurse-led, women-only, Deansgate."}
          </DisplayHeading>
          <motion.p variants={m.fadeUp} className="lede mt-6 max-w-xl">
            Every plan starts with an honest conversation about what suits your face — and what doesn't.
          </motion.p>
          <motion.div variants={m.fadeUp} className="mt-10">
            <motion.span whileHover={m.hoverButton} whileTap={m.tapButton} transition={spring.snappy} className="inline-flex">
              <Button asChild size="xl" variant="primary">
                <Link href="/book" data-testid="button-results-book">
                  Book a consultation <ArrowRight aria-hidden />
                </Link>
              </Button>
            </motion.span>
          </motion.div>
        </motion.div>
      </Section>

      {/* ── disclaimer ───────────────────────────────────── */}
      <Section tone="bone" grain pad="sm" animate={false}>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow as="p" rule className="mb-4">
              Important information
            </Eyebrow>
            <h2 className="font-display text-display-sm text-foreground">Results vary. Here's what to know.</h2>
          </div>
          <GlassCard tone="light" padding="md" radius="xl" className="lg:col-span-8 bg-white/50" data-testid="text-disclaimer">
            <dl className="grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="font-display text-lg text-foreground">Individual results vary</dt>
                <dd className="mt-2 font-sans text-[0.9rem] leading-relaxed text-ora-fog">
                  These are examples of what treatments can achieve. Outcomes depend on skin type, age, lifestyle and aftercare.
                </dd>
              </div>
              <div>
                <dt className="font-display text-lg text-foreground">Consultation required</dt>
                <dd className="mt-2 font-sans text-[0.9rem] leading-relaxed text-ora-fog">
                  Every aesthetic treatment at ORÁ starts with a thorough, nurse-led consultation and honest expectations.
                </dd>
              </div>
              <div>
                <dt className="font-display text-lg text-foreground">Client consent</dt>
                <dd className="mt-2 font-sans text-[0.9rem] leading-relaxed text-ora-fog">
                  All images are shared with express permission from our clients. We respect privacy and confidentiality.
                </dd>
              </div>
            </dl>
          </GlassCard>
        </div>
      </Section>

      <Lightbox item={open} onClose={() => setOpen(null)} />
    </Layout>
  );
}
