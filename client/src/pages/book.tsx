/**
 * /book — ORÁ Suites online booking (v2, restraint pass).
 * Light page (milk mesh + grain), header in light mode, centred 4-step flow
 * (Service → Time → Details → Confirm) with a slim summary rail on lg+ and a
 * bottom sheet on mobile.
 */
import { Layout } from "@/components/layout/layout";
import { Container } from "@/components/ui/section";
import { useSEO, servicesJsonLd, breadcrumbJsonLd, SITE_URL } from "@/hooks/use-seo";
import { allServices } from "@/lib/catalogue";
import { BookingFlow } from "@/components/booking/booking-flow";
import { BookingSoon } from "@/components/booking/booking-soon";
import { BOOKING_ENABLED, bookingUnlocked } from "@/config/booking";
import { motion } from "framer-motion";
import { useMotionSafe } from "@/lib/motion";

export default function BookPage() {
  const m = useMotionSafe();

  useSEO({
    title: "Book an Appointment | ORÁ Suites Manchester",
    description:
      "Book nurse-led aesthetics and luxury nail treatments online at ORÁ Suites, 49 Deansgate, Manchester. Choose your treatment and a time in four quick steps.",
    path: "/book",
    jsonLd: [
      breadcrumbJsonLd([{ name: "Book", path: "/book" }]),
      servicesJsonLd(
        allServices()
          .filter((s) => s.live)
          .map((s) => ({ name: s.name, price: s.price, category: s.categoryTitle, url: `${SITE_URL}/book?service=${encodeURIComponent(s.id)}` })),
        `${SITE_URL}/book`,
      ),
    ],
  });

  return (
    <Layout lightHeader padTop>
      <div className="mesh-bg grain relative min-h-screen pb-28 lg:pb-20">
        <Container className="pt-4 md:pt-8">
          <motion.header variants={m.stagger(0.06)} initial="hidden" animate="show" className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
            <motion.h1
              variants={m.fadeUp}
              className="font-display text-[clamp(1.9rem,3.2vw,2.75rem)] font-normal leading-[1.15] tracking-[-0.01em] text-foreground"
            >
              Book an appointment
            </motion.h1>
            <motion.p variants={m.fadeUp} className="mt-2 font-sans text-[0.9375rem] text-ora-fog">
              {bookingUnlocked() ? "49 Deansgate, Manchester · four quick steps." : "49 Deansgate, Manchester"}
            </motion.p>
          </motion.header>

          {bookingUnlocked() ? <BookingFlow /> : <BookingSoon />}
        </Container>
      </div>
    </Layout>
  );
}
