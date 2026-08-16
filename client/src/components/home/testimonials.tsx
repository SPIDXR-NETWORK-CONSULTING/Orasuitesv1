import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Eyebrow, IconOrb } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce, easeLuxury } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    id: 1,
    quote:
      "Ora transformed not just my skin, but my confidence. The team is professional, the space is stunning, and I always leave feeling like the best version of myself.",
    author: "Sarah M.",
    location: "Manchester",
    treatment: "Profhilo Treatment",
  },
  {
    id: 2,
    quote:
      "The team at Ora truly cares. It's the only place I trust with my skin. Every visit feels like a ritual, not just an appointment. I've never felt more beautiful.",
    author: "Amina K.",
    location: "Didsbury",
    treatment: "Facial Aesthetics",
  },
  {
    id: 3,
    quote:
      "I rent a room at Ora and it's been transformative for my practice. The community is incredible, and my clients love the luxurious space.",
    author: "Dr. Leila R.",
    location: "Manchester",
    treatment: "Room Rental Partner",
  },
  {
    id: 4,
    quote:
      "The atmosphere at Ora is unlike any other salon I've been to. It truly feels like a sanctuary. The attention to detail in every treatment is remarkable.",
    author: "Emma T.",
    location: "Chorlton",
    treatment: "Hair Services",
  },
];

const AUTOPLAY_MS = 6000;

/**
 * Testimonials (v2) — centred, small quote type, crossfade, arrows + dots.
 * Existing quotes kept verbatim.
 */
export function TestimonialsSection() {
  const m = useMotionSafe();
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const count = TESTIMONIALS.length;
  const t = TESTIMONIALS[index];

  useEffect(() => {
    if (!autoplay || m.reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplay, count, m.reduced]);

  const prev = useCallback(() => {
    setAutoplay(false);
    setIndex((i) => (i === 0 ? count - 1 : i - 1));
  }, [count]);
  const next = useCallback(() => {
    setAutoplay(false);
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const fade = m.reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

  return (
    <Section id="testimonials" tone="sand" grain className="overflow-hidden">
      <SectionHeader title="Client words" align="center" className="mb-6" />

      <motion.div
        variants={m.fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="relative mx-auto max-w-2xl"
        onMouseEnter={() => setAutoplay(false)}
        onMouseLeave={() => setAutoplay(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") prev();
          if (e.key === "ArrowRight") next();
        }}
      >

        <div className="relative px-2 text-center sm:px-6" aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            <motion.figure
              key={t.id}
              initial={fade.initial}
              animate={fade.animate}
              exit={fade.exit}
              transition={{ duration: 0.5, ease: easeLuxury }}
              className="mx-auto max-w-2xl"
            >
              <blockquote>
                <p className="font-display text-[clamp(1.05rem,1.6vw,1.25rem)] leading-[1.45] tracking-[-0.01em] text-foreground text-balance">
                  {t.quote}
                </p>
              </blockquote>
              <figcaption className="mt-5 flex flex-col items-center gap-1">
                <Eyebrow as="span" className="!text-ora-taupe">
                  {t.author}
                </Eyebrow>
                <span className="font-sans text-[0.875rem] text-ora-fog">
                  {t.location} · {t.treatment}
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            data-testid="button-testimonial-prev"
            aria-label="Previous testimonial"
            className="focus-ring rounded-full"
          >
            <IconOrb size="sm" tone="warm" className="hover-bronze transition-transform duration-450 ease-luxury hover:-translate-x-0.5">
              <ChevronLeft />
            </IconOrb>
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Testimonials">
            {TESTIMONIALS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Testimonial ${i + 1} — ${item.author}`}
                onClick={() => {
                  setAutoplay(false);
                  setIndex(i);
                }}
                className={cn(
                  "focus-ring h-2 rounded-full transition-all duration-450 ease-luxury",
                  i === index ? "w-7 bg-ora-bronze" : "w-2 bg-ora-smoke hover:bg-ora-taupe",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            data-testid="button-testimonial-next"
            aria-label="Next testimonial"
            className="focus-ring rounded-full"
          >
            <IconOrb size="sm" tone="warm" className="hover-bronze transition-transform duration-450 ease-luxury hover:translate-x-0.5">
              <ChevronRight />
            </IconOrb>
          </button>
        </div>
      </motion.div>
    </Section>
  );
}
