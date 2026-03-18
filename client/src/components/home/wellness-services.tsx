import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  IVDripIcon,
  VitaminDIcon,
  OxygenIcon,
  NutrientDripIcon,
  WellnessIcon,
  SpaStoneIcon,
  CollagenIcon,
  LotusIcon,
} from "@/components/icons/OraIcons";

const wellnessServices = [
  {
    icon: NutrientDripIcon,
    title: "Banana Bag IV Drip",
    label: "IV Therapy",
    desc: "The ultimate nutrient reset. A blend of B-vitamins, magnesium, and saline delivered directly into your bloodstream for instant energy and recovery.",
    tag: "Coming Soon",
    href: "/contact",
  },
  {
    icon: IVDripIcon,
    title: "Vitamin C Infusion",
    label: "IV Therapy",
    desc: "High-dose vitamin C delivered intravenously for immune support, collagen production, and radiant skin from the inside out.",
    tag: "Coming Soon",
    href: "/contact",
  },
  {
    icon: VitaminDIcon,
    title: "Vitamin D Shot",
    label: "Injectables",
    desc: "A single intramuscular injection to restore optimal vitamin D levels — essential for mood, immunity, bone health, and hair growth.",
    tag: "Available Now",
    href: "/contact",
  },
  {
    icon: OxygenIcon,
    title: "Oxygen Therapy",
    label: "Wellness",
    desc: "Pure, medical-grade oxygen inhaled in a calm therapeutic setting. Elevates energy, mental clarity, and cellular regeneration.",
    tag: "Coming Soon",
    href: "/contact",
  },
  {
    icon: CollagenIcon,
    title: "Collagen Peptide Drip",
    label: "IV Therapy",
    desc: "Marine collagen infused directly into circulation for accelerated skin renewal, joint support, and anti-aging effects from within.",
    tag: "Coming Soon",
    href: "/contact",
  },
  {
    icon: WellnessIcon,
    title: "Relaxation Massage",
    label: "Massage",
    desc: "Swedish, deep tissue, hot stone and aromatherapy massage — tailored to your body's needs and delivered in our private treatment suites.",
    tag: "Available Now",
    href: "/services#wellness",
  },
  {
    icon: SpaStoneIcon,
    title: "Hot Stone Ritual",
    label: "Massage",
    desc: "Volcanic basalt stones heated to therapeutic temperatures are placed along key meridians to melt deep muscular tension and restore flow.",
    tag: "Available Now",
    href: "/services#wellness",
  },
  {
    icon: LotusIcon,
    title: "NAD+ Infusion",
    label: "IV Therapy",
    desc: "The cellular longevity drip. NAD+ supports mitochondrial function, mental clarity, metabolism, and deep tissue repair at a molecular level.",
    tag: "Coming Soon",
    href: "/contact",
  },
];

interface ServiceCardProps {
  service: (typeof wellnessServices)[0];
  index: number;
}

function WellnessCard({ service, index }: ServiceCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const { icon: Icon } = service;
  const isAvailable = service.tag === "Available Now";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <Link href={service.href}>
        <div
          className="glass-card p-5 h-full cursor-pointer transition-all duration-500 hover:border-[rgba(185,136,103,0.3)]"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {/* Top row: icon + tag */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(185,136,103,0.12)", border: "1px solid rgba(185,136,103,0.18)" }}
            >
              <span style={{ color: "var(--ora-bronze)" }}>
                <Icon size={18} strokeWidth={1.5} />
              </span>
            </div>
            <span
              className="text-[9px] tracking-[0.2em] uppercase font-light px-2.5 py-1 rounded-full"
              style={{
                color: isAvailable ? "var(--ora-bronze)" : "rgba(255,255,255,0.3)",
                background: isAvailable ? "rgba(185,136,103,0.12)" : "rgba(255,255,255,0.05)",
                border: isAvailable ? "1px solid rgba(185,136,103,0.2)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {service.tag}
            </span>
          </div>

          {/* Label */}
          <p
            className="text-[9px] tracking-[0.25em] uppercase font-light mb-1.5"
            style={{ color: "rgba(185,136,103,0.5)" }}
          >
            {service.label}
          </p>

          {/* Title */}
          <h3
            className="font-display text-base text-white mb-3 leading-snug group-hover:text-[rgba(255,255,255,0.9)] transition-colors"
            style={{ fontWeight: 300, letterSpacing: "0.02em" }}
          >
            {service.title}
          </h3>

          {/* Description */}
          <p className="text-white/40 text-xs font-light leading-relaxed mb-4">
            {service.desc}
          </p>

          {/* CTA */}
          <span
            className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-light transition-all duration-300 group-hover:gap-2.5"
            style={{ color: "var(--ora-bronze)" }}
          >
            {isAvailable ? "Book Now" : "Register Interest"}
            <ArrowRight size={9} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function WellnessServicesSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section
      id="wellness-services"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: "var(--ora-deep)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 80% 20%, rgba(185,136,103,0.07) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(185,136,103,0.05) 0%, transparent 50%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <div ref={headerRef} className="mb-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
                style={{ color: "var(--ora-bronze)" }}
              >
                Wellness & Beyond
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-4xl sm:text-5xl text-white leading-tight max-w-xl"
                style={{ fontWeight: 300, letterSpacing: "0.02em" }}
              >
                Invest in what{" "}
                <span style={{ fontStyle: "italic", color: "var(--ora-bronze)" }}>
                  lasts.
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.25 }}
                className="text-white/45 text-base font-light mt-4 max-w-2xl leading-relaxed"
              >
                Beauty from the outside in — and the inside out. Our wellness clinic
                is expanding to offer IV drip therapy, vitamin injections, oxygen
                treatments and specialist massage. Register your interest for early access.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isHeaderInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex-shrink-0"
            >
              <Link href="/contact">
                <button
                  className="glass-pill px-7 py-3.5 text-sm font-medium hover-bronze inline-flex items-center gap-2"
                  style={{ color: "white", letterSpacing: "0.06em" }}
                >
                  Register Interest <ArrowRight size={13} />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wellnessServices.map((service, i) => (
            <WellnessCard key={service.title} service={service} index={i} />
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center text-white/20 text-xs font-light mt-10"
          style={{ letterSpacing: "0.06em" }}
        >
          All IV treatments administered by qualified practitioners. Consultations required.
        </motion.p>
      </div>
    </section>
  );
}
