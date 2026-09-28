import { Layout } from "@/components/layout/layout";
import { HeroSection } from "@/components/home/hero";
import { IntroductionSection } from "@/components/home/introduction";
import { ServicesOverviewSection } from "@/components/home/services-overview";
import { RoomRentalsTeaserSection } from "@/components/home/room-rentals-teaser";
import { TestimonialsSection } from "@/components/home/testimonials";
import { LocationSection } from "@/components/home/location";
import { useSEO, defaultBusinessJsonLd } from "@/hooks/use-seo";

export default function HomePage() {
  useSEO({
    title: "ORÁ Suites | Nails, Hair, Makeup & Beauty — Deansgate Manchester",
    description:
      "ORÁ Suites — beauty & wellness sanctuary at 49 Deansgate, Manchester. Luxury nails, hair, makeup and beauty, IV wellness drips and private treatment rooms. Book online.",
    path: "/",
    jsonLd: defaultBusinessJsonLd(),
  });

  return (
    <Layout>
      <HeroSection />
      <IntroductionSection />
      <ServicesOverviewSection />
      <RoomRentalsTeaserSection />
      <TestimonialsSection />
      <LocationSection />
    </Layout>
  );
}
