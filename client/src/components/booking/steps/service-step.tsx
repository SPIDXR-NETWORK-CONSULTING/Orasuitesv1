/**
 * Step 1 — choose a service.
 * Category tabs (live; coming-soon faded + disabled) → search → grouped GlassCard grid.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPill, ComingSoonBadge } from "@/components/ui/glass";
import {
  liveCategories,
  comingSoonCategories,
  servicesFor,
  formatDuration,
  formatPrice,
  type CategoryId,
  type ResolvedService,
} from "@/lib/catalogue";
import { useMotionSafe, spring, easeLuxury } from "@/lib/motion";
import { StepHeader, StepNav, ChoiceCard } from "../step-shell";

interface Props {
  selected?: ResolvedService;
  /** initial category tab (e.g. from ?category=nails) */
  initialCategory?: CategoryId;
  onSelect: (s: ResolvedService) => void;
  onNext: () => void;
}

export function ServiceStep({ selected, initialCategory, onSelect, onNext }: Props) {
  const live = React.useMemo(liveCategories, []);
  const soon = React.useMemo(comingSoonCategories, []);
  const [cat, setCat] = React.useState<CategoryId>(
    selected?.categoryId ?? (initialCategory && live.some((c) => c.id === initialCategory) ? initialCategory : live[0]?.id ?? "aesthetics"),
  );
  const [q, setQ] = React.useState("");
  const m = useMotionSafe();
  const searchId = React.useId();

  const services = React.useMemo(() => servicesFor(cat), [cat]);
  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return services;
    return services.filter((s) => s.name.toLowerCase().includes(needle) || s.groupName.toLowerCase().includes(needle));
  }, [services, q]);

  const groups = React.useMemo(() => {
    const map = new Map<string, ResolvedService[]>();
    for (const s of filtered) {
      if (!map.has(s.groupName)) map.set(s.groupName, []);
      map.get(s.groupName)!.push(s);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      <StepHeader step={0} title="What would you like to book?" lede="Nurse-led aesthetics and luxury nails at 45 Deansgate. Pick a treatment — you can change your mind at any step." />

      {/* Category tabs */}
      <div role="tablist" aria-label="Treatment categories" className="mb-6 flex flex-wrap items-center gap-2">
        {live.map((c) => {
          const active = c.id === cat;
          return (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => {
                setCat(c.id);
                setQ("");
              }}
              className={cn(
                "focus-ring relative rounded-full px-5 py-2.5 font-sans text-[0.875rem] font-medium transition-colors duration-450 ease-luxury",
                active ? "text-ora-cream" : "text-foreground/80 hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="book-cat-pill"
                  className="absolute inset-0 rounded-full bg-ora-taupe shadow-luxury"
                  transition={m.reduced ? { duration: 0 } : spring.snappy}
                />
              )}
              <span className="relative z-[1]">{c.title}</span>
            </button>
          );
        })}
        {soon.map((c) => (
          <span
            key={c.id}
            role="tab"
            aria-selected={false}
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-ora-greige px-4 py-2 font-sans text-[0.8125rem] text-ora-smoke opacity-70 [filter:grayscale(40%)]"
          >
            {c.title}
            <ComingSoonBadge label="Soon" className="px-2 py-0.5 text-[0.5625rem]" />
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-ora-fog" aria-hidden />
        <input
          id={searchId}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${live.find((c) => c.id === cat)?.title.toLowerCase() ?? "treatments"}…`}
          aria-label="Search treatments"
          className="focus-ring h-[3.25rem] w-full rounded-full border border-glass-border-warm bg-ora-cream/55 py-3.5 pl-12 pr-12 font-sans text-[0.9375rem] text-foreground placeholder:text-ora-fog backdrop-blur-glass-sm transition-[border-color,background-color] duration-450 ease-luxury focus:border-ora-bronze focus:bg-ora-cream/80"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQ("")}
            className="focus-ring absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ora-fog hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Groups + cards */}
      <div role="radiogroup" aria-label="Treatments" className="space-y-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${cat}-${q}`}
            initial={m.reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={m.reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: easeLuxury }}
            className="space-y-10"
          >
            {groups.length === 0 && (
              <p className="rounded-2xl border border-dashed border-ora-greige px-6 py-10 text-center font-sans text-[0.9375rem] text-ora-fog">
                Nothing matches “{q}”. Try a different word, or clear the search.
              </p>
            )}
            {groups.map(([groupName, items]) => (
              <section key={groupName} aria-label={groupName}>
                <h3 className="mb-4 flex items-center gap-3 font-sans text-[0.71875rem] uppercase tracking-[0.25em] text-ora-bronze">
                  <span aria-hidden className="inline-block h-px w-6 bg-ora-bronze" />
                  {groupName}
                </h3>
                <motion.ul
                  variants={m.stagger(0.05)}
                  initial="hidden"
                  animate="show"
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {items.map((s) => {
                    const isSel = selected?.id === s.id;
                    const free = s.price === 0;
                    return (
                      <motion.li key={s.id} variants={m.fadeUp}>
                        <ChoiceCard
                          selected={isSel}
                          onSelect={() => onSelect(s)}
                          className="h-full"
                          data-testid={`book-service-${s.id.replace("/", "-")}`}
                        >
                          <span className="block pr-8 font-sans text-[0.9375rem] font-medium leading-snug text-foreground">{s.name}</span>
                          <span className="mt-3 flex items-center justify-between gap-3">
                            <GlassPill size="sm" icon={<Clock aria-hidden />} className="bg-ora-cream/50 text-ora-fog">
                              {formatDuration(s.duration)}
                            </GlassPill>
                            <span className={cn("font-display text-[1.25rem] leading-none", free ? "text-ora-bronze" : "text-foreground")}>
                              {free ? "Complimentary" : formatPrice(s.price)}
                            </span>
                          </span>
                        </ChoiceCard>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </section>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <StepNav onNext={onNext} nextDisabled={!selected} hint={selected ? undefined : "Select a treatment to continue"} />
    </div>
  );
}
