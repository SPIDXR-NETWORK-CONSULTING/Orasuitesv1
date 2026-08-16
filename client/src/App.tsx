import { Switch, Route, useLocation } from "wouter";
import { useEffect, useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { pageTransition } from "@/lib/motion";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import ServicesPage from "@/pages/services";
import RoomRentalsPage from "@/pages/room-rentals";
import AboutPage from "@/pages/about";
import ResultsPage from "@/pages/results";
import ContactPage from "@/pages/contact";
import BookPage from "@/pages/book";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";

/**
 * Scroll handling on route change: runs AFTER the exit transition (so the old
 * page doesn't jump), scrolls to top — unless there's a hash, in which case the
 * anchor is scrolled into view once the new page has mounted.
 */
function scrollForRoute() {
  const hash = window.location.hash;
  if (hash) {
    const id = decodeURIComponent(hash.slice(1));
    // allow the new page a frame to mount
    window.requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: "start" });
      else window.scrollTo({ top: 0, left: 0 });
    });
    return;
  }
  window.scrollTo({ top: 0, left: 0 });
}

function Router() {
  const [location] = useLocation();
  const reduced = useReducedMotion();
  const first = useRef(true);

  // Reduced motion: no exit animation, so scroll immediately on change.
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) scrollForRoute();
  }, [location, reduced]);

  // Ensure the browser doesn't fight our scroll handling on navigation
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  // Same-page hash navigation (e.g. /services → /services#nails): wouter's location
  // (pathname) doesn't change, so handle the anchor jump on its pushState/replaceState events.
  useEffect(() => {
    let last = window.location.pathname;
    const onNav = () => {
      const now = window.location.pathname;
      if (now === last && window.location.hash) scrollForRoute();
      last = now;
    };
    window.addEventListener("pushState", onNav);
    window.addEventListener("replaceState", onNav);
    window.addEventListener("hashchange", onNav);
    return () => {
      window.removeEventListener("pushState", onNav);
      window.removeEventListener("replaceState", onNav);
      window.removeEventListener("hashchange", onNav);
    };
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={scrollForRoute}>
      <motion.div
        key={location}
        initial={reduced ? false : pageTransition.initial}
        animate={pageTransition.animate}
        exit={reduced ? undefined : pageTransition.exit}
        className="min-h-screen"
      >
        <Switch location={location}>
          <Route path="/" component={HomePage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/room-rentals" component={RoomRentalsPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/results" component={ResultsPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/book" component={BookPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/terms" component={TermsPage} />
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
