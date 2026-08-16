import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Eyebrow, DisplayHeading } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import ctaImage from "@assets/ora-hero-zebra-crossing.jpg";

/**
 * Closing CTA — full-bleed image with scroll parallax (y −40 → 40), warm
 * overlays + grain, display-lg heading, single primary action.
 */
export function CTASection() {
  const m = useMotionSafe();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], m.reduced ? [0, 0] : [-40, 40]);

  return (
    <section
      ref={ref}
      id="cta"
      data-testid="section-cta"
      className="on-dark relative overflow-hidden bg-ora-deep py-[clamp(7rem,14vw,13rem)] text-ora-cream"
    >
      {/* Parallax media (oversized so the shift never reveals edges) */}
      <motion.div aria-hidden style={{ y }} className="absolute -inset-y-12 inset-x-0 will-change-transform">
        <img
          src={ctaImage}
          alt=""
          width={1023}
          height={1537}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-[50%_35%]"
        />
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[var(--overlay-dark)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,transparent_20%,var(--overlay-deep)_100%)]"
      />
      <div aria-hidden className="grain pointer-events-none inset-0" style={{ position: "absolute" }} />

      <Container className="relative z-[2]">
        <motion.div
          variants={m.stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto max-w-4xl text-center"
        >
          <Eyebrow reveal as="p" className="mb-7 justify-center">
            Ready when you are
          </Eyebrow>
          <DisplayHeading as="h2" size="lg" tone="cream" inherit className="mx-auto">
            {"Book a consultation.\nNurse-led. Women-only. 45 Deansgate."}
          </DisplayHeading>
          <motion.div variants={m.fadeUp} className="mt-10 flex justify-center">
            <motion.span whileHover={m.hoverButton} whileTap={m.tapButton} className="inline-flex">
              <Button asChild size="xl" variant="primary">
                <Link href="/book" data-testid="button-cta-book">
                  Book a Consultation
                </Link>
              </Button>
            </motion.span>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
