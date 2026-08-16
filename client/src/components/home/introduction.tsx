import { Link } from "wouter";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import receptionImage from "@assets/ora-logo-wax-seal.jpg";

export function IntroductionSection() {
  return (
    <Section id="introduction" className="bg-ora-milk">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="font-serif text-display-sm md:text-display text-foreground mb-6">
              A Sanctuary for Wellness
            </h2>
            <div className="space-y-5 text-ora-fog leading-relaxed">
              <p className="text-lg">
                Ora is more than a beauty clinic—it's a holistic wellness destination
                for those who invest in themselves. From advanced aesthetics and cosmetic
                procedures to manicures, hair services, and laser treatments, every
                detail is crafted to help you transform, rejuvenate, and reclaim your
                confidence in the heart of Manchester.
              </p>
              <p>
                We believe beauty is not something you chase—it's something you
                cultivate. From the inside out. With intention. With care. With time.
              </p>
              <p>
                This is your space. To breathe. To transform. To become.
              </p>
            </div>
            <Link href="/about">
              <Button
                data-testid="button-discover-story"
                variant="outline"
                className="mt-8 border-ora-smoke text-ora-fog hover:bg-ora-bone px-8"
              >
                Discover Our Story
              </Button>
            </Link>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-ora-bone rounded-lg -z-10" />
              <img
                src={receptionImage}
                alt="A client arriving at ORÁ Suites, Manchester"
                className="w-full h-auto rounded-md shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
