/**
 * Typed loader + helpers for shared/catalogue.json — the ONLY source of
 * services, prices, durations and GHL calendar IDs. Never hard-code prices.
 */
import raw from "@shared/catalogue.json";

/* ── Types ──────────────────────────────────────────────── */
export type CategoryId = "aesthetics" | "nails" | "hair" | "makeup" | "laser" | "wellness" | (string & {});
export type TeamKey = "meg" | "daniela" | "soheila" | "ruslana" | "diana" | (string & {});

export interface Service {
  name: string;
  /** GBP, 0 = free */
  price: number;
  /** minutes */
  duration: number;
  ghlCalendarId?: string;
  description?: string;
}

export interface ServiceGroup {
  name: string;
  services: Service[];
}

export interface AddOn {
  name: string;
  price: number;
}

export interface Category {
  id: CategoryId;
  title: string;
  live: boolean;
  team: TeamKey[];
  ghlGroupId?: string;
  groups: ServiceGroup[];
  addOns?: AddOn[];
}

export interface TeamMemberMeta {
  ghlUserId: string;
  name: string;
}

export interface Catalogue {
  _meta: {
    updated: string;
    sources: Record<string, string>;
    team: Record<string, TeamMemberMeta>;
    depositPercent: number;
  };
  categories: Category[];
}

/** A service enriched with where it lives in the tree. */
export interface ResolvedService extends Service {
  id: string;
  categoryId: CategoryId;
  categoryTitle: string;
  groupName: string;
  live: boolean;
}

/* ── Data ───────────────────────────────────────────────── */
export const catalogue = raw as unknown as Catalogue;
export const categories: Category[] = catalogue.categories;
export const DEPOSIT_PERCENT: number = catalogue._meta.depositPercent ?? 20;

/* ── Public team names (what the site shows) ────────────── */
export interface TeamMember {
  key: TeamKey;
  /** public display name */
  name: string;
  /** short first name / nickname */
  short: string;
  role: string;
  initials: string;
  ghlUserId?: string;
  /** optional portrait import path (relative to attached_assets), consumers import themselves */
  portrait?: string;
}

const TEAM_PUBLIC: Record<string, Omit<TeamMember, "key" | "ghlUserId">> = {
  meg: { name: "Meg Cauli", short: "Meg", role: "Founder · Nurse-led Aesthetics", initials: "MC", portrait: "about-meg-ceo.jpg" },
  daniela: { name: "Daniela Mehmeti", short: "Daniela", role: "Aesthetics Practitioner", initials: "DM" },
  soheila: { name: "Soheila “Soli” Sadhagat", short: "Soli", role: "Nail Artist", initials: "SS" },
  ruslana: { name: "Ruslana Stupina", short: "Ruslana", role: "Nail Artist", initials: "RS" },
  diana: { name: "Diana Ann", short: "Diana", role: "Nail Artist", initials: "DA" },
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function teamMember(key: TeamKey): TeamMember {
  const pub = TEAM_PUBLIC[key];
  const meta = catalogue._meta.team[key];
  const fallbackName = meta?.name ?? key;
  return {
    key,
    ghlUserId: meta?.ghlUserId,
    name: pub?.name ?? fallbackName,
    short: pub?.short ?? fallbackName.split(" ")[0],
    role: pub?.role ?? "Practitioner",
    initials: pub?.initials ?? initialsOf(fallbackName),
    portrait: pub?.portrait,
  };
}

/** Public-facing team for a category (e.g. Aesthetics → Meg + Daniela). */
export function teamFor(categoryId: CategoryId): TeamMember[] {
  const cat = findCategory(categoryId);
  return (cat?.team ?? []).map(teamMember);
}

/** All team members, in menu order. */
export function allTeam(): TeamMember[] {
  const seen = new Set<string>();
  const out: TeamMember[] = [];
  for (const c of categories) for (const k of c.team) if (!seen.has(k)) { seen.add(k); out.push(teamMember(k)); }
  return out;
}

/* ── Category helpers ───────────────────────────────────── */
export function liveCategories(): Category[] {
  return categories.filter((c) => c.live);
}
export function comingSoonCategories(): Category[] {
  return categories.filter((c) => !c.live);
}
export function findCategory(id: CategoryId): Category | undefined {
  return categories.find((c) => c.id === id);
}

/* ── Service helpers ────────────────────────────────────── */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Stable service id = `${categoryId}/${slug(name)}` (unique across catalogue). */
export function serviceId(categoryId: CategoryId, name: string): string {
  return `${categoryId}/${slugify(name)}`;
}

let _flat: ResolvedService[] | null = null;
/** Every service flattened, in menu order (memoised). */
export function allServices(): ResolvedService[] {
  if (_flat) return _flat;
  _flat = [];
  for (const c of categories) {
    for (const g of c.groups) {
      for (const s of g.services) {
        _flat.push({
          ...s,
          id: serviceId(c.id, s.name),
          categoryId: c.id,
          categoryTitle: c.title,
          groupName: g.name,
          live: c.live,
        });
      }
    }
  }
  return _flat;
}

/** Find by id (`aesthetics/lip-flip`), by ghlCalendarId, or by exact name. */
export function findService(idOrName: string): ResolvedService | undefined {
  const all = allServices();
  return (
    all.find((s) => s.id === idOrName) ??
    all.find((s) => s.ghlCalendarId === idOrName) ??
    all.find((s) => s.name === idOrName) ??
    all.find((s) => slugify(s.name) === slugify(idOrName))
  );
}

export function servicesFor(categoryId: CategoryId): ResolvedService[] {
  return allServices().filter((s) => s.categoryId === categoryId);
}

/** Lowest non-zero price in a category — for "from £X" cards. */
export function fromPrice(categoryId: CategoryId): number | undefined {
  // "From £X" should reflect a real treatment — skip consultations, top-ups,
  // removals and single-injection add-ons so the figure isn't misleading.
  const SKIP = /consultation|top-up|removal|b12/i;
  const prices = servicesFor(categoryId)
    .filter((s) => !SKIP.test(s.name))
    .map((s) => s.price)
    .filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : undefined;
}

/* ── Formatting ─────────────────────────────────────────── */
export function formatPrice(n: number, opts: { free?: string } = {}): string {
  if (n === 0) return opts.free ?? "Free";
  const isWhole = Number.isInteger(n);
  return `£${isWhole ? n.toString() : n.toFixed(2)}`;
}

/** 20% deposit (rounded to nearest penny). */
export function depositFor(price: number, percent: number = DEPOSIT_PERCENT): number {
  return Math.round(price * percent) / 100;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h} hr${h > 1 ? "s" : ""}`;
}

/** Category → GHL group id (for slot lookups by group). */
export function ghlGroupFor(categoryId: CategoryId): string | undefined {
  return findCategory(categoryId)?.ghlGroupId;
}
