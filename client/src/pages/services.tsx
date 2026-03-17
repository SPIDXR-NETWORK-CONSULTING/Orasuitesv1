import { Layout } from "@/components/layout/layout";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { AestheticsIcon, NailPolishIcon, HairIcon, LaserIcon, WellnessIcon, KoreanWaveIcon } from "@/components/icons/OraIcons";

import aestheticsImage from "@assets/service-aesthetics_1770213665902.png";
import nailsImage from "@assets/service-nails_1770213665903.png";
import nailsStationImage from "@assets/service-nails-station_1770215234347.png";
import hairImage from "@assets/service-hair_1770213665902.png";
import roomRentalImage from "@assets/room-rental_1770213665899.png";
import productImage from "@assets/product-display_1770215241478.png";
import heroImage from "@assets/hero-image_1770213665902.png";

interface Treatment {
  name: string;
  duration: string;
  price: string;
  description?: string;
}

interface ServiceCategory {
  id: string;
  label: string;
  title: string;
  description: string;
  image: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string; className?: string }>;
  treatments: Treatment[];
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "korean-head-spa",
    label: "Korean Head Spa",
    title: "Korean Head Spa",
    description:
      "The most advanced scalp ritual in the city. 18 precision steps designed to reset, restore and transform your scalp health from the root.",
    image: heroImage,
    Icon: KoreanWaveIcon,
    treatments: [
      { name: "Scalp Diagnostic Assessment", duration: "20 min", price: "£45", description: "Microscopic 200x scalp analysis" },
      { name: "Signature Korean Head Spa", duration: "90 min", price: "From £160", description: "15-step complete scalp reset" },
      { name: "Luxury Ritual (18-step)", duration: "120 min", price: "From £220", description: "Full protocol with oil infusion & steam therapy" },
      { name: "Korean Head Spa + Scalp Combo", duration: "120 min", price: "From £240", description: "Ritual + targeted scalp treatment" },
      { name: "Monthly Scalp Membership", duration: "Monthly", price: "£599 / mo", description: "Priority booking + exclusive member benefits" },
    ],
  },
  {
    id: "aesthetics",
    label: "Aesthetics",
    title: "Aesthetics & Cosmetic Procedures",
    description:
      "Regenerative. Intentional. Transformative. Our aesthetic treatments are designed to enhance your natural beauty from the inside out.",
    image: aestheticsImage,
    Icon: AestheticsIcon,
    treatments: [
      { name: "Profhilo & Skin Boosters", duration: "45 min", price: "From £250" },
      { name: "Polynucleotide (PDRN) Injections", duration: "60 min", price: "From £280" },
      { name: "Dermal Fillers", duration: "45 min", price: "From £200" },
      { name: "Anti-Wrinkle Injections", duration: "30 min", price: "From £150" },
      { name: "Exosome Therapy", duration: "60 min", price: "From £320" },
      { name: "LED Light Therapy", duration: "30 min", price: "From £65" },
      { name: "Microneedling", duration: "60 min", price: "From £120" },
      { name: "Hydrafacials", duration: "60 min", price: "From £110" },
      { name: "IPL & Laser Resurfacing", duration: "45 min", price: "From £130" },
    ],
  },
  {
    id: "hair",
    label: "Hair",
    title: "Hair Services",
    description:
      "Expert stylists dedicated to bringing out your best. From subtle enhancements to bold transformations.",
    image: hairImage,
    Icon: HairIcon,
    treatments: [
      { name: "Wash, Cut & Blow Dry", duration: "60–90 min", price: "£39–£68" },
      { name: "Balayage — Short Hair", duration: "2–3 hrs", price: "From £130" },
      { name: "Balayage — Medium Hair", duration: "2–3 hrs", price: "From £180" },
      { name: "Balayage — Long Hair", duration: "3–4 hrs", price: "From £220" },
      { name: "Full Head Highlights", duration: "2–3 hrs", price: "From £160" },
      { name: "Half Head Highlights", duration: "1.5–2 hrs", price: "From £125" },
      { name: "Colour Correction", duration: "3–5 hrs", price: "From £200" },
      { name: "Keratin Straightening", duration: "2–3 hrs", price: "From £140" },
      { name: "Bridal Hair Styling", duration: "2 hrs", price: "From £120" },
    ],
  },
  {
    id: "nails",
    label: "Nails",
    title: "Nails & Pedicures",
    description:
      "Luxurious nail care designed to pamper and perfect. Every manicure is a moment of self-care.",
    image: nailsStationImage,
    Icon: NailPolishIcon,
    treatments: [
      { name: "Classic Manicure", duration: "45 min", price: "From £28" },
      { name: "Gel Manicure", duration: "60 min", price: "From £38" },
      { name: "Classic Pedicure", duration: "45 min", price: "From £32" },
      { name: "Luxury Pedicure", duration: "60 min", price: "From £45" },
      { name: "Nail Art & Extensions", duration: "90 min", price: "From £55" },
      { name: "Cuticle Care Treatment", duration: "30 min", price: "From £22" },
      { name: "Paraffin Hand Treatment", duration: "30 min", price: "From £28" },
    ],
  },
  {
    id: "laser",
    label: "Laser",
    title: "Laser Hair Removal",
    description:
      "Smooth, lasting results with advanced laser technology. Safe for all skin types, performed by trained professionals.",
    image: roomRentalImage,
    Icon: LaserIcon,
    treatments: [
      { name: "Full Body", duration: "90 min", price: "From £299" },
      { name: "Face & Upper Lip", duration: "20 min", price: "From £55" },
      { name: "Underarms", duration: "20 min", price: "From £45" },
      { name: "Bikini Line", duration: "20 min", price: "From £55" },
      { name: "Full Legs", duration: "45 min", price: "From £120" },
      { name: "Arms", duration: "30 min", price: "From £75" },
      { name: "Back & Shoulders", duration: "45 min", price: "From £95" },
    ],
  },
  {
    id: "wellness",
    label: "Wellness",
    title: "Massage & Wellness",
    description:
      "Restorative treatments for body and mind. Release tension, restore balance, and reconnect with yourself.",
    image: productImage,
    Icon: WellnessIcon,
    treatments: [
      { name: "Swedish Massage", duration: "60 min", price: "From £70" },
      { name: "Deep Tissue Massage", duration: "60 min", price: "From £80" },
      { name: "Hot Stone Massage", duration: "75 min", price: "From £95" },
      { name: "Aromatherapy Massage", duration: "60 min", price: "From £75" },
      { name: "Pregnancy Massage", duration: "60 min", price: "From £75" },
      { name: "Reflexology", duration: "50 min", price: "From £55" },
      { name: "Body Wrap Treatment", duration: "75 min", price: "From £85" },
    ],
  },
];

function TreatmentRow({ treatment, delay }: { treatment: Treatment; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start justify-between py-3.5 border-b border-ora-greige/50 last:border-0 group cursor-default"
    >
      <div className="flex-1 pr-6">
        <p className="text-foreground text-sm font-light group-hover:text-ora-taupe transition-colors duration-300">
          {treatment.name}
        </p>
        {treatment.description && (
          <p className="text-ora-fog/60 text-xs mt-0.5 font-light">{treatment.description}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--ora-bronze)" }}
        >
          {treatment.price}
        </p>
        {treatment.duration && (
          <p className="text-ora-fog/50 text-xs mt-0.5 font-light">{treatment.duration}</p>
        )}
      </div>
    </motion.div>
  );
}

function ServiceSection({ category, index }: { category: ServiceCategory; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isReversed = index % 2 === 1;
  const { Icon } = category;

  return (
    <div
      ref={ref}
      id={category.id}
      className="scroll-mt-28"
    >
      <div
        className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-start ${
          isReversed ? "lg:flex-row-reverse" : ""
        }`}
      >
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: isReversed ? 48 : -48 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={`relative overflow-hidden rounded-xl img-zoom ${isReversed ? "lg:order-2" : ""}`}
        >
          <div className="aspect-[4/3] overflow-hidden rounded-xl">
            <img
              src={category.image}
              alt={category.title}
              className="w-full h-full object-cover transition-transform duration-700"
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{ background: "var(--overlay-subtle)" }}
            />
          </div>

          {/* Category badge on image */}
          <div className="absolute top-5 left-5">
            <div className="glass-card-sm px-4 py-2 flex items-center gap-2">
              <Icon size={14} color="var(--ora-bronze)" strokeWidth={1.5} />
              <span
                className="text-xs tracking-widest uppercase font-light"
                style={{ color: "var(--ora-bronze)" }}
              >
                {category.label}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: isReversed ? -48 : 48 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className={isReversed ? "lg:order-1" : ""}
        >
          <h2
            className="font-display text-3xl sm:text-4xl text-foreground mb-4 leading-tight"
            style={{ fontWeight: 300, letterSpacing: "0.02em" }}
          >
            {category.title}
          </h2>
          <p className="text-ora-fog text-sm font-light leading-relaxed mb-8">
            {category.description}
          </p>

          {/* Pricing table */}
          <div className="glass-card-warm p-6 mb-6">
            <p
              className="text-xs tracking-[0.2em] uppercase mb-5 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              Treatments & Pricing
            </p>
            <div>
              {category.treatments.map((t, i) => (
                <TreatmentRow
                  key={t.name}
                  treatment={t}
                  delay={0.3 + i * 0.05}
                />
              ))}
            </div>
          </div>

          <Link href={category.id === "korean-head-spa" ? "/korean-head-spa" : "/contact"}>
            <button
              data-testid={`button-book-${category.id}`}
              className="glass-pill px-7 py-3 text-sm font-medium hover-bronze transition-all inline-flex items-center gap-2"
              style={{ color: "hsl(var(--ora-fog))", letterSpacing: "0.04em" }}
            >
              {category.id === "korean-head-spa" ? "Reserve Your Ritual" : "Book This Treatment"}
              <ArrowRight size={13} />
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  useSEO({
    title: "Treatments & Pricing | Ora Suites Manchester",
    description: "From Profhilo to Korean Head Spa — explore Ora's full treatment menu with transparent pricing. Women-only wellness sanctuary in Manchester.",
  });

  return (
    <Layout>
      {/* ── Hero ── */}
      <section
        className="relative pt-36 pb-20 overflow-hidden"
        style={{ background: "hsl(var(--ora-milk))" }}
      >
        <div
          className="absolute inset-0 dot-grid-bg opacity-40"
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              Our Treatments
            </p>
            <h1
              className="font-display text-5xl sm:text-6xl md:text-7xl text-foreground mb-6 leading-[1.05]"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              Every treatment,
              <br />
              <span style={{ fontStyle: "italic" }}>a ritual.</span>
            </h1>
            <p className="text-ora-fog text-lg font-light max-w-2xl">
              Tailored to your unique beauty and wellness goals. Transparent pricing,
              expert practitioners, intentional care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Sticky anchor nav ── */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{
          background: "hsl(var(--ora-sand))",
          borderColor: "hsl(var(--ora-greige))",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex gap-1 overflow-x-auto py-3 hide-scrollbar">
            {serviceCategories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                data-testid={`link-category-${cat.id}`}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-light tracking-widest uppercase transition-all duration-300 hover-bronze"
                style={{ color: "hsl(var(--ora-fog))", letterSpacing: "0.08em" }}
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Service sections ── */}
      <section className="py-16 md:py-24" style={{ background: "hsl(var(--ora-milk))" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 space-y-24 md:space-y-32">
          {serviceCategories.map((category, index) => (
            <ServiceSection key={category.id} category={category} index={index} />
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        className="py-20"
        style={{ background: "hsl(var(--ora-bone))" }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2
              className="font-display text-3xl sm:text-4xl text-foreground mb-4"
              style={{ fontWeight: 300, fontStyle: "italic" }}
            >
              Not sure where to start?
            </h2>
            <p className="text-ora-fog text-sm font-light mb-8 leading-relaxed">
              Book a complimentary consultation with one of our experts. We'll help
              you create a personalised treatment plan tailored to your goals.
            </p>
            <Link href="/contact">
              <button
                data-testid="button-services-consultation"
                className="px-9 py-4 text-sm font-medium transition-all"
                style={{
                  background: "var(--ora-bronze)",
                  color: "white",
                  borderRadius: "9999px",
                  letterSpacing: "0.06em",
                }}
              >
                Book a Free Consultation
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
