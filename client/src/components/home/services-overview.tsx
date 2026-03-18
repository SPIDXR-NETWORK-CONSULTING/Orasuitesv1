import { motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  AestheticsIcon,
  NailPolishIcon,
  HairIcon,
  LaserIcon,
  KoreanWaveIcon,
  WellnessIcon,
} from "@/components/icons/OraIcons";
import aestheticsImage from "@assets/service-aesthetics_1770213665902.png";
import nailsImage from "@assets/service-nails_1770213665903.png";
import hairImage from "@assets/service-hair_1770213665902.png";
import receptionImage from "@assets/reception-area_1770213665902.png";
import heroImage from "@assets/hero-image_1770213665902.png";

const services = [
  {
    id: "korean-head-spa",
    title: "Korean Head Spa",
    descriptor: "18-step scalp ritual",
    image: heroImage,
    href: "/korean-head-spa",
    Icon: KoreanWaveIcon,
    featured: true,
  },
  {
    id: "aesthetics",
    title: "Aesthetics",
    descriptor: "Advanced skin treatments",
    image: aestheticsImage,
    href: "/services#aesthetics",
    Icon: AestheticsIcon,
    featured: false,
  },
  {
    id: "nails",
    title: "Nails & Pedicure",
    descriptor: "Luxurious nail care",
    image: nailsImage,
    href: "/services#nails",
    Icon: NailPolishIcon,
    featured: false,
  },
  {
    id: "hair",
    title: "Hair Services",
    descriptor: "Expert colour & styling",
    image: hairImage,
    href: "/services#hair",
    Icon: HairIcon,
    featured: false,
  },
  {
    id: "laser",
    title: "Laser & Wellness",
    descriptor: "Laser removal & massage",
    image: receptionImage,
    href: "/services#laser",
    Icon: LaserIcon,
    featured: false,
  },
];

// ─── Tilt card for right-side attraction ─────────────────────────────────────

interface TiltCardProps {
  service: (typeof services)[0];
  index: number;
}

function TiltCard({ service, index }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const { Icon } = service;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [6, -6]);
  const rotateY = useTransform(x, [-80, 80], [-8, 8]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={service.href}>
        <motion.div
          data-testid={`card-service-${service.id}`}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="group relative overflow-hidden rounded-xl cursor-pointer"
        >
          {/* Image */}
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Dark gradient */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              background:
                "linear-gradient(to top, rgba(18,12,8,0.9) 0%, rgba(18,12,8,0.3) 55%, transparent 100%)",
            }}
          />

          {/* Bronze glow on hover — "right side attraction" */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 80%, rgba(185,136,103,0.25) 0%, transparent 65%)",
            }}
          />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="glass-card p-3.5">
              <div
                className="mb-2 opacity-60 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0"
                style={{ color: "var(--ora-bronze)" }}
              >
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <h3
                className="font-display text-white text-base mb-0.5"
                style={{ fontWeight: 300, letterSpacing: "0.03em" }}
              >
                {service.title}
              </h3>
              <p className="text-white/50 text-[10px] mb-3 font-light tracking-wide">
                {service.descriptor}
              </p>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase transition-all duration-300 group-hover:gap-2.5"
                style={{ color: "var(--ora-bronze)" }}
              >
                Explore <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>

          {/* 3D depth layer — shimmer on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
              transform: "translateZ(20px)",
            }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Featured card (Korean Head Spa) — taller, left column ───────────────────

interface FeaturedCardProps {
  service: (typeof services)[0];
}

function FeaturedCard({ service }: FeaturedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const { Icon } = service;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="lg:row-span-2 h-full"
    >
      <Link href={service.href}>
        <div
          data-testid={`card-service-${service.id}`}
          className="group relative overflow-hidden rounded-xl cursor-pointer h-full img-zoom"
        >
          {/* Image */}
          <div className="aspect-[3/4] lg:h-full lg:aspect-auto overflow-hidden">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(18,12,8,0.92) 0%, rgba(18,12,8,0.4) 40%, transparent 70%)",
            }}
          />

          {/* Bronze radial glow bottom */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{
              background: "radial-gradient(ellipse at 50% 90%, rgba(185,136,103,0.35) 0%, transparent 60%)",
            }}
          />

          {/* "Featured" crown badge */}
          <div className="absolute top-5 left-5">
            <div className="glass-card-warm px-3 py-1.5">
              <span className="text-[9px] tracking-[0.3em] uppercase font-light" style={{ color: "var(--ora-bronze)" }}>
                Signature Ritual
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <div className="glass-card p-5">
              <div
                className="mb-3 opacity-70 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0"
                style={{ color: "var(--ora-bronze)" }}
              >
                <Icon size={24} strokeWidth={1.3} />
              </div>
              <h3
                className="font-display text-white text-2xl sm:text-3xl mb-1"
                style={{ fontWeight: 300, letterSpacing: "0.02em" }}
              >
                {service.title}
              </h3>
              <p className="text-white/50 text-xs mb-1 font-light">18 steps · 90–120 min · From £160</p>
              <p className="text-white/35 text-[10px] mb-5 font-light leading-relaxed">
                Manchester's most elevated scalp ritual.
              </p>
              <span
                className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase transition-all duration-300 group-hover:gap-3"
                style={{ color: "var(--ora-bronze)" }}
              >
                Reserve Your Ritual
                <ArrowRight size={11} className="transition-transform group-hover:translate-x-1.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ServicesOverviewSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section
      id="services-overview"
      className="py-20 md:py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: "hsl(var(--ora-sand))" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Desktop: left header text + right CTA in one row */}
        {/* Mobile: header stacked above cards */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12 lg:mb-16">
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 32 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              Our Signature Services
            </p>
            <h2
              className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground max-w-xl leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              Every treatment
              <br />
              <span style={{ fontStyle: "italic" }}>a ritual.</span>
            </h2>
          </motion.div>

          {/* Desktop-only right side stat strip */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isHeaderInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col items-end gap-4 pb-2"
          >
            {/* Stat pills */}
            <div className="flex gap-3">
              {[
                { val: "6", label: "Services" },
                { val: "18", label: "KHS Steps" },
                { val: "100%", label: "Women-Only" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-card-warm px-4 py-3 text-center"
                  style={{ minWidth: 72 }}
                >
                  <p
                    className="font-display text-xl leading-none"
                    style={{ fontWeight: 300, color: "var(--ora-bronze)" }}
                  >
                    {stat.val}
                  </p>
                  <p className="text-[9px] tracking-widest uppercase text-ora-fog mt-1 font-light">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <Link href="/services">
              <button
                data-testid="button-view-all-services"
                className="glass-pill px-6 py-2.5 text-xs font-medium hover-bronze inline-flex items-center gap-2"
                style={{ color: "hsl(var(--ora-fog))", letterSpacing: "0.06em" }}
              >
                View All Treatments & Pricing <ArrowRight size={11} />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Grid layout */}
        {/* Mobile: single column stack */}
        {/* Tablet: 2 col grid */}
        {/* Desktop: 3 col, featured card spans 2 rows on left */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">

          {/* Featured card — Korean Head Spa */}
          <div className="sm:col-span-2 lg:col-span-1 lg:row-span-2">
            <FeaturedCard service={services[0]} />
          </div>

          {/* Regular cards with tilt effect on desktop */}
          {services.slice(1).map((service, i) => (
            <TiltCard key={service.id} service={service} index={i + 1} />
          ))}
        </div>

        {/* Mobile CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-10 lg:hidden"
        >
          <Link href="/services">
            <button
              data-testid="button-view-all-services-mobile"
              className="glass-card-warm px-8 py-3.5 text-sm font-medium hover-bronze transition-all"
              style={{
                color: "hsl(var(--ora-fog))",
                letterSpacing: "0.06em",
              }}
            >
              View All Treatments & Pricing
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
