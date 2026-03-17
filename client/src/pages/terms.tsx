import { Layout } from "@/components/layout/layout";
import { useSEO } from "@/hooks/use-seo";

export default function TermsPage() {
  useSEO({
    title: "Terms & Conditions | ORÁ. Suites Manchester",
    description:
      "Terms and conditions for booking treatments, using our services, and visiting Ora Suites in Manchester.",
  });

  return (
    <Layout>
      {/* Hero */}
      <section
        className="pt-32 pb-16"
        style={{ background: "hsl(var(--ora-bone))" }}
      >
        <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
          <p
            className="text-xs tracking-[0.25em] uppercase mb-4 font-light"
            style={{ color: "var(--ora-bronze)" }}
          >
            Legal
          </p>
          <h1
            className="font-display text-5xl sm:text-6xl text-foreground leading-tight"
            style={{ fontWeight: 300, letterSpacing: "0.02em" }}
          >
            Terms &amp; Conditions
          </h1>
          <p className="text-ora-fog text-base font-light mt-4">
            Last updated: March 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section
        className="py-16 pb-32"
        style={{ background: "hsl(var(--ora-milk))" }}
      >
        <div
          className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-16"
          style={{ color: "hsl(var(--ora-fog))" } as React.CSSProperties}
        >
          <div className="space-y-10 text-base font-light leading-relaxed">

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                1. Introduction
              </h2>
              <p>
                These Terms and Conditions govern your use of the Ora Suites website and the booking
                and receipt of treatments and services. By booking a treatment or using our website,
                you agree to these terms. Please read them carefully.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                2. Bookings & Appointments
              </h2>
              <p>
                All bookings are subject to availability. A booking is confirmed only once you receive
                a written confirmation from us. We reserve the right to decline any booking at our
                discretion.
              </p>
              <p className="mt-4">
                For first-time clients, certain treatments may require a consultation or patch test
                before proceeding. We will advise you of this at the time of booking.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                3. Cancellation & No-Show Policy
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cancellations made 48+ hours before your appointment: no charge.</li>
                <li>Cancellations made 24–48 hours before: 50% of treatment price.</li>
                <li>Cancellations made less than 24 hours before, or no-shows: full treatment price charged.</li>
                <li>Korean Head Spa rituals and packages require 72 hours' notice for cancellation.</li>
              </ul>
              <p className="mt-4">
                We understand circumstances change — if you experience an emergency, please contact us
                as soon as possible and we will do our best to accommodate you.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                4. Pricing & Payments
              </h2>
              <p>
                All prices are listed in GBP and include VAT where applicable. Prices are subject to
                change without notice, but confirmed bookings will honour the price at the time of
                booking. Payment is due at the time of treatment unless otherwise agreed.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                5. Health & Safety
              </h2>
              <p>
                It is your responsibility to disclose any relevant medical conditions, allergies, or
                medications before your treatment. Ora Suites reserves the right to refuse or modify a
                treatment if we believe it poses a risk to your health or the health of our staff.
              </p>
              <p className="mt-4">
                Certain treatments are not suitable during pregnancy. Please inform us at the time of
                booking if you are pregnant or trying to conceive.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                6. Women-Only Policy
              </h2>
              <p>
                Ora Suites is a women-only sanctuary. All clients and visitors must identify as women
                to access our services and premises. We operate this policy to provide a safe and
                comfortable environment for all our clients.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                7. Memberships
              </h2>
              <p>
                Membership terms are as agreed at the point of sign-up. Memberships are
                non-transferable. Monthly memberships require 30 days' notice for cancellation.
                Unused sessions within a membership period do not carry over.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                8. Room Rental Terms
              </h2>
              <p>
                Practitioners renting space at Ora Suites are bound by a separate Practitioner
                Agreement issued upon acceptance. Key terms include: practitioners are responsible
                for their own insurance, client interactions, and professional standards; Ora Suites
                is not liable for client outcomes from a visiting practitioner's treatments.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                9. Liability
              </h2>
              <p>
                Ora Suites is not liable for any loss, damage, or injury arising from treatments
                where you have failed to disclose relevant health information. Our liability is
                limited to the value of the treatment received. Nothing in these terms excludes
                liability for death or personal injury caused by negligence.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                10. Governing Law
              </h2>
              <p>
                These terms are governed by the laws of England and Wales. Any disputes shall be
                subject to the exclusive jurisdiction of the English courts.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                11. Contact
              </h2>
              <p>
                For any questions about these terms, please email us at{" "}
                <a href="mailto:hello@orasuites.co.uk" style={{ color: "var(--ora-bronze)" }}>
                  hello@orasuites.co.uk
                </a>
                .
              </p>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
