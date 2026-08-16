import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import roomRentalImage from "@assets/ora-hallway.jpg";

/**
 * Room rentals teaser (v2) — clean 2-col: image | heading + one line + 3 price pills + button.
 * No dark band, no bleed. Prices mirror pages/room-rentals.tsx.
 */
const PRICES = [
  { value: "£75", label: "half-day" },
  { value: "£130", label: "day" },
  { value: "£1,200", label: "month" },
];

export function RoomRentalsTeaserSection() {
  const m = useMotionSafe();

  return (
    <Section id="room-rentals-teaser" tone="milk" mesh grain data-testid="section-room-rentals-teaser">
      <motion.div
        variants={m.stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <motion.figure variants={m.fadeUp} className="overflow-hidden rounded-2xl bg-ora-greige shadow-luxury">
          <img
            src={roomRentalImage}
            alt="A warm-lit hallway at ORÁ Suites leading to the private treatment rooms"
            width={1206}
            height={1609}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] h-auto w-full object-cover lg:aspect-[5/4]"
          />
        </motion.figure>

        <div className="text-center lg:text-left">
          <DisplayHeading as="h2" size="lg" inherit>
            {"Rent a treatment room."}
          </DisplayHeading>
          <motion.p variants={m.fadeUp} className="lede mt-3">
            Furnished private rooms at 49 Deansgate — half-day, day or monthly.
          </motion.p>

          <motion.ul
            variants={m.fadeUp}
            className="mt-5 flex flex-wrap justify-center gap-2.5 lg:justify-start"
            aria-label="Room rental prices"
          >
            {PRICES.map((p) => (
              <li
                key={p.label}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-ora-taupe/30 bg-ora-sand px-4 py-2 font-sans text-[0.875rem]"
              >
                <span className="font-display text-[1rem] text-foreground">{p.value}</span>
                <span className="text-ora-fog">{p.label}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div variants={m.fadeUp} className="mt-6">
            <Button asChild variant="primary" size="default">
              <Link href="/room-rentals" data-testid="button-room-rentals-cta">
                Room rentals
                <ArrowRight size={16} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </Section>
  );
}
