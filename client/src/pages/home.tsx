import { Layout } from "@/components/layout/layout";
import { HeroSection } from "@/components/home/hero";
import { IntroductionSection } from "@/components/home/introduction";
import { ServicesOverviewSection } from "@/components/home/services-overview";
import { KoreanHeadSpaFeature } from "@/components/home/korean-head-spa-feature";
import { RoomRentalsTeaserSection } from "@/components/home/room-rentals-teaser";
import { ResultsShowcaseSection } from "@/components/home/results-showcase";
import { TestimonialsSection } from "@/components/home/testimonials";
import { LocationSection } from "@/components/home/location";
import { CTASection } from "@/components/home/cta";
import { useSEO } from "@/hooks/use-seo";

export default function HomePage() {
  useSEO({
    title: "ORÁ. | Women's Luxury Wellness & Beauty Sanctuary Manchester",
    description: "A sanctuary for women. Premium aesthetics, hair, nails, Korean Head Spa, and the UK's most elevated 18-step scalp ritual. Book your ritual in Manchester.",
  });

  return (
    <Layout>
      <HeroSection />
      <IntroductionSection />
      <ServicesOverviewSection />
      <KoreanHeadSpaFeature />
      <RoomRentalsTeaserSection />
      <ResultsShowcaseSection />
      <TestimonialsSection />
      <LocationSection />
      <CTASection />
    </Layout>
  );
}
