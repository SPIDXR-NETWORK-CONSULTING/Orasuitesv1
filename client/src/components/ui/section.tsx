import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import { Eyebrow, DisplayHeading, type DisplaySize } from "@/components/ui/glass";

/**
 * Section — page-level band with padding scale, tonal background, optional mesh + grain.
 * Direct motion children (variants set) are staggered 0.08s instead of a whole-section fade.
 *
 *  <Section tone="sand" mesh grain>
 *    <SectionHeader eyebrow="Services" title={"Nurse-led aesthetics.\nLuxury nails."} />
 *    <Reveal>…</Reveal>
 *  </Section>
 */
export type SectionTone = "milk" | "sand" | "bone" | "dark" | "chocolate" | "image" | "none";
export type SectionPad = "none" | "sm" | "md" | "lg" | "xl";

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  children: React.ReactNode;
  id?: string;
  tone?: SectionTone;
  /** padding scale (default md = 56–96px fluid) */
  pad?: SectionPad;
  /** radial warm mesh gradient background */
  mesh?: boolean;
  /** 3% SVG grain overlay */
  grain?: boolean;
  /** stagger children on scroll (default true). false = static section */
  animate?: boolean;
  /** stagger gap seconds */
  stagger?: number;
  /** constrain content; false = full-bleed (you manage the container) */
  contain?: boolean;
  containerClassName?: string;
  /** background image (tone="image") */
  image?: { src: string; alt?: string; overlay?: "dark" | "gradient" | "none"; className?: string };
}

const toneClass: Record<SectionTone, string> = {
  milk: "bg-ora-milk text-foreground",
  sand: "bg-ora-sand text-foreground",
  bone: "bg-ora-bone text-foreground",
  dark: "band-dark",
  chocolate: "band-chocolate",
  image: "band-dark relative overflow-hidden",
  none: "",
};

/* v2 rhythm: 56px mobile → 96px desktop max. lg/xl kept as aliases (no larger than md). */
const padClass: Record<SectionPad, string> = {
  none: "",
  sm: "py-section-sm",
  md: "py-section",
  lg: "py-section",
  xl: "py-section",
};

export const Container = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { wide?: boolean }>(
  function Container({ className, wide = false, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn("mx-auto w-full px-5 sm:px-8 lg:px-12", wide ? "max-w-wide" : "max-w-content", className)}
        {...rest}
      />
    );
  },
);

export const Section = React.forwardRef<HTMLElement, SectionProps>(function Section(
  {
    children,
    className,
    id,
    tone = "milk",
    pad = "md",
    mesh = false,
    grain = false,
    animate = true,
    stagger = 0.08,
    contain = true,
    containerClassName,
    image,
    ...rest
  },
  ref,
) {
  const m = useMotionSafe();
  const classes = cn(
    "relative",
    toneClass[tone],
    padClass[pad],
    mesh && (tone === "dark" || tone === "chocolate" ? "mesh-bg-dark" : "mesh-bg"),
    grain && "grain",
    className,
  );

  const bg =
    tone === "image" && image ? (
      <div aria-hidden className={cn("absolute inset-0 -z-0", image.className)}>
        <img src={image.src} alt={image.alt ?? ""} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        {image.overlay !== "none" && (
          <div
            className={cn(
              "absolute inset-0",
              image.overlay === "gradient"
                ? "bg-[linear-gradient(to_top,var(--overlay-deep),var(--overlay-dark)_40%,transparent)]"
                : "bg-[var(--overlay-dark)]",
            )}
          />
        )}
      </div>
    ) : null;

  const content = contain ? <Container className={cn("relative z-[2]", containerClassName)}>{children}</Container> : children;

  if (!animate) {
    return (
      <section ref={ref} id={id} className={classes} {...rest}>
        {bg}
        {content}
      </section>
    );
  }

  return (
    <motion.section
      ref={ref}
      id={id}
      className={classes}
      variants={m.stagger(stagger)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      {...(rest as React.ComponentProps<typeof motion.section>)}
    >
      {bg}
      {content}
    </motion.section>
  );
});

/* ── SectionHeader ─────────────────────────────────────── */
export interface SectionHeaderProps {
  title: string | React.ReactNode[];
  eyebrow?: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  size?: DisplaySize;
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** cream text for dark bands (auto when inside .band-dark via tokens, but explicit is safer) */
  tone?: "default" | "cream";
  children?: React.ReactNode;
}

export function SectionHeader({
  title,
  eyebrow,
  subtitle,
  align = "left",
  size = "lg",
  as = "h2",
  className,
  tone = "default",
  children,
}: SectionHeaderProps) {
  const m = useMotionSafe();
  return (
    <motion.div
      variants={m.stagger(0.08)}
      className={cn("mb-8 md:mb-10 max-w-3xl", align === "center" && "mx-auto text-center", className)}
    >
      {eyebrow && (
        <Eyebrow reveal as="p" rule={align === "left"} className="mb-3">
          {eyebrow}
        </Eyebrow>
      )}
      <DisplayHeading as={as} size={size} inherit tone={tone === "cream" ? "cream" : "default"}>
        {title}
      </DisplayHeading>
      {subtitle && (
        <motion.p variants={m.fadeUp} className={cn("lede mt-3 max-w-2xl", align === "center" && "mx-auto")}>
          {subtitle}
        </motion.p>
      )}
      {children && (
        <motion.div variants={m.fadeUp} className="mt-5">
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
