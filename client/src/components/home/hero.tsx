import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { useMotionSafe, easeLuxury } from "@/lib/motion";
import { cn } from "@/lib/utils";
import heroPoster from "@assets/hero-image_1770213665902.png";

/** WebGL atmosphere — lazy, so it never blocks the video/text first paint. */
const HeroAtmosphere = React.lazy(() => import("@/components/three/hero-atmosphere"));

/* Bespoke word-mask reveal: each word rises out of its own clip. The hero is the
   flagship surface, so it gets word-level stagger rather than the house line reveal. */
const wordVar: Variants = {
  hidden: { y: "115%" },
  show: { y: "0%", transition: { duration: 0.9, ease: easeLuxury } },
};

function WordReveal({ text, className }: { text: string; className?: string }) {
  const m = useMotionSafe();
  if (m.reduced) return <span className={className}>{text}</span>;
  return (
    <motion.span
      className={cn("inline", className)}
      variants={m.stagger(0.07, 0.15)}
      initial="hidden"
      animate="show"
      aria-label={text}
    >
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
          <motion.span aria-hidden className="inline-block will-change-transform" variants={wordVar}>
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/**
 * Hero (v3) — the approved salon video is the star; a bespoke WebGL warm-light
 * atmosphere drifts over it. Everything centred: one line of Playfair
 * (word-revealed), an animated bronze hairline, address, two buttons and a slim
 * scroll cue. Nothing else in the hero (brief v2) — the room does the talking.
 */
export function HeroSection() {
  const m = useMotionSafe();
  const reduced = useReducedMotion() ?? false;
  const [atmosphere, setAtmosphere] = React.useState(false);

  // Mount the GPU layer only after the hero has painted — and never for reduced
  // motion, phones (<768px: ~220KB gz for an effect barely visible there) or Data Saver.
  React.useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData || window.matchMedia("(max-width: 767px)").matches) return;
    // Safari has no requestIdleCallback — fall back to a short timeout.
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setAtmosphere(true));
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(() => setAtmosphere(true), 400);
    return () => clearTimeout(t);
  }, [reduced]);

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

      {/* bespoke WebGL warm-light + grain, composited over the footage */}
      {atmosphere && (
        <React.Suspense fallback={null}>
          <HeroAtmosphere />
        </React.Suspense>
      )}

      {/* soft dark overlay for AA contrast */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[rgba(18,12,8,0.42)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(to_top,rgba(18,12,8,0.72),transparent)]"
      />

      <Container className="relative z-[2] pb-24 pt-40 text-center sm:pb-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <h1 className="font-display font-normal text-ora-cream text-[clamp(1.7rem,3.2vw,2.4rem)] leading-[1.15] tracking-[-0.01em] text-balance">
            <WordReveal text="A wellness sanctuary in the heart of Manchester." />
          </h1>

          {/* animated bronze hairline */}
          <motion.span
            aria-hidden
            variants={m.lineGrow}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.6 }}
            className="mt-7 block h-px w-16 origin-center bg-[linear-gradient(90deg,transparent,var(--ora-bronze),transparent)]"
          />

          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: easeLuxury, delay: 0.7 }}
            className="mt-6 font-sans text-[0.9375rem] tracking-[0.02em] text-ora-cream/85"
          >
            49 Deansgate, Manchester
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeLuxury, delay: 0.85 }}
            className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4"
          >
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
        </div>
      </Container>

      {/* slim scroll cue */}
      {!reduced && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="pointer-events-none absolute bottom-6 left-1/2 z-[2] -translate-x-1/2"
        >
          <span className="relative block h-10 w-px overflow-hidden bg-ora-cream/20">
            <motion.span
              className="absolute inset-x-0 top-0 h-4 bg-ora-bronze"
              animate={{ y: ["-100%", "260%"] }}
              transition={{ duration: 2.2, ease: easeLuxury, repeat: Infinity, repeatDelay: 0.3 }}
            />
          </span>
        </motion.div>
      )}
    </section>
  );
}
