/**
 * Step 1 — choose a service.
 * Live-category tabs → group pills (All + catalogue groups[], first real group default)
 * → compact rows (name · duration · price). Small search input only when a category has
 * more than 25 items (searching switches to All). Clicking a row selects AND advances.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { liveCategories, findCategory, servicesFor, formatDuration, formatPrice, type CategoryId, type ResolvedService } from "@/lib/catalogue";
import { useMotionSafe, spring, easeLuxury } from "@/lib/motion";
import { StepHeader } from "../step-shell";

const SEARCH_THRESHOLD = 25;

/** First group with 2+ services (skips a lone Consultation row), else the first group, else All. */
function defaultGroup(cat: CategoryId): string {
  const groups = findCategory(cat)?.groups ?? [];
  return (groups.find((g) => g.services.length > 1) ?? groups[0])?.name ?? "";
}

interface Props {
  selected?: ResolvedService;
  /** initial category tab (e.g. from ?category=nails) */
  initialCategory?: CategoryId;
  /** select + auto-advance handled by the parent */
  onSelect: (s: ResolvedService) => void;
}

export function ServiceStep({ selected, initialCategory, onSelect }: Props) {
  const live = React.useMemo(liveCategories, []);
  const [cat, setCat] = React.useState<CategoryId>(
    selected?.categoryId ?? (initialCategory && live.some((c) => c.id === initialCategory) ? initialCategory : live[0]?.id ?? "aesthetics"),
  );
  const [q, setQ] = React.useState("");
  const m = useMotionSafe();
  const searchId = React.useId();

  const groupNames = React.useMemo(() => (findCategory(cat)?.groups ?? []).map((g) => g.name), [cat]);
  /** "" = All. Default = the selected service's group, else the first real group with a proper list. */
  const [group, setGroup] = React.useState<string>(() =>
    selected && selected.categoryId === cat && groupNames.includes(selected.groupName) ? selected.groupName : defaultGroup(cat),
  );

  const services = React.useMemo(() => servicesFor(cat), [cat]);
  const showSearch = services.length > SEARCH_THRESHOLD;
  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle && showSearch) {
      return services.filter((s) => s.name.toLowerCase().includes(needle) || s.groupName.toLowerCase().includes(needle));
    }
    return group ? services.filter((s) => s.groupName === group) : services;
  }, [services, q, showSearch, group]);

  const pickCategory = (id: CategoryId) => {
    setCat(id);
    setQ("");
    setGroup(defaultGroup(id));
  };
  const onSearch = (v: string) => {
    setQ(v);
    if (v.trim()) setGroup("");
  };

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
      <StepHeader step={0} title="What would you like to book?" />

      {/* Tabs + (optional) search on one line */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-3 sm:justify-between">
        <div role="tablist" aria-label="Treatment categories" className="flex items-center gap-1 rounded-full border border-glass-border-warm bg-ora-cream/45 p-1">
          {live.map((c) => {
            const active = c.id === cat;
            return (
              <button
                key={c.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => pickCategory(c.id)}
                className={cn(
                  "focus-ring relative rounded-full px-4 py-2 font-sans text-[0.875rem] font-medium transition-colors duration-450 ease-luxury",
                  active ? "text-ora-cream" : "text-foreground/75 hover:text-foreground",
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
        </div>

        {showSearch && (
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ora-fog" aria-hidden />
            <input
              id={searchId}
              type="search"
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search…"
              aria-label="Search treatments"
              className="focus-ring h-10 w-full rounded-full border border-glass-border-warm bg-ora-cream/55 pl-9 pr-9 font-sans text-[0.875rem] text-foreground placeholder:text-ora-fog transition-[border-color,background-color] duration-450 ease-luxury focus:border-ora-bronze focus:bg-ora-cream/80"
            />
            {q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQ("")}
                className="focus-ring absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ora-fog hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Group pills — All + this category's groups */}
      {groupNames.length > 1 && (
        <div role="tablist" aria-label="Treatment groups" className="mb-5 flex flex-wrap items-center justify-center gap-1.5">
          {["", ...groupNames].map((g) => {
            const active = g === group && !q.trim();
            return (
              <button
                key={g || "all"}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => {
                  setGroup(g);
                  setQ("");
                }}
                className={cn(
                  "focus-ring rounded-full border px-3 py-1.5 font-sans text-[0.75rem] transition-colors duration-450 ease-luxury",
                  active
                    ? "border-ora-bronze bg-ora-bronze/10 text-foreground"
                    : "border-glass-border-warm bg-ora-cream/40 text-foreground/70 hover:border-ora-bronze/60 hover:text-foreground",
                )}
              >
                {g || "All"}
              </button>
            );
          })}
        </div>
      )}

      {/* Groups + rows */}
      <div role="radiogroup" aria-label="Treatments">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${cat}-${group}-${q}`}
            initial={m.reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={m.reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: easeLuxury }}
            className="space-y-7"
          >
            {groups.length === 0 && (
              <p className="rounded-2xl border border-dashed border-ora-greige px-6 py-8 text-center font-sans text-[0.9375rem] text-ora-fog">
                Nothing matches “{q}”. Try a different word, or clear the search.
              </p>
            )}
            {groups.map(([groupName, items]) => (
              <section key={groupName} aria-label={groupName}>
                <h3 className="mb-1 flex items-center gap-3 font-sans text-[0.6875rem] uppercase tracking-[0.22em] text-ora-bronze">
                  {groupName}
                  <span aria-hidden className="h-px flex-1 bg-ora-greige/70" />
                </h3>
                <ul className="divide-y divide-ora-greige/60">
                  {items.map((s) => {
                    const isSel = selected?.id === s.id;
                    const free = s.price === 0;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isSel}
                          onClick={() => onSelect(s)}
                          data-testid={`book-service-${s.id.replace("/", "-")}`}
                          className={cn(
                            "focus-ring group/row -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-450 ease-luxury hover:bg-ora-cream/60 sm:gap-4",
                            isSel && "bg-ora-cream/70",
                          )}
                        >
                          <span className="min-w-0 flex-1 font-sans text-[0.9375rem] leading-snug text-foreground">{s.name}</span>
                          <span className="hidden shrink-0 font-sans text-[0.8125rem] tabular-nums text-ora-fog sm:block">{formatDuration(s.duration)}</span>
                          <span className={cn("shrink-0 text-right font-sans text-[0.9375rem] font-medium tabular-nums", free ? "text-ora-bronze" : "text-foreground")}>
                            {free ? "Free" : formatPrice(s.price)}
                            <span className="block font-normal text-[0.6875rem] text-ora-fog sm:hidden">{formatDuration(s.duration)}</span>
                          </span>
                          <span
                            aria-hidden
                            className={cn(
                              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ora-bronze/40 text-ora-bronze transition-[opacity,transform] duration-450 ease-luxury group-hover/row:translate-x-0.5 group-hover/row:opacity-100",
                              isSel ? "opacity-100" : "opacity-60",
                            )}
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
