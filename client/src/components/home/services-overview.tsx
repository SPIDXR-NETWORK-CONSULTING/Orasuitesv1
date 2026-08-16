import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { ComingSoon, ComingSoonBadge } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import { liveCategories, comingSoonCategories, fromPrice, formatPrice, type Category, type CategoryId } from "@/lib/catalogue";
import aestheticsImage from "@assets/service-injectables.jpg";
import nailsImage from "@assets/service-nails-ora.jpg";
import hairImage from "@assets/service-hair-homepage.jpg";
import makeupImage from "@assets/service-wellness-homepage.jpg";
import laserImage from "@assets/service-led-laser.jpg";

/* Approved image map (one image per category — never repeated on the page) */
const IMAGES: Record<string, { src: string; alt: string }> = {
  aesthetics: { src: aestheticsImage, alt: "Nurse-led aesthetic treatment in a warm-lit room at ORÁ Suites" },
  nails: { src: nailsImage, alt: "Freshly finished luxury manicure at ORÁ Nails" },
  hair: { src: hairImage, alt: "Soft blow-dried hair" },
  makeup: { src: makeupImage, alt: "Beauty products laid out for a makeup appointment" },
  laser: { src: laserImage, alt: "LED and laser skin treatment" },
};

const LIVE_TITLE: Record<string, string> = { aesthetics: "Aesthetics", nails: "Nails" };

function LiveCard({ cat }: { cat: Category }) {
  const m = useMotionSafe();
  const img = IMAGES[cat.id as CategoryId] ?? IMAGES.aesthetics;
  const price = fromPrice(cat.id);
  return (
    <motion.article variants={m.fadeUp} whileHover={m.hoverLift} data-testid={`card-service-${cat.id}`}>
      <Link
        href={`/services#${cat.id}`}
        className="focus-ring group block overflow-hidden rounded-2xl bg-ora-milk shadow-luxury transition-shadow duration-450 ease-luxury hover:shadow-glow-bronze"
        aria-label={`${cat.title} — treatments and prices`}
      >
        <div className="aspect-[4/3] overflow-hidden bg-ora-greige">
          <img
            src={img.src}
            alt={img.alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <h3 className="font-display text-[1.1rem] leading-tight text-foreground">{LIVE_TITLE[cat.id] ?? cat.title}</h3>
            {typeof price === "number" && (
              <p className="mt-1 font-sans text-[0.875rem] text-ora-fog">from {formatPrice(price)}</p>
            )}
          </div>
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ora-taupe/40 text-ora-taupe transition-[transform,border-color,color] duration-450 ease-luxury group-hover:translate-x-0.5 group-hover:border-ora-bronze group-hover:text-ora-bronze">
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

function SoonBox({ cat }: { cat: Category }) {
  const m = useMotionSafe();
  const img = IMAGES[cat.id as CategoryId];
  return (
    <motion.div variants={m.fadeUp} data-testid={`card-service-${cat.id}`}>
      <ComingSoon className="overflow-hidden rounded-2xl bg-ora-milk shadow-luxury">
        <div className="aspect-[4/3] overflow-hidden bg-ora-greige sm:aspect-[16/9]">
          {img && <img src={img.src} alt={img.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-col items-center gap-1.5 px-2 py-3 text-center sm:flex-row sm:justify-between sm:px-4">
          <h3 className="font-display text-[0.95rem] leading-tight text-foreground sm:text-[1rem]">{cat.title}</h3>
          <ComingSoonBadge label="Soon" className="!opacity-100 whitespace-nowrap px-2 py-0.5 text-[0.5625rem] tracking-[0.14em] sm:hidden" />
          <ComingSoonBadge className="!opacity-100 hidden whitespace-nowrap px-2 py-0.5 text-[0.5625rem] tracking-[0.14em] sm:inline-flex" />
        </div>
      </ComingSoon>
    </motion.div>
  );
}

/** Services overview (v2) — heading only; 2 live cards + 3 small faded coming-soon boxes. */
export function ServicesOverviewSection() {
  const m = useMotionSafe();
  const live = liveCategories();
  const soon = comingSoonCategories().filter((c) => IMAGES[c.id as CategoryId]).slice(0, 3);

  return (
    <Section id="services-overview" tone="sand" grain>
      <SectionHeader title="Our services" align="center" className="mb-8" />

      <motion.div
        variants={m.stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2"
      >
        {live.map((cat) => (
          <LiveCard key={cat.id} cat={cat} />
        ))}
      </motion.div>

      {soon.length > 0 && (
        <motion.div
          variants={m.stagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto mt-4 grid max-w-3xl grid-cols-3 gap-3 sm:gap-4"
        >
          {soon.map((cat) => (
            <SoonBox key={cat.id} cat={cat} />
          ))}
        </motion.div>
      )}
    </Section>
  );
}
