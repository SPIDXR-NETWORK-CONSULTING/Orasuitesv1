import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { MapPin, Mail, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";

import heroBannerImage from "@assets/contact-hero-nails.jpg";

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, service: "" }),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle size={28} className="text-ora-taupe" />
        <p className="font-medium text-foreground">Message received!</p>
        <p className="text-sm text-ora-fog">We'll get back to you within 24 hours.</p>
        <button onClick={() => setStatus("idle")} className="text-xs text-ora-fog underline mt-1">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="c-name" className="text-sm text-foreground">Name *</Label>
        <Input id="c-name" value={form.name} onChange={update("name")} placeholder="Jane Smith" required className="mt-1 bg-white border-ora-greige focus:border-ora-taupe" />
      </div>
      <div>
        <Label htmlFor="c-email" className="text-sm text-foreground">Email *</Label>
        <Input id="c-email" type="email" value={form.email} onChange={update("email")} placeholder="jane@example.com" required className="mt-1 bg-white border-ora-greige focus:border-ora-taupe" />
      </div>
      <div>
        <Label htmlFor="c-phone" className="text-sm text-foreground">Phone</Label>
        <Input id="c-phone" type="tel" value={form.phone} onChange={update("phone")} placeholder="+44 7700 900000" className="mt-1 bg-white border-ora-greige focus:border-ora-taupe" />
      </div>
      <div>
        <Label htmlFor="c-message" className="text-sm text-foreground">Message *</Label>
        <Textarea id="c-message" value={form.message} onChange={update("message")} placeholder="How can we help you?" rows={4} required className="mt-1 bg-white border-ora-greige focus:border-ora-taupe resize-none" />
      </div>
      {status === "error" && <p className="text-sm text-red-500">Something went wrong. Please try again.</p>}
      <Button type="submit" disabled={status === "loading"} className="w-full bg-ora-taupe text-white hover:bg-ora-fog">
        {status === "loading" ? <><Loader2 size={16} className="animate-spin mr-2" /> Sending…</> : "Send Message"}
      </Button>
    </form>
  );
}

export default function ContactPage() {
  useSEO({
    title: "Contact Us | ORÁ. - Manchester's Premier Wellness Sanctuary",
    description: "Get in touch with Ora Suites. Book a consultation, ask questions, or inquire about room rentals. Located in Manchester city centre.",
  });

  return (
    <Layout>
      <section className="relative h-[50vh] min-h-[360px] flex items-end overflow-hidden">
        <img
          src={heroBannerImage}
          alt="ORÁ Suites — Contact"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-display-sm md:text-display text-white mb-3">
              Get in Touch
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Ready to begin your transformation? Book a consultation or send us a
              message. We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <Section className="bg-ora-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
                Contact Information
              </h2>

              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4 p-5 bg-ora-milk rounded-md">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-ora-bone flex items-center justify-center">
                    <MapPin size={20} className="text-ora-taupe" />
                  </span>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Address</h4>
                    <p className="text-ora-fog text-sm" data-testid="text-address">
                      45 Deansgate, Manchester
                      <br />
                      M3 2AY, England
                    </p>
                  </div>
                </div>

<div className="flex items-start gap-4 p-5 bg-ora-milk rounded-md">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-ora-bone flex items-center justify-center">
                    <Mail size={20} className="text-ora-taupe" />
                  </span>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Email</h4>
                    <a
                      href="mailto:admin@orasuites.com"
                      data-testid="link-email"
                      className="text-ora-fog text-sm hover:text-ora-taupe transition-colors"
                    >
                      admin@orasuites.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-ora-milk rounded-md">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-ora-bone flex items-center justify-center">
                    <Clock size={20} className="text-ora-taupe" />
                  </span>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      Opening Hours
                    </h4>
                    <p className="text-ora-fog text-sm" data-testid="text-hours">
                      Monday - Saturday: 9am - 7pm
                      <br />
                      Sunday: By Appointment Only
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-md">
                <iframe
                  title="ORÁ Suites location"
                  src="https://www.google.com/maps?q=45+Deansgate+Manchester+M3+2AY&output=embed"
                  className="w-full h-48 border-0"
                  loading="lazy"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
                Book or Message Us
              </h2>

              <div className="bg-ora-milk rounded-md p-8">
                <h3 className="font-serif text-xl text-foreground mb-2">Book Online</h3>
                <p className="text-ora-fog text-sm mb-5">
                  Choose your treatment, pick a time, and confirm your appointment in minutes.
                </p>
                <Link href="/book">
                  <Button className="w-full bg-ora-taupe text-white hover:bg-ora-fog py-5 text-base mb-6">
                    Book an Appointment →
                  </Button>
                </Link>
                <div className="border-t border-ora-greige pt-6">
                  <p className="text-sm font-medium text-foreground mb-4">Or send us a message:</p>
                  <ContactForm />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
