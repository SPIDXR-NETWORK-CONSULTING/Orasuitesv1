import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
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
    </>
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
