import { Layout } from "@/components/layout/layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Sparkles, Users } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

import receptionImage from "@assets/ora-hallway.jpg";
import heroImage from "@assets/ora-hero-zebra-crossing.jpg";
import megImage from "@assets/about-meg-ceo.jpg";
import coffeeImage from "@assets/community-coffee.jpg";
import newspaperImage from "@assets/community-newspaper.jpg";

const values = [
  {
    icon: Heart,
    title: "Intentional Care",
    description:
      "Every treatment is performed with intention and attention to detail. We believe beauty should be cultivated, not rushed.",
  },
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Your wellbeing is our priority. All treatments are performed by trained, certified professionals using the highest quality products.",
  },
  {
    icon: Sparkles,
    title: "Transformation",
    description:
      "We're not just about treatments—we're about helping you feel confident, radiant, and empowered in your own skin.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Ora is more than a clinic. It's a community of wellness-conscious individuals supporting one another on their self-care journeys.",
  },
];

export default function AboutPage() {
  const storyRef = useRef<HTMLDivElement>(null);
  const isStoryInView = useInView(storyRef, { once: true, margin: "-100px" });

  useSEO({
    title: "About Us | ORÁ. - Manchester's Premier Wellness Sanctuary",
    description: "Learn about Ora Suites, Manchester's premier beauty and wellness sanctuary. Discover our story and the values dedicated to your transformation.",
  });

  return (
    <Layout>
      {/* Full-bleed hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end overflow-hidden">
        <img
          src={heroImage}
          alt="ORÁ Suites — Manchester"
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
              About Ora
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Where beauty meets intention. Where care becomes ritual. A sanctuary
              for those who invest in themselves.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story section */}
      <Section className="bg-ora-milk">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={storyRef} className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isStoryInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
                This is Ora
              </h2>
              <div className="space-y-5 text-ora-fog leading-relaxed">
                <p className="text-lg">
                  Ora is not a clinic. It's a sanctuary. A space where
                  wellness-conscious individuals come to pause, breathe, and transform.
                  Where every treatment is a ritual. Where care is intentional.
                  Where you are seen, heard, and held.
                </p>
                <p>
                  We believe beauty is not something you chase—it's something you
                  cultivate. From the inside out. With intention. With care. With
                  time.
                </p>
                <p>
                  Founded in Manchester, Ora was created to fill a gap in the
                  wellness industry—a space where people could receive advanced
                  aesthetic treatments, luxurious beauty services, and holistic
                  wellness care all under one roof, in an environment designed
                  for excellence and discretion.
                </p>
                <p className="font-serif text-xl text-foreground italic" data-testid="text-quote">
                  "This is your space. To breathe. To transform. To become."
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={isStoryInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-ora-bone rounded-lg -z-10" />
                <img
                  src={receptionImage}
                  alt="ORÁ Suites hallway — Manchester"
                  className="w-full h-auto rounded-md shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Meet Meg — CEO & Lead Nurse Practitioner */}
      <Section className="bg-ora-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-ora-taupe text-sm font-medium tracking-widest uppercase mb-3">Meet the Expert Behind ORÁ</p>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground">
              Meg Cauli
            </h2>
            <p className="text-ora-fog mt-2">CEO & Lead Nurse Practitioner</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <div className="space-y-5 text-ora-fog leading-relaxed">
                <p className="text-lg text-foreground font-serif italic">
                  "With nearly 10 years of experience in the industry, I commenced my career as a skincare expert and medical-grade skincare specialist."
                </p>
                <p>
                  My dedication to delivering professional and medically-focused treatments took root during this period. Having completed advanced studies in aesthetics and cosmetology, I consistently enhance my skills to provide you with cutting-edge services.
                </p>
                <p>
                  My passion lies in the gratification of individuals experiencing their optimal selves, all while adhering to a natural and health-conscious approach to filler and anti-aging injections.
                </p>
                <div className="pt-4 border-t border-ora-greige">
                  <p className="text-sm text-ora-smoke">
                    <span className="font-medium text-foreground">Specialisms:</span> Advanced Injectables · Medical-Grade Skincare · Anti-Aging Treatments · Natural Filler Techniques
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="order-1 lg:order-2"
            >
              <div className="relative max-w-sm mx-auto lg:mx-0 lg:ml-auto">
                <div className="absolute -inset-4 bg-ora-bone rounded-lg -z-10" />
                <img
                  src={megImage}
                  alt="Meg Cauli — CEO & Lead Nurse Practitioner at ORÁ Suites"
                  className="w-full h-auto rounded-md shadow-lg object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Community & Sanctuary section */}
      <Section className="bg-ora-milk">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-ora-taupe text-sm font-medium tracking-widest uppercase mb-3">A Space for Everyone</p>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              More Than a Salon. A Community.
            </h2>
            <p className="text-ora-fog max-w-2xl mx-auto">
              ORÁ is a place where all walks of life are welcome — mothers, young adults, practitioners, everyday people.
              A space designed not just for treatments, but for connection.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="overflow-hidden rounded-md"
            >
              <img
                src={newspaperImage}
                alt="Clients relaxing at ORÁ Suites — reading the ORÁ Gazette"
                className="w-full h-72 object-cover object-top"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="overflow-hidden rounded-md"
            >
              <img
                src={coffeeImage}
                alt="ORÁ branded refreshments — matcha and community"
                className="w-full h-72 object-cover"
              />
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                title: "Come as You Are",
                body: "Whether you're a busy mum, a young professional, or someone simply in need of a moment to yourself — ORÁ was built for you. No pressure. No judgement. Just care.",
              },
              {
                title: "Refreshments on Us",
                body: "We believe self-care starts the moment you walk through our door. Enjoy complimentary refreshments while you wait — matcha, herbal teas, and more — because your time here should feel like a treat from start to finish.",
              },
              {
                title: "A Place to Connect",
                body: "ORÁ is a gathering space as much as it is a treatment space. Come alone, leave with a community. We host soft events, social mornings, and practitioner meet-ups throughout the year.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-ora-sand rounded-md p-6"
              >
                <h3 className="font-serif text-lg text-foreground mb-3">{item.title}</h3>
                <p className="text-ora-fog text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Values */}
      <Section className="bg-ora-bone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Our Values"
            subtitle="The principles that guide everything we do at Ora."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                data-testid={`card-value-${value.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-center p-6"
              >
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-ora-milk mb-4">
                  <value.icon size={28} className="text-ora-taupe" />
                </span>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-ora-fog text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="py-20 bg-ora-sand">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              Ready to Experience Ora?
            </h2>
            <p className="text-ora-fog mb-8">
              Book your first treatment and discover why wellness-conscious individuals
              across Manchester choose Ora as their sanctuary.
            </p>
            <Link href="/book">
              <Button
                data-testid="button-about-book"
                className="bg-ora-taupe text-white hover:bg-ora-fog px-8"
              >
                Book Your Treatment
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
