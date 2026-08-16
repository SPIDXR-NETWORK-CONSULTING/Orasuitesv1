import { Layout } from "@/components/layout/layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Calendar, Users, Sparkles, Shield } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

import roomRentalHero from "@assets/ora-hallway.jpg";
import roomRentalPractitioner from "@assets/room-rental-practitioner.jpg";
import roomRentalIncluded from "@assets/room-rental-included.jpg";
import roomRentalWelcome from "@assets/room-rental-welcome.jpg";

const features = [
  {
    icon: Sparkles,
    title: "Fully Equipped Rooms",
    description:
      "State-of-the-art treatment rooms with premium equipment, linens, and amenities included.",
  },
  {
    icon: Users,
    title: "Client Base Access",
    description:
      "Tap into Ora's established client base and benefit from our marketing and referrals.",
  },
  {
    icon: Calendar,
    title: "Flexible Terms",
    description:
      "Choose from half-day, full day, or monthly rentals to match your practice needs.",
  },
  {
    icon: Shield,
    title: "Professional Support",
    description:
      "Reception services, booking management, and administrative support included.",
  },
];

const includedAmenities = [
  "Fully furnished treatment room",
  "Professional-grade treatment bed",
  "Storage facilities",
  "High-speed WiFi",
  "Reception and waiting area access",
  "Booking and scheduling support",
  "Marketing exposure on Ora channels",
  "Access to shared facilities",
  "Towels and linens provided",
  "Climate-controlled environment",
];

const pricingPlans = [
  {
    name: "Half Day",
    price: "£75",
    period: "per half day",
    description: "Perfect for occasional sessions",
    features: ["Up to 4 hours", "All amenities included", "Same-day booking available"],
  },
  {
    name: "Full Day",
    price: "£130",
    period: "per day",
    description: "Ideal for regular practitioners",
    popular: true,
    features: ["Full day access (9am–7pm)", "Priority booking", "Marketing inclusion"],
  },
  {
    name: "Monthly",
    price: "£1,200",
    period: "per month",
    description: "Best for established practitioners",
    features: ["Dedicated room", "Full access", "Premium marketing", "Client referrals"],
  },
];

const serviceTypes = [
  "Massage Therapy",
  "IV Drip Therapy",
  "Aesthetic Treatments",
  "Consultations",
  "Hair & Beauty",
  "Holistic Wellness",
  "Other",
];

function EnquiryForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    serviceType: "",
    hasInsurance: "" as "yes" | "no" | "",
    duration: "",
    startDate: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Minimum date = today + 2 days
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split("T")[0];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const message = [
      `Service Type: ${formData.serviceType}`,
      `Professional Insurance: ${formData.hasInsurance}`,
      `Preferred Duration: ${formData.duration}`,
      `Preferred Start Date: ${formData.startDate}`,
      formData.notes ? `Additional Notes: ${formData.notes}` : "",
      "[Room Rental Enquiry]",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          service: formData.serviceType,
          message,
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12 px-6 bg-ora-sand rounded-md">
        <p className="font-serif text-2xl text-foreground mb-2">Thank you.</p>
        <p className="text-ora-fog">We'll be in touch within 24 hours.</p>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 bg-white border border-ora-greige rounded text-ora-fog text-sm placeholder:text-ora-smoke focus:outline-none focus:border-ora-taupe transition-colors";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className={labelClass}>Full Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="hello@yourpractice.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Phone *</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          value={formData.phone}
          onChange={handleChange}
          className={inputClass}
          placeholder="+44 7000 000000"
        />
      </div>

      <div>
        <label htmlFor="serviceType" className={labelClass}>Type of Service *</label>
        <select
          id="serviceType"
          name="serviceType"
          required
          value={formData.serviceType}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="" disabled>Select your specialism</option>
          {serviceTypes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <p className={labelClass}>Professional Insurance *</p>
        <div className="flex gap-6">
          {(["yes", "no"] as const).map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hasInsurance"
                value={val}
                checked={formData.hasInsurance === val}
                onChange={handleChange}
                className="accent-ora-taupe"
                required
              />
              <span className="text-sm text-ora-fog capitalize">{val}</span>
            </label>
          ))}
        </div>
        {formData.hasInsurance === "no" && (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-4 py-3 leading-relaxed">
            Professional insurance is required to rent a room at ORÁ. Please ensure
            you are fully covered before enquiring.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="duration" className={labelClass}>Preferred Duration *</label>
        <select
          id="duration"
          name="duration"
          required
          value={formData.duration}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="" disabled>Select rental period</option>
          <option value="Half Day">Half Day</option>
          <option value="Full Day">Full Day</option>
          <option value="Monthly Rental">Monthly Rental</option>
        </select>
      </div>

      <div>
        <label htmlFor="startDate" className={labelClass}>Preferred Start Date *</label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          required
          min={minDateStr}
          value={formData.startDate}
          onChange={handleChange}
          className={inputClass}
        />
        <p className="text-xs text-ora-smoke mt-1">Minimum 48 hours notice required.</p>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Additional Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={formData.notes}
          onChange={handleChange}
          className={inputClass}
          placeholder="Tell us a little about your practice and any specific requirements..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting || formData.hasInsurance === "no"}
        className="w-full bg-ora-taupe text-white hover:bg-ora-fog disabled:opacity-50 disabled:cursor-not-allowed py-3"
        data-testid="button-submit-enquiry"
      >
        {submitting ? "Sending…" : "Send Enquiry"}
      </Button>
    </form>
  );
}

export default function RoomRentalsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });

  useSEO({
    title: "Room Rentals for Practitioners | ORÁ. Manchester",
    description: "Rent a fully equipped treatment room at Ora Suites Manchester. Flexible half-day, full-day, and monthly options for beauty and wellness practitioners.",
  });

  return (
    <Layout>
      {/* Full-bleed hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end overflow-hidden">
        <img
          src={roomRentalHero}
          alt="ORÁ Suites — Room Rentals"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-white/70 font-medium text-sm uppercase tracking-wider">For Practitioners</span>
            <h1 className="font-serif text-display-sm md:text-display text-white mt-1 mb-3">
              Your Space to Grow
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Premium treatment rooms in Manchester for independent wellness professionals.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-ora-milk">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={heroRef} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
                Why Practice at ORÁ?
              </h2>
              <p className="text-ora-fog text-lg leading-relaxed mb-6">
                ORÁ Suites offers fully equipped, beautifully designed treatment
                rooms for independent practitioners. Whether you're a massage
                therapist, IV drip specialist, aesthetic injector, wellness coach,
                or consultation practitioner — this is your space to flourish.
              </p>
              <p className="text-ora-fog leading-relaxed mb-8">
                You bring your expertise and your clients. ORÁ provides the premium
                environment, the brand credibility, and the support infrastructure.
                Elevate your practice in a sanctuary designed for excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#enquiry-form">
                  <Button
                    data-testid="button-apply-now"
                    className="bg-ora-taupe text-white hover:bg-ora-fog px-8"
                  >
                    Apply Now
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </a>
                <Link href="/contact">
                  <Button
                    data-testid="button-book-tour"
                    variant="outline"
                    className="border-ora-smoke text-ora-fog hover:bg-ora-bone px-8"
                  >
                    Book a Tour
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-ora-bone rounded-lg -z-10" />
                <img
                  src={roomRentalPractitioner}
                  alt="Practitioner performing treatment at ORÁ Suites"
                  className="w-full h-auto rounded-md shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Section className="bg-ora-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Why Choose ORÁ?"
            subtitle="Everything you need to run a successful practice, all in one beautiful space."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-center p-6 bg-ora-milk rounded-md"
              >
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ora-bone mb-4">
                  <feature.icon size={24} className="text-ora-taupe" />
                </span>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-ora-fog text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-ora-milk">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <img
                src={roomRentalIncluded}
                alt="ORÁ Suites — fully equipped treatment room"
                className="w-full h-auto rounded-md shadow-lg"
              />
            </div>
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
                What's Included
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {includedAmenities.map((amenity, index) => (
                  <motion.div
                    key={amenity}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="flex items-center gap-3"
                    data-testid={`amenity-${amenity.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ora-taupe/20 flex items-center justify-center">
                      <Check size={12} className="text-ora-taupe" />
                    </span>
                    <span className="text-ora-fog text-sm">{amenity}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="pricing" className="bg-ora-bone">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Flexible Pricing"
            subtitle="Choose the rental option that best fits your practice needs."
          />

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                data-testid={`card-pricing-${plan.name.toLowerCase().replace(/\s+/g, "-")}`}
                className={`relative p-8 rounded-md bg-ora-milk ${
                  plan.popular ? "ring-2 ring-ora-taupe" : ""
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-ora-taupe text-white text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-serif text-xl text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-ora-fog text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="font-serif text-4xl text-foreground" data-testid={`price-${plan.name.toLowerCase().replace(/\s+/g, "-")}`}>
                    {plan.price}
                  </span>
                  <span className="text-ora-fog text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-ora-fog text-sm">
                      <Check size={14} className="text-ora-taupe flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href="#enquiry-form">
                  <Button
                    data-testid={`button-pricing-${plan.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`w-full ${
                      plan.popular
                        ? "bg-ora-taupe text-white hover:bg-ora-fog"
                        : "bg-ora-bone text-ora-fog hover:bg-ora-greige"
                    }`}
                  >
                    Get Started
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-ora-milk">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
                Who We Welcome
              </h2>
              <p className="text-ora-fog leading-relaxed mb-4">
                ORÁ is a destination for excellence. We welcome independent
                professionals who share our commitment to quality, discretion, and
                client experience. Our practitioners include:
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Massage therapists and bodywork specialists",
                  "IV drip therapy practitioners",
                  "Aesthetic nurses and injectors",
                  "Wellness coaches and consultation practitioners",
                  "Hair and beauty professionals",
                  "Holistic and naturopathic therapists",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-ora-fog text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ora-taupe/20 flex items-center justify-center">
                      <Check size={12} className="text-ora-taupe" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-ora-fog leading-relaxed text-sm italic">
                All practitioners must hold valid professional insurance and
                relevant qualifications. We reserve the right to request evidence
                of credentials before confirming any rental agreement.
              </p>
            </div>
            <div>
              <img
                src={roomRentalWelcome}
                alt="ORÁ Suites — welcoming professional practitioners"
                className="w-full h-auto rounded-md shadow-lg"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section id="enquiry-form" className="bg-ora-sand scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Room Rental Enquiry"
            subtitle="Complete the form below and we'll be in touch within 24 hours to discuss your requirements."
          />
          <div className="bg-ora-milk rounded-md p-8 shadow-sm">
            <EnquiryForm />
          </div>
        </div>
      </Section>
    </Layout>
  );
}
