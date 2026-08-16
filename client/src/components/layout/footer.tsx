import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Instagram, ArrowRight, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, easeLuxury } from "@/lib/motion";
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
    <div className="w-full text-center">
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
              "mx-auto flex w-full max-w-md items-center gap-1 rounded-full border p-1 pl-5 transition-[border-color,box-shadow] duration-450 ease-luxury",
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
    <footer data-testid="footer" className="band-dark relative overflow-hidden">
      {/* email band */}
      <div className="relative z-[2] border-b border-ora-cream/10">
        <Stagger className="mx-auto flex w-full max-w-content flex-col items-center gap-5 px-5 py-12 text-center sm:px-8 lg:px-12">
          <Reveal inherit>
            <p className="font-display text-display-sm text-ora-cream">Stay in the loop</p>
            <p className="mt-1 text-[0.875rem] text-ora-smoke">New treatments and occasional offers.</p>
          </Reveal>
          <Reveal inherit className="flex w-full justify-center">
            <EmailListPill />
          </Reveal>
        </Stagger>
      </div>

      {/* links */}
      <Stagger className="relative z-[2] mx-auto flex w-full max-w-content flex-col items-center gap-7 px-5 py-12 text-center sm:px-8 lg:px-12">
        <Reveal inherit>
          <Link href="/" aria-label="ORÁ Suites — home" className="focus-ring inline-block rounded-xl">
            <img
              src={logoImage}
              alt="ORÁ Suites"
              width={160}
              height={56}
              loading="lazy"
              decoding="async"
              className="h-11 w-auto rounded-lg object-contain"
            />
          </Link>
        </Reveal>

        <Reveal inherit as="nav" aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {explore.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  data-testid={`link-footer-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="focus-ring group relative inline-block text-[0.9rem] text-ora-cream/80 transition-colors duration-450 hover:text-ora-cream"
                >
                  {l.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-ora-bronze transition-transform duration-450 ease-luxury group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal inherit>
          <address className="not-italic text-[0.875rem] leading-relaxed text-ora-smoke">
            49 Deansgate, Manchester M3 2AY
            <span className="mx-2 text-ora-bronze/60">·</span>
            Mon–Sat 9–7
            <span className="mx-2 text-ora-bronze/60">·</span>
            <a href="mailto:admin@orasuites.com" className="focus-ring transition-colors duration-450 hover:text-ora-cream">
              admin@orasuites.com
            </a>
          </address>
        </Reveal>

        <Reveal inherit>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-instagram"
            aria-label="ORÁ on Instagram"
            className="focus-ring glass-pill inline-flex h-10 w-10 items-center justify-center text-ora-cream hover:text-ora-bronze"
          >
            <Instagram size={17} strokeWidth={1.5} />
          </a>
        </Reveal>
      </Stagger>

      {/* bottom bar */}
      <div className="relative z-[2] border-t border-ora-cream/10">
        <div className="mx-auto flex w-full max-w-content flex-col items-center justify-center gap-2 px-5 py-5 text-[0.8125rem] text-ora-smoke sm:flex-row sm:gap-6 sm:px-8 lg:px-12">
          <p>© ORÁ Suites {year}</p>
          <div className="flex items-center gap-5">
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
