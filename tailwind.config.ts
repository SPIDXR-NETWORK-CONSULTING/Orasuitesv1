import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem",
        md: ".375rem",
        sm: ".1875rem",
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        ora: {
          milk: "hsl(var(--ora-milk) / <alpha-value>)",
          sand: "hsl(var(--ora-sand) / <alpha-value>)",
          bone: "hsl(var(--ora-bone) / <alpha-value>)",
          smoke: "hsl(var(--ora-smoke) / <alpha-value>)",
          chocolate: "hsl(var(--ora-chocolate) / <alpha-value>)",
          fog: "hsl(var(--ora-fog) / <alpha-value>)",
          greige: "hsl(var(--ora-greige) / <alpha-value>)",
          taupe: "hsl(var(--ora-taupe) / <alpha-value>)",
          cream: "hsl(var(--ora-cream) / <alpha-value>)",
          bronze: "rgb(var(--ora-bronze-rgb) / <alpha-value>)",
          deep: "var(--ora-deep)",
          void: "var(--ora-void)",
        },
        glass: {
          DEFAULT: "var(--glass-white)",
          strong: "var(--glass-white-strong)",
          warm: "var(--glass-warm)",
          border: "var(--glass-border)",
          "border-warm": "var(--glass-border-warm)",
        },
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
        "glass-sm": "var(--glass-blur-sm)",
      },
      boxShadow: {
        "glow-bronze": "0 0 24px var(--ora-bronze-glow), 0 10px 30px -12px rgba(15, 9, 8, 0.35)",
        "glow-bronze-lg": "0 0 40px var(--ora-bronze-glow), 0 24px 60px -24px rgba(15, 9, 8, 0.5)",
        glass: "var(--glass-highlight), 0 20px 60px -30px rgba(15, 9, 8, 0.45)",
        luxury: "0 24px 60px -24px rgba(15, 9, 8, 0.35)",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.22, 1, 0.36, 1)",
        reveal: "cubic-bezier(0.16, 1, 0.3, 1)",
        hover: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "450": "450ms",
        "700": "700ms",
        "900": "900ms",
      },
      letterSpacing: {
        display: "-0.02em",
        eyebrow: "0.25em",
      },
      maxWidth: {
        content: "1280px",
        wide: "1440px",
      },
      spacing: {
        section: "clamp(6rem, 10vw, 10rem)",
        "section-sm": "clamp(4rem, 7vw, 6rem)",
      },
      fontFamily: {
        sans: ["DM Sans", "var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "var(--font-serif)", "Georgia", "serif"],
        display: ["Playfair Display", "var(--font-display)", "Georgia", "serif"],
        mono: ["JetBrains Mono", "var(--font-mono)", "monospace"],
      },
      // Fluid display scale — same values as the .text-display-* utilities in index.css
      fontSize: {
        "display-xl": ["clamp(2.75rem, 7vw, 6.5rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.5rem, 5.5vw, 5rem)", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display": ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display-sm": ["clamp(1.5rem, 2.6vw, 2.25rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        eyebrow: ["0.71875rem", { lineHeight: "1.4", letterSpacing: "0.25em" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scroll-hint": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(8px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "bronze-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 var(--ora-bronze-glow)" },
          "50%": { boxShadow: "0 0 0 10px rgba(185, 136, 103, 0)" },
        },
        "line-grow": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "ken-burns": {
          from: { transform: "scale(1.06)" },
          to: { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "slide-in-left": "slide-in-left 0.8s ease-out forwards",
        "slide-in-right": "slide-in-right 0.8s ease-out forwards",
        "scale-in": "scale-in 0.6s ease-out forwards",
        "scroll-hint": "scroll-hint 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "bronze-pulse": "bronze-pulse 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "line-grow": "line-grow 1s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "ken-burns": "ken-burns 6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
