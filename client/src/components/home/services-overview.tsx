import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import aestheticsImage from "@assets/service-injectables.jpg";
import nailsImage from "@assets/service-nails-ora.jpg";
import hairImage from "@assets/service-hair-homepage.jpg";
import wellnessImage from "@assets/service-wellness-homepage.jpg";

const services = [
  {
    id: "aesthetics",
    title: "Aesthetics",
    description: "Advanced injectables, skin boosters and rejuvenation therapies",
    image: aestheticsImage,
    href: "/services#aesthetics",
  },
  {
    id: "nails",
    title: "Nails & Pedicure",
    description: "Luxurious nail care and pampering treatments",
    image: nailsImage,
    href: "/services#nails",
  },
  {
    id: "hair",
    title: "Hair Services",
    description: "Expert styling, colour, and transformative hair care",
    image: hairImage,
    href: "/services#hair",
  },
  {
    id: "wellness",
    title: "Massage & Wellness",
    description: "Restorative facials and holistic wellness rituals",
    image: wellnessImage,
    href: "/services#wellness",
  },
];

interface ServiceCardProps {
  service: typeof services[0];
  index: number;
}

function ServiceCard({ service, index }: ServiceCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Link href={service.href}>
        <div
          data-testid={`card-service-${service.id}`}
          className="group relative overflow-hidden rounded-md bg-ora-sand cursor-pointer"
        >
          <div className="aspect-[4/5] overflow-hidden">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="font-serif text-xl md:text-2xl text-white mb-2">
              {service.title}
            </h3>
            <p className="text-white/80 text-sm mb-4 line-clamp-2">
              {service.description}
            </p>
            <span className="inline-flex items-center gap-2 text-white text-sm font-medium group-hover:gap-3 transition-all">
              Explore
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ServicesOverviewSection() {
  return (
    <Section id="services-overview" className="bg-ora-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Our Signature Services"
          subtitle="Tailored treatments designed for transformation, not transaction. Each service is a ritual crafted with intention and care."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/services">
            <Button
              data-testid="button-view-all-services"
              variant="outline"
              className="border-ora-smoke text-ora-fog hover:bg-ora-bone px-8"
            >
              View All Services
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}
