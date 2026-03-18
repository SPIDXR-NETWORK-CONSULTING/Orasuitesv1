import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  KoreanWaveIcon,
  WaterDropIcon,
  LotusIcon,
  ScalpIcon,
  FeatherIcon,
  DiamondLeafIcon,
  StarClusterIcon,
  InfinityLoopIcon,
} from "@/components/icons/OraIcons";

const phases = [
  {
    phase: 1,
    name: "Prepare",
    icon: ScalpIcon,
    color: "rgba(100,140,160,0.15)",
    steps: [
      { n: 1, name: "Scalp Analysis", desc: "Microscopic 200× diagnostic maps your scalp's pH, sebum, and follicle health." },
      { n: 2, name: "Pre-Cleanse Brush", desc: "Dry brushing stimulates initial circulation and lifts surface debris." },
      { n: 3, name: "Herbal Oil Infusion", desc: "Warm Korean botanical oil worked deep into the root for nourishment." },
    ],
  },
  {
    phase: 2,
    name: "Cleanse",
    icon: WaterDropIcon,
    color: "rgba(130,100,70,0.18)",
    steps: [
      { n: 4, name: "Steam Treatment", desc: "Gentle steam opens follicles and prepares the scalp for deep cleansing." },
      { n: 5, name: "Clarifying Shampoo", desc: "pH-balanced Korean formula dissolves buildup without stripping moisture." },
      { n: 6, name: "Enzyme Exfoliation", desc: "Removes dead skin and unclogs follicles with precision enzyme technology." },
    ],
  },
  {
    phase: 3,
    name: "Activate",
    icon: DiamondLeafIcon,
    color: "rgba(185,136,103,0.18)",
    steps: [
      { n: 7, name: "Second Purifying Shampoo", desc: "Deeper cleanse targeting the sebaceous glands for true scalp clarity." },
      { n: 8, name: "High-Frequency Stimulation", desc: "Gentle electrical current accelerates cell turnover and kills bacteria." },
      { n: 9, name: "Pressure-Point Massage", desc: "Traditional Korean pressure points dissolve tension and unlock lymph flow." },
    ],
  },
  {
    phase: 4,
    name: "Restore",
    icon: LotusIcon,
    color: "rgba(160,130,90,0.18)",
    steps: [
      { n: 10, name: "Gua Sha Scalp Lift", desc: "Jade gua sha along the nape and temples lifts the fascia visibly." },
      { n: 11, name: "Growth Factor Serum", desc: "Concentrated ampoule serum pressed into scalp via micro-pressure." },
      { n: 12, name: "Hyaluronic Acid Mask", desc: "Hydration sheet mask locks moisture into the scalp surface layer." },
    ],
  },
  {
    phase: 5,
    name: "Heal",
    icon: InfinityLoopIcon,
    color: "rgba(90,70,50,0.22)",
    steps: [
      { n: 13, name: "LED Light Therapy", desc: "Red & near-infrared light stimulate collagen, reduce inflammation." },
      { n: 14, name: "Cooling Serum Tonic", desc: "Menthol-based Korean tonic soothes the scalp and closes each follicle." },
      { n: 15, name: "Bond-Building Conditioner", desc: "Root-to-tip restoration with bond-building formula." },
    ],
  },
  {
    phase: 6,
    name: "Complete",
    icon: StarClusterIcon,
    color: "rgba(185,136,103,0.28)",
    steps: [
      { n: 16, name: "Korean Blow Dry", desc: "Professional low-heat blow dry preserves moisture and maximises volume." },
      { n: 17, name: "Scalp Tonic Finish", desc: "Protective tonic sealed in to lock results and add shine." },
      { n: 18, name: "Post-Ritual Consultation", desc: "Personalised aftercare plan and your recommended next-step ritual." },
    ],
  },
];

export function KoreanHeadSpaFeature() {
  const [activePhase, setActivePhase] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const phase = phases[activePhase];
  const PhaseIcon = phase.icon;
  const progress = ((activePhase + 1) / 6) * 100;

  return (
    <section
      ref={ref}
      id="korean-head-spa-feature"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: "var(--ora-deep)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 15% 50%, rgba(185,136,103,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(185,136,103,0.05) 0%, transparent 45%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs tracking-[0.3em] uppercase mb-4 font-light" style={{ color: "var(--ora-bronze)" }}>
              State of the Art · Ora Suites
            </p>
            <h2
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] max-w-xl"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              The Art of the Scalp.{" "}
              <span style={{ fontStyle: "italic", color: "var(--ora-bronze)" }}>Redefined.</span>
            </h2>
            <p
              className="text-white/45 text-base font-light mt-4 max-w-lg"
              style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}
            >
              18 steps. 6 phases. A ritual unlike anything else in Manchester.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap gap-3 lg:pb-2"
          >
            <Link href="/korean-head-spa">
              <button
                className="px-7 py-3.5 text-sm font-medium transition-all"
                style={{
                  background: "var(--ora-bronze)",
                  color: "white",
                  borderRadius: "9999px",
                  letterSpacing: "0.06em",
                }}
              >
                Reserve Ritual
              </button>
            </Link>
            <Link href="/korean-head-spa">
              <button
                className="glass-pill px-7 py-3.5 text-sm font-medium hover-bronze inline-flex items-center gap-2"
                style={{ color: "white", letterSpacing: "0.06em" }}
              >
                Full Details <ArrowRight size={13} />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Main panel: phase tabs left, content right */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="grid lg:grid-cols-[200px_1fr] gap-4 lg:gap-6"
        >
          {/* Phase tab column */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {phases.map((p, i) => {
              const Icon = p.icon;
              const isActive = i === activePhase;
              return (
                <button
                  key={p.phase}
                  onClick={() => setActivePhase(i)}
                  className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all duration-300 w-full"
                  style={{
                    background: isActive ? "rgba(185,136,103,0.12)" : "transparent",
                    border: isActive ? "1px solid rgba(185,136,103,0.25)" : "1px solid transparent",
                  }}
                >
                  <span style={{ color: isActive ? "var(--ora-bronze)" : "rgba(185,136,103,0.35)" }}>
                    <Icon size={14} strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="text-[9px] tracking-[0.2em] uppercase font-light" style={{ color: isActive ? "rgba(185,136,103,0.6)" : "rgba(255,255,255,0.2)" }}>
                      Phase {p.phase}
                    </p>
                    <p className="text-xs font-light" style={{ color: isActive ? "white" : "rgba(255,255,255,0.4)" }}>
                      {p.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active phase content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePhase}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-2xl overflow-hidden"
              style={{ borderColor: "rgba(185,136,103,0.15)" }}
            >
              <div className="grid sm:grid-cols-[1fr_220px] lg:grid-cols-[1fr_260px]">
                {/* Steps */}
                <div className="p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(185,136,103,0.12)", border: "1px solid rgba(185,136,103,0.2)" }}
                    >
                      <span style={{ color: "var(--ora-bronze)" }}>
                        <PhaseIcon size={16} strokeWidth={1.5} />
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] tracking-[0.25em] uppercase font-light" style={{ color: "rgba(185,136,103,0.55)" }}>
                        Phase {phase.phase} of 6
                      </p>
                      <p className="font-display text-lg text-white" style={{ fontWeight: 300, letterSpacing: "0.03em" }}>
                        {phase.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-0">
                    {phase.steps.map((step, i) => (
                      <motion.div
                        key={step.n}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-start gap-4 py-4"
                        style={{ borderBottom: i < phase.steps.length - 1 ? "1px solid rgba(185,136,103,0.08)" : "none" }}
                      >
                        <span
                          className="flex-shrink-0 font-display text-2xl leading-none mt-0.5"
                          style={{ color: "rgba(185,136,103,0.25)", fontWeight: 300 }}
                        >
                          {String(step.n).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="text-white text-sm font-light mb-1" style={{ letterSpacing: "0.02em" }}>
                            {step.name}
                          </p>
                          <p className="text-white/40 text-xs font-light leading-relaxed">{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Progress + nav row */}
                  <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: "1px solid rgba(185,136,103,0.1)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-px relative" style={{ background: "rgba(185,136,103,0.15)" }}>
                        <motion.div
                          className="absolute inset-y-0 left-0 h-full"
                          style={{ background: "var(--ora-bronze)", transformOrigin: "left" }}
                          animate={{ scaleX: progress / 100 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <span className="text-[10px] font-light" style={{ color: "rgba(185,136,103,0.5)" }}>
                        Steps {phase.steps[0].n}–{phase.steps[2].n} of 18
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActivePhase(Math.max(0, activePhase - 1))}
                        disabled={activePhase === 0}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
                        style={{ border: "1px solid rgba(185,136,103,0.25)", color: "var(--ora-bronze)" }}
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setActivePhase(Math.min(5, activePhase + 1))}
                        disabled={activePhase === 5}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
                        style={{ border: "1px solid rgba(185,136,103,0.25)", color: "var(--ora-bronze)" }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right visual panel */}
                <div
                  className="hidden sm:flex flex-col items-center justify-center p-6 relative overflow-hidden"
                  style={{ background: phase.color }}
                >
                  {/* Ambient rings */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border"
                      style={{
                        borderColor: "rgba(185,136,103,0.12)",
                        width: `${60 + i * 40}%`,
                        height: `${60 + i * 40}%`,
                      }}
                      animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 3.5, delay: i * 0.7, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ))}

                  <div className="relative z-10 text-center">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ color: "var(--ora-bronze)" }}
                      className="mb-3 flex justify-center"
                    >
                      <PhaseIcon size={40} strokeWidth={1.2} />
                    </motion.div>
                    <p
                      className="font-display text-6xl leading-none mb-1"
                      style={{ color: "rgba(185,136,103,0.12)", fontWeight: 300 }}
                    >
                      {String(phase.steps[0].n).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] tracking-[0.25em] uppercase font-light" style={{ color: "rgba(185,136,103,0.5)" }}>
                      {phase.name}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-4">
                    {[
                      { val: "18", label: "Steps" },
                      { val: "90+", label: "Min" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="font-display text-lg" style={{ color: "var(--ora-bronze)", fontWeight: 300 }}>{s.val}</p>
                        <p className="text-[9px] tracking-widest uppercase font-light" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Bottom stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center justify-between mt-6 pt-5"
          style={{ borderTop: "1px solid rgba(185,136,103,0.1)" }}
        >
          <div className="flex gap-6">
            {[
              { val: "18", label: "Steps" },
              { val: "6", label: "Phases" },
              { val: "90–120", label: "Min" },
              { val: "£160+", label: "From" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-lg sm:text-xl" style={{ color: "var(--ora-bronze)", fontWeight: 300 }}>{s.val}</p>
                <p className="text-[9px] tracking-widest uppercase font-light" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <Link href="/korean-head-spa">
            <button
              className="text-sm font-light hover-bronze transition-all inline-flex items-center gap-2"
              style={{ color: "rgba(185,136,103,0.6)", letterSpacing: "0.04em" }}
            >
              Full ritual details <ArrowRight size={12} />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
