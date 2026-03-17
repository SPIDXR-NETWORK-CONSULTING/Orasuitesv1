import { useEffect, useRef } from "react";

/**
 * useScrollReveal — attaches an IntersectionObserver to a container ref.
 * All children with .reveal-up, .reveal-left, .reveal-right, .reveal-scale,
 * or .rule-reveal classes get .is-visible added when they enter the viewport.
 *
 * @param threshold  — 0–1 fraction visible before triggering (default 0.15)
 * @param once       — if true, observer disconnects after first trigger (default true)
 */
export function useScrollReveal(threshold = 0.15, once = true) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const revealClasses = [
      ".reveal-up",
      ".reveal-left",
      ".reveal-right",
      ".reveal-scale",
      ".rule-reveal",
      ".count-animate",
    ];

    const targets = el.querySelectorAll<HTMLElement>(revealClasses.join(", "));

    if (targets.length === 0) {
      // If the element itself is a reveal target
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            if (once) observer.disconnect();
          }
        },
        { threshold }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }

    const observers: IntersectionObserver[] = [];

    targets.forEach((target) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            target.classList.add("is-visible");
            if (once) observer.disconnect();
          }
        },
        { threshold }
      );
      observer.observe(target);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [threshold, once]);

  return ref;
}

/**
 * useParallax — returns a ref whose element gets a translateY style
 * based on scroll position, creating a subtle parallax drift.
 *
 * @param speed  — multiplier (0.3 = 30% of scroll offset, default 0.3)
 */
export function useParallax(speed = 0.3) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const offset = window.scrollY + rect.top;
      const scroll = window.scrollY - offset;
      el.style.transform = `translateY(${scroll * speed}px)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return ref;
}

/**
 * useCountUp — animates a number from 0 to target when element enters viewport.
 */
export function useCountUp(target: number, duration = 1800) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = String(Math.round(ease * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return ref;
}

/**
 * useScrollProgress — tracks overall page scroll 0–1.
 * Attach to a `<div>` and set its scaleX via inline style.
 */
export function useScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      el.style.transform = `scaleX(${progress})`;
    };

    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return ref;
}
