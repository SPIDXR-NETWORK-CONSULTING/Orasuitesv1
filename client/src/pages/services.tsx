import { Layout } from "@/components/layout/layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

import aestheticsImage from "@assets/service-aesthetics-skincare.jpg";
import nailsStationImage from "@assets/service-nails-gold.jpg";
import hairImage from "@assets/service-hair-blowout.jpg";
import laserImage from "@assets/service-led-laser.jpg";
import wellnessImage from "@assets/service-wellness-facial.jpg";
import heroBannerImage from "@assets/ora-hero-zebra-crossing.jpg";

const serviceCategories = [
  {
    id: "aesthetics",
    comingSoon: false,
    title: "Aesthetics",
    subtitle: "Aesthetics & Cosmetic Procedures",
    description:
      "Regenerative. Intentional. Transformative. Our aesthetic treatments are designed to enhance your natural beauty from the inside out.",
    image: aestheticsImage,
    treatments: [
      { name: "Profhilo & Skin Boosters", price: "From £250", duration: "45 mins" },
      { name: "Polynucleotide (PDRN) Injections", price: "From £275", duration: "45 mins" },
      { name: "Dermal Fillers", price: "From £195", duration: "45 mins" },
      { name: "Lip Filler", price: "From £175", duration: "30 mins" },
      { name: "Anti-Wrinkle Injections", price: "From £150", duration: "30 mins" },
      { name: "Exosome Therapy", price: "From £350", duration: "60 mins" },
      { name: "LED Light Therapy", price: "From £55", duration: "30 mins" },
      { name: "Microneedling", price: "From £130", duration: "60 mins" },
      { name: "HydraFacial", price: "From £110", duration: "60 mins" },
      { name: "IPL & Laser Resurfacing", price: "From £175", duration: "45 mins" },
    ],
  },
  {
    id: "nails",
    comingSoon: false,
    title: "Nails",
    subtitle: "Nails & Pedicures",
    description:
      "Luxurious nail care designed to pamper and perfect. Every manicure is a moment of self-care, every pedicure a ritual of relaxation.",
    image: nailsStationImage,
    treatments: [
      { name: "BIAB New Set with Manicure", price: "£47", duration: "80 mins" },
      { name: "BIAB Infill with Manicure", price: "£43", duration: "80 mins" },
      { name: "French / Chrome / Ombre / Cat Eye", price: "£10 add-on", duration: "+10 mins" },
      { name: "Simple Nail Art (1–2 nails)", price: "£5", duration: "+10 mins" },
      { name: "Simple Nail Art (Full hands)", price: "£15", duration: "+10 mins" },
      { name: "Advanced Nail Art / 3D Designs (1–2 nails)", price: "£10", duration: "+15 mins" },
      { name: "Advanced Nail Art / 3D Designs (Full hands)", price: "£25", duration: "+15 mins" },
      { name: "Repair (1–2 nails)", price: "£5", duration: "+5 mins" },
      { name: "Gel Polish Hands with Manicure", price: "£35", duration: "50 mins" },
      { name: "Smart Gel Extensions (up to 4 length) with Manicure", price: "£50", duration: "80 mins" },
      { name: "Smart Gel Extensions (4+ length) with Manicure", price: "£60", duration: "90 mins" },
      { name: "Smart Gel Infill with Manicure", price: "£45", duration: "80 mins" },
      { name: "Classic Manicure (no polish)", price: "£28", duration: "30 mins" },
      { name: "Japanese Manicure (no polish)", price: "£30", duration: "35 mins" },
      { name: "European Manicure (no cut cuticle, no polish)", price: "£25", duration: "20 mins" },
      { name: "Halal Manicure", price: "£30", duration: "35 mins" },
      { name: "Hermès Set with Manicure", price: "£55", duration: "40 mins" },
      { name: "BIAB / Gel / Acrylic Removal*", price: "£15", duration: "20 mins" },
      { name: "Classic Pedicure with Gel Polish", price: "£40", duration: "60 mins" },
      { name: "BIAB Pedicure with Manicure", price: "£50", duration: "60 mins" },
      { name: "European Pedicure (no cut cuticle + Gel Polish)", price: "£37", duration: "45 mins" },
      { name: "European Pedicure (no cut cuticle, no polish)", price: "£30", duration: "40 mins" },
      { name: "Luxury Pedicure + Gel Polish + SPA", price: "£55", duration: "60 mins" },
      { name: "Luxury Pedicure + SPA (no polish)", price: "£47", duration: "40 mins" },
    ],
    footnote: "*Removals do not include manicure services",
  },
  {
    id: "hair",
    comingSoon: true,
    title: "Hair",
    subtitle: "Hair Services",
    description:
      "Expert stylists dedicated to bringing out your best. From subtle enhancements to bold transformations, your hair journey starts here.",
    image: hairImage,
    treatments: [
      { name: "Cut & Style", price: "From £45", duration: "60 mins" },
      { name: "Color & Highlights", price: "From £80", duration: "90 mins" },
      { name: "Balayage & Ombre", price: "From £120", duration: "120 mins" },
      { name: "Keratin Treatments", price: "From £150", duration: "120 mins" },
      { name: "Scalp Treatments", price: "From £60", duration: "45 mins" },
      { name: "Bridal Hair", price: "From £100", duration: "90 mins" },
      { name: "Blowdry & Styling", price: "From £35", duration: "45 mins" },
    ],
  },
  {
    id: "laser",
    comingSoon: true,
    title: "Laser",
    subtitle: "Laser Hair Removal",
    description:
      "Smooth, lasting results with our advanced laser technology. Safe for all skin types, performed by trained professionals.",
    image: laserImage,
    treatments: [
      { name: "Full Body", price: "From £350", duration: "120 mins" },
      { name: "Face & Upper Lip", price: "From £50", duration: "20 mins" },
      { name: "Underarms", price: "From £40", duration: "15 mins" },
      { name: "Bikini Area", price: "From £60", duration: "20 mins" },
      { name: "Full Legs", price: "From £180", duration: "60 mins" },
      { name: "Arms", price: "From £100", duration: "40 mins" },
      { name: "Back & Shoulders", price: "From £120", duration: "45 mins" },
    ],
  },
  {
    id: "wellness",
    comingSoon: true,
    title: "Wellness",
    subtitle: "Massage & Wellness",
    description:
      "Restorative treatments for body and mind. Release tension, restore balance, and reconnect with yourself.",
    image: wellnessImage,
    treatments: [
      { name: "Swedish Massage", price: "From £60", duration: "60 mins" },
      { name: "Deep Tissue Massage", price: "From £75", duration: "60 mins" },
      { name: "Hot Stone Massage", price: "From £85", duration: "75 mins" },
      { name: "Aromatherapy Massage", price: "From £70", duration: "60 mins" },
      { name: "Pregnancy Massage", price: "From £70", duration: "60 mins" },
      { name: "Reflexology", price: "From £50", duration: "45 mins" },
      { name: "Body Wrap Treatments", price: "From £80", duration: "75 mins" },
    ],
  },
];

export default function ServicesPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  useSEO({
    title: "Services | ORÁ. - Beauty & Wellness Treatments Manchester",
    description: "Explore our range of beauty and wellness services at Ora Suites Manchester. Aesthetics, nails, hair, laser treatments, and massage therapy — a sanctuary for those who invest in themselves.",
  });

  const activeCategory = serviceCategories.find((c) => c.id === activeId);

  return (
    <Layout>
      {/* Full-bleed hero banner */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end overflow-hidden">
        <img
          src={heroBannerImage}
          alt="ORÁ Suites — Services"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-display-sm md:text-display text-white mb-3">
              Transformative Treatments
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Tailored to your unique beauty and wellness goals. Every treatment
              is a ritual crafted with intention and care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category grid */}
      <section className="py-16 md:py-24 bg-ora-milk">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {serviceCategories.map((category, index) => (
              <motion.button
                key={category.id}
                id={category.id}
                data-testid={`card-category-${category.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                onClick={() => {
                  if (!category.comingSoon) {
                    setActiveId((prev) => (prev === category.id ? null : category.id));
                  }
                }}
                className={`group relative overflow-hidden rounded-md aspect-[3/4] focus:outline-none ${
                  category.comingSoon ? "cursor-default opacity-60" : "cursor-pointer"
                } ${activeId === category.id ? "ring-2 ring-ora-taupe ring-offset-2" : ""}`}
              >
                <img
                  src={category.image}
                  alt={category.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${!category.comingSoon ? "group-hover:scale-105" : ""}`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 ${activeId === category.id ? "opacity-100" : "opacity-70 group-hover:opacity-90"}`} />
                {category.comingSoon && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                    <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/30 rounded-full text-white text-xs font-medium tracking-widest uppercase">
                      Coming Soon
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-serif text-white text-lg font-medium">{category.title}</p>
                  {!category.comingSoon && (
                    <div className={`flex items-center gap-1 text-white/70 text-xs mt-1 transition-all duration-300 ${activeId === category.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <span>{activeId === category.id ? "Close" : "View treatments"}</span>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-300 ${activeId === category.id ? "rotate-180" : ""}`}
                      />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* More services coming */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-center gap-3 py-4 mb-4"
          >
            <div className="h-px flex-1 bg-ora-greige max-w-[80px]" />
            <p className="text-ora-fog text-sm text-center">
              More personal care services coming soon — we're growing ORÁ into Manchester's most complete wellness sanctuary.
            </p>
            <div className="h-px flex-1 bg-ora-greige max-w-[80px]" />
          </motion.div>

          {/* Expanded treatment panel */}
          <AnimatePresence>
            {activeCategory && (
              <motion.div
                key={activeCategory.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="bg-ora-sand rounded-md p-6 md:p-10">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                        {activeCategory.subtitle}
                      </h2>
                      <p className="text-ora-fog mt-2 max-w-xl">{activeCategory.description}</p>
                    </div>
                    <button
                      onClick={() => setActiveId(null)}
                      className="ml-4 flex-shrink-0 p-2 rounded-full bg-ora-bone text-ora-fog hover:bg-ora-greige transition-colors"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-0">
                    {activeCategory.treatments.map((treatment) => (
                      <div
                        key={treatment.name}
                        data-testid={`treatment-${activeCategory.id}-${treatment.name.toLowerCase().replace(/[\s/()–*+]+/g, "-")}`}
                        className="flex items-start justify-between gap-3 py-3 border-b border-ora-greige last:border-0"
                      >
                        <div>
                          <p className="text-foreground text-sm font-medium leading-snug">{treatment.name}</p>
                          <p className="text-ora-smoke text-xs mt-0.5">{treatment.duration}</p>
                        </div>
                        <span
                          className="text-ora-taupe font-semibold text-sm whitespace-nowrap flex-shrink-0"
                          data-testid={`price-${treatment.name.toLowerCase().replace(/[\s/()–*+]+/g, "-")}`}
                        >
                          {treatment.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  {"footnote" in activeCategory && activeCategory.footnote && (
                    <p className="mt-5 text-xs text-ora-smoke italic">{activeCategory.footnote}</p>
                  )}

                  <div className="mt-8">
                    <Link href={
                      activeCategory.id === "aesthetics" ? "/book?type=aesthetics"
                      : activeCategory.id === "nails" ? "/book?type=nails"
                      : "/contact"
                    }>
                      <Button
                        data-testid={`button-book-${activeCategory.id}`}
                        className="bg-ora-taupe text-white hover:bg-ora-fog px-8"
                      >
                        Book {activeCategory.title}
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="py-20 bg-ora-bone">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
            Not Sure Where to Start?
          </h2>
          <p className="text-ora-fog mb-8">
            Book a complimentary consultation with one of our experts. We'll help
            you create a personalised treatment plan tailored to your goals.
          </p>
          <Link href="/contact">
            <Button
              data-testid="button-services-consultation"
              className="bg-ora-taupe text-white hover:bg-ora-fog px-8"
            >
              Book Your Free Consultation
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
