import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Bell } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { GlassPill, ComingSoon, ComingSoonBadge, Eyebrow } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  liveCategories,
  comingSoonCategories,
  fromPrice,
  formatPrice,
  type Category,
  type CategoryId,
} from "@/lib/catalogue";
import aestheticsImage from "@assets/service-injectables.jpg";
import nailsImage from "@assets/service-nails-ora.jpg";
import hairImage from "@assets/service-hair-homepage.jpg";
import wellnessImage from "@assets/service-wellness-homepage.jpg";

/* ── Presentation map (images + copy only — prices come from the catalogue) ── */
interface Presentation {
  image: string;
  width: number;
  height: number;
  alt: string;
  blurb: string;
}
const PRESENTATION: Record<string, Presentation> = {
  aesthetics: {
    image: aestheticsImage,
    width: 736,
    height: 1308,
    alt: "Nurse-led aesthetic injectables at ORÁ Suites — a practitioner treating a client in a calm, warm-lit room",
    blurb: "Anti-wrinkle, fillers, skin boosters and facials — nurse-led, natural, unhurried.",
  },
  nails: {
    image: nailsImage,
    width: 1086,
    height: 1448,
    alt: "Freshly finished luxury manicure at ORÁ Nails, Manchester",
    blurb: "BIAB, gel, extensions and slow, spa-grade manicures and pedicures.",
  },
  hair: {
    image: hairImage,
    width: 736,
    height: 1308,
    alt: "Soft blow-dried hair styled at ORÁ Suites",
    blurb: "Cut, colour and blow-dry.",
  },
  makeup: {
    image: wellnessImage,
    width: 736,
    height: 1313,
    alt: "Warm-toned beauty products laid out for a makeup appointment at ORÁ Suites",
    blurb: "Occasion and bridal makeup.",
  },
  laser: {
    image: aestheticsImage,
    width: 736,
    height: 1308,
    alt: "Skin treatment room prepared for laser at ORÁ Suites",
    blurb: "Laser hair removal and skin.",
  },
  wellness: {
    image: wellnessImage,
    width: 736,
    height: 1313,
    alt: "Calm wellness treatment space at ORÁ Suites",
    blurb: "Restorative rituals.",
  },
};
const fallbackPresentation = PRESENTATION.wellness;

function presentationFor(id: CategoryId): Presentation {
  return PRESENTATION[id] ?? fallbackPresentation;
}

/** Up to 6 headline treatments — group names first, then services if there are few groups. */
function headlineTreatments(cat: Category, max = 6): string[] {
  const groups = cat.groups.map((g) => g.name).filter((n) => !/consult/i.test(n));
  if (groups.length >= 4) return groups.slice(0, max);
  const services = cat.groups.flatMap((g) => g.services.map((s) => s.name));
  return Array.from(new Set([...groups, ...services])).slice(0, max);
}

/* ── Feature card (live category) ── */
function FeatureCard({ cat, className }: { cat: Category; className?: string }) {
  const m = useMotionSafe();
  const p = presentationFor(cat.id);
  const price = fromPrice(cat.id);
  const treatments = headlineTreatments(cat);

  return (
    <motion.article
      variants={m.fadeUp}
      whileHover={m.hoverLift}
      className={cn("group relative flex flex-col will-change-transform", className)}
      data-testid={`card-service-${cat.id}`}
    >
      <Link
        href={`/services#${cat.id}`}
        className="focus-ring relative block min-h-0 flex-1 overflow-hidden rounded-2xl bg-ora-greige shadow-luxury transition-shadow duration-700 ease-luxury hover:shadow-glow-bronze-lg"
        aria-label={`${cat.title} — view treatments and prices`}
      >
        <img
          src={p.image}
          alt={p.alt}
          width={p.width}
          height={p.height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-deep)_0%,var(--overlay-dark)_30%,transparent_65%)]"
        />

        {/* Glass caption panel */}
        <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
          <div className="glass-strong on-dark rounded-2xl p-5 text-ora-cream sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Eyebrow className="!text-ora-bronze">{cat.title}</Eyebrow>
              {typeof price === "number" && (
                <GlassPill size="sm" tone="bronze" className="!text-ora-cream">
                  from {formatPrice(price)}
                </GlassPill>
              )}
            </div>
            <h3 className="mt-3 font-display text-[1.75rem] leading-[1.1] tracking-display sm:text-[2rem] lg:text-[2.25rem]">
              {cat.title === "Aesthetics" ? "Nurse-led aesthetics" : cat.title === "Nails" ? "Luxury nails" : cat.title}
            </h3>
            <p className="mt-2 max-w-md font-sans text-[0.9375rem] leading-relaxed text-ora-cream/75">{p.blurb}</p>

            {/* Treatments — slide up on hover (always visible on touch) */}
            <ul
              className={cn(
                "mt-4 flex flex-wrap gap-x-4 gap-y-1.5 overflow-hidden font-sans text-[0.8125rem] text-ora-cream/85",
                "max-h-40 opacity-100 md:max-h-0 md:translate-y-2 md:opacity-0",
                "transition-[max-height,opacity,transform] duration-700 ease-luxury md:group-hover:max-h-40 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:max-h-40 md:group-focus-within:opacity-100",
              )}
            >
              {treatments.map((t) => (
                <li key={t} className="flex items-center gap-2 before:h-1 before:w-1 before:rounded-full before:bg-ora-bronze">
                  {t}
                </li>
              ))}
            </ul>

            <span className="mt-5 inline-flex items-center gap-2 font-sans text-[0.875rem] font-medium text-ora-cream">
              View treatments
              <ArrowRight size={16} className="transition-transform duration-450 ease-luxury group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

/* ── Coming-soon card ── */
function ComingSoonCard({ cat, className }: { cat: Category; className?: string }) {
  const m = useMotionSafe();
  const p = presentationFor(cat.id);

  return (
    <motion.div variants={m.fadeUp} className={cn("relative", className)} data-testid={`card-service-${cat.id}`}>
      <ComingSoon className="h-full">
        <article className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-ora-greige shadow-luxury">
          <img
            src={p.image}
            alt={p.alt}
            width={p.width}
            height={p.height}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-deep)_0%,var(--overlay-dark)_40%,transparent_75%)]"
          />
          <ComingSoonBadge className="absolute left-4 top-4 !opacity-100" />
          <div className="on-dark absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-ora-cream">
            <div>
              <h3 className="font-display text-[1.5rem] leading-tight tracking-display sm:text-[1.75rem]">{cat.title}</h3>
              <p className="mt-1 font-sans text-[0.8125rem] text-ora-cream/75">{p.blurb}</p>
            </div>
            <Link href="/contact" asChild>
              <GlassPill
                as="a"
                size="sm"
                data-interactive
                icon={<Bell />}
                className="focus-ring shrink-0 cursor-pointer !text-ora-cream"
                aria-label={`Notify me when ${cat.title} launches`}
              >
                Notify me
              </GlassPill>
            </Link>
          </div>
        </article>
      </ComingSoon>
    </motion.div>
  );
}

/* ── Section ── */
export function ServicesOverviewSection() {
  const m = useMotionSafe();
  const live = liveCategories();
  const soon = comingSoonCategories();
  const [first, second, ...restLive] = live;

  return (
    <Section id="services-overview" tone="sand" mesh grain>
      <SectionHeader
        eyebrow="Services"
        title={"Nurse-led aesthetics.\nLuxury nails.\nMore on the way."}
        subtitle="Two studios open now at 45 Deansgate. Hair, makeup and laser follow — be first to know."
      />

      {/* Live: asymmetric feature pair */}
      <motion.div
        variants={m.stagger(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid gap-5 sm:gap-6 lg:grid-cols-12"
      >
        {first && <FeatureCard cat={first} className="aspect-[4/5] sm:aspect-[5/6] lg:col-span-7 lg:aspect-auto lg:min-h-[640px]" />}
        {second && <FeatureCard cat={second} className="aspect-[4/5] sm:aspect-[5/6] lg:col-span-5 lg:mt-16 lg:aspect-auto lg:min-h-[640px]" />}
        {restLive.map((cat) => (
          <FeatureCard key={cat.id} cat={cat} className="aspect-[4/5] lg:col-span-6 lg:min-h-[520px]" />
        ))}
      </motion.div>

      {/* Coming soon: staggered row */}
      {soon.length > 0 && (
        <motion.div
          variants={m.stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
        >
          {soon.map((cat, i) => (
            <ComingSoonCard
              key={cat.id}
              cat={cat}
              className={cn(i === 1 && "lg:mt-10", i === 2 && "lg:mt-20", i > 2 && "lg:mt-0")}
            />
          ))}
        </motion.div>
      )}

      <div className="mt-12 flex justify-center sm:mt-16">
        <Button asChild variant="ghost" size="lg">
          <Link href="/services" data-testid="button-view-all-services">
            View all treatments &amp; prices
          </Link>
        </Button>
      </div>
    </Section>
  );
}
