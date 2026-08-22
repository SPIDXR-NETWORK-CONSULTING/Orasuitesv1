/**
 * CategorySelector — centred row of 6 tiles on /services.
 * Live tiles (Aesthetics, Nails, IV Therapy) are tab buttons that open a price list below;
 * coming-soon tiles (Hair, Makeup, Laser) are faded with a small badge, no copy.
 */
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ComingSoonBadge } from "@/components/ui/glass";
import { formatPrice, fromPrice, type Category, type CategoryId } from "@/lib/catalogue";
import { useMotionSafe, spring } from "@/lib/motion";

export interface CategoryTile {
  category: Category;
  image: string;
  alt: string;
}

interface Props {
  tiles: CategoryTile[];
  active: CategoryId;
  onSelect: (id: CategoryId) => void;
}

const tileBase =
  "focus-ring relative block w-full overflow-hidden rounded-2xl border text-left transition-[border-color,box-shadow] duration-450 ease-luxury";

function TileArt({ image, alt, title, sub }: { image: string; alt: string; title: string; sub?: React.ReactNode }) {
  return (
    <>
      <span className="block aspect-[4/5] sm:aspect-[3/4]">
        <img src={image} alt={alt} width={480} height={640} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-dark)_0%,rgba(18,12,8,0.35)_45%,transparent_100%)]" />
      </span>
      <span className="absolute inset-x-0 bottom-0 p-3.5 text-ora-cream sm:p-4">
        <span className="block font-display text-[1.05rem] leading-tight sm:text-[1.15rem]">{title}</span>
        {sub}
      </span>
    </>
  );
}

export function CategorySelector({ tiles, active, onSelect }: Props) {
  const m = useMotionSafe();
  const live = tiles.filter((t) => t.category.live);
  const soon = tiles.filter((t) => !t.category.live);

  const renderLive = ({ category, image, alt }: CategoryTile) => {
    const isActive = category.id === active;
    const from = fromPrice(category.id);
    return (
      <motion.button
        key={category.id}
        type="button"
        role="tab"
        id={`tab-${category.id}`}
        aria-selected={isActive}
        aria-controls={`panel-${category.id}`}
        onClick={() => onSelect(category.id)}
        variants={m.fadeUp}
        whileHover={m.reduced ? undefined : { y: -3, transition: spring.soft }}
        whileTap={m.reduced ? undefined : { scale: 0.99 }}
        className={cn(tileBase, "cursor-pointer", isActive ? "border-ora-bronze shadow-glow-bronze" : "border-glass-border-warm hover:border-ora-bronze/60")}
        data-testid={`services-tile-${category.id}`}
      >
        <TileArt
          image={image}
          alt={alt}
          title={category.title}
          sub={from !== undefined ? <span className="mt-1 block font-sans text-[0.75rem] text-ora-cream/80">from {formatPrice(from)}</span> : undefined}
        />
        {isActive && (
          <motion.span
            layoutId="services-tile-ring"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-ora-bronze"
            transition={m.reduced ? { duration: 0 } : spring.snappy}
          />
        )}
      </motion.button>
    );
  };

  const renderSoon = ({ category, image, alt }: CategoryTile) => (
    <motion.div
      key={category.id}
      variants={m.fadeUp}
      aria-disabled="true"
      className={cn(tileBase, "border-glass-border-warm opacity-[.55] [filter:grayscale(40%)]")}
    >
      <TileArt
        image={image}
        alt={alt}
        title={category.title}
        sub={
          <span className="mt-1.5 block">
            <ComingSoonBadge label="Soon" className="border-ora-cream/40 bg-ora-cream/10 px-2 py-0.5 text-[0.5625rem] text-ora-cream" />
          </span>
        }
      />
    </motion.div>
  );

  /* Mobile: 3 live tiles on one row, 3 faded on the next. md+: one 6-across row. */
  return (
    <div role="tablist" aria-label="Treatment categories" className="mx-auto max-w-5xl space-y-3 md:grid md:grid-cols-6 md:gap-4 md:space-y-0">
      <div className="grid grid-cols-3 gap-3 md:contents">{live.map(renderLive)}</div>
      <div className="grid grid-cols-3 gap-3 md:contents">{soon.map(renderSoon)}</div>
    </div>
  );
}
