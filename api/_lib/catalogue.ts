/**
 * ORÁ — SERVER-SIDE view of shared/catalogue.json.
 *
 * The client has client/src/lib/catalogue.ts; this is the same data seen from
 * the backend, and it exists for one reason: a price that decides how much a
 * card is charged must NEVER come from the browser. The client sends a
 * `serviceId`; the server looks the price up here.
 *
 * `slugify`/`serviceId` are deliberately identical to the client's so ids match
 * on both sides. If you change one, change the other.
 */
import catalogueRaw from "../../shared/catalogue.json" with { type: "json" };

export interface CatalogueService {
  /** `${categoryId}/${slug(name)}` — the id the browser sends. */
  id: string;
  name: string;
  /** GBP; 0 = complimentary (no deposit, no payment step). */
  price: number;
  /** minutes */
  duration: number;
  ghlCalendarId?: string;
  categoryId: string;
  categoryTitle: string;
  groupName: string;
  live: boolean;
}

const raw = catalogueRaw as any;

export const DEPOSIT_PERCENT: number = raw?._meta?.depositPercent ?? 20;

export function slugify(name: string): string {
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function serviceId(categoryId: string, name: string): string {
  return `${categoryId}/${slugify(name)}`;
}

let _flat: CatalogueService[] | null = null;
export function allServices(): CatalogueService[] {
  if (_flat) return _flat;
  const out: CatalogueService[] = [];
  for (const c of raw?.categories ?? []) {
    for (const g of c.groups ?? []) {
      for (const s of g.services ?? []) {
        out.push({
          id: serviceId(c.id, s.name),
          name: s.name,
          price: Number(s.price) || 0,
          duration: Number(s.duration) || 0,
          ghlCalendarId: s.ghlCalendarId,
          categoryId: c.id,
          categoryTitle: c.title,
          groupName: g.name,
          live: Boolean(c.live),
        });
      }
    }
  }
  _flat = out;
  return out;
}

/** Resolve by service id, GHL calendar id, exact name or slugified name. */
export function findService(idOrName: string | undefined | null): CatalogueService | undefined {
  if (!idOrName) return undefined;
  const all = allServices();
  return (
    all.find((s) => s.id === idOrName) ??
    all.find((s) => s.ghlCalendarId === idOrName) ??
    all.find((s) => s.name === idOrName) ??
    all.find((s) => slugify(s.name) === slugify(idOrName))
  );
}

/**
 * The deposit in PENCE — the only figure that should ever reach Stripe.
 * 20% of the catalogue price, rounded to the nearest penny.
 * £80 → 1600p (£16). £67.50 → 1350p (£13.50).
 */
export function depositPence(priceGbp: number, percent: number = DEPOSIT_PERCENT): number {
  if (!Number.isFinite(priceGbp) || priceGbp <= 0) return 0;
  return Math.round(priceGbp * percent);
}

/** Pence → "£16" / "£13.50" for emails and error copy. */
export function formatPence(pence: number): string {
  const pounds = pence / 100;
  return Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`;
}
