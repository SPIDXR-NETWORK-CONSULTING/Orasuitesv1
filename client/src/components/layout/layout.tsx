import { Header } from "./header";
import { Footer } from "./footer";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { BackToTop } from "@/components/ui/back-to-top";
import { ScrollProgressBar } from "@/components/ui/scroll-progress";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-ora-milk">
      <ScrollProgressBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
      <CookieBanner />
    </div>
  );
}
