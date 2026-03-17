import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { KoreanWaveIcon, WaterDropIcon, CrescentIcon, LotusIcon } from "@/components/icons/OraIcons";

const steps = [
  { icon: WaterDropIcon, label: "Scalp Diagnosis" },
  { icon: LotusIcon, label: "Deep Cleanse" },
  { icon: KoreanWaveIcon, label: "Exfoliation" },
  { icon: WaterDropIcon, label: "Oil Infusion" },
  { icon: LotusIcon, label: "Steam Therapy" },
];

const benefits = [
  { icon: KoreanWaveIcon, text: "18 steps, 90 minutes — a complete scalp reset" },
  { icon: WaterDropIcon, text: "Proven to increase scalp circulation by up to 40%" },
  { icon: CrescentIcon, text: "Exclusively for women who invest in what lasts" },
];

export function KoreanHeadSpaFeature() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isLeftInView = useInView(leftRef, { once: true, margin: "-80px" });
  const isRightInView = useInView(rightRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      id="korean-head-spa-feature"
      className="relative overflow-hidden py-20 md:py-28 lg:py-32"
      style={{ background: "var(--ora-deep)" }}
    >
      {/* ── Ambient background texture ── */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(185,136,103,1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(185,136,103,0.6) 0%, transparent 40%)",
        }}
      />

      {/* ── Animated step indicators (ambient) ── */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 opacity-20">
        {steps.map(({ icon: Icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.6 + i * 0.12, duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <Icon size={14} color="var(--ora-bronze)" strokeWidth={1.2} />
            <span
              className="text-[10px] tracking-widest uppercase font-light"
              style={{ color: "var(--ora-bronze)", writingMode: "vertical-rl" }}
            >
              {i + 1}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: Animated ambient visual ── */}
          <motion.div
            ref={leftRef}
            initial={{ opacity: 0, x: -60 }}
            animate={isLeftInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative order-2 lg:order-1"
          >
            {/* Main visual container */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(185,136,103,0.15)",
                aspectRatio: "4/5",
              }}
            >
              {/* Animated ripple circles */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border"
                    style={{ borderColor: "rgba(185,136,103,0.2)" }}
                    initial={{ width: 80, height: 80, opacity: 0.8 }}
                    animate={{
                      width: [80, 280 + i * 60],
                      height: [80, 280 + i * 60],
                      opacity: [0.6, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      delay: i * 0.8,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                ))}
                {/* Central icon */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <KoreanWaveIcon
                    size={64}
                    color="var(--ora-bronze)"
                    strokeWidth={1}
                  />
                </motion.div>
              </div>

              {/* Step count display */}
              <div className="absolute top-8 left-8">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={isLeftInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="font-display text-7xl text-white/8 select-none"
                  style={{ fontWeight: 300, lineHeight: 1 }}
                >
                  18
                </motion.p>
                <p
                  className="text-xs tracking-[0.2em] uppercase"
                  style={{ color: "rgba(185,136,103,0.5)" }}
                >
                  Steps
                </p>
              </div>

              {/* Duration badge */}
              <div className="absolute bottom-8 right-8">
                <div className="glass-card-warm px-4 py-2 text-center">
                  <p
                    className="font-display text-2xl"
                    style={{ fontWeight: 300, color: "var(--ora-bronze)" }}
                  >
                    90
                  </p>
                  <p className="text-[10px] tracking-widest uppercase text-white/40">
                    Minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing teaser */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isLeftInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1, duration: 0.8 }}
              className="glass-card mt-4 p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-white/40 text-xs tracking-widest uppercase">
                  Starting from
                </p>
                <p
                  className="font-display text-3xl mt-0.5"
                  style={{ fontWeight: 300, color: "var(--ora-bronze)" }}
                >
                  £160
                </p>
              </div>
              <Link href="/korean-head-spa">
                <button
                  className="glass-pill px-5 py-2.5 text-xs font-medium hover-bronze"
                  style={{ color: "white", letterSpacing: "0.06em" }}
                >
                  View Rituals →
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Right: Copy block ── */}
          <motion.div
            ref={rightRef}
            initial={{ opacity: 0, x: 60 }}
            animate={isRightInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 lg:order-2"
          >
            {/* Eyebrow */}
            <p
              className="text-xs tracking-[0.3em] uppercase mb-6 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              State of the Art
            </p>

            {/* Headline */}
            <h2
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mb-4 leading-[1.1]"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              The Art of the Scalp.{" "}
              <span style={{ fontStyle: "italic", color: "var(--ora-bronze)" }}>
                Redefined.
              </span>
            </h2>

            <p className="text-white/50 text-lg font-light mb-8 leading-relaxed">
              18 steps. 90 minutes. A ritual unlike anything
              <br className="hidden sm:block" /> else in the city.
            </p>

            {/* Animated divider */}
            <motion.div
              initial={{ width: "0%" }}
              animate={isRightInView ? { width: "60px" } : {}}
              transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-px mb-8"
              style={{ background: "var(--ora-bronze)" }}
            />

            {/* Benefit list */}
            <div className="space-y-5 mb-10">
              {benefits.map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 24 }}
                  animate={isRightInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    delay: 0.5 + i * 0.12,
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-start gap-4"
                >
                  <div
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: "var(--ora-bronze)" }}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <p className="text-white/65 text-sm font-light leading-relaxed">
                    {text}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Demographic targeting statement */}
            <p
              className="font-display text-xl text-white/40 mb-8"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              "Designed for the woman who invests in what lasts."
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/korean-head-spa">
                <button
                  className="glass-pill px-8 py-4 text-sm font-medium hover-bronze transition-all"
                  style={{ color: "white", letterSpacing: "0.06em" }}
                >
                  Reserve Your Ritual →
                </button>
              </Link>
              <Link href="/contact">
                <button
                  className="text-white/35 text-sm px-4 py-4 hover:text-white/70 transition-colors font-light"
                  style={{ letterSpacing: "0.04em" }}
                >
                  Join the Waitlist
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
