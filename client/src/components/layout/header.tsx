import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMotionSafe, spring, easeLuxury } from "@/lib/motion";
import logoImage from "@assets/ora-logo-new.jpg";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/room-rentals", label: "Room Rentals" },
  { href: "/about", label: "About" },
  { href: "/results", label: "Results" },
  { href: "/contact", label: "Contact" },
];

/**
 * Routes whose hero is dark imagery → header starts transparent with cream text.
 * Pages with a light top (e.g. /book, /privacy) get the dark-on-light treatment.
 * Page agents: add/remove routes here if a hero changes tone (or add `.on-dark`
 * handling via the `data-header="light"` attribute below).
 */
const DARK_HERO_ROUTES = ["/", "/services", "/about", "/results", "/room-rentals", "/contact"];

export function Header() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const m = useMotionSafe();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));
  useEffect(() => setScrolled(window.scrollY > 24), []);

  useEffect(() => setOpen(false), [location]);

  // lock body scroll when the overlay is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const [pageForcesLight, setPageForcesLight] = useState(false);
  useEffect(() => {
    // pages may opt out of the transparent/cream header with <main data-header="light"> or any element [data-header="light"]
    setPageForcesLight(!!document.querySelector('[data-header="light"]'));
  }, [location]);
  const overDark = !scrolled && !open && !pageForcesLight && DARK_HERO_ROUTES.includes(location);
  /** cream text: over a dark hero, or while the dark overlay menu is open */
  const cream = overDark || open;
  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  return (
    <>
      <motion.header
        data-testid="header"
        initial={m.reduced ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: easeLuxury }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,padding] duration-700 ease-luxury",
          scrolled && !open
            ? "border-b border-glass-border bg-ora-milk/70 backdrop-blur-glass shadow-[0_10px_40px_-20px_rgba(15,9,8,.35)] supports-[backdrop-filter]:bg-ora-milk/60"
            : "border-b border-transparent bg-transparent",
          cream && "on-dark",
        )}
      >
        <div className={cn("mx-auto flex w-full max-w-wide items-center justify-between gap-4 px-5 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-12 transition-[padding] duration-700 ease-luxury", scrolled ? "py-2.5" : "py-4 md:py-5")}>
          <Link href="/" data-testid="link-home-logo" aria-label="ORÁ Suites — home" className="focus-ring rounded-xl lg:justify-self-start">
            <motion.img
              src={logoImage}
              alt="ORÁ Suites"
              width={160}
              height={56}
              animate={{ height: scrolled ? 36 : 44 }}
              transition={{ duration: 0.6, ease: easeLuxury }}
              className="w-auto object-contain rounded-lg"
              style={{ height: scrolled ? 36 : 44 }}
            />
          </Link>

          <nav aria-label="Primary" className="hidden lg:flex items-center justify-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-ring group relative rounded-md px-3 py-2 font-sans text-[0.875rem] font-medium tracking-[0.02em] transition-colors duration-450 ease-luxury",
                    cream
                      ? active
                        ? "text-ora-cream"
                        : "text-ora-cream/75 hover:text-ora-cream"
                      : active
                        ? "text-foreground"
                        : "text-ora-fog hover:text-foreground",
                  )}
                >
                  {link.label}
                  {active ? (
                    <motion.span
                      layoutId="nav-underline"
                      transition={spring.soft}
                      className="absolute left-3.5 right-3.5 -bottom-0.5 h-px bg-ora-bronze"
                    />
                  ) : (
                    <span className="absolute left-3.5 right-3.5 -bottom-0.5 h-px origin-left scale-x-0 bg-ora-bronze/70 transition-transform duration-450 ease-luxury group-hover:scale-x-100" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 lg:justify-self-end">
            <Button asChild size="pill" variant={cream ? "glass" : "primary"} className="sm:min-h-11 sm:px-6 sm:text-[0.9375rem]">
              <Link href="/book" data-testid="button-book-now">
                Book
              </Link>
            </Button>

            <button
              data-testid="button-mobile-menu"
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={cn(
                "focus-ring lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-450",
                cream ? "text-ora-cream hover:bg-ora-cream/10" : "text-foreground hover:bg-ora-taupe/10",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25, ease: easeLuxury }}
                  className="inline-flex"
                >
                  {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile full-screen glass overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3, ease: easeLuxury } }}
            transition={{ duration: 0.4, ease: easeLuxury }}
            className="fixed inset-0 z-40 lg:hidden band-dark mesh-bg-dark grain"
          >
            <motion.nav
              aria-label="Mobile"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={m.stagger(0.07, 0.15)}
              className="relative z-[2] flex h-full flex-col justify-between px-6 pb-8 pt-28 sm:px-10"
            >
              <ul className="flex flex-col gap-1">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <motion.li
                      key={link.href}
                      variants={{
                        hidden: { opacity: 0, y: 24 },
                        show: { opacity: 1, y: 0, transition: spring.soft },
                      }}
                    >
                      <Link
                        href={link.href}
                        data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "focus-ring group flex items-baseline justify-between border-b border-ora-cream/10 py-4 font-display text-[clamp(1.5rem,6vw,2rem)] leading-none tracking-display",
                          active ? "text-ora-bronze" : "text-ora-cream",
                        )}
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight
                          size={22}
                          strokeWidth={1.25}
                          className="translate-y-1 text-ora-bronze opacity-0 transition-all duration-450 ease-luxury group-hover:translate-y-0 group-hover:opacity-100"
                        />
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: spring.soft } }}
                className="flex flex-col gap-5"
              >
                <Button asChild size="lg" variant="luxury" className="w-full">
                  <Link href="/book" data-testid="button-mobile-book-now">
                    Book Now
                  </Link>
                </Button>
                <p className="font-sans text-[0.8125rem] leading-relaxed text-ora-smoke">
                  45 Deansgate, Manchester M3 2AY
                  <br />
                  <a href="mailto:admin@orasuites.com" className="hover:text-ora-cream transition-colors">
                    admin@orasuites.com
                  </a>
                  <span className="mx-2 text-ora-bronze/60">·</span>Mon–Sat 9–7
                </p>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
