import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/ora-hero-zebra-crossing.jpg";

export function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      data-testid="section-cta"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Ora Suites atmosphere"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-serif text-display-sm md:text-display lg:text-display-lg text-white mb-6">
            Ready to Transform Your Wellness?
          </h2>
          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Book your appointment today and experience Manchester's most
            elevated beauty sanctuary.
          </p>
          <Link href="/book">
            <Button
              data-testid="button-cta-book"
              size="lg"
              className="bg-white text-ora-fog hover:bg-white/90 font-medium px-10 py-6 text-base"
            >
              Book Your Treatment Now
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
