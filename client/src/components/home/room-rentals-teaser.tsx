import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import roomRentalImage from "@assets/ora-hallway.jpg";

const features = [
  "Fully equipped treatment rooms",
  "Reception and booking support",
  "Access to Ora's client base",
  "Marketing and social media exposure",
  "Flexible rental terms",
];

export function RoomRentalsTeaserSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section id="room-rentals-teaser" className="bg-ora-bone overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-ora-milk rounded-lg -z-10 hidden lg:block" />
            <img
              src={roomRentalImage}
              alt="Professional treatment room for rent"
              className="w-full h-auto rounded-md shadow-xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-ora-taupe font-medium text-sm uppercase tracking-wider">
              For Practitioners
            </span>
            <h2 className="font-serif text-display-sm md:text-display text-foreground mt-2 mb-6">
              Your Space to Grow
            </h2>
            <p className="text-ora-fog text-lg leading-relaxed mb-6">
              Are you a beauty or wellness professional looking for a premium
              space to practice? Ora offers luxurious, fully-equipped treatment
              rooms available for daily, monthly, or yearly rental.
            </p>
            <p className="text-ora-fog leading-relaxed mb-8">
              Join a community of wellness professionals in the heart of
              Manchester. Elevate your practice in a space designed for success.
            </p>

            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 text-ora-fog"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ora-taupe/20 flex items-center justify-center">
                    <Check size={12} className="text-ora-taupe" />
                  </span>
                  {feature}
                </motion.li>
              ))}
            </ul>

            <Link href="/room-rentals">
              <Button
                data-testid="button-room-rentals-cta"
                className="bg-ora-taupe text-white hover:bg-ora-fog px-8 group"
              >
                Learn More About Room Rentals
                <ArrowRight
                  size={16}
                  className="ml-2 transition-transform group-hover:translate-x-1"
                />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
