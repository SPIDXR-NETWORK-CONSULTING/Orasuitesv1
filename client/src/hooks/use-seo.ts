import { useEffect } from "react";
import { useLocation } from "wouter";

export const SITE_URL = "https://www.orasuites.com";
export const SITE_NAME = "ORÁ Suites";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/ora-logo-new.jpg`;

export interface SEOConfig {
  /** full <title> — keyword-first on inner pages */
  title: string;
  description: string;
  /** override canonical path (defaults to current route, no query/hash) */
  path?: string;
  /** absolute or root-relative og:image (defaults to /ora-logo-new.jpg) */
  image?: string;
  /** og:type (default website) */
  type?: "website" | "article" | "profile";
  /** JSON-LD object (or array) injected as <script type="application/ld+json" id="seo-jsonld"> */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** set to true to add noindex */
  noindex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function absolute(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Per-route SEO: title, description, canonical, Open Graph, Twitter card and optional JSON-LD.
 *   useSEO({ title: "...", description: "...", jsonLd: defaultBusinessJsonLd() });
 */
export function useSEO({ title, description, path, image, type = "website", jsonLd, noindex = false }: SEOConfig) {
  const [location] = useLocation();
  const routePath = path ?? location;
  const canonical = `${SITE_URL}${routePath === "/" ? "/" : routePath.replace(/\/+$/, "")}`;
  const ogImage = absolute(image ?? DEFAULT_OG_IMAGE);
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = "en-GB";

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
    upsertLink("canonical", canonical);

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:locale", "en_GB");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    // JSON-LD (replace on every route)
    const existing = document.getElementById("seo-jsonld");
    if (jsonLdString) {
      const script = existing instanceof HTMLScriptElement ? existing : document.createElement("script");
      script.type = "application/ld+json";
      script.id = "seo-jsonld";
      script.textContent = jsonLdString;
      if (!existing) document.head.appendChild(script);
    } else if (existing) {
      existing.remove();
    }
  }, [title, description, canonical, ogImage, type, jsonLdString, noindex]);
}

/* ── JSON-LD builders ───────────────────────────────────── */
export const BUSINESS = {
  name: SITE_NAME,
  legalName: "ORÁ Suites",
  url: SITE_URL,
  email: "admin@orasuites.com",
  streetAddress: "49 Deansgate",
  addressLocality: "Manchester",
  postalCode: "M3 2AY",
  addressCountry: "GB",
  openingHours: "Mo-Su 10:00-17:00",
  priceRange: "££",
  image: DEFAULT_OG_IMAGE,
  sameAs: ["https://www.instagram.com/ora_beauty_mcr/"],
} as const;

/** HealthAndBeautyBusiness — use on the home page (and merge into others as needed). */
export function defaultBusinessJsonLd(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    url: BUSINESS.url,
    email: BUSINESS.email,
    image: BUSINESS.image,
    logo: BUSINESS.image,
    description:
      "ORÁ Suites — beauty & wellness sanctuary at 49 Deansgate, Manchester. Nurse-led aesthetics, IV therapy, luxury nails and private treatment rooms.",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.addressLocality,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.addressCountry,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "17:00",
      },
    ],
    priceRange: BUSINESS.priceRange,
    sameAs: [...BUSINESS.sameAs],
    areaServed: { "@type": "City", name: "Manchester" },
    ...extra,
  };
}

export interface ServiceJsonLdInput {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  url?: string;
}

/** Service list (ItemList of Service) — use on /services and /book. */
export function servicesJsonLd(services: ServiceJsonLdInput[], pageUrl = `${SITE_URL}/services`): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: pageUrl,
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.name,
        ...(s.description ? { description: s.description } : {}),
        ...(s.category ? { serviceType: s.category } : {}),
        provider: { "@id": `${SITE_URL}/#business` },
        areaServed: { "@type": "City", name: "Manchester" },
        ...(typeof s.price === "number"
          ? {
              offers: {
                "@type": "Offer",
                priceCurrency: "GBP",
                price: s.price,
                availability: "https://schema.org/InStock",
                url: s.url ?? pageUrl,
              },
            }
          : {}),
      },
    })),
  };
}

/** Breadcrumbs for inner pages. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path === "/" ? "/" : it.path}`,
    })),
  };
}
