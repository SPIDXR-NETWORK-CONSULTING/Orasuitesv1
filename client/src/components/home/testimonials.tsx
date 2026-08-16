import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Section, SectionHeader } from "@/components/ui/section";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote:
      "Ora transformed not just my skin, but my confidence. The team is professional, the space is stunning, and I always leave feeling like the best version of myself.",
    author: "Sarah M.",
    location: "Manchester",
    rating: 5,
    treatment: "Profhilo Treatment",
  },
  {
    id: 2,
    quote:
      "The team at Ora truly cares. It's the only place I trust with my skin. Every visit feels like a ritual, not just an appointment. I've never felt more beautiful.",
    author: "Amina K.",
    location: "Didsbury",
    rating: 5,
    treatment: "Facial Aesthetics",
  },
  {
    id: 3,
    quote:
      "I rent a room at Ora and it's been transformative for my practice. The community is incredible, and my clients love the luxurious space.",
    author: "Dr. Leila R.",
    location: "Manchester",
    rating: 5,
    treatment: "Room Rental Partner",
  },
  {
    id: 4,
    quote:
      "The atmosphere at Ora is unlike any other salon I've been to. It truly feels like a sanctuary. The attention to detail in every treatment is remarkable.",
    author: "Emma T.",
    location: "Chorlton",
    rating: 5,
    treatment: "Hair Services",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <Section id="testimonials" className="bg-ora-sand">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="What Our Clients Say"
          subtitle="Real stories from clients who have experienced the Ora difference."
        />

        <div
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center py-8"
              >
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className="fill-ora-taupe text-ora-taupe"
                    />
                  ))}
                </div>
                <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl text-foreground leading-relaxed mb-8">
                  "{testimonials[currentIndex].quote}"
                </blockquote>
                <div>
                  <p className="font-medium text-foreground">
                    {testimonials[currentIndex].author}
                  </p>
                  <p className="text-ora-fog text-sm">
                    {testimonials[currentIndex].location} ·{" "}
                    {testimonials[currentIndex].treatment}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={goToPrevious}
              data-testid="button-testimonial-prev"
              className="p-3 rounded-full bg-ora-bone text-ora-fog hover:text-ora-taupe hover:bg-ora-greige transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-6 bg-ora-taupe"
                      : "bg-ora-smoke hover:bg-ora-fog"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              data-testid="button-testimonial-next"
              className="p-3 rounded-full bg-ora-bone text-ora-fog hover:text-ora-taupe hover:bg-ora-greige transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}
