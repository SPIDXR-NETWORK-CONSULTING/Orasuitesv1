import { Layout } from "@/components/layout/layout";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, Clock } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import {
  AestheticsIcon,
  NailPolishIcon,
  HairIcon,
  LaserIcon,
  WellnessIcon,
  KoreanWaveIcon,
} from "@/components/icons/OraIcons";

import aestheticsImage from "@assets/service-aesthetics_1770213665902.png";
import nailsStationImage from "@assets/service-nails-station_1770215234347.png";
import hairImage from "@assets/service-hair_1770213665902.png";
import roomRentalImage from "@assets/room-rental_1770213665899.png";
import productImage from "@assets/product-display_1770215241478.png";
import heroImage from "@assets/hero-image_1770213665902.png";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
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
  featured?: boolean;
  featuredStats?: string[];
}

/* ─────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────── */
const serviceCategories: ServiceCategory[] = [
  {
    id: "korean-head-spa",
    label: "Korean Head Spa",
    title: "Korean Head Spa",
    description:
      "The most advanced scalp ritual in the city. 18 precision steps designed to reset, restore and transform your scalp health from the root.",
    image: heroImage,
    Icon: KoreanWaveIcon,
    featured: true,
    featuredStats: ["18 Steps", "90–120 min", "From £160"],
    treatments: [
      {
        name: "Scalp Diagnostic Assessment",
        duration: "20 min",
        price: "£45",
        description: "Microscopic 200× scalp analysis with personalised report",
      },
      {
        name: "Signature Korean Head Spa",
        duration: "90 min",
        price: "From £160",
        description: "15-step complete scalp reset — deep cleanse, exfoliation & masque",
      },
      {
        name: "Luxury Ritual — 18 Steps",
        duration: "120 min",
        price: "From £220",
        description: "Full protocol with hot oil infusion, steam therapy & scalp massage",
      },
      {
        name: "Korean Head Spa + Scalp Combo",
        duration: "120 min",
        price: "From £240",
        description: "Ritual combined with targeted scalp treatment for maximum results",
      },
      {
        name: "Monthly Scalp Membership",
        duration: "Monthly",
        price: "£599 / mo",
        description: "Priority booking, exclusive member benefits & 20% off retail",
      },
    ],
  },
  {
    id: "aesthetics",
    label: "Aesthetics",
    title: "Aesthetics & Cosmetics",
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
    title: "Nails & Pedicure",
    description:
      "Luxurious nail care designed to pamper and perfect. Every treatment is a moment of deliberate self-care.",
    image: nailsStationImage,
    Icon: NailPolishIcon,
    treatments: [
      { name: "Classic Manicure", duration: "45 min", price: "From £28" },
      { name: "Gel Manicure", duration: "60 min", price: "From £38" },
      { name: "Luxury Pedicure", duration: "60 min", price: "From £45" },
      { name: "Nail Art & Extensions", duration: "90 min", price: "From £55" },
      { name: "Classic Pedicure", duration: "45 min", price: "From £32" },
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
    ],
  },
  {
    id: "wellness",
    label: "Wellness",
    title: "Wellness & Massage",
    description:
      "Restorative treatments for body and mind. Release tension, restore balance and reconnect with yourself.",
    image: productImage,
    Icon: WellnessIcon,
    treatments: [
      { name: "Swedish Massage", duration: "60 min", price: "From £70" },
      { name: "Deep Tissue Massage", duration: "60 min", price: "From £80" },
      { name: "Hot Stone Massage", duration: "75 min", price: "From £95" },
      { name: "Aromatherapy Massage", duration: "60 min", price: "From £75" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   Treatment Row
───────────────────────────────────────────────────────────── */
function TreatmentRow({
  treatment,
  index,
  categoryId,
}: {
  treatment: Treatment;
  index: number;
  categoryId: string;
}) {
  const bookHref = categoryId === "korean-head-spa" ? "/korean-head-spa" : "/contact";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.055,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group flex items-start justify-between gap-4 py-4 border-b last:border-0"
      style={{ borderColor: "var(--glass-border-warm)" }}
    >
      {/* Left: name + description */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-light leading-snug transition-colors duration-300"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {treatment.name}
        </p>
        {treatment.description && (
          <p
            className="mt-0.5 text-xs font-light leading-relaxed"
            style={{ color: "hsl(var(--ora-fog))" }}
          >
            {treatment.description}
          </p>
        )}
      </div>

      {/* Middle: duration badge */}
      <div className="flex-shrink-0 flex items-center gap-1.5 mt-0.5">
        <Clock size={10} style={{ color: "var(--ora-bronze)", opacity: 0.7 }} />
        <span
          className="text-xs font-light tracking-wide whitespace-nowrap"
          style={{ color: "hsl(var(--ora-smoke))" }}
        >
          {treatment.duration}
        </span>
      </div>

      {/* Right: price + book arrow */}
      <div className="flex-shrink-0 flex items-center gap-3">
        <span
          className="text-sm font-medium whitespace-nowrap"
          style={{ color: "var(--ora-bronze)" }}
        >
          {treatment.price}
        </span>
        <Link href={bookHref}>
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full border opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
            style={{
              borderColor: "var(--ora-bronze)",
              color: "var(--ora-bronze)",
              background: "var(--glass-warm)",
            }}
          >
            <ArrowRight size={11} />
          </span>
        </Link>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Accordion Panel — glass-card-warm expanded treatments list
───────────────────────────────────────────────────────────── */
function TreatmentPanel({
  category,
  isOpen,
}: {
  category: ServiceCategory;
  isOpen: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: "hidden" }}
        >
          <div className="glass-card-warm mx-0 mt-0 rounded-t-none rounded-b-2xl p-6 md:p-8">
            {/* Header row inside panel */}
            <div className="flex items-center justify-between mb-6">
              <p
                className="text-xs tracking-[0.22em] uppercase font-light"
                style={{ color: "var(--ora-bronze)" }}
              >
                Treatments & Pricing
              </p>
              <Link
                href={
                  category.id === "korean-head-spa"
                    ? "/korean-head-spa"
                    : "/contact"
                }
              >
                <button
                  className="glass-pill px-5 py-2 text-xs font-light inline-flex items-center gap-1.5 transition-all"
                  style={{ color: "hsl(var(--ora-fog))", letterSpacing: "0.06em" }}
                >
                  {category.id === "korean-head-spa"
                    ? "Reserve Ritual"
                    : "Book Now"}
                  <ArrowRight size={11} />
                </button>
              </Link>
            </div>

            {/* Treatment rows */}
            <div>
              {category.treatments.map((treatment, i) => (
                <TreatmentRow
                  key={treatment.name}
                  treatment={treatment}
                  index={i}
                  categoryId={category.id}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────
   Category Card — the clickable collapsed header
───────────────────────────────────────────────────────────── */
function CategoryCard({
  category,
  isOpen,
  onToggle,
  revealDelay,
}: {
  category: ServiceCategory;
  isOpen: boolean;
  onToggle: () => void;
  revealDelay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const { Icon } = category;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: revealDelay, ease: [0.16, 1, 0.3, 1] }}
      id={category.id}
      className="scroll-mt-32"
    >
      {/* Clickable card */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        data-testid={`button-category-${category.id}`}
        className={`group w-full text-left focus:outline-none ${
          category.featured ? "rounded-2xl" : "rounded-2xl"
        } ${isOpen ? "rounded-b-none" : ""} overflow-hidden`}
        style={{ display: "block" }}
      >
        {/* Image container */}
        <div
          className={`relative overflow-hidden ${
            category.featured ? "aspect-[21/9] md:aspect-[3/1]" : "aspect-[16/7] md:aspect-[4/1]"
          }`}
        >
          <img
            src={category.image}
            alt={category.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            loading="lazy"
          />

          {/* Dark gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: isOpen
                ? "linear-gradient(160deg, rgba(10,7,4,0.82) 0%, rgba(30,18,10,0.62) 100%)"
                : "linear-gradient(160deg, rgba(10,7,4,0.68) 0%, rgba(30,18,10,0.44) 100%)",
              transition: "background 0.5s ease",
            }}
          />

          {/* Korean Head Spa: gradient shimmer accent */}
          {category.featured && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(185,136,103,0.18) 0%, transparent 70%)",
              }}
            />
          )}

          {/* Card content overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
            {/* Top row: icon + label */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="glass-card-sm flex items-center justify-center"
                  style={{ width: 34, height: 34 }}
                >
                  <Icon size={15} color="var(--ora-bronze)" strokeWidth={1.5} />
                </div>
                <span
                  className="text-xs tracking-[0.22em] uppercase font-light"
                  style={{ color: "var(--ora-bronze)" }}
                >
                  {category.label}
                </span>
              </div>

              {/* Chevron toggle indicator */}
              <div
                className="glass-card-sm flex items-center justify-center flex-shrink-0"
                style={{ width: 32, height: 32 }}
              >
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChevronDown
                    size={14}
                    style={{ color: isOpen ? "var(--ora-bronze)" : "rgba(255,255,255,0.6)" }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Bottom row: title + featured stat pills */}
            <div>
              {/* Stat pills for Korean Head Spa */}
              {category.featured && category.featuredStats && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {category.featuredStats.map((stat) => (
                    <span
                      key={stat}
                      className="glass-card-sm px-3 py-1 text-xs font-light tracking-wide"
                      style={{ color: "var(--ora-bronze)", borderRadius: 999 }}
                    >
                      {stat}
                    </span>
                  ))}
                </div>
              )}

              <h2
                className={`font-display text-white leading-tight ${
                  category.featured
                    ? "text-3xl sm:text-4xl md:text-5xl"
                    : "text-2xl sm:text-3xl md:text-4xl"
                }`}
                style={{ fontWeight: 300, letterSpacing: "0.02em" }}
              >
                {category.title}
              </h2>
              <p
                className={`mt-2 text-sm font-light leading-relaxed max-w-xl ${
                  isOpen ? "opacity-70" : "opacity-60"
                } transition-opacity duration-300`}
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {category.description}
              </p>

              {/* "View treatments" hint when closed */}
              {!isOpen && (
                <p
                  className="mt-3 text-xs tracking-widest uppercase font-light"
                  style={{ color: "var(--ora-bronze)", opacity: 0.8 }}
                >
                  View treatments
                </p>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Accordion panel */}
      <TreatmentPanel category={category} isOpen={isOpen} />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sticky Tab Strip
───────────────────────────────────────────────────────────── */
function StickyTabStrip({
  categories,
  activeId,
  onSelect,
}: {
  categories: ServiceCategory[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      className="sticky top-0 z-40 border-b"
      style={{
        background: "hsl(var(--ora-sand))",
        borderColor: "hsl(var(--ora-greige))",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14">
        <div className="flex gap-0.5 overflow-x-auto py-2.5 hide-scrollbar">
          {categories.map((cat) => {
            const isActive = activeId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                data-testid={`link-category-${cat.id}`}
                className="relative flex-shrink-0 px-4 py-2 rounded-full text-xs font-light tracking-widest uppercase transition-all duration-300 focus:outline-none"
                style={{
                  color: isActive ? "var(--ora-bronze)" : "hsl(var(--ora-fog))",
                  letterSpacing: "0.08em",
                  background: isActive
                    ? "var(--glass-warm)"
                    : "transparent",
                  border: isActive
                    ? "1px solid var(--glass-border-warm)"
                    : "1px solid transparent",
                }}
              >
                {cat.label}
                {isActive && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: "var(--ora-bronze)" }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function ServicesPage() {
  useSEO({
    title: "Treatments & Pricing | Ora Suites Manchester",
    description:
      "From Profhilo to Korean Head Spa — explore Ora's full treatment menu with transparent pricing. Women-only wellness sanctuary in Manchester.",
  });

  const [activeCategory, setActiveCategory] = useState<string | null>("korean-head-spa");

  /* Scroll to category section and open it */
  function handleTabSelect(id: string) {
    setActiveCategory((prev) => (prev === id ? null : id));
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -120;
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  /* Update active tab as user scrolls */
  useEffect(() => {
    function onScroll() {
      for (const cat of [...serviceCategories].reverse()) {
        const el = document.getElementById(cat.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveCategory((prev) => (prev !== cat.id ? cat.id : prev));
            break;
          }
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleCategory(id: string) {
    setActiveCategory((prev) => (prev === id ? null : id));
  }

  return (
    <Layout>
      {/* ── Hero ── */}
      <section
        className="relative pt-36 pb-16 overflow-hidden"
        style={{ background: "hsl(var(--ora-milk))" }}
      >
        {/* Dot grid texture */}
        <div className="absolute inset-0 dot-grid-bg opacity-40" aria-hidden="true" />

        {/* Bronze radial glow */}
        <div
          className="absolute right-0 top-0 w-1/2 h-full pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 85% 30%, rgba(185,136,103,0.1) 0%, transparent 65%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="text-xs tracking-[0.28em] uppercase mb-5 font-light"
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
            <p
              className="text-lg font-light max-w-xl leading-relaxed"
              style={{ color: "hsl(var(--ora-fog))" }}
            >
              Tailored to your unique beauty and wellness goals. Transparent pricing,
              expert practitioners, intentional care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Sticky tab strip ── */}
      <StickyTabStrip
        categories={serviceCategories}
        activeId={activeCategory}
        onSelect={handleTabSelect}
      />

      {/* ── Category accordion cards ── */}
      <section
        className="py-12 md:py-16"
        style={{ background: "hsl(var(--ora-milk))" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 space-y-4">
          {serviceCategories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              isOpen={activeCategory === category.id}
              onToggle={() => toggleCategory(category.id)}
              revealDelay={Math.min(index * 0.07, 0.3)}
            />
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        className="py-24"
        style={{ background: "hsl(var(--ora-bone))" }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Decorative line */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div
                className="h-px w-16 opacity-40"
                style={{ background: "var(--ora-bronze)" }}
              />
              <KoreanWaveIcon size={18} color="var(--ora-bronze)" strokeWidth={1.3} />
              <div
                className="h-px w-16 opacity-40"
                style={{ background: "var(--ora-bronze)" }}
              />
            </div>

            <h2
              className="font-display text-3xl sm:text-4xl text-foreground mb-4 leading-tight"
              style={{ fontWeight: 300, fontStyle: "italic" }}
            >
              Not sure where to start?
            </h2>
            <p
              className="text-sm font-light mb-9 leading-relaxed"
              style={{ color: "hsl(var(--ora-fog))" }}
            >
              Book a complimentary consultation with one of our experts. We'll help
              you create a personalised treatment plan tailored to your goals.
            </p>
            <Link href="/contact">
              <button
                data-testid="button-services-consultation"
                className="px-10 py-4 text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "var(--ora-bronze)",
                  color: "white",
                  borderRadius: "9999px",
                  letterSpacing: "0.07em",
                  boxShadow: "0 8px 32px var(--ora-bronze-muted)",
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
