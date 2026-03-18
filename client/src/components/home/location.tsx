import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock, Navigation, ArrowRight } from "lucide-react";
import manchesterImage from "@assets/manchester-location_1770213665902.png";

const contactInfo = [
  {
    Icon: MapPin,
    label: "Address",
    value: "Manchester City Centre",
    sub: "Greater Manchester, UK",
    href: "https://maps.google.com/?q=Manchester+City+Centre+UK",
  },
  {
    Icon: Phone,
    label: "Phone",
    value: "+44 (0) 123 456 7890",
    sub: "Mon–Sat · 9am–7pm",
    href: "tel:+441234567890",
  },
  {
    Icon: Mail,
    label: "Email",
    value: "admin@orasuites.com",
    sub: "We respond within 24h",
    href: "mailto:admin@orasuites.com",
  },
  {
    Icon: Clock,
    label: "Hours",
    value: "Mon – Sat: 9am – 7pm",
    sub: "Sunday: By Appointment",
    href: null,
  },
];

export function LocationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="location"
      className="py-20 md:py-28"
      style={{ background: "hsl(var(--ora-milk))" }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="mb-12">
          <p
            className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
            Find Us
          </p>
          <h2
            className="font-display text-4xl sm:text-5xl text-foreground leading-tight"
            style={{ fontWeight: 300, letterSpacing: "0.02em" }}
          >
            In the Heart of{" "}
            <span style={{ fontStyle: "italic" }}>Manchester.</span>
          </h2>
          <p className="text-ora-fog text-base font-light mt-3 max-w-xl">
            Conveniently located in Manchester city centre. Your accessible sanctuary for beauty and wellness.
          </p>
        </div>

        <div
          ref={ref}
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-xl img-zoom"
          >
            <img
              src={manchesterImage}
              alt="Manchester city skyline — Ora Suites location"
              className="w-full h-auto rounded-xl"
              loading="lazy"
            />
            {/* Warm overlay */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: "linear-gradient(to bottom, transparent 50%, rgba(18,12,8,0.5) 100%)",
              }}
            />
            {/* Location pin overlay */}
            <div className="absolute bottom-5 left-5">
              <div className="glass-card-warm px-4 py-2.5 flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 pulse-dot"
                  style={{ background: "var(--ora-bronze)" }}
                >
                  <MapPin size={12} color="white" />
                </div>
                <div>
                  <p className="text-white text-xs font-medium" style={{ letterSpacing: "0.04em" }}>
                    Ora Suites
                  </p>
                  <p className="text-white/50 text-[10px] font-light">Manchester City Centre</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {/* Info cards grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {contactInfo.map(({ Icon, label, value, sub, href }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                      <div className="glass-card-warm p-4 flex items-start gap-3.5 group cursor-pointer hover:border-[rgba(185,136,103,0.3)] transition-colors duration-300">
                        <div
                          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ background: "var(--ora-bronze-muted)" }}
                        >
                          <Icon size={16} style={{ color: "var(--ora-bronze)" }} />
                        </div>
                        <div>
                          <p className="text-[10px] tracking-[0.2em] uppercase font-light mb-0.5" style={{ color: "rgba(185,136,103,0.6)" }}>
                            {label}
                          </p>
                          <p className="text-foreground text-sm font-light group-hover:text-[var(--ora-bronze)] transition-colors" style={{ letterSpacing: "0.01em" }}>
                            {value}
                          </p>
                          <p className="text-ora-fog text-[11px] font-light mt-0.5">{sub}</p>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div className="glass-card-warm p-4 flex items-start gap-3.5">
                      <div
                        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: "var(--ora-bronze-muted)" }}
                      >
                        <Icon size={16} style={{ color: "var(--ora-bronze)" }} />
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.2em] uppercase font-light mb-0.5" style={{ color: "rgba(185,136,103,0.6)" }}>
                          {label}
                        </p>
                        <p className="text-foreground text-sm font-light">{value}</p>
                        <p className="text-ora-fog text-[11px] font-light mt-0.5">{sub}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="https://maps.google.com/?q=Manchester+City+Centre+UK"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <button
                  data-testid="button-get-directions"
                  className="w-full px-6 py-3.5 text-sm font-medium inline-flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "var(--ora-bronze)",
                    color: "white",
                    borderRadius: "9999px",
                    letterSpacing: "0.06em",
                  }}
                >
                  <Navigation size={15} /> Get Directions
                </button>
              </a>

              <Link href="/contact" className="flex-1">
                <button
                  data-testid="button-book-treatment"
                  className="w-full glass-pill px-6 py-3.5 text-sm font-medium hover-bronze inline-flex items-center justify-center gap-2"
                  style={{ color: "hsl(var(--ora-fog))", letterSpacing: "0.06em" }}
                >
                  Book Treatment <ArrowRight size={13} />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
