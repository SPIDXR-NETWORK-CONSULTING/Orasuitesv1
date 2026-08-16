/**
 * ComingSoonStrip — slim horizontal glass cards for categories not yet live
 * (Hair · Makeup · Laser · Wellness). Faded via <ComingSoon/>, honest copy,
 * "Notify me" stays interactive (data-interactive) → /contact.
 */
import * as React from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Eyebrow, DisplayHeading, ComingSoon, ComingSoonBadge } from "@/components/ui/glass";
import type { Category } from "@/lib/catalogue";
import { useMotionSafe } from "@/lib/motion";

export interface SoonItem {
  category: Category;
  image?: string;
  /** one honest line about what's coming */
  line: string;
}

/** "Hair, makeup and laser are" / "Hair is" */
function listNames(names: string[]): string {
  const lower = names.map((n, i) => (i === 0 ? n : n.toLowerCase()));
  if (lower.length === 0) return "More treatments are";
  if (lower.length === 1) return `${lower[0]} is`;
  return `${lower.slice(0, -1).join(", ")} and ${lower[lower.length - 1]} are`;
}

export function ComingSoonStrip({ id = "coming-soon", items }: { id?: string; items: SoonItem[] }) {
  const m = useMotionSafe();
  if (!items.length) return null;
  return (
    <Section id={id} tone="chocolate" pad="md" mesh grain className="scroll-mt-28" aria-labelledby={`${id}-title`}>
      <motion.div variants={m.stagger(0.08)} className="mb-10 max-w-2xl md:mb-12">
        <Eyebrow reveal as="p" rule className="mb-4">
          Growing ORÁ
        </Eyebrow>
        <DisplayHeading as="h2" size="md" tone="cream" inherit id={`${id}-title`} className="text-display-md">
          {"Launching soon\nat 45 Deansgate."}
        </DisplayHeading>
        <motion.p variants={m.fadeUp} className="lede mt-5 max-w-xl">
          {listNames(items.map((i) => i.category.title))} on the way. Leave your details and we'll tell you the moment bookings open.
        </motion.p>
      </motion.div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map(({ category, image, line }) => (
          <motion.li key={category.id} variants={m.fadeUp} className="min-w-0">
            <ComingSoon className="h-full">
              <article className="glass relative flex h-full items-center gap-4 overflow-hidden rounded-2xl p-4 text-ora-cream">
                {image && (
                  <img
                    src={image}
                    alt=""
                    width={112}
                    height={112}
                    loading="lazy"
                    decoding="async"
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[1.375rem] leading-none">{category.title}</h3>
                    <ComingSoonBadge />
                  </div>
                  <p className="mt-2 font-sans text-[0.8125rem] leading-snug text-ora-smoke">{line}</p>
                  <Link
                    href={`/contact?interest=${encodeURIComponent(category.id)}`}
                    data-interactive
                    className="focus-ring mt-3 inline-flex items-center gap-1 font-sans text-[0.8125rem] font-medium text-ora-bronze underline-offset-4 hover:underline"
                  >
                    Notify me <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </article>
            </ComingSoon>
          </motion.li>
        ))}
      </ul>
    </Section>
  );
}
