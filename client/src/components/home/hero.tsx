import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { ChevronDown } from "lucide-react";
import heroImage from "@assets/hero-image_1770213665902.png";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax: image drifts up as user scrolls
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  // Progress indicator: taupe line fades out early
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  // Character-split animation for "ORÁ."
  const chars = "ORÁ.".split("");

  return (
    <section
      ref={sectionRef}
      data-testid="section-hero"
      className="relative min-h-screen flex items-end overflow-hidden"
    >
      {/* ── Parallax background ── */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: imageY, scale: 1.15 }}
      >
        <img
          src={heroImage}
          alt="Ora Suites luxury treatment room"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </motion.div>

      {/* ── Dual-layer gradient overlay (HVN-inspired) ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(18,12,8,0.88) 0%, rgba(18,12,8,0.52) 40%, rgba(18,12,8,0.22) 100%), radial-gradient(ellipse at 30% 90%, rgba(70,45,28,0.5) 0%, transparent 70%)",
        }}
      />

      {/* ── Scroll progress indicator (right edge) ── */}
      <motion.div
        style={{ opacity: scrollIndicatorOpacity }}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 hidden lg:flex"
      >
        <div className="w-px h-24 bg-white/20" />
        <span
          className="text-white/40 text-[10px] tracking-[0.2em] uppercase"
          style={{ writingMode: "vertical-rl" }}
        >
          Scroll
        </span>
      </motion.div>

      {/* ── Glass CTA panel — asymmetric, bottom-left ── */}
      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-2xl">
          {/* ── Title: character-split entrance ── */}
          <div className="overflow-hidden mb-3" aria-label="ORÁ.">
            <div className="flex items-end">
              {chars.map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{
                    duration: 0.9,
                    delay: 0.2 + i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="inline-block font-display text-6xl sm:text-7xl md:text-8xl text-white"
                  style={{
                    fontWeight: 300,
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>
          </div>

          {/* ── Arabic subtitle ── */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-2xl sm:text-3xl text-white/60 mb-6"
            dir="rtl"
            style={{ fontWeight: 300, letterSpacing: "0.06em" }}
          >
            أورا
          </motion.p>

          {/* ── Glass panel containing tagline + CTAs ── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card-warm p-6 sm:p-8 max-w-xl"
          >
            <p
              className="text-white/90 text-base sm:text-lg mb-2 font-light"
              style={{ letterSpacing: "0.02em" }}
            >
              Manchester's Premier Women-Only Wellness Sanctuary
            </p>
            <p className="text-white/55 text-sm mb-7 font-light">
              Where beauty meets intention. Where care becomes ritual.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/contact">
                <button
                  data-testid="button-hero-book"
                  className="glass-pill px-6 py-3 text-white text-sm font-medium hover-bronze transition-all w-full sm:w-auto"
                  style={{ letterSpacing: "0.04em" }}
                >
                  Book Your Treatment
                </button>
              </Link>
              <Link href="/korean-head-spa">
                <button
                  className="glass-pill px-6 py-3 text-sm font-medium transition-all w-full sm:w-auto"
                  style={{
                    color: "var(--ora-bronze)",
                    borderColor: "var(--ora-bronze-muted)",
                    letterSpacing: "0.04em",
                  }}
                >
                  Reserve a Ritual →
                </button>
              </Link>
              <Link href="/services">
                <button
                  data-testid="button-hero-services"
                  className="text-white/60 text-sm px-4 py-3 hover:text-white transition-colors font-light w-full sm:w-auto text-left sm:text-center"
                  style={{ letterSpacing: "0.04em" }}
                >
                  Explore Services
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Scroll hint ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        style={{ opacity: scrollIndicatorOpacity }}
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors cursor-pointer z-20"
        aria-label="Scroll to discover"
        data-testid="button-scroll-down"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] tracking-[0.25em] uppercase text-white/40">
            Discover
          </span>
          <ChevronDown size={18} className="animate-scroll-hint" />
        </div>
      </motion.button>
    </section>
  );
}
