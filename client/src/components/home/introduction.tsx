import { motion } from "framer-motion";
import { Link } from "wouter";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import waxSealImage from "@assets/ora-logo-wax-seal.jpg";

/**
 * Introduction (v2) — centred: wax-seal image in a tidy card, one heading,
 * one line, link to About.
 */
export function IntroductionSection() {
  const m = useMotionSafe();

  return (
    <Section id="introduction" tone="milk" mesh grain>
      <motion.div
        variants={m.stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mx-auto flex max-w-2xl flex-col items-center text-center"
      >
        <motion.figure variants={m.fadeUp} className="w-full max-w-[22rem] overflow-hidden rounded-2xl bg-ora-greige shadow-luxury">
          <img
            src={waxSealImage}
            alt="The ORÁ logo pressed into a wax seal on a cream envelope"
            width={1206}
            height={1532}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] h-auto w-full object-cover"
          />
        </motion.figure>

        <DisplayHeading as="h2" size="lg" inherit className="mt-8">
          {"A beauty and wellness sanctuary on Deansgate."}
        </DisplayHeading>
        <motion.p variants={m.fadeUp} className="lede mt-3 max-w-xl">
          Private treatment rooms, nurse-led aesthetics and luxury nails — in one calm space.
        </motion.p>

        <motion.div variants={m.fadeUp} className="mt-5">
          <Button asChild variant="link" size="sm">
            <Link href="/about" data-testid="button-discover-story">
              About ORÁ <span aria-hidden>→</span>
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </Section>
  );
}
