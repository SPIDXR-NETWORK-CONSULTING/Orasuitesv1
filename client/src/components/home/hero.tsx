import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { DisplayHeading } from "@/components/ui/glass";
import { useMotionSafe } from "@/lib/motion";
import heroPoster from "@assets/hero-image_1770213665902.png";

/**
 * Hero (v2) — the video is the star. Full-bleed, soft dark overlay, everything
 * centred: one line of Playfair, one small address line, two buttons. Nothing else.
 */
export function HeroSection() {
  const m = useMotionSafe();

  return (
    <section
      id="hero"
      data-testid="section-hero"
      className="on-dark relative flex min-h-[100svh] items-end justify-center overflow-hidden bg-ora-deep text-ora-cream"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={heroPoster}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* soft dark overlay for AA contrast */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[rgba(18,12,8,0.42)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(to_top,rgba(18,12,8,0.7),transparent)]"
      />

      <Container className="relative z-[2] pb-16 pt-40 text-center sm:pb-20">
        <motion.div
          variants={m.stagger(0.08, 0.2)}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-2xl flex-col items-center"
        >
          <DisplayHeading
            as="h1"
            size="xl"
            tone="cream"
            onMount
            className="!text-[clamp(1.7rem,3.2vw,2.4rem)] text-balance"
          >
            {"Nurse-led aesthetics and luxury nails."}
          </DisplayHeading>

          <motion.p variants={m.fadeUp} className="mt-3 font-sans text-[0.9375rem] tracking-[0.02em] text-ora-cream/85">
            49 Deansgate, Manchester
          </motion.p>

          <motion.div variants={m.fadeUp} className="mt-7 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <Button asChild size="lg" variant="primary" className="w-full sm:w-auto">
              <Link href="/book" data-testid="button-hero-book">
                Book
              </Link>
            </Button>
            <Button asChild size="lg" variant="glass" className="w-full sm:w-auto">
              <Link href="/services" data-testid="button-hero-services">
                Services
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
