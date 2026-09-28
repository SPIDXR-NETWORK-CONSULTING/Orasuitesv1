/**
 * "Just this one" or a Blow-Dry Bundle — shown on the confirm step for treatments a
 * bundle covers. Native radios (keyboard + screen readers for free). The server
 * re-prices the choice from the catalogue; nothing here decides money.
 */
import { cn } from "@/lib/utils";
import { formatPrice, type BundleOffer } from "@/lib/catalogue";

interface Props {
  offer: BundleOffer;
  /** single-visit price, for the "just this one" option */
  single: number;
  value?: number;
  onChange: (bundle: number | undefined) => void;
  className?: string;
}

export function BundlePicker({ offer, single, value, onChange, className }: Props) {
  const options = [
    { key: 0, title: "Just this blow-dry", price: single, sub: null as string | null, was: undefined as number | undefined },
    ...offer.sizes.map((s) => ({ key: s.count, title: `Bundle of ${s.count}`, price: s.price, sub: `${formatPrice(s.price / s.count)} per blow-dry`, was: s.was })),
  ];
  return (
    <fieldset className={cn("rounded-2xl border border-glass-border-warm bg-ora-cream/50 p-5 sm:p-6", className)}>
      <legend className="sr-only">{offer.name}</legend>
      <p className="mb-3 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-bronze">{offer.name}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((o) => {
          const checked = (value ?? 0) === o.key;
          return (
            <label
              key={o.key}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition-colors duration-200",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ora-bronze/60",
                checked ? "border-ora-bronze bg-ora-bronze/10" : "border-ora-greige/80 bg-white/40 hover:border-ora-bronze/50",
              )}
            >
              <input
                type="radio"
                name="bundle"
                value={o.key}
                checked={checked}
                onChange={() => onChange(o.key || undefined)}
                className="sr-only"
                data-testid={`bundle-option-${o.key}`}
              />
              <span className="font-sans text-[0.875rem] font-medium text-foreground">{o.title}</span>
              <span className="mt-0.5 font-sans text-[0.875rem] text-foreground">
                {o.was ? <s className="mr-1.5 text-ora-fog">{formatPrice(o.was)}</s> : null}
                {formatPrice(o.price)}
              </span>
              {o.sub && <span className="mt-0.5 font-sans text-[0.75rem] text-ora-fog">{o.sub}</span>}
            </label>
          );
        })}
      </div>
      {offer.terms && <p className="mt-3 font-sans text-[0.75rem] leading-relaxed text-ora-fog">{offer.terms}</p>}
    </fieldset>
  );
}
