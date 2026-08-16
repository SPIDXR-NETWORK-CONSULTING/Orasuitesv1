import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Instagram, ArrowRight, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, easeLuxury } from "@/lib/motion";
import { Eyebrow, ComingSoonBadge } from "@/components/ui/glass";
import { categories } from "@/lib/catalogue";
import logoImage from "@assets/ora-logo-new.jpg";

const explore = [
  { href: "/services", label: "Services" },
  { href: "/book", label: "Book" },
  { href: "/room-rentals", label: "Room Rentals" },
  { href: "/results", label: "Results" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const INSTAGRAM_URL = "https://www.instagram.com/ora_beauty_mcr/";

function EmailListPill() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/email-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" ? (
          <motion.p
            key="ok"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeLuxury }}
            className="inline-flex items-center gap-2 rounded-full border border-ora-bronze/40 bg-ora-bronze/10 px-5 py-3 text-[0.9375rem] text-ora-cream"
          >
            <Check size={16} className="text-ora-bronze" /> You're on the list.
          </motion.p>
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: easeLuxury }}
            className={cn(
              "flex w-full max-w-md items-center gap-1 rounded-full border p-1 pl-5 transition-[border-color,box-shadow] duration-450 ease-luxury",
              "glass-pill focus-within:border-ora-bronze focus-within:shadow-glow-bronze",
              status === "error" && "border-destructive/60",
            )}
          >
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              autoComplete="email"
              className="min-w-0 flex-1 bg-transparent font-sans text-[0.9375rem] text-ora-cream placeholder:text-ora-smoke/80 outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              aria-label="Join the list"
              className="focus-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-ora-taupe px-4 text-[0.8125rem] font-medium text-ora-cream transition-[background-color,box-shadow] duration-450 ease-luxury hover:bg-ora-bronze hover:shadow-glow-bronze disabled:opacity-60"
            >
              {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <>Join <ArrowRight size={14} /></>}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {status === "error" && (
        <p role="alert" className="mt-2 text-[0.8125rem] text-ora-smoke">
          Something went wrong — please try again.
        </p>
      )}
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-testid="footer" className="band-dark mesh-bg-dark grain relative overflow-hidden">
      {/* email band */}
      <div className="relative z-[2] border-b border-ora-cream/10">
        <Stagger className="mx-auto grid w-full max-w-wide gap-8 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr] md:items-center md:py-16 lg:px-12">
          <Reveal inherit>
            <Eyebrow as="p" rule className="mb-4">
              Stay in the loop
            </Eyebrow>
            <p className="font-display text-display-sm text-ora-cream">
              New treatments, quiet openings, <em className="italic text-ora-bronze">occasional</em> offers.
            </p>
          </Reveal>
          <Reveal inherit className="md:justify-self-end w-full md:max-w-md">
            <EmailListPill />
          </Reveal>
        </Stagger>
      </div>

      {/* columns */}
      <Stagger className="relative z-[2] mx-auto grid w-full max-w-wide grid-cols-2 gap-x-6 gap-y-12 px-5 py-16 sm:px-8 md:py-20 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:gap-x-12 lg:px-12">
        <Reveal inherit className="col-span-2 lg:col-span-1">
          <Link href="/" aria-label="ORÁ Suites — home" className="focus-ring inline-block rounded-xl">
            <img
              src={logoImage}
              alt="ORÁ Suites"
              width={160}
              height={56}
              loading="lazy"
              decoding="async"
              className="h-14 w-auto rounded-lg object-contain"
            />
          </Link>
          <p className="mt-6 max-w-xs font-display text-[1.375rem] leading-snug text-ora-cream">
            Manchester's women-only sanctuary for beauty & wellness.
          </p>
          <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-ora-smoke">
            Nurse-led aesthetics, luxury nails and private treatment rooms — by appointment, on Deansgate.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-instagram"
              aria-label="ORÁ on Instagram"
              className="focus-ring glass-pill inline-flex h-11 w-11 items-center justify-center text-ora-cream hover:text-ora-bronze"
            >
              <Instagram size={18} strokeWidth={1.5} />
            </a>
          </div>
        </Reveal>

        <Reveal inherit>
          <h4 className="eyebrow mb-5">Explore</h4>
          <ul className="space-y-3">
            {explore.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  data-testid={`link-footer-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="focus-ring group relative inline-block text-[0.9375rem] text-ora-cream/80 transition-colors duration-450 hover:text-ora-cream"
                >
                  {l.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-ora-bronze transition-transform duration-450 ease-luxury group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal inherit>
          <h4 className="eyebrow mb-5">Services</h4>
          <ul className="space-y-3">
            {categories.map((c) =>
              c.live ? (
                <li key={c.id}>
                  <Link
                    href={`/services#${c.id}`}
                    className="focus-ring group relative inline-block text-[0.9375rem] text-ora-cream/80 transition-colors duration-450 hover:text-ora-cream"
                  >
                    {c.title}
                    <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-ora-bronze transition-transform duration-450 ease-luxury group-hover:scale-x-100" />
                  </Link>
                </li>
              ) : (
                <li key={c.id} className="flex items-center gap-2.5 text-[0.9375rem] text-ora-cream/40" aria-label={`${c.title} — coming soon`}>
                  <span>{c.title}</span>
                  <ComingSoonBadge label="Soon" className="px-2 py-0.5 text-[0.5625rem] opacity-70" />
                </li>
              ),
            )}
          </ul>
        </Reveal>

        <Reveal inherit>
          <h4 className="eyebrow mb-5">Visit</h4>
          <address className="not-italic space-y-3 text-[0.9375rem] leading-relaxed text-ora-cream/80">
            <p>
              45 Deansgate
              <br />
              Manchester M3 2AY
            </p>
            <p>
              <a href="mailto:admin@orasuites.com" className="focus-ring transition-colors duration-450 hover:text-ora-cream">
                admin@orasuites.com
              </a>
            </p>
            <p>
              Mon–Sat 9–7
              <br />
              <span className="text-ora-smoke">Women-only · By appointment</span>
            </p>
          </address>
        </Reveal>
      </Stagger>

      {/* bottom bar */}
      <div className="relative z-[2] border-t border-ora-cream/10">
        <div className="mx-auto flex w-full max-w-wide flex-col items-start justify-between gap-3 px-5 py-6 text-[0.8125rem] text-ora-smoke sm:flex-row sm:items-center sm:px-8 lg:px-12">
          <p>© ORÁ Suites {year}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="focus-ring transition-colors duration-450 hover:text-ora-cream">
              Privacy
            </Link>
            <Link href="/terms" className="focus-ring transition-colors duration-450 hover:text-ora-cream">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
