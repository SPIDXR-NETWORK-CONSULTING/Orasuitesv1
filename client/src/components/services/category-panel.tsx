/**
 * CategoryPanel — one live category on /services.
 * Split layout: sticky editorial image | price list grouped by catalogue `groups[]`.
 * Group headers are collapsible (aria-expanded), open by default. Rows link to
 * /book?service=<id>. Nail add-ons render as a compact glass strip. Team strip below.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "@/components/ui/section";
import { Eyebrow, DisplayHeading, GlassPill, GlassCard, IconOrb } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import {
  formatDuration,
  formatPrice,
  fromPrice,
  serviceId,
  teamFor,
  type Category,
  type Service,
} from "@/lib/catalogue";
import { useMotionSafe, easeLuxury, viewportOnce, spring } from "@/lib/motion";

export interface CategoryPanelProps {
  category: Category;
  image: { src: string; alt: string };
  /** editorial one-liner under the title */
  blurb: string;
  /** flip image to the right (grid-break on alternate panels) */
  flip?: boolean;
  tone?: "milk" | "sand" | "bone";
  /** open state forced from URL hash (auto-expands all groups) */
  forceOpen?: boolean;
}

export function CategoryPanel({ category, image, blurb, flip = false, tone = "milk", forceOpen = false }: CategoryPanelProps) {
  const team = React.useMemo(() => teamFor(category.id), [category.id]);
  const from = fromPrice(category.id);
  const m = useMotionSafe();

  return (
    <Section id={category.id} tone={tone} pad="lg" mesh grain className="scroll-mt-28" aria-labelledby={`${category.id}-title`}>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Image column — sticky, offset upward for a deliberate grid-break */}
        <motion.figure
          variants={m.fadeUp}
          className={cn("relative lg:col-span-5 lg:-mt-24", flip ? "lg:order-2" : "lg:order-1")}
        >
          <div className="img-zoom relative overflow-hidden rounded-3xl shadow-luxury lg:sticky lg:top-32 aspect-[4/5] lg:aspect-[3/4]">
            <img
              src={image.src}
              alt={image.alt}
              width={960}
              height={1200}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-dark),transparent_45%)]" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <GlassPill tone="light" size="sm" className="text-ora-cream">
                {from !== undefined ? `From ${formatPrice(from)}` : category.title}
              </GlassPill>
              <p className="mt-3 font-display text-[clamp(2rem,3vw,2.75rem)] leading-none text-ora-cream">{category.title}</p>
            </figcaption>
          </div>
        </motion.figure>

        {/* Price list column */}
        <div className={cn("lg:col-span-7", flip ? "lg:order-1" : "lg:order-2")}>
          <motion.div variants={m.stagger(0.08)} className="mb-10">
            <Eyebrow reveal as="p" rule className="mb-4">
              {category.title} · Manchester
            </Eyebrow>
            <DisplayHeading as="h2" size="md" inherit id={`${category.id}-title`} className="text-display-md">
              {`${category.title} treatments\n& prices`}
            </DisplayHeading>
            <motion.p variants={m.fadeUp} className="lede mt-5 max-w-xl">
              {blurb}
            </motion.p>
          </motion.div>

          <div className="space-y-8">
            {category.groups.map((g, gi) => (
              <PriceGroup key={g.name} categoryId={category.id} name={g.name} services={g.services} defaultOpen index={gi} forceOpen={forceOpen} />
            ))}
          </div>

          {category.addOns?.length ? (
            <GlassCard tone="warm" padding="sm" radius="lg" className="mt-10 bg-ora-cream/40">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="font-sans text-[0.71875rem] uppercase tracking-[0.25em] text-ora-bronze">Add-ons</span>
                <ul className="flex flex-wrap gap-2">
                  {category.addOns.map((a) => (
                    <li key={a.name}>
                      <GlassPill size="sm" className="bg-ora-cream/50 text-foreground/85">
                        {a.name}
                        <span className="font-display text-[0.9375rem] text-foreground">+{formatPrice(a.price)}</span>
                      </GlassPill>
                    </li>
                  ))}
                </ul>
                <p className="w-full font-sans text-[0.75rem] text-ora-fog">Add-ons are added on the day with your nail artist.</p>
              </div>
            </GlassCard>
          ) : null}

          {team.length > 0 && (
            <motion.div variants={m.fadeUp} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-ora-greige/70 pt-8">
              <p className="font-sans text-[0.71875rem] uppercase tracking-[0.25em] text-ora-bronze">Your practitioners</p>
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {team.map((t) => (
                  <li key={t.key} className="flex items-center gap-3">
                    <IconOrb size="sm" tone="warm" initials={t.initials} aria-hidden />
                    <span className="font-sans text-[0.9375rem]">
                      <span className="text-foreground">{t.name}</span>
                      <span className="block text-[0.75rem] text-ora-fog">{t.role}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div variants={m.fadeUp} className="mt-10">
            <Button asChild size="lg">
              <Link href={`/book?category=${encodeURIComponent(category.id)}`}>
                Book {category.title.toLowerCase()} <ArrowRight aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ── PriceGroup (collapsible) ───────────────────────────── */
function PriceGroup({
  categoryId,
  name,
  services,
  defaultOpen = true,
  index,
  forceOpen,
}: {
  categoryId: string;
  name: string;
  services: Service[];
  defaultOpen?: boolean;
  index: number;
  forceOpen: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  React.useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);
  const m = useMotionSafe();
  const panelId = `${categoryId}-${index}-panel`;
  const btnId = `${categoryId}-${index}-btn`;

  return (
    <motion.section
      variants={m.fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      aria-labelledby={btnId}
    >
      <h3 className="m-0">
        <button
          id={btnId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="focus-ring group/grp flex w-full items-center justify-between gap-4 rounded-md py-2 text-left"
        >
          <span className="flex items-center gap-3 font-sans text-[0.71875rem] uppercase tracking-[0.25em] text-ora-bronze">
            <span aria-hidden className="inline-block h-px w-6 bg-ora-bronze transition-[width] duration-450 ease-luxury group-hover/grp:w-10" />
            {name}
            <span className="text-ora-smoke normal-case tracking-normal">({services.length})</span>
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={m.reduced ? { duration: 0 } : { duration: 0.45, ease: easeLuxury }} className="text-ora-fog">
            <ChevronDown className="h-4 w-4" aria-hidden />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            initial={m.reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={m.reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: easeLuxury }}
            className="overflow-hidden"
          >
            <ul className="mt-2 divide-y divide-ora-greige/70 border-y border-ora-greige/70">
              {services.map((s) => (
                <PriceRow key={s.name} categoryId={categoryId} service={s} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ── PriceRow ───────────────────────────────────────────── */
function PriceRow({ categoryId, service }: { categoryId: string; service: Service }) {
  const m = useMotionSafe();
  const id = serviceId(categoryId, service.name);
  const free = service.price === 0;
  return (
    <li>
      <Link
        href={`/book?service=${encodeURIComponent(id)}`}
        aria-label={`Book ${service.name}, ${formatDuration(service.duration)}, ${free ? "complimentary" : formatPrice(service.price)}`}
        data-testid={`service-row-${id.replace("/", "-")}`}
        className="focus-ring group/row -mx-3 flex items-center gap-4 rounded-xl px-3 py-4 transition-colors duration-450 ease-luxury hover:bg-ora-cream/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-sans text-[0.9375rem] font-medium leading-snug text-foreground sm:text-[1rem]">{service.name}</span>
          {service.description && <span className="mt-0.5 block font-sans text-[0.8125rem] text-ora-fog">{service.description}</span>}
        </span>
        <GlassPill size="sm" icon={<Clock aria-hidden />} className="hidden shrink-0 bg-ora-cream/50 text-ora-fog sm:inline-flex">
          {formatDuration(service.duration)}
        </GlassPill>
        <span className={cn("shrink-0 text-right font-display text-[1.25rem] leading-none tabular-nums", free ? "text-ora-bronze" : "text-foreground")}>
          {free ? "Free" : formatPrice(service.price)}
          <span className="mt-1 block font-sans text-[0.6875rem] text-ora-fog sm:hidden">{formatDuration(service.duration)}</span>
        </span>
        <motion.span
          aria-hidden
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ora-bronze/40 text-ora-bronze opacity-0 transition-opacity duration-450 ease-luxury group-hover/row:opacity-100 group-focus-visible/row:opacity-100"
          whileHover={m.reduced ? undefined : { x: 2, transition: spring.snappy }}
        >
          <ArrowRight className="h-4 w-4" />
        </motion.span>
      </Link>
    </li>
  );
}
