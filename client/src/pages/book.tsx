/**
 * /book — ORÁ Suites online booking.
 * Light page (milk mesh + grain), header in light mode, single-column stepper
 * with a sticky summary rail on lg+ and a bottom sheet on mobile.
 */
import { Layout } from "@/components/layout/layout";
import { Container } from "@/components/ui/section";
import { Eyebrow, DisplayHeading } from "@/components/ui/glass";
import { useSEO, servicesJsonLd, breadcrumbJsonLd, SITE_URL } from "@/hooks/use-seo";
import { allServices } from "@/lib/catalogue";
import { BookingFlow } from "@/components/booking/booking-flow";
import { motion } from "framer-motion";
import { useMotionSafe } from "@/lib/motion";

export default function BookPage() {
  const m = useMotionSafe();

  useSEO({
    title: "Book an Appointment | ORÁ Suites Manchester",
    description:
      "Book nurse-led aesthetics and luxury nail treatments online at ORÁ Suites — Manchester's women-only sanctuary at 45 Deansgate. Choose your treatment, practitioner and time.",
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
      <div className="mesh-bg grain relative min-h-screen pb-32 lg:pb-24">
        <Container className="pt-6 md:pt-10">
          <motion.header
            variants={m.stagger(0.08)}
            initial="hidden"
            animate="show"
            className="mb-10 max-w-3xl md:mb-14"
          >
            <Eyebrow reveal as="p" rule className="mb-5">
              Online booking · 45 Deansgate
            </Eyebrow>
            <DisplayHeading as="h1" size="lg" inherit className="text-display-lg">
              {"Book your\nappointment."}
            </DisplayHeading>
            <motion.p variants={m.fadeUp} className="lede mt-5 max-w-xl">
              Nurse-led aesthetics and luxury nails, in Manchester's women-only sanctuary. Five quick steps.
            </motion.p>
          </motion.header>

          <BookingFlow />
        </Container>
      </div>
    </Layout>
  );
}
