import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import {
  KoreanWaveIcon,
  LotusIcon,
  WaterDropIcon,
  CrescentIcon,
  InfinityLoopIcon,
  StarClusterIcon,
  FeatherIcon,
  DiamondLeafIcon,
  ScalpIcon,
} from "@/components/icons/OraIcons";
import { useSEO } from "@/hooks/use-seo";
import heroImage from "@assets/hero-image_1770213665902.png";
import aestheticsImage from "@assets/service-aesthetics_1770213665902.png";
import productImage from "@assets/product-display_1770215241478.png";
import scalpImg from "@assets/result-scalp-health_ora.png";
import hairGrowthImg from "@assets/result-hair-growth_ora.png";
import densityImg from "@assets/result-hair-density_ora.png";

// ─── Phase data ──────────────────────────────────────────────────────────────
const phases = [
  {
    n: "01",
    phase: "Prepare",
    label: "Diagnostic & Priming",
    steps: [
      { n: "01", name: "Scalp Consultation & Analysis" },
      { n: "02", name: "Pre-Cleanse Brush Technique" },
      { n: "03", name: "Herbal Oil Infusion" },
    ],
    icon: ScalpIcon,
    color: "rgba(185,136,103,0.9)",
    desc: "Every ritual begins with understanding your scalp. We map pH balance, sebum levels, and hair density before a single product is applied.",
  },
  {
    n: "02",
    phase: "Cleanse",
    label: "Deep Purification",
    steps: [
      { n: "04", name: "Scalp Steam Treatment" },
      { n: "05", name: "First Clarifying Shampoo" },
      { n: "06", name: "Scalp Exfoliation" },
    ],
    icon: WaterDropIcon,
    color: "rgba(140,160,185,0.9)",
    desc: "Steam opens the follicle. Korean enzyme exfoliation clears years of buildup that standard shampoos can't reach. The scalp breathes — sometimes for the first time.",
  },
  {
    n: "03",
    phase: "Activate",
    label: "Stimulation & Clarity",
    steps: [
      { n: "07", name: "Second Purifying Shampoo" },
      { n: "08", name: "High-Frequency Stimulation" },
      { n: "09", name: "Scalp Massage — Pressure Points" },
    ],
    icon: StarClusterIcon,
    color: "rgba(185,160,103,0.9)",
    desc: "A gentle electrical current accelerates cell turnover. Then Korean pressure-point massage — not relaxation, but restoration — stimulates lymphatic flow and releases fascia tension.",
  },
  {
    n: "04",
    phase: "Restore",
    label: "Lifting & Infusion",
    steps: [
      { n: "10", name: "Gua Sha Scalp Lift" },
      { n: "11", name: "Ampoule Serum Injection" },
      { n: "12", name: "Hyaluronic Acid Scalp Mask" },
    ],
    icon: LotusIcon,
    color: "rgba(160,130,185,0.9)",
    desc: "Jade gua sha lifts the brow, temples, and jaw. Then concentrated growth serums are pressed deep into the scalp. A hydration mask locks moisture where it's needed most.",
  },
  {
    n: "05",
    phase: "Heal",
    label: "Light & Recovery",
    steps: [
      { n: "13", name: "LED Light Therapy" },
      { n: "14", name: "Cooling Serum Application" },
      { n: "15", name: "Hair & Scalp Conditioning" },
    ],
    icon: FeatherIcon,
    color: "rgba(185,200,140,0.9)",
    desc: "Red and near-infrared light stimulate collagen and reduce inflammation. A cooling tonic closes the follicle. Bond-building conditioner restores from root to tip.",
  },
  {
    n: "06",
    phase: "Complete",
    label: "Finish & Aftercare",
    steps: [
      { n: "16", name: "Blow Dry Technique" },
      { n: "17", name: "Scalp Tonic Finish" },
      { n: "18", name: "Post-Ritual Consultation" },
    ],
    icon: KoreanWaveIcon,
    color: "rgba(185,136,103,0.9)",
    desc: "A Korean low-heat blow dry preserves moisture. A protective tonic seals every step in. Finally, personalised aftercare advice ensures your results last — and grow.",
  },
];

// ─── Pricing data ────────────────────────────────────────────────────────────
const pricing = [
  { name: "Scalp Diagnostic Assessment", duration: "20 min", price: "£45" },
  { name: "Signature Korean Head Spa", duration: "90 min", price: "from £160" },
  { name: "Luxury Ritual (18-step full protocol)", duration: "120 min", price: "from £220" },
  { name: "KHS + Scalp Treatment Combo", duration: "120 min", price: "from £240" },
  { name: "Monthly Scalp Membership", duration: "Monthly", price: "£599/mo" },
];

// ─── Phase Card — horizontal scroll item ─────────────────────────────────────
function PhaseCard({ phase, index }: { phase: (typeof phases)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const { icon: Icon } = phase;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 w-[85vw] sm:w-[420px] lg:w-[380px]"
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="glass-card h-full p-7 flex flex-col gap-5 hover:border-[rgba(185,136,103,0.3)] transition-colors duration-500">
        {/* Phase number + icon */}
        <div className="flex items-start justify-between">
          <div>
            <span
              className="font-display text-6xl leading-none"
              style={{ color: "rgba(185,136,103,0.18)", fontWeight: 300 }}
            >
              {phase.n}
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(185,136,103,0.12)", border: "1px solid rgba(185,136,103,0.2)" }}
          >
            <span style={{ color: "var(--ora-bronze)" }}>
              <Icon size={20} strokeWidth={1.5} />
            </span>
          </div>
        </div>

        {/* Phase name */}
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase font-light mb-1" style={{ color: "rgba(185,136,103,0.6)" }}>
            Phase {phase.n}
          </p>
          <h3 className="font-display text-2xl text-white mb-1" style={{ fontWeight: 300, letterSpacing: "0.02em" }}>
            {phase.phase}
          </h3>
          <p className="text-white/35 text-xs font-light tracking-wide">{phase.label}</p>
        </div>

        {/* Description */}
        <p className="text-white/55 text-sm font-light leading-relaxed flex-1">{phase.desc}</p>

        {/* Steps */}
        <div className="space-y-2 pt-2" style={{ borderTop: "1px solid rgba(185,136,103,0.12)" }}>
          {phase.steps.map((step) => (
            <div key={step.n} className="flex items-center gap-3">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium"
                style={{ background: "rgba(185,136,103,0.12)", color: "var(--ora-bronze)" }}
              >
                {step.n}
              </span>
              <span className="text-white/60 text-xs font-light">{step.name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Benefit bar — editorial horizontal layout ────────────────────────────────
const benefits = [
  { icon: DiamondLeafIcon, label: "Hair Growth", value: "Stimulated from session one" },
  { icon: WaterDropIcon, label: "Scalp Health", value: "Rebalanced microbiome" },
  { icon: FeatherIcon, label: "Stress Relief", value: "Pressure-point deep release" },
  { icon: LotusIcon, label: "Facial Lift", value: "Visible in 90 minutes" },
  { icon: InfinityLoopIcon, label: "Sebum Control", value: "Enzymes restore balance" },
  { icon: StarClusterIcon, label: "Circulation", value: "Dormant follicles revived" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function KoreanHeadSpaPage() {
  useSEO({
    title: "Korean Head Spa Manchester | 18-Step Luxury Scalp Ritual | ORÁ.",
    description:
      "Experience Manchester's most elevated Korean head spa. An 18-step scalp ritual designed for deep restoration, hair growth, and total renewal. Book at Ora Suites.",
  });

  // Hero parallax
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);

  // Section refs
  const introRef = useRef<HTMLDivElement>(null);
  const isIntroInView = useInView(introRef, { once: true, margin: "-80px" });
  const benefitsRef = useRef<HTMLDivElement>(null);
  const isBenefitsInView = useInView(benefitsRef, { once: true, margin: "-60px" });
  const pricingRef = useRef<HTMLDivElement>(null);
  const isPricingInView = useInView(pricingRef, { once: true, margin: "-80px" });
  const ctaRef = useRef<HTMLDivElement>(null);
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  return (
    <Layout>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-end pb-20 overflow-hidden"
        style={{ background: "#0f0908" }}
      >
        {/* Parallax image */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <img
            src={heroImage}
            alt="Korean Head Spa at Ora Suites"
            className="w-full h-full object-cover scale-110"
          />
        </motion.div>

        {/* Deep dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,7,4,0.55) 0%, rgba(15,9,8,0.85) 55%, rgba(15,9,8,0.97) 100%)",
          }}
        />

        {/* Bronze radial at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 90%, rgba(70,40,20,0.5) 0%, transparent 60%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
          {/* Label */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs tracking-[0.3em] uppercase font-light mb-6"
            style={{ color: "var(--ora-bronze)" }}
          >
            Ora Suites · Manchester
          </motion.p>

          {/* Headline */}
          <div className="overflow-hidden mb-4">
            {"The Ritual.".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{
                  duration: 1,
                  delay: 0.3 + i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block font-display text-5xl sm:text-7xl md:text-8xl text-white"
                style={{ fontWeight: 300, letterSpacing: char === " " ? "0.3em" : "0.01em" }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </div>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/55 text-xl md:text-2xl font-light mb-10"
            style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", letterSpacing: "0.04em" }}
          >
            18 steps. 90 minutes. Your scalp, transformed.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <Link href="/contact">
              <button
                className="px-8 py-4 text-sm font-medium transition-all"
                style={{
                  background: "var(--ora-bronze)",
                  color: "white",
                  borderRadius: "9999px",
                  letterSpacing: "0.06em",
                }}
              >
                Reserve Your Ritual
              </button>
            </Link>
            <button
              onClick={() =>
                document.getElementById("protocol")?.scrollIntoView({ behavior: "smooth" })
              }
              className="glass-pill px-8 py-4 text-sm font-medium hover-bronze transition-all inline-flex items-center gap-2"
              style={{ color: "white", letterSpacing: "0.06em" }}
            >
              The 18 Steps <ArrowRight size={14} />
            </button>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-16 flex items-center gap-3"
          >
            <div className="w-px h-10 origin-top" style={{ background: "rgba(185,136,103,0.4)" }} />
            <span className="text-[10px] tracking-[0.3em] uppercase font-light" style={{ color: "rgba(185,136,103,0.5)" }}>
              Scroll to discover
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── WHAT IS IT? ──────────────────────────────────────────────────── */}
      <section className="py-24 md:py-36" style={{ background: "hsl(var(--ora-bone))" }}>
        <div
          ref={introRef}
          className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center"
        >
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isIntroInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative img-zoom rounded-xl overflow-hidden"
          >
            <img
              src={productImage}
              alt="Korean head spa products and ritual setup"
              className="w-full h-auto rounded-xl"
              loading="lazy"
            />
            <div className="absolute inset-0 rounded-xl" style={{ background: "var(--overlay-subtle)" }} />
            <div className="absolute bottom-6 left-6">
              <div className="glass-card-warm px-5 py-3">
                <p className="text-xs tracking-widest uppercase font-light" style={{ color: "var(--ora-bronze)" }}>
                  Korean Method
                </p>
                <p className="font-display text-white text-lg mt-1" style={{ fontWeight: 300 }}>
                  18-Step Protocol
                </p>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isIntroInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs tracking-[0.25em] uppercase mb-4 font-light" style={{ color: "var(--ora-bronze)" }}>
              The Method
            </p>
            <h2
              className="font-display text-4xl sm:text-5xl text-foreground mb-6 leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              Not a wash.{" "}
              <span style={{ fontStyle: "italic" }}>A restoration.</span>
            </h2>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={isIntroInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="origin-left h-px mb-8"
              style={{ background: "var(--ora-bronze-muted)", transformOrigin: "left" }}
            />

            <p className="text-ora-fog text-base font-light leading-relaxed mb-8">
              The Korean Head Spa is not a treatment — it's a philosophy. Rooted in the belief
              that true beauty begins at the scalp, the 18-step protocol combines ancient Korean
              scalp wisdom with modern clinical-grade ingredients for results you feel from the first session.
            </p>

            <div className="space-y-3">
              {[
                "Clinical-grade Korean botanicals & growth serums",
                "High-frequency and LED light therapy integrated",
                "Gua sha fascia lifting — visible in one session",
              ].map((point, i) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isIntroInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3"
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--ora-bronze-muted)" }}
                  >
                    <Check size={10} style={{ color: "var(--ora-bronze)" }} />
                  </span>
                  <span className="text-ora-fog text-sm font-light">{point}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 18 STEPS — PHASE HORIZONTAL SCROLL ──────────────────────────── */}
      <section
        id="protocol"
        className="py-24 md:py-36 overflow-hidden"
        style={{ background: "var(--ora-deep, #1a1008)" }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 mb-12">
          <p className="text-xs tracking-[0.25em] uppercase mb-4 font-light" style={{ color: "var(--ora-bronze)" }}>
            The Protocol
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2
              className="font-display text-4xl sm:text-5xl text-white leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              6 phases.{" "}
              <span style={{ fontStyle: "italic" }}>18 steps.</span>
            </h2>
            <p className="text-white/35 text-sm font-light sm:text-right max-w-xs sm:max-w-[220px]">
              Swipe to explore each phase of the ritual.
            </p>
          </div>
        </div>

        {/* Fade edges */}
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-4 w-8 sm:w-16 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, var(--ora-deep, #1a1008), transparent)" }}
          />
          <div
            className="absolute right-0 top-0 bottom-4 w-8 sm:w-16 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, var(--ora-deep, #1a1008), transparent)" }}
          />

          <div
            className="flex gap-4 px-6 sm:px-10 lg:px-16 overflow-x-auto pb-6"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {phases.map((phase, i) => (
              <PhaseCard key={phase.n} phase={phase} index={i} />
            ))}
          </div>
        </div>

        {/* Step counter strip */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 mt-10">
          <div
            className="flex items-center justify-between py-6"
            style={{ borderTop: "1px solid rgba(185,136,103,0.12)" }}
          >
            {[
              { val: "18", label: "Steps" },
              { val: "90–120", label: "Minutes" },
              { val: "£160+", label: "From" },
              { val: "6", label: "Phases" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <p className="font-display text-2xl sm:text-3xl text-white" style={{ fontWeight: 300, color: "var(--ora-bronze)" }}>
                  {stat.val}
                </p>
                <p className="text-[9px] tracking-widest uppercase font-light mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS — EDITORIAL HORIZONTAL BAR ──────────────────────────── */}
      <section
        className="relative py-24 md:py-36 overflow-hidden"
        style={{ background: "hsl(var(--ora-milk))" }}
      >
        <div ref={benefitsRef} className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isBenefitsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16"
          >
            <p className="text-xs tracking-[0.25em] uppercase mb-4 font-light" style={{ color: "var(--ora-bronze)" }}>
              What You'll Experience
            </p>
            <h2
              className="font-display text-4xl sm:text-5xl text-foreground leading-tight max-w-xl"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              Every session.{" "}
              <span style={{ fontStyle: "italic" }}>Every benefit.</span>
            </h2>
          </motion.div>

          {/* Benefits — 2-col grid, large editorial style */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "rgba(185,136,103,0.1)" }}>
            {benefits.map(({ icon: Icon, label, value }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0 }}
                animate={isBenefitsInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="group relative p-5 sm:p-8 flex flex-col gap-3 hover:bg-[rgba(185,136,103,0.04)] transition-colors duration-500"
                style={{ background: "hsl(var(--ora-milk))" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--ora-bronze-muted)" }}
                >
                  <span style={{ color: "var(--ora-bronze)" }}>
                    <Icon size={18} strokeWidth={1.5} />
                  </span>
                </div>
                <h3
                  className="font-display text-xl text-foreground"
                  style={{ fontWeight: 300, letterSpacing: "0.02em" }}
                >
                  {label}
                </h3>
                <p className="text-ora-fog text-sm font-light leading-relaxed">{value}</p>
                {/* Bronze accent line on hover */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "var(--ora-bronze-muted)" }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR? — minimal editorial ────────────────────────────── */}
      <section
        className="relative py-24 md:py-36 overflow-hidden"
        style={{ background: "hsl(var(--ora-bone))" }}
      >
        {/* Full-bleed ambient image */}
        <div className="absolute inset-0">
          <img
            src={aestheticsImage}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-[0.08]"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs tracking-[0.25em] uppercase mb-6 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
            Who It's For
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl sm:text-5xl md:text-6xl text-foreground leading-tight mb-8"
            style={{ fontWeight: 300, letterSpacing: "0.02em" }}
          >
            For the woman who{" "}
            <br />
            <span style={{ fontStyle: "italic" }}>doesn't compromise.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-foreground/60 text-base sm:text-xl font-light leading-relaxed mb-12 max-w-2xl mx-auto"
            style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}
          >
            "Designed for the woman who invests in what lasts — her health, her hair, her time."
          </motion.p>

          {/* 4 tags — horizontal pill row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              "Hair thinning & shedding",
              "Scalp sensitivity",
              "Stress & tension",
              "Genuine transformation",
            ].map((tag) => (
              <span
                key={tag}
                className="glass-card-warm px-5 py-2.5 text-xs font-light tracking-wide"
                style={{ color: "var(--ora-bronze)" }}
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-36" style={{ background: "var(--ora-deep, #1a1008)" }}>
        <div ref={pricingRef} className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isPricingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 text-center"
          >
            <p className="text-xs tracking-[0.25em] uppercase mb-4 font-light" style={{ color: "var(--ora-bronze)" }}>
              Ritual Pricing
            </p>
            <h2
              className="font-display text-4xl sm:text-5xl text-white leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              Choose your{" "}
              <span style={{ fontStyle: "italic" }}>ritual.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isPricingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card-warm overflow-hidden"
          >
            {pricing.map((item, i) => (
              <div
                key={item.name}
                className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-5 gap-4 transition-colors duration-300 hover:bg-[rgba(185,136,103,0.06)]"
                style={{
                  borderBottom: i < pricing.length - 1 ? "1px solid rgba(185,136,103,0.15)" : "none",
                }}
              >
                <div>
                  <p className="text-white text-sm font-light" style={{ letterSpacing: "0.02em" }}>
                    {item.name}
                  </p>
                  <p className="text-white/35 text-xs font-light mt-0.5">{item.duration}</p>
                </div>
                <p className="font-display text-base sm:text-lg flex-shrink-0" style={{ color: "var(--ora-bronze)", fontWeight: 400 }}>
                  {item.price}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isPricingInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center text-white/30 text-xs font-light mt-6"
          >
            All rituals include full scalp consultation. Patch test not required.
          </motion.p>
        </div>
      </section>

      {/* ── BEFORE & AFTER ───────────────────────────────────────────────── */}
      <section className="py-24 md:py-28 overflow-hidden" style={{ background: "hsl(var(--ora-milk))" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 mb-12">
          <p className="text-xs tracking-[0.25em] uppercase mb-4 font-light" style={{ color: "var(--ora-bronze)" }}>
            Client Results
          </p>
          <h2
            className="font-display text-4xl sm:text-5xl text-foreground leading-tight"
            style={{ fontWeight: 300, letterSpacing: "0.02em" }}
          >
            Real results.{" "}
            <span style={{ fontStyle: "italic" }}>Real confidence.</span>
          </h2>
        </div>

        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-4 w-16 z-10 pointer-events-none hidden sm:block"
            style={{ background: "linear-gradient(to right, hsl(var(--ora-milk)), transparent)" }}
          />
          <div
            className="absolute right-0 top-0 bottom-4 w-16 z-10 pointer-events-none hidden sm:block"
            style={{ background: "linear-gradient(to left, hsl(var(--ora-milk)), transparent)" }}
          />
          <div
            className="flex gap-5 px-6 sm:px-10 lg:px-16 overflow-x-auto pb-4"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {[
              { label: "Scalp Health", desc: "Before & after 3 sessions", image: scalpImg },
              { label: "Hair Growth", desc: "4-week protocol results", image: hairGrowthImg },
              { label: "Density & Shine", desc: "Monthly membership client", image: densityImg },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="flex-shrink-0 w-72 sm:w-80 group"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="relative overflow-hidden rounded-xl img-zoom">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={card.image}
                      alt={`${card.label} before and after`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(18,12,8,0.85) 0%, transparent 60%)" }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="glass-card-sm px-3 py-1 text-[10px] tracking-widest uppercase font-light text-white/80">
                      Korean Head Spa
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="glass-card p-4">
                      <h4 className="font-display text-base text-white mb-1" style={{ fontWeight: 300 }}>
                        {card.label}
                      </h4>
                      <p className="text-white/50 text-xs font-light">{card.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOOKING CTA ──────────────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className="relative py-24 md:py-36 overflow-hidden"
        style={{ background: "#0f0908" }}
      >
        <div className="absolute inset-0">
          <img
            src={aestheticsImage}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-25"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,7,4,0.85) 0%, rgba(15,9,8,0.92) 100%), radial-gradient(ellipse at 50% 80%, rgba(70,45,28,0.45) 0%, transparent 60%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs tracking-[0.25em] uppercase mb-6 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
            Begin Your Ritual
          </motion.p>

          <div className="mb-6 overflow-hidden">
            <div className="flex flex-wrap justify-center gap-x-4">
              {"Reserve Your Ritual.".split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ y: "110%", opacity: 0 }}
                  animate={isCtaInView ? { y: "0%", opacity: 1 } : {}}
                  transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block font-display text-4xl sm:text-5xl md:text-6xl text-white"
                  style={{ fontWeight: 300, letterSpacing: "0.02em" }}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/55 text-lg md:text-xl mb-10 font-light leading-relaxed"
          >
            Limited slots available each week.
            <br className="hidden sm:block" />
            Book now and begin your transformation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/contact">
              <button
                className="px-9 py-4 text-sm font-medium transition-all"
                style={{
                  background: "var(--ora-bronze)",
                  color: "white",
                  borderRadius: "9999px",
                  letterSpacing: "0.06em",
                }}
              >
                Book My Ritual
              </button>
            </Link>
            <Link href="/services">
              <button
                className="glass-pill px-9 py-4 text-sm font-medium hover-bronze transition-all"
                style={{ color: "white", letterSpacing: "0.06em" }}
              >
                View All Services →
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isCtaInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.9 }}
            className="mt-14"
          >
            <p className="font-display text-sm tracking-[0.15em] uppercase" style={{ color: "rgba(185,136,103,0.5)" }}>
              ORÁ. · Manchester
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
