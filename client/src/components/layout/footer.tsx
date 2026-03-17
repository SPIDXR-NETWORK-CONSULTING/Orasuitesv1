import { Link } from "wouter";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import logoImage from "@assets/WhatsApp_Image_2025-08-06_at_17.22.03_(1)_1770213670965.jpeg";

const quickLinks = [
  { href: "/services", label: "Services" },
  { href: "/room-rentals", label: "Room Rentals" },
  { href: "/about", label: "About Us" },
  { href: "/results", label: "Results" },
  { href: "/contact", label: "Contact" },
];

const services = [
  { href: "/korean-head-spa", label: "Korean Head Spa" },
  { href: "/services#aesthetics", label: "Aesthetics" },
  { href: "/services#nails", label: "Nails & Pedicure" },
  { href: "/services#hair", label: "Hair Services" },
  { href: "/services#laser", label: "Laser Removal" },
  { href: "/services#wellness", label: "Wellness" },
];

export function Footer() {
  return (
    <footer data-testid="footer" className="bg-ora-sand border-t border-ora-greige">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="lg:col-span-1">
            <Link href="/">
              <img
                src={logoImage}
                alt="ORÁ."
                className="h-14 w-auto object-contain mb-4"
              />
            </Link>
            <p className="text-ora-fog text-sm leading-relaxed mb-6">
              Manchester's premier women-only wellness sanctuary. Where beauty
              meets intention. Where care becomes ritual.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/orasuites"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-instagram"
                className="p-2 rounded-full bg-ora-bone text-ora-fog hover:text-ora-taupe hover:bg-ora-greige transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com/orasuites"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-facebook"
                className="p-2 rounded-full bg-ora-bone text-ora-fog hover:text-ora-taupe hover:bg-ora-greige transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-lg text-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-ora-fog hover:text-ora-taupe transition-colors text-sm"
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg text-foreground mb-4">
              Our Services
            </h4>
            <ul className="space-y-3">
              {services.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-ora-fog hover:text-ora-taupe transition-colors text-sm">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg text-foreground mb-4">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-ora-taupe mt-0.5 flex-shrink-0" />
                <span className="text-ora-fog text-sm">
                  Manchester City Centre
                  <br />
                  Greater Manchester, UK
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-ora-taupe flex-shrink-0" />
                <a
                  href="tel:+441onal"
                  className="text-ora-fog hover:text-ora-taupe transition-colors text-sm"
                >
                  +44 (0) 123 456 7890
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-ora-taupe flex-shrink-0" />
                <a
                  href="mailto:hello@orasuites.com"
                  className="text-ora-fog hover:text-ora-taupe transition-colors text-sm"
                >
                  hello@orasuites.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-ora-greige">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-ora-smoke text-sm">
              &copy; {new Date().getFullYear()} Ora Suites. A sanctuary for women.
            </p>
            <div className="flex items-center gap-6 text-sm text-ora-smoke">
              <Link href="/privacy">
                <span className="hover:text-ora-taupe transition-colors">
                  Privacy Policy
                </span>
              </Link>
              <Link href="/terms">
                <span className="hover:text-ora-taupe transition-colors">
                  Terms of Service
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
