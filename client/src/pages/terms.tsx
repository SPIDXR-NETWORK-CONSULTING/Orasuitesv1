import { Layout } from "@/components/layout/layout";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

export default function TermsPage() {
  useSEO({
    title: "Terms of Service | ORÁ.",
    description: "Terms of Service for ORÁ Suites — booking, cancellation, and deposit policies.",
  });

  return (
    <Layout>
      <section className="pt-32 pb-16 bg-ora-milk">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">Terms of Service</h1>
            <p className="text-ora-smoke text-sm mb-10">Last updated: June 2026</p>

            <div className="prose prose-sm max-w-none text-ora-fog space-y-6">
              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">1. Booking & Appointments</h2>
                <p>All appointments must be booked through our online booking system, by phone, or by email. A booking is only confirmed once a 20% deposit has been received. We reserve the right to release unconfirmed bookings.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">2. Deposits</h2>
                <p>A non-refundable 20% deposit is required to secure all appointments. This deposit is deducted from the total treatment cost at the time of your appointment. The remaining balance is due on the day of your appointment.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">3. Cancellations & No-Shows</h2>
                <p><strong className="text-foreground">24-hour cancellation policy:</strong> Cancellations made with less than 24 hours' notice will result in full forfeiture of the deposit. No refunds will be issued for late cancellations or no-shows.</p>
                <p className="mt-2">Cancellations made more than 24 hours in advance may receive their deposit as credit toward a future appointment, at our discretion.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">4. Rescheduling</h2>
                <p>Appointments may be rescheduled with at least 24 hours' notice at no charge. Rescheduling within 24 hours may incur a rescheduling fee at our discretion.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">5. Health & Safety</h2>
                <p>Clients are responsible for disclosing any relevant medical conditions, allergies, or contraindications prior to treatment. ORÁ Suites reserves the right to refuse or modify treatments in the interest of client safety. We are not liable for adverse reactions arising from undisclosed conditions.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">6. Pricing</h2>
                <p>All prices are displayed on our website and are subject to change without notice. Prices are inclusive of VAT where applicable.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">7. Room Rentals</h2>
                <p>Room rental agreements are governed by separate contracts. Please contact us directly for terms relating to practitioner room hire.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">8. Complaints</h2>
                <p>We take client satisfaction seriously. If you have a complaint, please contact us at <a href="mailto:hello@orasuites.com" className="text-ora-taupe underline">hello@orasuites.com</a> within 7 days of your appointment. We will investigate and respond within 5 working days.</p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-foreground mb-3">9. Governing Law</h2>
                <p>These terms are governed by the laws of England and Wales.</p>
              </section>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
