import { Layout } from "@/components/layout/layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";

import heroBannerImage from "@assets/result-hero-contour.jpg";
import lipFiller1 from "@assets/result-lip-filler-new.jpg";
import polynucleotideImg from "@assets/service-polynucleotide.jpg";
import hydrofacialImg from "@assets/result-hydrofacial.jpg";
import underEyeImg from "@assets/result-under-eye-new.jpg";
import microneedlingImg from "@assets/result-microneedling.jpg";
import chinFillerImg from "@assets/result-chin-filler.jpg";

const results = [
  {
    id: 1,
    treatment: "Lip Filler",
    description: "Natural volume and definition with precise placement",
    category: "Aesthetics",
    image: lipFiller1,
  },
  {
    id: 2,
    treatment: "Polynucleotide Therapy",
    description: "Advanced skin regeneration — Ora practitioner at work",
    category: "Aesthetics",
    image: polynucleotideImg,
  },
  {
    id: 3,
    treatment: "Under Eye Filler",
    description: "Tear trough correction for refreshed, rested eyes",
    category: "Aesthetics",
    image: underEyeImg,
  },
  {
    id: 4,
    treatment: "HydraFacial",
    description: "Deep cleanse, exfoliation and targeted hydration",
    category: "Skin",
    image: hydrofacialImg,
  },
  {
    id: 5,
    treatment: "Chin Filler",
    description: "Profile enhancement and facial balance with expert contouring",
    category: "Aesthetics",
    image: chinFillerImg,
  },
  {
    id: 6,
    treatment: "Microneedling",
    description: "Collagen induction therapy for skin texture and lasting radiance",
    category: "Skin",
    image: microneedlingImg,
  },
];

export default function ResultsPage() {
  useSEO({
    title: "Before & After Results | ORÁ. Manchester",
    description: "See real before and after results from Ora Suites treatments. Profhilo, dermal fillers, laser hair removal, and more aesthetic transformations.",
  });

  return (
    <Layout>
      <section className="relative h-[50vh] min-h-[360px] flex items-end overflow-hidden">
        <img
          src={heroBannerImage}
          alt="ORÁ Suites — Results"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-display-sm md:text-display text-white mb-3">
              Real Results, Real Confidence
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Every transformation tells a story of renewed confidence. See what's
              possible with expert care and personalised treatment plans.
            </p>
          </motion.div>
        </div>
      </section>

      <Section className="bg-ora-milk">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                data-testid={`card-result-${result.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-md bg-ora-sand">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={result.image}
                      alt={`${result.treatment} result`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-ora-milk/90 backdrop-blur-sm rounded-full text-xs font-medium text-ora-fog">
                      {result.category}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-serif text-lg text-foreground" data-testid={`text-result-title-${result.id}`}>
                    {result.treatment}
                  </h3>
                  <p className="text-ora-fog text-sm mt-1">{result.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <section className="py-20 bg-ora-bone">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              Your Transformation Awaits
            </h2>
            <p className="text-ora-fog mb-8">
              Book a consultation with our experts to discuss your goals and create
              a personalised treatment plan.
            </p>
            <Link href="/book">
              <Button
                data-testid="button-results-book"
                className="bg-ora-taupe text-white hover:bg-ora-fog px-8"
              >
                Book Your Consultation
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Section className="bg-ora-milk">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Important Information"
            subtitle="Results vary by individual. Here's what you should know."
          />

          <div className="prose prose-ora max-w-none text-ora-fog">
            <div className="bg-ora-sand rounded-md p-6 md:p-8 space-y-4" data-testid="text-disclaimer">
              <p>
                <strong className="text-foreground">Individual Results May Vary:</strong>{" "}
                The results shown on this page are examples of what our treatments can
                achieve. Individual results depend on various factors including skin
                type, age, lifestyle, and adherence to post-treatment care instructions.
              </p>
              <p>
                <strong className="text-foreground">Consultation Required:</strong>{" "}
                All aesthetic treatments at Ora begin with a thorough consultation. Our
                practitioners will assess your suitability for treatment and discuss
                realistic expectations.
              </p>
              <p>
                <strong className="text-foreground">Client Consent:</strong>{" "}
                All before and after images are shared with express permission from our
                clients. We respect privacy and confidentiality.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
