import { Layout } from "@/components/layout/layout";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

export default function PrivacyPage() {
  useSEO({
    title: "Privacy Policy | ORÁ.",
    description: "Privacy Policy for ORÁ Suites — how we collect, use, and protect your personal data.",
  });

  return (
    <Layout>
      <section className="pt-32 pb-16 bg-ora-milk">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">Privacy Policy</h1>
            <p className="text-ora-smoke text-sm mb-10">Last updated: June 2026</p>

            <div className="prose prose-sm max-w-none text-ora-fog space-y-6">
              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">1. Who We Are</h2>
                <p>ORÁ Suites is a women's wellness sanctuary based in Manchester, UK. When you use our website or book an appointment, you are sharing personal data with us. We take your privacy seriously and are committed to protecting it.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">2. Data We Collect</h2>
                <p>We may collect the following information:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Name, email address, and phone number (when you book or contact us)</li>
                  <li>Appointment details and service preferences</li>
                  <li>Payment information (processed securely by our payment provider — we do not store card details)</li>
                  <li>Any notes or health information you voluntarily provide regarding your treatment</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">3. How We Use Your Data</h2>
                <p>We use your data to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Confirm and manage your appointments</li>
                  <li>Send appointment reminders and follow-ups</li>
                  <li>Process payments and deposits</li>
                  <li>Respond to enquiries</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">4. Data Sharing</h2>
                <p>We do not sell your personal data. We may share data with trusted third-party services that help us operate (e.g., booking software, payment processors, email providers). These parties are contractually obligated to handle your data in accordance with GDPR.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">5. Data Retention</h2>
                <p>We retain your data for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data at any time by contacting us.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">6. Your Rights</h2>
                <p>Under UK GDPR you have the right to: access, correct, delete, or restrict the processing of your personal data. To exercise any of these rights, contact us at <a href="mailto:hello@orasuites.com" className="text-ora-taupe underline">hello@orasuites.com</a>.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">7. Cookies</h2>
                <p>Our website may use cookies to improve your browsing experience. We do not use tracking cookies for advertising purposes.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">8. Contact</h2>
                <p>For privacy-related enquiries: <a href="mailto:hello@orasuites.com" className="text-ora-taupe underline">hello@orasuites.com</a></p>
              </section>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
