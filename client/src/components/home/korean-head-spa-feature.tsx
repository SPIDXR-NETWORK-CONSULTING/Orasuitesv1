import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  KoreanWaveIcon,
  WaterDropIcon,
  LotusIcon,
  ScalpIcon,
  IVDripIcon,
  FeatherIcon,
  DiamondLeafIcon,
  StarClusterIcon,
  InfinityLoopIcon,
  CrescentIcon,
} from "@/components/icons/OraIcons";

// ─── 18 Steps with phase grouping ────────────────────────────────────────────

const phases = [
  {
    phase: 1,
    name: "Prepare",
    color: "rgba(100,140,160,0.18)",
    icon: ScalpIcon,
    steps: [
      { n: 1, name: "Scalp Analysis", desc: "Microscopic 200x diagnostic maps your scalp's pH, sebum, and follicle health." },
      { n: 2, name: "Pre-Cleanse Brush", desc: "Dry brushing stimulates initial circulation and lifts surface debris." },
      { n: 3, name: "Herbal Oil Infusion", desc: "Warm Korean botanical oil is worked deep into the root for nourishment." },
    ],
  },
  {
    phase: 2,
    name: "Cleanse",
    color: "rgba(130,100,70,0.2)",
    icon: WaterDropIcon,
    steps: [
      { n: 4, name: "Steam Treatment", desc: "Gentle steam opens follicles and prepares the scalp for deep cleansing." },
      { n: 5, name: "First Clarifying Shampoo", desc: "pH-balanced Korean formula dissolves buildup without stripping moisture." },
      { n: 6, name: "Enzyme Exfoliation", desc: "Removes dead skin and unclogs follicles with precision enzyme technology." },
    ],
  },
  {
    phase: 3,
    name: "Activate",
    color: "rgba(185,136,103,0.2)",
    icon: DiamondLeafIcon,
    steps: [
      { n: 7, name: "Second Purifying Shampoo", desc: "Deeper cleanse targeting the sebaceous glands for true scalp clarity." },
      { n: 8, name: "High-Frequency Stimulation", desc: "Gentle electrical current accelerates cell turnover and eliminates bacteria." },
      { n: 9, name: "Pressure-Point Massage", desc: "Traditional Korean pressure points dissolve tension and unlock lymph flow." },
    ],
  },
  {
    phase: 4,
    name: "Restore",
    color: "rgba(160,130,90,0.2)",
    icon: LotusIcon,
    steps: [
      { n: 10, name: "Gua Sha Scalp Lift", desc: "Jade gua sha along the nape and temples lifts the fascia visibly." },
      { n: 11, name: "Growth Factor Serum", desc: "Concentrated ampoule serum pressed into scalp via micro-pressure." },
      { n: 12, name: "Hyaluronic Acid Mask", desc: "Hydration sheet mask locks moisture into the scalp surface layer." },
    ],
  },
  {
    phase: 5,
    name: "Heal",
    color: "rgba(90,70,50,0.25)",
    icon: InfinityLoopIcon,
    steps: [
      { n: 13, name: "LED Light Therapy", desc: "Red & near-infrared light stimulate collagen, reduce inflammation." },
      { n: 14, name: "Cooling Serum Tonic", desc: "Menthol-based Korean tonic soothes the scalp and closes each follicle." },
      { n: 15, name: "Bond-Building Conditioner", desc: "Root-to-tip restoration with bond-building formula for total hair health." },
    ],
  },
  {
    phase: 6,
    name: "Complete",
    color: "rgba(185,136,103,0.3)",
    icon: StarClusterIcon,
    steps: [
      { n: 16, name: "Korean Blow Dry", desc: "Professional low-heat blow dry preserves moisture and maximises volume." },
      { n: 17, name: "Scalp Tonic Finish", desc: "Protective tonic sealed in to lock in treatment results and add shine." },
      { n: 18, name: "Post-Ritual Consultation", desc: "Personalised aftercare plan and your recommended next-step ritual." },
    ],
  },
];

const allSteps = phases.flatMap((p) => p.steps);

// ─── Step Row ─────────────────────────────────────────────────────────────────

interface StepRowProps {
  step: (typeof allSteps)[0];
  phaseColor: string;
  onActivate: (n: number) => void;
  isActive: boolean;
}

function StepRow({ step, phaseColor, onActivate, isActive }: StepRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-30% 0px -30% 0px" });

  useEffect(() => {
    if (isInView) onActivate(step.n);
  }, [isInView, step.n, onActivate]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-5 py-5 border-b cursor-default"
      style={{ borderColor: "rgba(185,136,103,0.1)" }}
    >
      {/* Step number */}
      <span
        className="flex-shrink-0 font-display text-3xl leading-none transition-colors duration-500"
        style={{
          fontWeight: 300,
          color: isActive ? "var(--ora-bronze)" : "rgba(185,136,103,0.2)",
        }}
      >
        {String(step.n).padStart(2, "0")}
      </span>

      {/* Content */}
      <div className="flex-1">
        <motion.h4
          className="font-display text-base text-white mb-0.5 transition-opacity duration-300"
          style={{ fontWeight: isActive ? 400 : 300, opacity: isActive ? 1 : 0.55, letterSpacing: "0.02em" }}
        >
          {step.name}
        </motion.h4>
        <AnimatePresence>
          {isActive && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="text-white/45 text-xs font-light leading-relaxed"
            >
              {step.desc}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Active indicator */}
      <motion.div
        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
        style={{ background: "var(--ora-bronze)" }}
        animate={{ scale: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

// ─── Left Sticky Visual ───────────────────────────────────────────────────────

interface StickyVisualProps {
  activeStep: number;
}

function StickyVisual({ activeStep }: StickyVisualProps) {
  const activePhaseIndex = phases.findIndex((p) =>
    p.steps.some((s) => s.n === activeStep)
  );
  const phase = phases[Math.max(0, activePhaseIndex)];
  const PhaseIcon = phase?.icon ?? KoreanWaveIcon;
  const progress = activeStep / 18;

  return (
    <div className="sticky top-24 lg:top-28">
      {/* Main visual card */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(185,136,103,0.15)",
          aspectRatio: "4/5",
        }}
      >
        {/* Phase color wash — transitions between phases */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase?.phase}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{ background: phase?.color ?? "transparent" }}
          />
        </AnimatePresence>

        {/* Ambient ripple rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{ borderColor: "rgba(185,136,103,0.15)" }}
              animate={{
                scale: [0.5 + i * 0.3, 1.2 + i * 0.3, 0.5 + i * 0.3],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 4,
                delay: i * 0.9,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              initial={{ width: 120 + i * 50, height: 120 + i * 50 }}
            />
          ))}
        </div>

        {/* Centre: Phase icon + step display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
          {/* Phase icon — transitions between phases */}
          <AnimatePresence mode="wait">
            <motion.div
              key={phase?.phase}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -10 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ color: "var(--ora-bronze)" }}
            >
              <PhaseIcon size={56} strokeWidth={1} />
            </motion.div>
          </AnimatePresence>

          {/* Active step number */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <span
                className="font-display block text-7xl leading-none"
                style={{ color: "rgba(185,136,103,0.15)", fontWeight: 300 }}
              >
                {String(activeStep).padStart(2, "0")}
              </span>
              <span
                className="text-[10px] tracking-[0.3em] uppercase font-light"
                style={{ color: "rgba(185,136,103,0.5)" }}
              >
                of 18
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Phase name badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={phase?.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card-warm px-4 py-1.5"
            >
              <span className="text-[10px] tracking-[0.25em] uppercase font-light" style={{ color: "var(--ora-bronze)" }}>
                Phase {phase?.phase} · {phase?.name}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress arc overlay */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ opacity: 0.3 }}
        >
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="rgba(185,136,103,0.6)"
            strokeWidth="0.4"
            strokeDasharray={`${progress * 264} 264`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>

        {/* Corner badges */}
        <div className="absolute top-5 left-5">
          <p className="font-display text-5xl text-white/5 leading-none select-none" style={{ fontWeight: 300 }}>
            18
          </p>
          <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(185,136,103,0.4)" }}>
            Steps
          </p>
        </div>

        <div className="absolute bottom-5 right-5">
          <div className="glass-card-warm px-3 py-1.5 text-center">
            <p className="font-display text-xl" style={{ fontWeight: 300, color: "var(--ora-bronze)" }}>90</p>
            <p className="text-[9px] tracking-widest uppercase text-white/30">min</p>
          </div>
        </div>
      </div>

      {/* Pricing card below visual */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="glass-card mt-4 p-5 flex items-center justify-between"
      >
        <div>
          <p className="text-white/35 text-[10px] tracking-widest uppercase">Starting from</p>
          <p className="font-display text-3xl mt-0.5" style={{ fontWeight: 300, color: "var(--ora-bronze)" }}>
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
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function KoreanHeadSpaFeature() {
  const [activeStep, setActiveStep] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const isIntroInView = useInView(introRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      id="korean-head-spa-feature"
      className="relative overflow-hidden py-20 md:py-28"
      style={{ background: "var(--ora-deep)" }}
    >
      {/* Ambient radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 15% 50%, rgba(185,136,103,0.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(185,136,103,0.05) 0%, transparent 45%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── Intro header ── */}
        <div ref={introRef} className="mb-14">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isIntroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs tracking-[0.3em] uppercase mb-4 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
            State of the Art · Ora Suites
          </motion.p>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isIntroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] max-w-xl"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              The Art of the Scalp.{" "}
              <span style={{ fontStyle: "italic", color: "var(--ora-bronze)" }}>
                Redefined.
              </span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isIntroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 lg:pb-2"
            >
              <Link href="/korean-head-spa">
                <button
                  className="glass-pill px-8 py-4 text-sm font-medium hover-bronze inline-flex items-center gap-2"
                  style={{ color: "white", letterSpacing: "0.06em" }}
                >
                  Reserve Your Ritual <ArrowRight size={14} />
                </button>
              </Link>
              <Link href="/contact">
                <button
                  className="text-white/35 text-sm px-4 py-4 hover:text-white/60 transition-colors font-light"
                  style={{ letterSpacing: "0.04em" }}
                >
                  Join Waitlist
                </button>
              </Link>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isIntroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-white/50 text-lg font-light mt-5 max-w-2xl"
            style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}
          >
            18 steps. 6 phases. A ritual unlike anything else in Manchester.
            Scroll to be guided through every step.
          </motion.p>
        </div>

        {/* ── Scroll storytelling: sticky left + scrolling right ── */}
        <div className="grid lg:grid-cols-[420px_1fr] gap-12 lg:gap-16 items-start">

          {/* Left: Sticky visual — desktop only */}
          <div className="hidden lg:block">
            <StickyVisual activeStep={activeStep} />
          </div>

          {/* Right: Scrolling steps */}
          <div>
            {/* Mobile phase pills */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 lg:hidden">
              {phases.map((p) => (
                <div
                  key={p.phase}
                  className="flex-shrink-0 glass-card-sm px-3 py-1.5 text-[10px] tracking-widest uppercase font-light"
                  style={{ color: "var(--ora-bronze)" }}
                >
                  {p.name}
                </div>
              ))}
            </div>

            {phases.map((phase) => (
              <div key={phase.phase} className="mb-8">
                {/* Phase header */}
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-4 mb-4"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(185,136,103,0.15)", border: "1px solid rgba(185,136,103,0.2)" }}
                  >
                    <span style={{ color: "var(--ora-bronze)" }}>
                      <phase.icon size={16} strokeWidth={1.5} />
                    </span>
                  </div>
                  <div>
                    <span
                      className="text-[10px] tracking-[0.3em] uppercase font-light mr-3"
                      style={{ color: "rgba(185,136,103,0.5)" }}
                    >
                      Phase {phase.phase}
                    </span>
                    <span
                      className="font-display text-base text-white"
                      style={{ fontWeight: 300, letterSpacing: "0.04em" }}
                    >
                      {phase.name}
                    </span>
                  </div>
                </motion.div>

                {/* Steps in this phase */}
                {phase.steps.map((step) => (
                  <StepRow
                    key={step.n}
                    step={step}
                    phaseColor={phase.color}
                    onActivate={setActiveStep}
                    isActive={activeStep === step.n}
                  />
                ))}
              </div>
            ))}

            {/* End of ritual CTA */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 glass-card-warm p-6 text-center"
            >
              <p
                className="font-display text-xl text-white mb-2"
                style={{ fontWeight: 300, fontStyle: "italic" }}
              >
                "Designed for the woman who invests in what lasts."
              </p>
              <p className="text-white/40 text-sm font-light mb-6">
                18 steps complete. Your scalp, transformed. Ready to begin?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/korean-head-spa">
                  <button
                    className="px-8 py-3.5 text-sm font-medium transition-all"
                    style={{
                      background: "var(--ora-bronze)",
                      color: "white",
                      borderRadius: "9999px",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Book My Ritual — From £160
                  </button>
                </Link>
                <Link href="/korean-head-spa">
                  <button
                    className="glass-pill px-8 py-3.5 text-sm hover-bronze inline-flex items-center gap-2"
                    style={{ color: "white", letterSpacing: "0.06em" }}
                  >
                    Full 18-Step Details <ArrowRight size={13} />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
