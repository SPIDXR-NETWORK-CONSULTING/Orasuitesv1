import { motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { DisplayHeading, GlassPill } from "@/components/ui/glass";
import { useMotionSafe, easeLuxury } from "@/lib/motion";
import { OraMarkIcon, AestheticsIcon } from "@/components/icons/OraIcons";
import heroPoster from "@assets/hero-image_1770213665902.png";

/**
 * Hero — full-bleed video, warm vignette + grain, left-aligned editorial type,
 * floating glass strip (desktop) and a scroll cue. Everything animates on mount.
 */
export function HeroSection() {
  const m = useMotionSafe();

  const scrollToContent = () => {
    const next = document.getElementById("introduction");
    if (next) next.scrollIntoView({ behavior: m.reduced ? "auto" : "smooth", block: "start" });
    else window.scrollTo({ top: window.innerHeight, behavior: m.reduced ? "auto" : "smooth" });
  };

  return (
    <section
      id="hero"
      data-testid="section-hero"
      className="on-dark relative flex min-h-[100svh] items-end overflow-hidden bg-ora-deep text-ora-cream"
    >
      {/* ── Media ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={heroPoster}
        aria-hidden="true"
        className={
          "absolute inset-0 h-full w-full object-cover " + (m.reduced ? "" : "animate-ken-burns")
        }
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* ── Overlays: warm radial vignette + gradient-up + grain ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_35%,var(--overlay-warm)_75%,var(--overlay-dark)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-deep)_0%,var(--overlay-dark)_28%,transparent_70%)]"
      />
      <div aria-hidden className="grain pointer-events-none inset-0" style={{ position: "absolute" }} />

      {/* ── Copy ── */}
      <Container className="relative z-[2] pb-28 pt-40 sm:pb-32 md:pb-40 lg:pb-44">
        <motion.div
          variants={m.stagger(0.1, 0.25)}
          initial="hidden"
          animate="show"
          className="max-w-4xl"
        >
          {/* Eyebrow: wordmark + Arabic */}
          <motion.p
            variants={m.fadeUp}
            className="mb-7 flex items-center gap-4 font-sans text-[0.71875rem] font-medium uppercase tracking-eyebrow text-ora-bronze"
          >
            <OraMarkIcon size={22} className="text-ora-bronze" />
            <span className="font-display normal-case tracking-[0.18em] text-[0.95rem] text-ora-cream">ORÁ</span>
            <span aria-hidden className="h-px w-8 bg-ora-bronze/70" />
            <span dir="rtl" lang="ar" className="font-display normal-case tracking-normal text-[1rem] text-ora-cream/80">
              أورا
            </span>
            <span aria-hidden className="hidden h-px w-8 bg-ora-bronze/70 sm:inline-block" />
            <span className="hidden sm:inline">Deansgate · Manchester</span>
          </motion.p>

          <DisplayHeading as="h1" size="xl" tone="cream" onMount delay={0.45}>
            {"Manchester's women-only\nsanctuary for beauty & wellness."}
          </DisplayHeading>

          <motion.p
            variants={m.fadeUp}
            className="mt-7 max-w-xl font-sans text-[1.0625rem] leading-relaxed text-ora-cream/80 sm:text-lg"
          >
            Nurse-led aesthetics and luxury nails, in a calm private space at 45 Deansgate.
          </motion.p>

          <motion.div variants={m.fadeUp} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <motion.span whileHover={m.hoverButton} whileTap={m.tapButton} className="inline-flex">
              <Button asChild size="lg" variant="primary" className="w-full sm:w-auto">
                <Link href="/book" data-testid="button-hero-book">
                  Book a Consultation
                </Link>
              </Button>
            </motion.span>
            <motion.span whileHover={m.hoverButton} whileTap={m.tapButton} className="inline-flex">
              <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
                <Link href="/services" data-testid="button-hero-services">
                  Explore Services
                </Link>
              </Button>
            </motion.span>
          </motion.div>
        </motion.div>
      </Container>

      {/* ── Floating glass strip (desktop) ── */}
      <motion.div
        initial={m.reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.3, ease: easeLuxury }}
        className="pointer-events-none absolute inset-x-0 bottom-8 z-[2] hidden md:block"
      >
        <Container className="flex items-end justify-between gap-6">
          <ul className="pointer-events-auto flex flex-wrap items-center gap-3" aria-label="At a glance">
            <GlassPill as="li" icon={<MapPin />}>
              45 Deansgate, Manchester
            </GlassPill>
            <GlassPill as="li" icon={<OraMarkIcon />}>
              Women-only
            </GlassPill>
            <GlassPill as="li" icon={<AestheticsIcon />}>
              Aesthetics · Nails · more coming
            </GlassPill>
          </ul>

          <button
            type="button"
            onClick={scrollToContent}
            aria-label="Scroll to discover"
            data-testid="button-scroll-down"
            className="focus-ring pointer-events-auto group flex items-center gap-3 rounded-full py-2 pl-2 pr-1 text-ora-cream/70 transition-colors duration-450 hover:text-ora-cream"
          >
            <span className="font-sans text-[0.71875rem] font-medium uppercase tracking-eyebrow">Discover</span>
            <span className="glass-pill inline-flex h-10 w-10 items-center justify-center">
              <ChevronDown size={18} className={m.reduced ? "" : "animate-scroll-hint"} />
            </span>
          </button>
        </Container>
      </motion.div>

      {/* ── Scroll cue (mobile) ── */}
      <motion.button
        type="button"
        onClick={scrollToContent}
        aria-label="Scroll to discover"
        initial={m.reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="focus-ring absolute bottom-6 left-1/2 z-[2] -translate-x-1/2 rounded-full text-ora-cream/70 md:hidden"
      >
        <span className="glass-pill inline-flex h-10 w-10 items-center justify-center">
          <ChevronDown size={18} className={m.reduced ? "" : "animate-scroll-hint"} />
        </span>
      </motion.button>
    </section>
  );
}
