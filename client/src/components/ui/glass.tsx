/**
 * ORÁ glass primitives — the luxury-glassmorphic building blocks.
 *
 *  GlassCard        frosted panel (tone light|warm|strong), optional hover lift, motion-aware
 *  GlassPill        small frosted pill (tags, stats, chips)
 *  Eyebrow          DM Sans 11.5px .25em uppercase bronze label
 *  DisplayHeading   Playfair display heading with split-line reveal (\n = new line)
 *  SplitLineReveal  the reveal primitive on its own (any element)
 *  SectionIntro     eyebrow + heading + optional lede, left/center aligned
 *  IconOrb          glass circle for icons / initials
 *  ComingSoonBadge  faded "Coming soon" tag
 *  BeforeAfterSlider  drag/keyboard before-after comparison of two images
 *
 * All colours come from tokens (tailwind `ora-*`, `glass-*`) — no hex here.
 */
import * as React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMotionSafe, viewportOnce, easeLuxury, hoverLift, spring, duration } from "@/lib/motion";

/* ────────────────────────────────────────────────────────── */
/* GlassCard                                                  */
/* ────────────────────────────────────────────────────────── */
export type GlassTone = "light" | "warm" | "strong" | "dark";

export interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  tone?: GlassTone;
  /** lift -6px / scale 1.02 + bronze glow on hover */
  hover?: boolean;
  /** padding preset */
  padding?: "none" | "sm" | "md" | "lg";
  /** rounded preset */
  radius?: "md" | "lg" | "xl" | "2xl" | "full";
  /** when true, does NOT attach its own reveal variants (use inside <Stagger>) */
  inherit?: boolean;
  /** when true, no reveal at all (static) */
  staticCard?: boolean;
  children?: React.ReactNode;
}

const toneClass: Record<GlassTone, string> = {
  light: "glass",
  warm: "glass-warm",
  strong: "glass-strong",
  dark: "bg-ora-deep/70 backdrop-blur-glass border border-ora-bronze/25 shadow-glass text-ora-cream",
};
const padClass = { none: "", sm: "p-4 sm:p-5", md: "p-6 sm:p-8", lg: "p-8 sm:p-10 lg:p-12" } as const;
const radiusClass = { md: "rounded-xl", lg: "rounded-2xl", xl: "rounded-3xl", "2xl": "rounded-[2rem]", full: "rounded-full" } as const;

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { tone = "light", hover = false, padding = "md", radius = "lg", inherit = false, staticCard = false, className, children, ...rest },
  ref,
) {
  const m = useMotionSafe();
  const revealProps = staticCard
    ? {}
    : inherit
      ? { variants: m.fadeUp }
      : { variants: m.fadeUp, initial: "hidden" as const, whileInView: "show" as const, viewport: viewportOnce };
  return (
    <motion.div
      ref={ref}
      className={cn(
        toneClass[tone],
        padClass[padding],
        radiusClass[radius],
        "relative overflow-hidden will-change-transform",
        hover && "transition-shadow duration-450 ease-luxury hover:shadow-glow-bronze",
        className,
      )}
      whileHover={hover ? m.hoverLift : undefined}
      {...revealProps}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

/* ────────────────────────────────────────────────────────── */
/* GlassPill                                                  */
/* ────────────────────────────────────────────────────────── */
export interface GlassPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "light" | "dark" | "bronze";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  as?: "span" | "div" | "li" | "a" | "button";
  href?: string;
}
export const GlassPill = React.forwardRef<HTMLSpanElement, GlassPillProps>(function GlassPill(
  { tone = "light", size = "md", icon, as = "span", className, children, ...rest },
  ref,
) {
  const Comp = as as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={cn(
        "glass-pill inline-flex items-center gap-2 font-sans font-medium leading-none",
        size === "sm" ? "px-3 py-1.5 text-[0.75rem]" : "px-4 py-2 text-[0.8125rem]",
        tone === "light" && "text-foreground [.band-dark_&]:text-ora-cream [.on-dark_&]:text-ora-cream",
        tone === "dark" && "text-ora-cream bg-ora-deep/60 border-ora-bronze/30",
        tone === "bronze" && "text-ora-bronze border-ora-bronze/40",
        className,
      )}
      {...rest}
    >
      {icon && <span className="inline-flex shrink-0 text-ora-bronze [&_svg]:size-3.5">{icon}</span>}
      {children}
    </Comp>
  );
});

/* ────────────────────────────────────────────────────────── */
/* Eyebrow                                                    */
/* ────────────────────────────────────────────────────────── */
export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: "span" | "p" | "div";
  /** draws a short bronze rule before the text */
  rule?: boolean;
  /** inherit reveal from parent stagger (adds variants) */
  reveal?: boolean;
}
export function Eyebrow({ as = "span", rule = false, reveal = false, className, children, ...rest }: EyebrowProps) {
  const m = useMotionSafe();
  const classes = cn("eyebrow inline-flex items-center gap-3", className);
  const inner = (
    <>
      {rule && <span aria-hidden className="inline-block h-px w-8 bg-ora-bronze" />}
      {children}
    </>
  );
  if (reveal) {
    const MComp = (motion as unknown as Record<string, typeof motion.span>)[as] ?? motion.span;
    return (
      <MComp variants={m.fadeUp} className={classes} {...(rest as HTMLMotionProps<"span">)}>
        {inner}
      </MComp>
    );
  }
  const Comp = as as React.ElementType;
  return (
    <Comp className={classes} {...rest}>
      {inner}
    </Comp>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SplitLineReveal + DisplayHeading                           */
/* ────────────────────────────────────────────────────────── */
export interface SplitLineRevealProps {
  /** text with \n for line breaks, or an array of lines/nodes */
  children: string | React.ReactNode[];
  /** stagger between lines (default 0.08s) */
  gap?: number;
  delay?: number;
  /** animate on mount instead of in view (heroes) */
  onMount?: boolean;
  className?: string;
  lineClassName?: string;
  /** when true, does not orchestrate itself — expects a parent variants container */
  inherit?: boolean;
}

/**
 * Splits content into lines; each line is masked (overflow-hidden) and slides
 * y:110% → 0 with a per-line stagger. Renders inline <span>s so it can live
 * inside any heading element.
 */
export function SplitLineReveal({
  children,
  gap = 0.08,
  delay = 0,
  onMount = false,
  className,
  lineClassName,
  inherit = false,
}: SplitLineRevealProps) {
  const m = useMotionSafe();
  const lines: React.ReactNode[] = typeof children === "string" ? children.split("\n") : children;
  const container: Variants = m.stagger(gap, delay);
  const orchestrate = inherit
    ? {}
    : onMount
      ? { initial: "hidden" as const, animate: "show" as const }
      : { initial: "hidden" as const, whileInView: "show" as const, viewport: viewportOnce };
  return (
    <motion.span className={cn("block", className)} variants={container} {...orchestrate}>
      {lines.map((line, i) => (
        <span key={i} className={cn("block overflow-hidden pb-[0.08em] -mb-[0.08em]", lineClassName)}>
          <motion.span className="block will-change-transform" variants={m.lineReveal}>
            {line === "" ? " " : line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

export type DisplaySize = "xl" | "lg" | "md" | "sm";
export interface DisplayHeadingProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "children"> {
  as?: "h1" | "h2" | "h3" | "p" | "div";
  size?: DisplaySize;
  /** string with \n line breaks, or nodes (one per line) */
  children: string | React.ReactNode[];
  /** italic Playfair accent — wrap parts of a line in <em> yourself; this sets italic weight styling */
  onMount?: boolean;
  gap?: number;
  delay?: number;
  /** disable the split reveal (renders plain) */
  plain?: boolean;
  inherit?: boolean;
  tone?: "default" | "cream" | "bronze";
}

const sizeClass: Record<DisplaySize, string> = {
  xl: "text-display-xl",
  lg: "text-display-lg",
  md: "text-display-md",
  sm: "text-display-sm",
};

/**
 * Playfair display heading with split-line reveal. `\n` = new line.
 *   <DisplayHeading as="h1" size="xl">{"Manchester's women-only\nsanctuary for beauty & wellness."}</DisplayHeading>
 * Use `[&_em]:italic [&_em]:text-ora-bronze` via className to style <em> accents when passing nodes.
 */
export function DisplayHeading({
  as = "h2",
  size = "lg",
  children,
  onMount = false,
  gap = 0.08,
  delay = 0,
  plain = false,
  inherit = false,
  tone = "default",
  className,
  ...rest
}: DisplayHeadingProps) {
  const Tag = as as React.ElementType;
  const toneCls = tone === "cream" ? "text-ora-cream" : tone === "bronze" ? "text-ora-bronze" : "text-foreground";
  const classes = cn(sizeClass[size], toneCls, "font-display [&_em]:italic [&_em]:font-normal", className);
  if (plain) {
    const lines = typeof children === "string" ? children.split("\n") : children;
    return (
      <Tag className={classes} {...rest}>
        {lines.map((l, i) => (
          <span key={i} className="block">
            {l}
          </span>
        ))}
      </Tag>
    );
  }
  return (
    <Tag className={classes} {...rest}>
      <SplitLineReveal gap={gap} delay={delay} onMount={onMount} inherit={inherit}>
        {children}
      </SplitLineReveal>
    </Tag>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SectionIntro                                               */
/* ────────────────────────────────────────────────────────── */
export interface SectionIntroProps {
  eyebrow?: React.ReactNode;
  heading: string | React.ReactNode[];
  headingAs?: "h1" | "h2" | "h3";
  size?: DisplaySize;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  tone?: "default" | "cream";
  /** max width for the lede */
  ledeClassName?: string;
  children?: React.ReactNode;
}
export function SectionIntro({
  eyebrow,
  heading,
  headingAs = "h2",
  size = "lg",
  lede,
  align = "left",
  tone = "default",
  className,
  ledeClassName,
  children,
}: SectionIntroProps) {
  const m = useMotionSafe();
  return (
    <motion.div
      variants={m.stagger(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={cn("mb-12 md:mb-16 lg:mb-20 max-w-3xl", align === "center" && "mx-auto text-center", className)}
    >
      {eyebrow && (
        <Eyebrow reveal as="p" rule={align === "left"} className="mb-5">
          {eyebrow}
        </Eyebrow>
      )}
      <DisplayHeading as={headingAs} size={size} inherit tone={tone === "cream" ? "cream" : "default"}>
        {heading}
      </DisplayHeading>
      {lede && (
        <motion.p variants={m.fadeUp} className={cn("lede mt-6 max-w-2xl", align === "center" && "mx-auto", ledeClassName)}>
          {lede}
        </motion.p>
      )}
      {children && (
        <motion.div variants={m.fadeUp} className="mt-8">
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* IconOrb                                                    */
/* ────────────────────────────────────────────────────────── */
export interface IconOrbProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "light" | "warm" | "dark" | "bronze";
  /** show initials monogram (Playfair) instead of an icon */
  initials?: string;
  pulse?: boolean;
}
const orbSize = { sm: "h-9 w-9 text-sm", md: "h-12 w-12 text-base", lg: "h-16 w-16 text-xl", xl: "h-24 w-24 text-3xl" } as const;
export function IconOrb({ size = "md", tone = "light", initials, pulse = false, className, children, ...rest }: IconOrbProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        tone === "light" && "glass-sm text-ora-taupe",
        tone === "warm" && "glass-warm text-ora-bronze",
        tone === "dark" && "bg-ora-deep/80 border border-ora-bronze/30 text-ora-cream shadow-glass backdrop-blur-glass-sm",
        tone === "bronze" && "bg-ora-bronze/15 border border-ora-bronze/40 text-ora-bronze",
        pulse && "animate-bronze-pulse",
        orbSize[size],
        "[&_svg]:size-[45%]",
        className,
      )}
      {...rest}
    >
      {initials ? <span className="font-display tracking-wide leading-none">{initials}</span> : children}
    </span>
  );
}

/* ────────────────────────────────────────────────────────── */
/* ComingSoonBadge                                            */
/* ────────────────────────────────────────────────────────── */
export interface ComingSoonBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string;
}
export function ComingSoonBadge({ label = "Coming soon", className, ...rest }: ComingSoonBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-ora-bronze/40 bg-ora-bronze/10 px-3 py-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ora-bronze",
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ora-bronze animate-pulse" />
      {label}
    </span>
  );
}

/**
 * Wrapper for faded coming-soon content: opacity .55, 40% grayscale, children non-interactive
 * except elements marked with `data-interactive` (e.g. the "Notify me" button).
 */
export function ComingSoon({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-disabled="true"
      className={cn(
        "relative opacity-[.55] [filter:grayscale(40%)] [&_*]:pointer-events-none [&_[data-interactive]]:pointer-events-auto [&_[data-interactive]_*]:pointer-events-auto",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* BeforeAfterSlider                                          */
/* ────────────────────────────────────────────────────────── */
export interface BeforeAfterSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  before: { src: string; alt: string; width?: number; height?: number };
  after: { src: string; alt: string; width?: number; height?: number };
  /** initial position 0–100 (default 50) */
  initial?: number;
  labels?: { before?: string; after?: string };
  /** aspect ratio class, default aspect-[4/5] */
  ratioClassName?: string;
  onChange?: (percent: number) => void;
}

/**
 * Two stacked <img>s; the "after" is clipped by the handle position.
 * Drag with pointer, or focus the handle and use ←/→ (Home/End, PgUp/PgDn).
 */
export function BeforeAfterSlider({
  before,
  after,
  initial = 50,
  labels = { before: "Before", after: "After" },
  ratioClassName = "aspect-[4/5]",
  className,
  onChange,
  ...rest
}: BeforeAfterSliderProps) {
  const [pos, setPos] = React.useState(() => Math.min(100, Math.max(0, initial)));
  const [dragging, setDragging] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const m = useMotionSafe();

  const update = React.useCallback(
    (clientX: number) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
      setPos(p);
      onChange?.(p);
    },
    [onChange],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
    update(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging) update(e.clientX);
  };
  const stop = () => setDragging(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    let next = pos;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = pos - step;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = pos + step;
        break;
      case "PageDown":
        next = pos - 10;
        break;
      case "PageUp":
        next = pos + 10;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = 100;
        break;
      default:
        return;
    }
    e.preventDefault();
    next = Math.min(100, Math.max(0, next));
    setPos(next);
    onChange?.(next);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "group relative w-full select-none overflow-hidden rounded-2xl bg-ora-sand touch-pan-y",
        ratioClassName,
        dragging ? "cursor-grabbing" : "cursor-ew-resize",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      {...rest}
    >
      {/* before (full) */}
      <img
        src={before.src}
        alt={before.alt}
        width={before.width}
        height={before.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* after (clipped) */}
      <img
        src={after.src}
        alt={after.alt}
        width={after.width}
        height={after.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      />

      {/* labels */}
      <span className="pointer-events-none absolute left-3 top-3 glass-pill px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ora-cream">
        {labels.before}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 glass-pill px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ora-cream">
        {labels.after}
      </span>

      {/* divider + handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-ora-cream/90 shadow-[0_0_12px_rgba(0,0,0,.35)]"
        style={{ left: `${pos}%` }}
      />
      <motion.button
        type="button"
        role="slider"
        aria-label="Compare before and after"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)}% after`}
        onKeyDown={onKeyDown}
        whileHover={m.reduced ? undefined : { scale: 1.06 }}
        whileTap={m.reduced ? undefined : { scale: 0.96 }}
        transition={spring.snappy}
        className="focus-ring absolute top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full glass-strong text-ora-cream cursor-grab active:cursor-grabbing"
        style={{ left: `${pos}%` }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 6 3 12l6 6" />
          <path d="m15 6 6 6-6 6" />
        </svg>
      </motion.button>
    </div>
  );
}

/* Re-exports for convenience so agents can import everything from one place */
export { hoverLift, easeLuxury, duration };
