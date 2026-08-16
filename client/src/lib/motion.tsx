/**
 * ORÁ motion system — single source of truth for easing, springs and variants.
 * Mirrors the CSS tokens in index.css (--ease-luxury etc.).
 *
 * Usage:
 *   const m = useMotionSafe();
 *   <motion.div variants={m.fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce} />
 *   <Stagger><Reveal>…</Reveal><Reveal>…</Reveal></Stagger>
 */
import * as React from "react";
import { motion, useReducedMotion, type Variants, type Transition, type HTMLMotionProps } from "framer-motion";

/* ── Easing ─────────────────────────────────────────────── */
export const easeLuxury: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const easeReveal: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const easeHover: [number, number, number, number] = [0.4, 0, 0.2, 1];

/* ── Springs (no overshoot > ~4%) ───────────────────────── */
export const spring = {
  /** buttons, chips, pills */
  snappy: { type: "spring", stiffness: 160, damping: 20, mass: 0.8 } as Transition,
  /** cards on hover / layout moves */
  soft: { type: "spring", stiffness: 120, damping: 22, mass: 1 } as Transition,
  /** mobile drawers, sheets */
  drawer: { type: "spring", stiffness: 140, damping: 24, mass: 1 } as Transition,
} as const;

/* ── Durations ──────────────────────────────────────────── */
export const duration = {
  fast: 0.25,
  hover: 0.45,
  reveal: 0.9,
  slow: 1.2,
  page: 0.35,
  stagger: 0.08,
} as const;

/* ── Viewport presets ───────────────────────────────────── */
export const viewportOnce = { once: true, margin: "-80px" } as const;
export const viewportOnceSoft = { once: true, margin: "-40px" } as const;

/* ── Variants ───────────────────────────────────────────── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: duration.reveal, ease: easeLuxury } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.reveal, ease: easeLuxury } },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: duration.reveal, ease: easeLuxury } },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: duration.reveal, ease: easeLuxury } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: duration.reveal, ease: easeLuxury } },
};

/** Split-line headline reveal: wrap each line in overflow-hidden, animate the inner. */
export const lineReveal: Variants = {
  hidden: { y: "110%", opacity: 0 },
  show: { y: "0%", opacity: 1, transition: { duration: 0.9, ease: easeLuxury } },
};

/** Clip-path band grow (dark bands, image reveals). */
export const clipReveal: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  show: { clipPath: "inset(0 0 0% 0)", transition: { duration: 1, ease: easeLuxury } },
};

/** Horizontal rule draw. */
export const lineGrow: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 1, ease: easeLuxury } },
};

/** Container that staggers its children. */
export function stagger(children: number = duration.stagger, delayChildren: number = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: children, delayChildren } },
  };
}
export const staggerContainer = stagger();

/** Page transition (App.tsx). */
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.page, ease: easeLuxury } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: easeLuxury } },
} as const;

/* ── Hover presets ──────────────────────────────────────── */
export const hoverLift = { y: -6, scale: 1.02, transition: spring.soft } as const;
export const hoverButton = { scale: 1.03, transition: spring.snappy } as const;
export const tapButton = { scale: 0.98 } as const;

/* ── Reduced motion ─────────────────────────────────────── */
const staticVariants: Variants = {
  hidden: { opacity: 1 },
  show: { opacity: 1 },
};

export interface MotionSafe {
  reduced: boolean;
  fadeUp: Variants;
  fadeIn: Variants;
  fadeLeft: Variants;
  fadeRight: Variants;
  scaleIn: Variants;
  lineReveal: Variants;
  clipReveal: Variants;
  lineGrow: Variants;
  stagger: (children?: number, delayChildren?: number) => Variants;
  hoverLift: typeof hoverLift | undefined;
  hoverButton: typeof hoverButton | undefined;
  tapButton: typeof tapButton | undefined;
}

/**
 * Returns the variant set, or static (no-transform) equivalents when the user
 * prefers reduced motion. Everything stays visible; nothing moves.
 */
export function useMotionSafe(): MotionSafe {
  const reduced = useReducedMotion() ?? false;
  return React.useMemo<MotionSafe>(() => {
    if (reduced) {
      const stg = () => ({ hidden: {}, show: {} }) as Variants;
      return {
        reduced: true,
        fadeUp: staticVariants,
        fadeIn: staticVariants,
        fadeLeft: staticVariants,
        fadeRight: staticVariants,
        scaleIn: staticVariants,
        lineReveal: staticVariants,
        clipReveal: staticVariants,
        lineGrow: { hidden: { scaleX: 1 }, show: { scaleX: 1 } },
        stagger: stg,
        hoverLift: undefined,
        hoverButton: undefined,
        tapButton: undefined,
      };
    }
    return {
      reduced: false,
      fadeUp,
      fadeIn,
      fadeLeft,
      fadeRight,
      scaleIn,
      lineReveal,
      clipReveal,
      lineGrow,
      stagger,
      hoverLift,
      hoverButton,
      tapButton,
    };
  }, [reduced]);
}

/* ── Helper components ──────────────────────────────────── */
type RevealVariant = "up" | "in" | "left" | "right" | "scale";

export interface RevealProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  /** which variant to use (default "up") */
  variant?: RevealVariant;
  /** extra delay in seconds */
  delay?: number;
  /** render as a different tag */
  as?: "div" | "section" | "article" | "li" | "span" | "p" | "figure" | "header" | "footer";
  /** if true, animates on mount rather than in view */
  onMount?: boolean;
  /** if true, inherits orchestration from a parent <Stagger>/variants container (no own initial/whileInView) */
  inherit?: boolean;
}

/**
 * Single reveal on scroll (viewport once, -80px). Use inside <Stagger> to inherit
 * the parent's orchestration — in that case do NOT pass initial/whileInView.
 */
export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  { variant = "up", delay = 0, as = "div", onMount = false, inherit = false, children, transition, ...rest },
  ref,
) {
  const m = useMotionSafe();
  const map: Record<RevealVariant, Variants> = {
    up: m.fadeUp,
    in: m.fadeIn,
    left: m.fadeLeft,
    right: m.fadeRight,
    scale: m.scaleIn,
  };
  const Comp = (motion as unknown as Record<string, typeof motion.div>)[as] ?? motion.div;
  const withDelay: Variants =
    delay && !m.reduced
      ? {
          hidden: map[variant].hidden,
          show: {
            ...(map[variant].show as object),
            transition: { duration: duration.reveal, ease: easeLuxury, delay },
          },
        }
      : map[variant];

  return (
    <Comp
      ref={ref}
      variants={withDelay}
      {...(inherit
        ? {}
        : onMount
          ? { initial: "hidden", animate: "show" }
          : { initial: "hidden", whileInView: "show", viewport: viewportOnce })}
      transition={transition}
      {...rest}
    >
      {children}
    </Comp>
  );
});

export interface StaggerProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  /** seconds between children (default 0.08) */
  gap?: number;
  /** delay before first child */
  delay?: number;
  as?: "div" | "section" | "ul" | "ol" | "nav" | "article" | "header";
  onMount?: boolean;
  /** viewport margin override */
  margin?: string;
}

/**
 * Orchestrates children: each direct child should be a motion element with
 * `variants` (e.g. <Reveal>, <GlassCard>) — no initial/whileInView on children.
 */
export const Stagger = React.forwardRef<HTMLDivElement, StaggerProps>(function Stagger(
  { gap = duration.stagger, delay = 0, as = "div", onMount = false, margin, children, ...rest },
  ref,
) {
  const m = useMotionSafe();
  const Comp = (motion as unknown as Record<string, typeof motion.div>)[as] ?? motion.div;
  return (
    <Comp
      ref={ref}
      variants={m.stagger(gap, delay)}
      {...(onMount
        ? { initial: "hidden", animate: "show" }
        : { initial: "hidden", whileInView: "show", viewport: { once: true, margin: margin ?? viewportOnce.margin } })}
      {...rest}
    >
      {children}
    </Comp>
  );
});
