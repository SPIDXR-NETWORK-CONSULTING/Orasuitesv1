/**
 * Shown on /book while online booking is switched off (see @/config/booking).
 * Calm, on-brand, and still useful: the client can email or call the clinic.
 */
import { motion } from "framer-motion";
import { CalendarClock, Mail, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Eyebrow, GlassCard, IconOrb } from "@/components/ui/glass";
import { useMotionSafe } from "@/lib/motion";
import { BOOKING_SOON_COPY as C } from "@/config/booking";

export function BookingSoon() {
  const m = useMotionSafe();
  return (
    <motion.div variants={m.stagger(0.07)} initial="hidden" animate="show" className="mx-auto max-w-xl">
      <GlassCard tone="warm" padding="lg" className="text-center" inherit>
        <motion.div variants={m.fadeUp} className="flex justify-center">
          <IconOrb size="lg" aria-hidden>
            <CalendarClock />
          </IconOrb>
        </motion.div>

        <motion.div variants={m.fadeUp} className="mt-5">
          <Eyebrow>{C.eyebrow}</Eyebrow>
        </motion.div>

        <motion.h2
          variants={m.fadeUp}
          className="mt-2 font-display text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-[1.15] tracking-[-0.01em] text-foreground"
        >
          {C.heading}
        </motion.h2>

        <motion.p variants={m.fadeUp} className="mx-auto mt-3 max-w-md font-sans text-[0.9375rem] leading-relaxed text-ora-fog">
          {C.line}
        </motion.p>

        <motion.div variants={m.fadeUp} className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="primary" size="lg">
            <a href="mailto:admin@orasuites.com?subject=Appointment%20enquiry" data-testid="link-booking-soon-email">
              <Mail className="h-4 w-4" aria-hidden />
              Email us
            </a>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/contact" data-testid="link-booking-soon-contact">
              <MessageSquare className="h-4 w-4" aria-hidden />
              Send a message
            </Link>
          </Button>
        </motion.div>

        <motion.p variants={m.fadeUp} className="mt-6 font-sans text-[0.8125rem] text-ora-fog">
          Prices and treatments are on our{" "}
          <Link href="/services" className="text-ora-bronze underline-offset-4 hover:underline">
            services page
          </Link>
          .
        </motion.p>
      </GlassCard>
    </motion.div>
  );
}
