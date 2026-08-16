import { motion } from "framer-motion";
import { MapPin, Mail, Clock, Navigation } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { GlassCard, IconOrb } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import manchesterImage from "@assets/manchester-location_1770213665902.png";

/* Business truth — keep in sync with hooks/use-seo.ts BUSINESS + DESIGN_BRIEF.md */
const ADDRESS_LINES = ["45 Deansgate", "Manchester M3 2AY"];
const EMAIL = "admin@orasuites.com";
const MAPS_URL = "https://maps.google.com/?q=45+Deansgate+Manchester+M3+2AY";
const MAP_EMBED_SRC = "https://www.google.com/maps?q=45+Deansgate+Manchester+M3+2AY&output=embed";
const HOURS = [
  { days: "Monday – Saturday", time: "9am – 7pm" },
  { days: "Sunday", time: "Closed" },
];

/**
 * Location — glass info card floating over the Manchester skyline (left),
 * live Google Map embed (right). No phone (none yet). Stacks on mobile.
 */
export function LocationSection() {
  const m = useMotionSafe();

  return (
    <Section id="location" tone="milk" mesh grain className="overflow-hidden">
      <SectionHeader
        eyebrow="Find us"
        title={"On Deansgate,\nin the heart of Manchester."}
        subtitle="A calm, private space a short walk from St Ann's Square, Spinningfields and Deansgate tram stop."
      />

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Skyline + floating glass card */}
        <motion.div
          variants={m.fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative lg:col-span-7"
        >
          <div className="relative overflow-hidden rounded-3xl bg-ora-greige shadow-luxury">
            <img
              src={manchesterImage}
              alt="Manchester city skyline at dusk, warm light on the buildings around Deansgate"
              width={1344}
              height={768}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] h-auto w-full object-cover sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[560px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-deep)_0%,var(--overlay-dark)_35%,transparent_70%)]"
            />
            <div aria-hidden className="grain pointer-events-none inset-0" style={{ position: "absolute" }} />

            {/* Glass info card */}
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 lg:left-8 lg:right-auto lg:bottom-8 lg:w-[min(24rem,80%)]">
              <GlassCard tone="strong" padding="md" radius="xl" staticCard className="on-dark text-ora-cream">
                <address className="not-italic">
                  <ul className="space-y-5">
                    <li className="flex items-start gap-4">
                      <IconOrb size="sm" tone="dark" className="mt-0.5">
                        <MapPin />
                      </IconOrb>
                      <div>
                        <p className="eyebrow mb-1.5">Address</p>
                        <p className="font-display text-[1.25rem] leading-snug">
                          {ADDRESS_LINES[0]}
                          <br />
                          {ADDRESS_LINES[1]}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <IconOrb size="sm" tone="dark" className="mt-0.5">
                        <Mail />
                      </IconOrb>
                      <div>
                        <p className="eyebrow mb-1.5">Email</p>
                        <a
                          href={`mailto:${EMAIL}`}
                          className="focus-ring rounded font-sans text-[0.9375rem] text-ora-cream/90 underline-offset-4 transition-colors duration-450 hover:text-ora-bronze hover:underline"
                        >
                          {EMAIL}
                        </a>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <IconOrb size="sm" tone="dark" className="mt-0.5">
                        <Clock />
                      </IconOrb>
                      <div>
                        <p className="eyebrow mb-1.5">Hours</p>
                        <dl className="space-y-1 font-sans text-[0.9375rem]">
                          {HOURS.map((h) => (
                            <div key={h.days} className="flex justify-between gap-6">
                              <dt className="text-ora-cream/85">{h.days}</dt>
                              <dd className="text-ora-cream">{h.time}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </li>
                  </ul>
                </address>

                <div className="mt-7">
                  <Button asChild variant="glass" size="default" className="w-full sm:w-auto">
                    <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" data-testid="button-get-directions">
                      <Navigation size={16} />
                      Get directions
                    </a>
                  </Button>
                </div>
              </GlassCard>
            </div>
          </div>
        </motion.div>

        {/* Map */}
        <motion.div
          variants={m.fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          transition={{ delay: 0.12 }}
          className="relative lg:col-span-5"
        >
          <div className="glass-warm relative h-full overflow-hidden rounded-3xl p-2">
            <iframe
              title="Map — ORÁ Suites, 45 Deansgate, Manchester M3 2AY"
              src={MAP_EMBED_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block aspect-[4/3] w-full rounded-[1.25rem] border-0 grayscale-[35%] sepia-[18%] contrast-[.95] transition-[filter] duration-700 ease-luxury hover:grayscale-0 hover:sepia-0 lg:aspect-auto lg:h-full lg:min-h-[560px]"
            />
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
