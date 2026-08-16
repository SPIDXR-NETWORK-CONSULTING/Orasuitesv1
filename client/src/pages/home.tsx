import { Layout } from "@/components/layout/layout";
import { HeroSection } from "@/components/home/hero";
import { IntroductionSection } from "@/components/home/introduction";
import { ServicesOverviewSection } from "@/components/home/services-overview";
import { RoomRentalsTeaserSection } from "@/components/home/room-rentals-teaser";
import { ResultsShowcaseSection } from "@/components/home/results-showcase";
import { TikTokCarouselSection } from "@/components/home/tiktok-carousel";
import { TestimonialsSection } from "@/components/home/testimonials";
import { LocationSection } from "@/components/home/location";
import { useSEO, defaultBusinessJsonLd } from "@/hooks/use-seo";

export default function HomePage() {
  useSEO({
    title: "ORÁ Suites | Nurse-led Aesthetics & Luxury Nails, Deansgate Manchester",
    description:
      "ORÁ Suites — beauty & wellness sanctuary at 45 Deansgate, Manchester. Nurse-led aesthetics, luxury nails and private treatment rooms. Book online.",
    path: "/",
    jsonLd: defaultBusinessJsonLd(),
  });

  return (
    <Layout>
      <HeroSection />
      <IntroductionSection />
      <ServicesOverviewSection />
      <RoomRentalsTeaserSection />
      <ResultsShowcaseSection />
      <TestimonialsSection />
      <LocationSection />
      <TikTokCarouselSection />
    </Layout>
  );
}
