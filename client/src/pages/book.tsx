import { Layout } from "@/components/layout/layout";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";

export default function BookPage() {
  useSEO({
    title: "Book an Appointment | ORÁ Suites",
    description: "Book your treatment at ORÁ Suites, Manchester's premier wellness sanctuary at 45 Deansgate.",
  });

  return (
    <Layout>
      <div className="min-h-screen bg-ora-milk pt-24 pb-16 flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-ora-smoke text-xs tracking-widest uppercase mb-6">ORÁ Suites · 45 Deansgate, Manchester</p>

            <div className="w-10 h-px bg-ora-greige mx-auto mb-8" />

            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-5">
              Online Booking<br />Coming Soon
            </h1>

            <p className="text-ora-fog text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Our online booking system is currently being updated. In the meantime, please get in touch and we'll arrange your appointment directly.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <span className="inline-flex items-center justify-center px-7 py-3 bg-ora-taupe text-white text-sm font-medium rounded-md hover:bg-ora-chocolate transition-colors duration-200 cursor-pointer">
                  Send an Enquiry
                </span>
              </Link>
              <a
                href="mailto:admin@orasuites.com"
                className="inline-flex items-center justify-center px-7 py-3 bg-ora-bone text-ora-taupe text-sm font-medium rounded-md hover:bg-ora-greige transition-colors duration-200"
              >
                Email Us
              </a>
            </div>

            <div className="mt-12 pt-8 border-t border-ora-greige">
              <p className="text-ora-smoke text-xs">
                admin@orasuites.com · 45 Deansgate, Manchester
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
