import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const STORAGE_KEY = "ora-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div
            className="glass-card-warm p-5 relative"
            style={{ backdropFilter: "blur(24px)" }}
          >
            {/* Close */}
            <button
              onClick={decline}
              className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>

            <p
              className="text-xs tracking-[0.2em] uppercase font-light mb-2"
              style={{ color: "var(--ora-bronze)" }}
            >
              Cookie Notice
            </p>
            <p className="text-white/60 text-xs font-light leading-relaxed mb-4">
              We use cookies to enhance your experience and understand how you use our site.
              Essential cookies are always active.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={accept}
                className="flex-1 py-2.5 text-xs font-medium text-white transition-all"
                style={{
                  background: "var(--ora-bronze)",
                  borderRadius: "9999px",
                  letterSpacing: "0.06em",
                }}
              >
                Accept All
              </button>
              <button
                onClick={decline}
                className="text-white/40 text-xs font-light hover:text-white/70 transition-colors whitespace-nowrap"
                style={{ letterSpacing: "0.04em" }}
              >
                Essential only
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
