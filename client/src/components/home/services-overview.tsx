import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { AestheticsIcon, NailPolishIcon, HairIcon, LaserIcon, KoreanWaveIcon } from "@/components/icons/OraIcons";
import aestheticsImage from "@assets/service-aesthetics_1770213665902.png";
import nailsImage from "@assets/service-nails_1770213665903.png";
import hairImage from "@assets/service-hair_1770213665902.png";
import roomRentalImage from "@assets/room-rental_1770213665899.png";
import heroImage from "@assets/hero-image_1770213665902.png";

const services = [
  {
    id: "korean-head-spa",
    title: "Korean Head Spa",
    descriptor: "18-step scalp ritual",
    image: heroImage,
    href: "/korean-head-spa",
    Icon: KoreanWaveIcon,
    featured: true, // spans 2 rows on desktop
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
    descriptor: "Professional laser & massage",
    image: roomRentalImage,
    href: "/services#laser",
    Icon: LaserIcon,
    featured: false,
  },
];

interface CardProps {
  service: (typeof services)[0];
  index: number;
}

function ServiceCard({ service, index }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const { Icon } = service;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.9,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={service.featured ? "lg:row-span-2" : ""}
    >
      <Link href={service.href}>
        <div
          data-testid={`card-service-${service.id}`}
          className="group relative overflow-hidden rounded-lg cursor-pointer img-zoom"
          style={{ height: service.featured ? "100%" : undefined }}
        >
          {/* Image fills card */}
          <div
            className={`overflow-hidden ${
              service.featured
                ? "aspect-[3/4] lg:h-full lg:aspect-auto"
                : "aspect-[4/5]"
            }`}
          >
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Dark gradient overlay */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              background:
                "linear-gradient(to top, rgba(18,12,8,0.88) 0%, rgba(18,12,8,0.4) 50%, rgba(18,12,8,0.1) 100%)",
            }}
          />

          {/* Content panel at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            {/* Glass info panel */}
            <div className="glass-card p-4 sm:p-5">
              {/* Icon — slides up on hover */}
              <div
                className="mb-3 opacity-70 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0"
                style={{ color: "var(--ora-bronze)" }}
              >
                <Icon size={22} strokeWidth={1.5} />
              </div>

              <h3
                className="font-display text-white text-xl sm:text-2xl mb-1"
                style={{ fontWeight: 300, letterSpacing: "0.03em" }}
              >
                {service.title}
              </h3>
              <p className="text-white/55 text-xs mb-4 font-light tracking-wide">
                {service.descriptor}
              </p>

              <span
                className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase transition-all duration-300"
                style={{ color: "var(--ora-bronze)" }}
              >
                Explore treatments
                <ArrowRight
                  size={12}
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

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
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 32 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <p
            className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
            Our Signature Services
          </p>
          <h2
            className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground max-w-2xl leading-tight"
            style={{ fontWeight: 300, letterSpacing: "0.02em" }}
          >
            Every treatment
            <br />
            <span style={{ fontStyle: "italic" }}>a ritual.</span>
          </h2>
        </motion.div>

        {/* Asymmetric grid: featured card tall on left, 4 cards right */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {/* Featured (Korean Head Spa) — full height left column */}
          <div className="sm:col-span-2 lg:col-span-1 lg:row-span-2">
            <ServiceCard service={services[0]} index={0} />
          </div>

          {/* Regular cards — 2-column right side */}
          {services.slice(1).map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i + 1} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-14"
        >
          <Link href="/services">
            <button
              data-testid="button-view-all-services"
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
