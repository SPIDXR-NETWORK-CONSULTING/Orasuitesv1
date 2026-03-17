import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import heroImage from "@assets/hero-image_1770213665902.png";

export function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const headline = "Begin Your Journey.".split(" ");

  return (
    <section
      ref={ref}
      data-testid="section-cta"
      className="relative py-24 md:py-36 overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Ora Suites atmosphere"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Deep dark overlay with warm radial */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,7,4,0.82) 0%, rgba(18,12,8,0.75) 100%), radial-gradient(ellipse at 50% 80%, rgba(70,45,28,0.4) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 text-center">
        {/* Word-by-word headline reveal */}
        <div className="mb-6 overflow-hidden">
          <div className="flex flex-wrap justify-center gap-x-4">
            {headline.map((word, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={isInView ? { y: "0%", opacity: 1 } : {}}
                transition={{
                  duration: 0.9,
                  delay: i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block font-display text-4xl sm:text-5xl md:text-6xl text-white"
                style={{ fontWeight: 300, letterSpacing: "0.02em" }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-white/55 text-lg md:text-xl mb-10 font-light leading-relaxed"
        >
          Book your first treatment and experience
          <br className="hidden sm:block" /> Manchester's most intentional wellness sanctuary.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/contact">
            <button
              data-testid="button-cta-book"
              className="px-9 py-4 text-sm font-medium transition-all"
              style={{
                background: "var(--ora-bronze)",
                color: "white",
                borderRadius: "9999px",
                letterSpacing: "0.06em",
                border: "1px solid var(--ora-bronze)",
              }}
            >
              Book a Treatment
            </button>
          </Link>

          <Link href="/korean-head-spa">
            <button
              className="glass-pill px-9 py-4 text-sm font-medium hover-bronze transition-all"
              style={{ color: "white", letterSpacing: "0.06em" }}
            >
              Reserve a Ritual →
            </button>
          </Link>

          <Link href="/services">
            <button
              className="text-white/40 text-sm px-4 py-4 hover:text-white/70 transition-colors font-light hidden lg:block"
              style={{ letterSpacing: "0.04em" }}
            >
              Explore Services
            </button>
          </Link>
        </motion.div>

        {/* Divider + tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-14"
        >
          <p
            className="font-display text-sm tracking-[0.15em] uppercase"
            style={{ color: "rgba(185,136,103,0.5)" }}
          >
            ORÁ. · Manchester
          </p>
        </motion.div>
      </div>
    </section>
  );
}
