import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import ServicesPage from "@/pages/services";
import AboutPage from "@/pages/about";
import ResultsPage from "@/pages/results";
import ContactPage from "@/pages/contact";
import KoreanHeadSpaPage from "@/pages/korean-head-spa";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
};

function AnimatedRoute({ component: Component }: { component: React.ComponentType }) {
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  return (
    <motion.div {...pageTransition}>
      <Component />
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path="/" component={() => <AnimatedRoute component={HomePage} />} />
        <Route path="/services" component={() => <AnimatedRoute component={ServicesPage} />} />
        <Route path="/about" component={() => <AnimatedRoute component={AboutPage} />} />
        <Route path="/results" component={() => <AnimatedRoute component={ResultsPage} />} />
        <Route path="/contact" component={() => <AnimatedRoute component={ContactPage} />} />
        <Route path="/korean-head-spa" component={() => <AnimatedRoute component={KoreanHeadSpaPage} />} />
        <Route path="/privacy" component={() => <AnimatedRoute component={PrivacyPage} />} />
        <Route path="/terms" component={() => <AnimatedRoute component={TermsPage} />} />
        <Route component={NotFound} />
      </Switch>
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
