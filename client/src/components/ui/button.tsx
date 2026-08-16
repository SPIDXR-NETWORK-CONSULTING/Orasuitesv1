import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/lib/motion";

/**
 * ORÁ button system.
 *  - primary  : taupe fill → chocolate on hover, bronze glow, spring scale 1.03
 *  - ghost    : 1px border (cream/40 on dark bands, taupe on light), fills on hover
 *  - luxury   : dark chocolate fill with bronze hairline + glow (hero / dark CTA on light bg)
 *  - glass    : frosted pill for use over imagery
 *  - link     : underline-draw text link (bronze)
 *  - default/secondary/outline/destructive kept for shadcn compatibility.
 */
const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium tracking-[0.02em] select-none " +
    "transition-[background-color,color,border-color,box-shadow] duration-450 ease-luxury " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ora-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-transparent " +
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "rounded-full bg-ora-taupe text-ora-cream border border-transparent shadow-luxury hover:bg-ora-chocolate hover:shadow-glow-bronze",
        ghost:
          "rounded-full bg-transparent border border-ora-taupe/60 text-foreground hover:border-ora-taupe hover:bg-ora-taupe/10 " +
          "[.band-dark_&]:border-ora-cream/40 [.band-dark_&]:text-ora-cream [.band-dark_&]:hover:border-ora-cream [.band-dark_&]:hover:bg-ora-cream/10 " +
          "[.band-chocolate_&]:border-ora-cream/40 [.band-chocolate_&]:text-ora-cream [.band-chocolate_&]:hover:border-ora-cream [.band-chocolate_&]:hover:bg-ora-cream/10 " +
          "[.on-dark_&]:border-ora-cream/40 [.on-dark_&]:text-ora-cream [.on-dark_&]:hover:border-ora-cream [.on-dark_&]:hover:bg-ora-cream/10",
        luxury:
          "rounded-full bg-ora-deep text-ora-cream border border-ora-bronze/40 shadow-luxury hover:border-ora-bronze hover:shadow-glow-bronze",
        glass:
          "rounded-full glass-pill text-ora-cream hover:text-ora-cream",
        link:
          "rounded-none px-0 text-ora-bronze bg-transparent border-0 " +
          "after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-ora-bronze after:transition-transform after:duration-450 after:ease-luxury hover:after:scale-x-100",
        // shadcn compatibility
        default:
          "rounded-full bg-ora-taupe text-ora-cream border border-transparent shadow-luxury hover:bg-ora-chocolate hover:shadow-glow-bronze",
        secondary:
          "rounded-full bg-ora-bone text-foreground border border-ora-greige hover:bg-ora-sand hover:border-ora-taupe/50",
        outline:
          "rounded-full bg-transparent border border-ora-taupe/60 text-foreground hover:border-ora-taupe hover:bg-ora-taupe/10",
        destructive:
          "rounded-full bg-destructive text-destructive-foreground border border-destructive-border",
      },
      size: {
        default: "min-h-11 px-6 py-2.5 text-[0.9375rem]",
        sm: "min-h-9 px-4 py-2 text-[0.8125rem]",
        lg: "min-h-[3.25rem] px-8 py-3 text-base",
        xl: "min-h-14 px-10 py-3.5 text-[1.0625rem]",
        icon: "h-11 w-11 p-0",
        pill: "min-h-9 px-4 py-1.5 text-[0.8125rem]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** disable spring scale on hover/tap */
  still?: boolean;
}

/**
 * Button — spring hover scale (1.03) + tap (0.98) unless `still` or reduced motion.
 * With `asChild`, wraps the child (e.g. <a>/<Link>) and skips the motion wrapper.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, still = false, ...props }, ref) => {
    const m = useMotionSafe();
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      return <Slot className={classes} ref={ref} {...props} />;
    }

    const noSpring = still || m.reduced || variant === "link";
    if (noSpring) {
      return <button className={classes} ref={ref} {...props} />;
    }

    // Motion button — strip conflicting DOM-vs-motion event prop types
    const {
      onAnimationStart: _oas,
      onDragStart: _ods,
      onDragEnd: _ode,
      onDrag: _od,
      ...rest
    } = props as ButtonProps & Record<string, unknown>;

    return (
      <motion.button
        className={classes}
        ref={ref}
        whileHover={m.hoverButton}
        whileTap={m.tapButton}
        {...(rest as HTMLMotionProps<"button">)}
      />
    );
  },
);
Button.displayName = "Button";

/** Convenience aliases */
const PrimaryButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>((p, ref) => (
  <Button ref={ref} variant="primary" {...p} />
));
PrimaryButton.displayName = "PrimaryButton";

const GhostButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>((p, ref) => (
  <Button ref={ref} variant="ghost" {...p} />
));
GhostButton.displayName = "GhostButton";

export { Button, PrimaryButton, GhostButton, buttonVariants };
