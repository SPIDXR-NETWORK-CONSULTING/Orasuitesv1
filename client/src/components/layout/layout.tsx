import { Header } from "./header";
import { Footer } from "./footer";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  /** set when the page starts with a light section (no dark hero) so content clears the fixed header */
  padTop?: boolean;
  /** tells the header the top of the page is light (dark text over it) */
  lightHeader?: boolean;
  className?: string;
}

export function Layout({ children, padTop = false, lightHeader = false, className }: LayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-ora-milk text-foreground", className)}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ora-deep focus:px-4 focus:py-2 focus:text-ora-cream"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className={cn("flex-1", padTop && "pt-24 md:pt-28")} data-header={lightHeader ? "light" : undefined}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
