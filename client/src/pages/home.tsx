import { Layout } from "@/components/layout/layout";
import { HeroSection } from "@/components/home/hero";
import { IntroductionSection } from "@/components/home/introduction";
import { ServicesOverviewSection } from "@/components/home/services-overview";
import { RoomRentalsTeaserSection } from "@/components/home/room-rentals-teaser";
import { ResultsShowcaseSection } from "@/components/home/results-showcase";
import { TikTokCarouselSection } from "@/components/home/tiktok-carousel";
import { TestimonialsSection } from "@/components/home/testimonials";
import { LocationSection } from "@/components/home/location";
import { CTASection } from "@/components/home/cta";
import { useSEO, defaultBusinessJsonLd } from "@/hooks/use-seo";

export default function HomePage() {
  useSEO({
    title: "ORÁ Suites | Women-Only Beauty & Wellness Sanctuary, Deansgate Manchester",
    description:
      "ORÁ Suites is Manchester's women-only sanctuary for beauty and wellness at 45 Deansgate — nurse-led aesthetics, luxury nails and private treatment rooms. Book a consultation.",
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
      <TikTokCarouselSection />
      <TestimonialsSection />
      <LocationSection />
      <CTASection />
    </Layout>
  );
}
