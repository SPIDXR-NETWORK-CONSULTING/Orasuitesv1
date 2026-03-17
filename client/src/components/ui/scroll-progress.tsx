import { useEffect, useRef } from "react";

export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const bar = barRef.current;
      if (!bar) return;
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${total > 0 ? scrolled / total : 0})`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none origin-left"
      style={{ background: "transparent" }}
    >
      <div
        ref={barRef}
        className="h-full origin-left"
        style={{
          background: "var(--ora-bronze)",
          transformOrigin: "left",
          transform: "scaleX(0)",
          transition: "transform 0.05s linear",
          opacity: 0.7,
        }}
      />
    </div>
  );
}
