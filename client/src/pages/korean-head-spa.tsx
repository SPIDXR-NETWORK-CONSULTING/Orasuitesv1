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
} from "@/components/icons/OraIcons";
import { useSEO } from "@/hooks/use-seo";
import heroImage from "@assets/hero-image_1770213665902.png";
import aestheticsImage from "@assets/service-aesthetics_1770213665902.png";
import beforeAfterImage from "@assets/before-after-results_1770213665903.png";
import productImage from "@assets/product-display_1770215241478.png";

// ─── 18-step protocol data ──────────────────────────────────────────────────
const steps = [
  { n: "01", name: "Scalp Consultation & Analysis", desc: "A detailed diagnostic to map your scalp's needs, pH balance, and sebum levels." },
  { n: "02", name: "Pre-Cleanse Brush Technique", desc: "Dry brushing to loosen debris and stimulate initial circulation." },
  { n: "03", name: "Herbal Oil Infusion", desc: "Warm Korean botanical oil is worked into the scalp to nourish at the root." },
  { n: "04", name: "Scalp Steam Treatment", desc: "Gentle steam opens follicles and prepares the scalp for deep cleansing." },
  { n: "05", name: "First Clarifying Shampoo", desc: "A pH-balanced Korean formula dissolves buildup without stripping moisture." },
  { n: "06", name: "Scalp Exfoliation", desc: "Enzyme-based exfoliant removes dead skin and unclogs follicles." },
  { n: "07", name: "Second Purifying Shampoo", desc: "A deeper cleanse targeting the sebaceous glands for true clarity." },
  { n: "08", name: "High-Frequency Stimulation", desc: "A gentle electrical current accelerates cell turnover and kills bacteria." },
  { n: "09", name: "Scalp Massage — Pressure Points", desc: "Traditional Korean pressure-point massage for tension release and lymph flow." },
  { n: "10", name: "Gua Sha Scalp Lift", desc: "Jade gua sha along the nape, temples, and brow lifts the fascia and reduces puffiness." },
  { n: "11", name: "Ampoule Serum Injection", desc: "A concentrated growth factor serum is pressed into the scalp via micro-pressure." },
  { n: "12", name: "Hyaluronic Acid Scalp Mask", desc: "A hydration sheet mask is applied to lock moisture into the scalp's surface layer." },
  { n: "13", name: "LED Light Therapy", desc: "Red and near-infrared light stimulate collagen, reduce inflammation and boost growth." },
  { n: "14", name: "Cooling Serum Application", desc: "A menthol-based Korean tonic soothes the scalp and closes the follicle." },
  { n: "15", name: "Hair & Scalp Conditioning", desc: "A bond-building conditioner is applied from root to tip for complete restoration." },
  { n: "16", name: "Blow Dry Technique", desc: "A professional Korean low-heat blow dry to preserve moisture and add volume." },
  { n: "17", name: "Scalp Tonic Finish", desc: "A final protective tonic is spritzed to seal in treatment and add shine." },
  { n: "18", name: "Post-Ritual Consultation", desc: "Personalised aftercare advice and next-step ritual recommendations." },
];

// ─── Benefits data ───────────────────────────────────────────────────────────
const benefits = [
  { icon: <DiamondLeafIcon />, title: "Hair Growth Activation", desc: "Stimulated follicles produce thicker, faster-growing hair from session one." },
  { icon: <WaterDropIcon />, title: "Scalp Health & Balance", desc: "Rebalanced sebum, cleared follicles, and restored scalp microbiome." },
  { icon: <FeatherIcon />, title: "Stress & Tension Relief", desc: "Korean pressure-point massage dissolves built-up muscular and mental tension." },
  { icon: <LotusIcon />, title: "Facial Lift Effect", desc: "Gua sha and fascia work visibly lifts the brows, temples, and jaw." },
  { icon: <InfinityLoopIcon />, title: "Sebum Regulation", desc: "Oily roots and dry ends corrected through enzyme exfoliation and serum therapy." },
  { icon: <StarClusterIcon />, title: "Circulation Boost", desc: "Increased blood flow delivers nutrients to dormant follicles and boosts scalp vitality." },
];

// ─── Pricing data ────────────────────────────────────────────────────────────
const pricing = [
  { name: "Scalp Diagnostic Assessment", duration: "20 min", price: "£45" },
  { name: "Signature Korean Head Spa (15-step)", duration: "90 min", price: "from £160" },
  { name: "Luxury Ritual (18-step full protocol)", duration: "120 min", price: "from £220" },
  { name: "Korean Head Spa + Scalp Treatment Combo", duration: "120 min", price: "from £240" },
  { name: "Monthly Scalp Membership", duration: "Monthly", price: "£599/mo" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function RippleAnimation() {
  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[420px]">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            borderColor: `rgba(185,136,103,${0.35 - i * 0.07})`,
            width: `${i * 22}%`,
            height: `${i * 22}%`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.25, 0.6] }}
          transition={{
            duration: 3.5,
            delay: i * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Centre icon */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <div style={{ color: "var(--ora-bronze)" }}>
          <KoreanWaveIcon />
        </div>
        <span
          className="font-display text-7xl sm:text-8xl leading-none"
          style={{ color: "rgba(185,136,103,0.12)", fontWeight: 300, letterSpacing: "-0.02em" }}
        >
          18
        </span>
        <div
          className="glass-card px-5 py-2 text-xs tracking-widest uppercase font-light"
          style={{ color: "var(--ora-bronze)" }}
        >
          90 min ritual
        </div>
      </motion.div>
    </div>
  );
}

interface StepCardProps {
  step: (typeof steps)[0];
  index: number;
}

function StepCard({ step, index }: StepCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-5 flex gap-4 items-start"
    >
      <span
        className="font-display text-3xl leading-none flex-shrink-0 mt-0.5"
        style={{ color: "rgba(185,136,103,0.35)", fontWeight: 300 }}
      >
        {step.n}
      </span>
      <div>
        <h4
          className="font-display text-base text-white mb-1"
          style={{ fontWeight: 400, letterSpacing: "0.02em" }}
        >
          {step.name}
        </h4>
        <p className="text-white/45 text-xs font-light leading-relaxed">{step.desc}</p>
      </div>
    </motion.div>
  );
}

interface BenefitCardProps {
  benefit: (typeof benefits)[0];
  index: number;
}

function BenefitCard({ benefit, index }: BenefitCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-6 group hover:border-[rgba(185,136,103,0.25)] transition-colors duration-500"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--ora-bronze-muted)" }}
      >
        <span style={{ color: "var(--ora-bronze)" }}>{benefit.icon}</span>
      </div>
      <h4
        className="font-display text-base text-white mb-2"
        style={{ fontWeight: 400, letterSpacing: "0.02em" }}
      >
        {benefit.title}
      </h4>
      <p className="text-white/45 text-sm font-light leading-relaxed">{benefit.desc}</p>
    </motion.div>
  );
}

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
  const stepsRef = useRef<HTMLDivElement>(null);
  const isStepsInView = useInView(stepsRef, { once: true, margin: "-60px" });
  const whoRef = useRef<HTMLDivElement>(null);
  const isWhoInView = useInView(whoRef, { once: true, margin: "-80px" });
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
        style={{ background: "var(--ora-void, #0f0908)" }}
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
              "linear-gradient(to bottom, rgba(10,7,4,0.65) 0%, rgba(15,9,8,0.88) 60%, rgba(15,9,8,0.97) 100%)",
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

          {/* Headline — character split */}
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
                className="inline-block font-display text-6xl sm:text-7xl md:text-8xl text-white"
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
                  border: "1px solid var(--ora-bronze)",
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
              See the 18 Steps <ArrowRight size={14} />
            </button>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-16 flex items-center gap-3"
          >
            <div
              className="w-px h-10 origin-top"
              style={{ background: "rgba(185,136,103,0.4)" }}
            />
            <span className="text-[10px] tracking-[0.3em] uppercase font-light" style={{ color: "rgba(185,136,103,0.5)" }}>
              Scroll to discover
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── WHAT IS IT? ──────────────────────────────────────────────────── */}
      <section
        className="py-24 md:py-36"
        style={{ background: "hsl(var(--ora-bone))" }}
      >
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
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: "var(--overlay-subtle)" }}
            />
            {/* Badge */}
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
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              The Method
            </p>
            <h2
              className="font-display text-4xl sm:text-5xl text-foreground mb-6 leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              Not a wash.{" "}
              <span style={{ fontStyle: "italic" }}>A restoration.</span>
            </h2>

            {/* Animated rule */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isIntroInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="origin-left h-px mb-8"
              style={{ background: "var(--ora-bronze-muted)", transformOrigin: "left" }}
            />

            <p className="text-ora-fog text-base font-light leading-relaxed mb-6">
              The Korean Head Spa is not a treatment — it's a philosophy. Rooted in the belief
              that true beauty begins at the scalp, the 18-step protocol combines ancient Korean
              scalp wisdom with modern clinical-grade ingredients.
            </p>
            <p className="text-ora-fog text-base font-light leading-relaxed mb-8">
              Unlike a standard scalp massage or wash, each step builds on the last: diagnostic
              analysis, layered cleansing, serum infusion, pressure-point massage, LED therapy,
              and a personalised aftercare protocol. The result is not just beautiful hair —
              it's a recalibrated scalp, reduced inflammation, and a genuinely calm nervous system.
            </p>

            {/* Differentiators */}
            <div className="space-y-3">
              {[
                "Clinical-grade Korean botanicals & growth serums",
                "High-frequency and LED light therapy integrated",
                "Gua sha fascia lifting — visible results in one session",
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

      {/* ── 18-STEP PROTOCOL ────────────────────────────────────────────── */}
      <section
        id="protocol"
        className="py-24 md:py-36 overflow-hidden"
        style={{ background: "var(--ora-deep, #1a1008)" }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          {/* Header */}
          <div ref={stepsRef} className="mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isStepsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              The Protocol
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isStepsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl sm:text-5xl text-white leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              18 steps.{" "}
              <span style={{ fontStyle: "italic" }}>Zero compromises.</span>
            </motion.h2>
          </div>

          {/* Steps grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <StepCard key={step.n} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section
        className="py-24 md:py-36"
        style={{ background: "hsl(var(--ora-milk))" }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          {/* Header */}
          <div className="mb-14 max-w-2xl">
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              What You'll Experience
            </p>
            <h2
              className="font-display text-4xl sm:text-5xl text-foreground leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              Every session.{" "}
              <span style={{ fontStyle: "italic" }}>Every benefit.</span>
            </h2>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit, i) => (
              <BenefitCard key={benefit.title} benefit={benefit} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR? ───────────────────────────────────────────────── */}
      <section
        className="relative py-24 md:py-36 overflow-hidden"
        style={{ background: "hsl(var(--ora-bone))" }}
      >
        <div className="absolute inset-0 dot-grid-bg opacity-40" aria-hidden="true" />

        <div
          ref={whoRef}
          className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 grid lg:grid-cols-2 gap-16 items-center"
        >
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isWhoInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              Who It's For
            </p>
            <h2
              className="font-display text-4xl sm:text-5xl text-foreground mb-6 leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              For the woman who{" "}
              <span style={{ fontStyle: "italic" }}>
                doesn't compromise.
              </span>
            </h2>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={isWhoInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="origin-left h-px mb-8"
              style={{ background: "var(--ora-bronze-muted)" }}
            />

            <p
              className="text-foreground/70 text-xl font-light leading-relaxed mb-6"
              style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}
            >
              "Designed for the woman who invests in what lasts — her health, her hair,
              her time."
            </p>

            <p className="text-ora-fog text-base font-light leading-relaxed mb-8">
              Whether you're in Manchester or travelling from London, the Ora Korean Head Spa
              is built for discerning women who understand that great hair starts at the scalp.
              It's for the executive who carries stress in her neck. The new mother experiencing
              post-partum hair loss. The woman who simply refuses to settle for a basic blowout.
            </p>

            <div className="space-y-3">
              {[
                "Experiencing hair thinning or shedding",
                "Struggling with scalp sensitivity or excess oiliness",
                "Seeking a genuinely transformative wellness ritual",
                "Wanting visible results from their first session",
              ].map((point, i) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isWhoInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3"
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--ora-bronze-muted)" }}
                  >
                    <CrescentIcon />
                  </span>
                  <span className="text-ora-fog text-sm font-light">{point}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — visual panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isWhoInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="glass-card-warm p-10 text-center">
              <RippleAnimation />
              <div className="mt-6">
                <p className="text-xs tracking-widest uppercase font-light mb-2" style={{ color: "var(--ora-bronze)" }}>
                  Manchester · London
                </p>
                <p className="font-display text-2xl text-foreground" style={{ fontWeight: 300, fontStyle: "italic" }}>
                  Exclusively at ORÁ.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section
        className="py-24 md:py-36"
        style={{ background: "var(--ora-deep, #1a1008)" }}
      >
        <div
          ref={pricingRef}
          className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isPricingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 text-center"
          >
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
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

          {/* Pricing table */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isPricingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card-warm overflow-hidden"
          >
            {pricing.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-6 py-5 transition-colors duration-300 hover:bg-[rgba(185,136,103,0.06)]"
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
                <p
                  className="font-display text-lg flex-shrink-0 ml-8"
                  style={{ color: "var(--ora-bronze)", fontWeight: 400 }}
                >
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
      <section
        className="py-24 md:py-28 overflow-hidden"
        style={{ background: "hsl(var(--ora-milk))" }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 mb-12">
          <p
            className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
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

        {/* Horizontal scroll strip */}
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none hidden sm:block"
            style={{ background: "linear-gradient(to right, hsl(var(--ora-milk)), transparent)" }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none hidden sm:block"
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
              { label: "Scalp Health", desc: "Before & after 3 sessions" },
              { label: "Hair Growth", desc: "4-week protocol results" },
              { label: "Density & Shine", desc: "Monthly membership client" },
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
                      src={beforeAfterImage}
                      alt={`${card.label} before and after`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(to top, rgba(18,12,8,0.85) 0%, transparent 60%)",
                    }}
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
        style={{ background: "var(--ora-void, #0f0908)" }}
      >
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={aestheticsImage}
            alt="Ora Suites treatment room"
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

        {/* Content */}
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

          {/* Word reveal */}
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
                  border: "1px solid var(--ora-bronze)",
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
            <p
              className="font-display text-sm tracking-[0.15em] uppercase"
              style={{ color: "rgba(185,136,103,0.5)" }}
            >
              ORÁ. · Manchester
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
