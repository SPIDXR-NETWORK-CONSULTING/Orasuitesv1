import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import lipFiller1 from "@assets/result-lip-filler-1.jpg";
import hydrofacialImg from "@assets/result-hydrofacial.jpg";

const results = [
  {
    id: 1,
    treatment: "Lip Filler",
    description: "Natural volume and definition — before & after",
    image: lipFiller1,
  },
  {
    id: 2,
    treatment: "HydraFacial",
    description: "Deep cleanse, exfoliation and targeted hydration",
    image: hydrofacialImg,
  },
];

export function ResultsShowcaseSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section id="results" className="bg-ora-milk">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Real Results, Real Confidence"
          subtitle="Every transformation tells a story of renewed confidence. See the results our clients have achieved through our expert treatments."
        />

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-md bg-ora-sand">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={result.image}
                    alt={`${result.treatment} before and after`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg text-foreground">
                  {result.treatment}
                </h3>
                <p className="text-ora-fog text-sm mt-1">{result.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/results">
            <Button
              data-testid="button-view-more-results"
              variant="outline"
              className="border-ora-smoke text-ora-fog hover:bg-ora-bone px-8"
            >
              View More Results
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}
