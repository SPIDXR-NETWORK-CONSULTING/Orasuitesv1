import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, DisplayHeading, GlassPill } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import roomRentalImage from "@assets/ora-hallway.jpg";

/**
 * Room rentals teaser — chocolate band with clip-path grow reveal, hallway
 * image bleeding to the right edge (desktop), cream type + 3 stat pills.
 * Prices mirror pages/room-rentals.tsx (£75 half-day · £130 day · £1,200 month).
 */
const STATS = [
  { value: "£75", label: "half-day" },
  { value: "£130", label: "full day" },
  { value: "£1,200", label: "per month" },
];

export function RoomRentalsTeaserSection() {
  const m = useMotionSafe();

  return (
    <motion.section
      id="room-rentals-teaser"
      data-testid="section-room-rentals-teaser"
      variants={m.clipReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className="band-dark mesh-bg-dark grain relative overflow-hidden"
    >
      <div className="relative z-[2] lg:grid lg:grid-cols-12 lg:items-stretch">
        {/* Copy */}
        <div className="px-5 py-section sm:px-8 lg:col-span-6 lg:col-start-1 lg:pl-[max(3rem,calc((100vw-80rem)/2+3rem))] lg:pr-12 xl:col-span-5">
          <motion.div
            variants={m.stagger(0.08, 0.35)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="max-w-xl"
          >
            <Eyebrow reveal as="p" rule className="mb-6">
              For practitioners
            </Eyebrow>
            <DisplayHeading as="h2" size="lg" tone="cream" inherit>
              {"Your room,\nat 45 Deansgate."}
            </DisplayHeading>
            <motion.p variants={m.fadeUp} className="lede mt-6 max-w-lg text-ora-smoke">
              Fully equipped private treatment rooms inside a women-only sanctuary — reception, bookings and a
              ready-made client base included. Half-day, day or monthly.
            </motion.p>

            <motion.ul variants={m.fadeUp} className="mt-9 flex flex-wrap gap-3" aria-label="Room rental prices">
              {STATS.map((s) => (
                <GlassPill key={s.label} as="li" tone="light" className="!py-2.5 !pl-4 !pr-4">
                  <span className="font-display text-[1.125rem] leading-none text-ora-cream">{s.value}</span>
                  <span className="text-ora-smoke">{s.label}</span>
                </GlassPill>
              ))}
            </motion.ul>

            <motion.div variants={m.fadeUp} className="mt-10">
              <motion.span whileHover={m.hoverButton} whileTap={m.tapButton} className="inline-flex">
                <Button asChild variant="luxury" size="lg">
                  <Link href="/room-rentals" data-testid="button-room-rentals-cta">
                    Enquire about a room
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </motion.span>
            </motion.div>
          </motion.div>
        </div>

        {/* Image — bleeds to the right edge on desktop, stacks below on mobile */}
        <motion.figure
          variants={m.fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative mx-5 mb-12 aspect-[4/5] overflow-hidden rounded-2xl sm:mx-8 sm:aspect-[5/4] lg:col-span-6 lg:col-start-7 lg:m-0 lg:aspect-auto lg:min-h-[640px] lg:rounded-none lg:rounded-l-[2rem]"
        >
          <img
            src={roomRentalImage}
            alt="A warm-lit hallway at ORÁ Suites leading to the private treatment rooms"
            width={1206}
            height={1609}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--ora-deep)_0%,transparent_35%)] hidden lg:block"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-warm)_0%,transparent_45%)]" />
          {/* floating glass caption */}
          <figcaption className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-auto lg:bottom-10 lg:left-16">
            <span className="glass-strong inline-flex items-center gap-3 rounded-full px-4 py-2 font-sans text-[0.8125rem] font-medium text-ora-cream">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ora-bronze animate-pulse" />
              Private rooms · reception included
            </span>
          </figcaption>
        </motion.figure>
      </div>
    </motion.section>
  );
}
