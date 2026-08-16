import { motion } from "framer-motion";
import { Link } from "wouter";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import lipFiller1 from "@assets/result-lip-filler-1.jpg";
import hydrofacialImg from "@assets/result-hydrofacial.jpg";

const RESULTS = [
  {
    id: "lip-filler",
    treatment: "Lip filler",
    image: lipFiller1,
    width: 1206,
    height: 1237,
    alt: "Before and after lip filler at ORÁ Suites — subtle added volume and a defined lip border",
  },
  {
    id: "hydrafacial",
    treatment: "HydraFacial",
    image: hydrofacialImg,
    width: 1206,
    height: 1297,
    alt: "Before and after HydraFacial at ORÁ Suites — clearer, more hydrated skin",
  },
] as const;

/** Results (v2) — centred heading, two images side by side, one link. */
export function ResultsShowcaseSection() {
  const m = useMotionSafe();

  return (
    <Section id="results" tone="sand" grain>
      <SectionHeader title="Real results" align="center" className="mb-8" />

      <motion.div
        variants={m.stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2"
      >
        {RESULTS.map((r) => (
          <motion.figure key={r.id} variants={m.fadeUp} whileHover={m.hoverLift} className="group">
            <Link href="/results" className="focus-ring block rounded-2xl" aria-label={`${r.treatment} — see more results`}>
              <div className="overflow-hidden rounded-2xl bg-ora-greige shadow-luxury">
                <img
                  src={r.image}
                  alt={r.alt}
                  width={r.width}
                  height={r.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[1/1] h-auto w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-[1.03]"
                />
              </div>
              <figcaption className="mt-3 text-center font-sans text-[0.9375rem] text-foreground">
                {r.treatment} <span className="text-ora-fog">· before &amp; after</span>
              </figcaption>
            </Link>
          </motion.figure>
        ))}
      </motion.div>

      <div className="mt-8 flex justify-center">
        <Button asChild variant="link" size="sm">
          <Link href="/results" data-testid="button-view-more-results">
            See all results <span aria-hidden>→</span>
          </Link>
        </Button>
      </div>
    </Section>
  );
}
