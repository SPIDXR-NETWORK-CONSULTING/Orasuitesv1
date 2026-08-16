/**
 * CategoryTabs — sticky glass tab bar under the fixed header on /services.
 * Live categories are anchors (#id) with a layoutId underline; coming-soon
 * tabs are faded and jump to the "coming soon" band. Scroll-spy via IntersectionObserver.
 */
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/catalogue";
import { useMotionSafe, spring } from "@/lib/motion";

interface Props {
  live: Category[];
  soon: Category[];
  /** id of the coming-soon band */
  soonId?: string;
}

export function CategoryTabs({ live, soon, soonId = "coming-soon" }: Props) {
  const m = useMotionSafe();
  const ids = React.useMemo(() => [...live.map((c) => c.id), soonId], [live, soonId]);
  const [active, setActive] = React.useState<string>(live[0]?.id ?? "");
  const [stuck, setStuck] = React.useState(false);
  const sentinel = React.useRef<HTMLDivElement>(null);

  // scroll-spy
  React.useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        // choose the entry closest to the top that is intersecting
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);

  // stuck state → stronger glass
  React.useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: "-64px 0px 0px 0px", threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    const y = el.getBoundingClientRect().top + window.scrollY - 128;
    window.scrollTo({ top: y, behavior: m.reduced ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <div ref={sentinel} aria-hidden className="h-px w-full" />
      <div className="sticky top-[3.875rem] z-40 -mt-7 px-3 sm:px-6">
        <nav
          aria-label="Treatment categories"
          className={cn(
            "mx-auto flex max-w-content items-center gap-1 overflow-x-auto px-3 py-2 transition-[background-color,box-shadow,border-color] duration-700 ease-luxury [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "rounded-full border backdrop-blur-glass",
            stuck
              ? "border-glass-border-warm bg-ora-milk/75 shadow-glass supports-[backdrop-filter]:bg-ora-milk/65"
              : "border-glass-border-warm bg-ora-milk/90 shadow-luxury",
          )}
        >
          {live.map((c) => {
            const isActive = active === c.id;
            return (
              <a
                key={c.id}
                href={`#${c.id}`}
                onClick={jump(c.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "focus-ring relative shrink-0 rounded-full px-5 py-2.5 font-sans text-[0.875rem] font-medium transition-colors duration-450 ease-luxury",
                  isActive ? "text-ora-cream" : "text-foreground/75 hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="services-tab-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-ora-taupe shadow-luxury"
                    transition={m.reduced ? { duration: 0 } : spring.snappy}
                  />
                )}
                <span className="relative z-[1]">{c.title}</span>
              </a>
            );
          })}
          <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-ora-greige" />
          {soon.map((c) => (
            <a
              key={c.id}
              href={`#${soonId}`}
              onClick={jump(soonId)}
              className={cn(
                "focus-ring relative shrink-0 rounded-full px-4 py-2.5 font-sans text-[0.8125rem] transition-colors duration-450 ease-luxury",
                active === soonId ? "text-foreground" : "text-ora-smoke hover:text-ora-fog",
              )}
            >
              {c.title}
              <span className="ml-1.5 align-middle font-sans text-[0.5625rem] uppercase tracking-[0.2em] text-ora-bronze">soon</span>
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
