import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import roomRentalImage from "@assets/room-rental_1770215241478.png";

const features = [
  "Fully equipped treatment rooms",
  "Reception and booking support",
  "Access to Ora's client base",
  "Marketing and social media exposure",
  "Flexible rental terms (hourly / daily / monthly)",
];

export function RoomRentalsTeaserSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="room-rentals-teaser"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: "hsl(var(--ora-bone))" }}
    >
      {/* Dot grid background — parallaxes subtly */}
      <div
        className="absolute inset-0 dot-grid-bg opacity-60"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div
          ref={ref}
          className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -48 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative img-zoom rounded-xl overflow-hidden"
          >
            <img
              src={roomRentalImage}
              alt="Professional treatment room for rent at Ora Suites"
              className="w-full h-auto rounded-xl"
              loading="lazy"
            />
            {/* Warm tint overlay */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: "var(--overlay-subtle)" }}
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 48 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
              style={{ color: "var(--ora-bronze)" }}
            >
              For Practitioners
            </p>

            <h2
              className="font-display text-4xl sm:text-5xl text-foreground mb-6 leading-tight"
              style={{ fontWeight: 300, letterSpacing: "0.02em" }}
            >
              Your Space to{" "}
              <span style={{ fontStyle: "italic" }}>Grow.</span>
            </h2>

            <p className="text-ora-fog text-base font-light leading-relaxed mb-8">
              A premium space for women wellness professionals in the heart of
              Manchester. Fully equipped rooms, reception support, and a
              community that elevates your practice.
            </p>

            {/* Feature list — glass card */}
            <div className="glass-card-warm p-6 mb-8 space-y-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3"
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--ora-bronze-muted)" }}
                  >
                    <Check size={11} style={{ color: "var(--ora-bronze)" }} />
                  </span>
                  <span className="text-ora-fog text-sm font-light">{feature}</span>
                </motion.div>
              ))}
            </div>

            <Link href="/room-rentals">
              <button
                data-testid="button-room-rentals-cta"
                className="glass-pill px-8 py-3.5 text-sm font-medium hover-bronze transition-all inline-flex items-center gap-2"
                style={{ color: "hsl(var(--ora-fog))", letterSpacing: "0.04em" }}
              >
                Learn More About Room Rentals
                <ArrowRight size={14} />
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
