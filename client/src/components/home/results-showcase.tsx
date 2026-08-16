import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";
import lipFiller1 from "@assets/result-lip-filler-1.jpg";
import hydrofacialImg from "@assets/result-hydrofacial.jpg";

const RESULTS = [
  {
    id: "lip-filler",
    treatment: "Lip filler",
    caption: "Natural volume and definition — before and after, one session.",
    image: lipFiller1,
    width: 1206,
    height: 1237,
    alt: "Before and after lip filler at ORÁ Suites — subtle added volume and a defined lip border",
  },
  {
    id: "hydrafacial",
    treatment: "HydraFacial",
    caption: "Deep cleanse, gentle exfoliation and targeted hydration.",
    image: hydrofacialImg,
    width: 1206,
    height: 1297,
    alt: "Before and after HydraFacial at ORÁ Suites — clearer, more hydrated skin",
  },
] as const;

type Result = (typeof RESULTS)[number];

function ResultFigure({ r, className, large = false }: { r: Result; className?: string; large?: boolean }) {
  const m = useMotionSafe();
  return (
    <motion.figure variants={m.fadeUp} className={cn("group", className)}>
      <Link href="/results" className="focus-ring block rounded-2xl" aria-label={`${r.treatment} — see more results`}>
        <div className="relative overflow-hidden rounded-2xl bg-ora-greige shadow-luxury">
          <img
            src={r.image}
            alt={r.alt}
            width={r.width}
            height={r.height}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-auto w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105",
              large ? "aspect-[1/1]" : "aspect-[4/5]",
            )}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25" />
          <span className="glass-pill pointer-events-none absolute left-4 top-4 px-3 py-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ora-cream">
            Before · After
          </span>
        </div>
        <figcaption className={cn("mt-5", large ? "max-w-md" : "max-w-xs")}>
          <span className="relative inline-block font-display text-[1.375rem] leading-tight tracking-display text-foreground sm:text-[1.625rem]">
            {r.treatment}
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-ora-bronze transition-transform duration-700 ease-luxury group-hover:scale-x-100"
            />
          </span>
          <p className="mt-2 font-sans text-[0.9375rem] leading-relaxed text-ora-fog">{r.caption}</p>
        </figcaption>
      </Link>
    </motion.figure>
  );
}

/**
 * Results — editorial overlapping strip: large image left, second image offset
 * down-right by ~15% (desktop). Simple stack on mobile.
 */
export function ResultsShowcaseSection() {
  const m = useMotionSafe();
  const [primary, secondary] = RESULTS;

  return (
    <Section id="results" tone="milk" mesh grain className="overflow-hidden">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="Real results"
            title={"Subtle work.\nVisible confidence."}
            subtitle="Every result below is a real ORÁ client, treated by our nurse-led team at 45 Deansgate."
            className="mb-8 lg:mb-10"
          />
          <Button asChild variant="link">
            <Link href="/results" data-testid="button-view-more-results">
              See all results
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>

        <motion.div
          variants={m.stagger(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative grid gap-10 sm:grid-cols-2 sm:items-start lg:col-span-8 lg:grid-cols-12"
        >
          <ResultFigure r={primary} large className="sm:col-span-1 lg:col-span-7" />
          <ResultFigure
            r={secondary}
            className="sm:col-span-1 sm:mt-16 lg:col-span-5 lg:-ml-[15%] lg:mt-[15%] lg:w-[115%]"
          />
          {/* bronze halo behind the overlap */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-[10%] top-1/2 -z-10 hidden h-64 w-64 -translate-y-1/2 rounded-full bg-ora-bronze/15 blur-3xl lg:block"
          />
          <Eyebrow className="hidden lg:absolute lg:-left-3 lg:top-1/2 lg:block lg:origin-left lg:-rotate-90 lg:text-ora-bronze/70">
            ORÁ · Manchester
          </Eyebrow>
        </motion.div>
      </div>
    </Section>
  );
}
