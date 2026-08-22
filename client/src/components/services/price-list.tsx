/**
 * PriceList — one live category's menu, rendered in place under the tile selector.
 * Groups as small headers; rows: name · duration · price · arrow → /book?service=<id>.
 * A service `note` sits under the name; `ingredients` (IV drips) hide behind a small
 * "What's in it" disclosure so the price rhythm stays calm. Category `addOns` render as
 * one compact row and a category `disclaimer` as small print below.
 * Prices/durations come from shared/catalogue.json.
 */
import * as React from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, formatPrice, serviceId, type Category, type Service } from "@/lib/catalogue";

export function PriceList({ category }: { category: Category }) {
  return (
    <div id={`panel-${category.id}`} role="tabpanel" aria-labelledby={`tab-${category.id}`} className="mx-auto max-w-3xl">
      <div className="space-y-8">
        {category.groups.map((g) => (
          <section key={g.name} aria-label={g.name}>
            <h3 className="mb-1 flex items-center gap-3 font-sans text-[0.71875rem] uppercase tracking-[0.22em] text-ora-bronze">
              {g.name}
              <span aria-hidden className="h-px flex-1 bg-ora-greige/70" />
            </h3>
            <ul className="divide-y divide-ora-greige/60">
              {g.services.map((s) => (
                <PriceRow key={s.name} categoryId={category.id} service={s} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {category.addOns?.length ? (
        <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 rounded-2xl border border-glass-border-warm bg-ora-cream/45 px-4 py-3">
          <span className="font-sans text-[0.71875rem] uppercase tracking-[0.22em] text-ora-bronze">Add-ons</span>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-[0.875rem] text-foreground/85">
            {category.addOns.map((a) => (
              <li key={a.name}>
                {a.name} <span className="text-foreground">+{formatPrice(a.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {category.disclaimer ? (
        <p className="mx-auto mt-6 max-w-2xl text-center font-sans text-[0.75rem] leading-relaxed text-ora-fog">
          {category.disclaimer}
        </p>
      ) : null}
    </div>
  );
}

/** Compact, muted "what's in it" list — collapsed by default so rows keep their rhythm. */
function Ingredients({ items, label }: { items: string[]; label: string }) {
  return (
    <details className="group -mt-1 pb-3">
      <summary
        className="focus-ring inline-flex cursor-pointer list-none items-center gap-1 rounded-md py-1 font-sans text-[0.75rem] text-ora-bronze [&::-webkit-details-marker]:hidden"
        aria-label={`What's in ${label}`}
      >
        What&rsquo;s in it
        <ChevronDown aria-hidden className="h-3 w-3 transition-transform duration-450 ease-luxury group-open:rotate-180" />
      </summary>
      <ul className="flex flex-wrap gap-x-1.5 pt-1 font-sans text-[0.75rem] leading-relaxed text-ora-fog">
        {items.map((item, i) => (
          <li key={item}>
            {i > 0 ? <span aria-hidden className="mr-1.5 text-ora-taupe/70">·</span> : null}
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

function PriceRow({ categoryId, service }: { categoryId: string; service: Service }) {
  const id = serviceId(categoryId, service.name);
  const free = service.price === 0;
  return (
    <li>
      <Link
        href={`/book?service=${encodeURIComponent(id)}`}
        aria-label={`Book ${service.name}, ${formatDuration(service.duration)}, ${free ? "complimentary" : formatPrice(service.price)}`}
        data-testid={`service-row-${id.replace("/", "-")}`}
        className="focus-ring group/row -mx-3 flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-450 ease-luxury hover:bg-ora-cream/60 sm:gap-4"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-sans text-[0.9375rem] leading-snug text-foreground">{service.name}</span>
          {service.note ? (
            <span className="mt-0.5 block font-sans text-[0.75rem] leading-snug text-ora-fog">{service.note}</span>
          ) : null}
        </span>
        <span className="hidden shrink-0 font-sans text-[0.8125rem] tabular-nums text-ora-fog sm:block">{formatDuration(service.duration)}</span>
        <span className={cn("shrink-0 text-right font-sans text-[0.9375rem] font-medium tabular-nums", free ? "text-ora-bronze" : "text-foreground")}>
          {free ? "Free" : formatPrice(service.price)}
          <span className="block font-normal text-[0.6875rem] text-ora-fog sm:hidden">{formatDuration(service.duration)}</span>
        </span>
        <span
          aria-hidden
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ora-bronze/40 text-ora-bronze opacity-60 transition-[opacity,transform] duration-450 ease-luxury group-hover/row:translate-x-0.5 group-hover/row:opacity-100"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
      {service.ingredients?.length ? <Ingredients items={service.ingredients} label={service.name} /> : null}
    </li>
  );
}
