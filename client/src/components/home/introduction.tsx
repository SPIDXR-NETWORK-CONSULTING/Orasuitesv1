import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useScrollReveal, useCountUp } from "@/hooks/useScrollReveal";
import receptionImage from "@assets/reception-area_1770213665902.png";

function StatCounter({
  target,
  suffix,
  label,
  delay,
}: {
  target: number;
  suffix: string;
  label: string;
  delay: number;
}) {
  const countRef = useCountUp(target, 1600);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapRef, { once: true });

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      <div className="flex items-baseline justify-center gap-0.5">
        <span
          ref={countRef as React.RefObject<HTMLSpanElement>}
          className="font-display text-4xl md:text-5xl"
          style={{
            fontWeight: 300,
            color: "var(--ora-bronze)",
            letterSpacing: "0.02em",
          }}
        >
          {target}
        </span>
        <span
          className="font-display text-2xl"
          style={{ fontWeight: 300, color: "var(--ora-bronze)" }}
        >
          {suffix}
        </span>
      </div>
      <p className="text-ora-fog text-xs tracking-widest uppercase mt-1 font-light">
        {label}
      </p>
    </motion.div>
  );
}

export function IntroductionSection() {
  const sectionRef = useScrollReveal(0.1);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const isImageInView = useInView(imageRef, { once: true, margin: "-80px" });
  const isTextInView = useInView(textRef, { once: true, margin: "-80px" });
  const ruleRef = useRef<HTMLSpanElement>(null);
  const isRuleInView = useInView(ruleRef, { once: true });

  return (
    <section
      id="introduction"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative overflow-hidden bg-ora-milk"
    >
      {/* ── Full-bleed split layout ── */}
      <div className="grid lg:grid-cols-2 min-h-[80vh]">

        {/* Left: Full-bleed image */}
        <motion.div
          ref={imageRef}
          initial={{ opacity: 0, x: -40 }}
          animate={isImageInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden min-h-[50vh] lg:min-h-full img-zoom"
        >
          <img
            src={receptionImage}
            alt="Ora Suites elegant reception area"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Warm overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "var(--overlay-subtle)" }}
          />
        </motion.div>

        {/* Right: Text content */}
        <motion.div
          ref={textRef}
          initial={{ opacity: 0, x: 40 }}
          animate={isTextInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 py-16 lg:py-0"
        >
          {/* Eyebrow */}
          <p
            className="text-xs tracking-[0.25em] uppercase mb-6 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
            Our Sanctuary
          </p>

          {/* Opening quote — Playfair italic */}
          <h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground mb-6 leading-tight"
            style={{ fontStyle: "italic", fontWeight: 400 }}
          >
            This is not a salon.
          </h2>

          {/* Animated rule */}
          <motion.span
            ref={ruleRef}
            initial={{ width: "0%" }}
            animate={isRuleInView ? { width: "100%" } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="block h-px mb-8"
            style={{ background: "var(--ora-bronze)" }}
          />

          <div className="space-y-5 text-ora-fog leading-relaxed">
            <p className="text-base font-light">
              Ora is a holistic wellness destination designed exclusively for women.
              From advanced aesthetics and regenerative therapies to our state-of-the-art
              Korean Head Spa, every detail is crafted with intention.
            </p>
            <p className="text-base font-light">
              We believe beauty is not something you chase — it's something you cultivate.
              From the inside out. With care. With time. With ritual.
            </p>
            <p
              className="text-lg font-display"
              style={{ fontWeight: 300, fontStyle: "italic", color: "var(--ora-bronze)" }}
            >
              This is your space. To breathe. To transform. To become.
            </p>
          </div>

          <Link href="/about">
            <Button
              data-testid="button-discover-story"
              variant="outline"
              className="mt-10 border-ora-smoke text-ora-fog hover:bg-ora-bone px-8 self-start hover-bronze"
              style={{ letterSpacing: "0.04em" }}
            >
              Discover Our Story
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* ── Stat counters ── */}
      <div className="bg-ora-sand border-t border-ora-greige">
        <div className="max-w-4xl mx-auto px-8 py-10 grid grid-cols-3 gap-8">
          <StatCounter target={12} suffix="+" label="Treatments" delay={0.1} />
          <StatCounter target={1} suffix="" label="Sanctuary" delay={0.2} />
          <StatCounter target={100} suffix="%" label="Women-Only" delay={0.3} />
        </div>
      </div>
    </section>
  );
}
