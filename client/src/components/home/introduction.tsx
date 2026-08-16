import { motion } from "framer-motion";
import { Link } from "wouter";
import { MapPin } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Eyebrow, DisplayHeading, IconOrb } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import { OraMarkIcon, FeatherIcon } from "@/components/icons/OraIcons";
import waxSealImage from "@assets/ora-logo-wax-seal.jpg";

const FACTS = [
  { icon: <OraMarkIcon />, label: "Women-only" },
  { icon: <MapPin />, label: "45 Deansgate" },
  { icon: <FeatherIcon />, label: "Led by Meg Cauli" },
];

/**
 * Introduction — asymmetric: the wax-seal image climbs 80px above the section
 * and runs 8% wider than its column (desktop). One 23-word statement in display
 * type + a glass micro-strip of three facts. Simple stack below lg.
 */
export function IntroductionSection() {
  const m = useMotionSafe();

  return (
    <Section
      id="introduction"
      tone="milk"
      mesh
      grain
      pad="none"
      className="pb-section pt-section lg:pt-0"
    >
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
        {/* Image — breaks the grid on desktop */}
        <motion.figure
          variants={m.clipReveal}
          className="relative lg:col-span-5 lg:-ml-[8%] lg:-mt-20 lg:w-[108%]"
        >
          <div className="group relative overflow-hidden rounded-2xl shadow-luxury">
            <img
              src={waxSealImage}
              alt="The ORÁ Beauty logo, with its Arabic name beneath, pressed into a dusty-rose wax seal on a cream envelope"
              width={1206}
              height={1532}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] h-auto w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
          </div>
          <span aria-hidden className="absolute -bottom-6 -right-6 -z-10 hidden h-40 w-40 rounded-full bg-ora-bronze/15 blur-2xl lg:block" />
        </motion.figure>

        {/* Statement */}
        <motion.div
          variants={m.stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="lg:col-span-6 lg:col-start-7 lg:pt-section"
        >
          <Eyebrow reveal as="p" rule className="mb-6">
            A sanctuary for wellness
          </Eyebrow>

          <DisplayHeading as="h2" size="md" inherit gap={0.1}>
            {"A women-only sanctuary in the heart of Manchester —\nnurse-led aesthetics, luxury nails and calm private rooms,\nwhere self-care becomes a ritual you keep."}
          </DisplayHeading>

          {/* Micro-facts glass strip */}
          <motion.ul
            variants={m.fadeUp}
            className="glass-warm mt-10 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-ora-bronze/20"
            aria-label="Key facts"
          >
            {FACTS.map((f) => (
              <li key={f.label} className="flex items-center gap-3 px-3 py-1.5 sm:flex-1 sm:justify-center">
                <IconOrb size="sm" tone="warm">
                  {f.icon}
                </IconOrb>
                <span className="font-sans text-[0.9375rem] font-medium text-foreground">{f.label}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div variants={m.fadeUp} className="mt-8">
            <Button asChild variant="link" size="sm">
              <Link href="/about" data-testid="button-discover-story">
                Our story
                <span aria-hidden>→</span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </Section>
  );
}
