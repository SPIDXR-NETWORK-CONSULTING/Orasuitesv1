import { Layout } from "@/components/layout/layout";
import { useSEO } from "@/hooks/use-seo";

export default function PrivacyPage() {
  useSEO({
    title: "Privacy Policy | ORÁ. Suites Manchester",
    description:
      "How Ora Suites collects, uses, and protects your personal information. GDPR-compliant privacy practices.",
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
            Privacy Policy
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
          className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-16 prose prose-neutral"
          style={{ "--tw-prose-body": "hsl(var(--ora-fog))", color: "hsl(var(--ora-fog))" } as React.CSSProperties}
        >
          <div className="space-y-10 text-base font-light leading-relaxed">

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                1. Who We Are
              </h2>
              <p>
                Ora Suites ("we", "our", "us") is a women's luxury wellness and beauty sanctuary
                based in Manchester, UK. We are the data controller responsible for your personal
                information. You can contact us at{" "}
                <a href="mailto:hello@orasuites.co.uk" style={{ color: "var(--ora-bronze)" }}>
                  hello@orasuites.co.uk
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                2. What Information We Collect
              </h2>
              <p>We may collect the following information when you use our website or book a treatment:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Name, email address, and phone number</li>
                <li>Appointment preferences and treatment history</li>
                <li>Health information relevant to your treatment (provided voluntarily)</li>
                <li>Payment information (processed securely through Stripe — we do not store card details)</li>
                <li>Website usage data (cookies and analytics)</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                3. How We Use Your Information
              </h2>
              <p>We use your data to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Process and manage your bookings and appointments</li>
                <li>Send appointment confirmations, reminders, and aftercare advice</li>
                <li>Respond to your enquiries and provide customer support</li>
                <li>Send marketing communications (only with your consent)</li>
                <li>Improve our website and services through anonymised analytics</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                4. Legal Basis for Processing
              </h2>
              <p>
                We process your data under the following lawful bases: (a) contract performance — to
                fulfil your bookings; (b) legitimate interests — to improve our services and communicate
                with you; (c) consent — for marketing communications; (d) legal obligation — where
                required by law.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                5. Who We Share Your Data With
              </h2>
              <p>
                We do not sell your personal data. We may share it with trusted third-party service
                providers who assist us in operating our business, including: booking platform (GoHighLevel),
                payment processor (Stripe), email service provider, and analytics providers. All
                third parties are contractually bound to protect your data.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                6. How Long We Keep Your Data
              </h2>
              <p>
                We retain your personal data for as long as necessary to provide our services and
                comply with legal obligations. Typically, booking records are kept for 7 years for
                financial and compliance purposes. You may request deletion at any time.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                7. Your Rights
              </h2>
              <p>Under UK GDPR, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate data</li>
                <li>Request erasure of your data</li>
                <li>Object to or restrict certain processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, email us at{" "}
                <a href="mailto:hello@orasuites.co.uk" style={{ color: "var(--ora-bronze)" }}>
                  hello@orasuites.co.uk
                </a>
                . You also have the right to lodge a complaint with the Information Commissioner's
                Office (ICO) at{" "}
                <span style={{ color: "var(--ora-bronze)" }}>ico.org.uk</span>.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                8. Cookies
              </h2>
              <p>
                We use essential cookies to make our website function and analytics cookies to
                understand how visitors use our site. You can manage cookie preferences at any time
                via the cookie banner or your browser settings.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 400 }}>
                9. Changes to This Policy
              </h2>
              <p>
                We may update this policy from time to time. We will notify you of significant
                changes by email or a prominent notice on our website. The date at the top of this
                page reflects the most recent update.
              </p>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
