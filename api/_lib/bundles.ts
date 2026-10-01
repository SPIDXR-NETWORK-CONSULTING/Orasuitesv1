/**
 * Blow-dry bundles (packs of 4 / 6 blow-dries) — the one place that knows the offer
 * and talks to the bundle tables.
 *
 * Offer terms live in shared/catalogue.json (hair → `bundle`), so the website, the
 * dashboard and the app all read the same prices and eligible treatments.
 * Records live in the ORÁ Supabase (ora_bundles / ora_bundle_uses): locked tables,
 * reachable only through the secret-gated ora_bundle_* functions.
 *
 * Money: bought online → paid in full by card when booking (Stripe, see
 * api/booking/payment-intent.ts); sold at the desk → reception taps "Paid". The
 * 6-month validity starts when it's paid.
 * Visits: an online booking of a covered blow-dry by someone with a paid bundle is
 * counted on it straight away (with the visit time). Cancelled or no-show → the
 * blow-dry goes back on the bundle (ora_bundle_appt 'release'). Reception can also
 * count / undo by hand. The client gets an email with a private link (/bundle/<token>).
 */
import { randomBytes } from "node:crypto";
import catalogueRaw from "../../shared/catalogue.json" with { type: "json" };
import { ghlFetch } from "./ghl.js";

export interface BundleOffer {
  name: string;
  sizes: { count: number; price: number; was?: number }[];
  /** GHL calendar ids of the treatments a bundle covers */
  eligible: string[];
  eligibleLabel?: string;
  expiryMonths: number;
  terms?: string;
}

export interface BundleUse { id: string; appointment_id: string | null; service: string | null; used_at: string; visit_at: string | null }
export interface Bundle {
  id: string; token: string; client_name: string; email: string | null; phone: string | null; contact_id: string | null;
  size: number; price: number; source: "online" | "desk"; first_appointment_id: string | null;
  paid_at: string | null; expires_at: string | null; voided_at: string | null; notes: string | null; created_at: string;
  used: number; uses: BundleUse[];
}

const OFFERS: BundleOffer[] = ((catalogueRaw as any).categories || [])
  .filter((c: any) => c.bundle && c.live && !c.hidden)
  .map((c: any) => c.bundle as BundleOffer);

/** Validity once paid (months) — from the catalogue offer. */
export const BUNDLE_EXPIRY_MONTHS: number = OFFERS[0]?.expiryMonths ?? 6;

/** The bundle offer that covers this treatment's calendar, if any. */
export function bundleOfferFor(calendarId?: string | null): BundleOffer | undefined {
  return calendarId ? OFFERS.find((o) => o.eligible.includes(calendarId)) : undefined;
}
/** Price for a bundle size — always from the catalogue, never from the browser. */
export function bundleSize(offer: BundleOffer | undefined, count: unknown) {
  return offer?.sizes.find((s) => s.count === Number(count));
}

const BASE = (process.env.PUBLIC_BASE_URL || "https://www.orasuites.com").replace(/\/$/, "");
export const bundleLink = (token: string) => `${BASE}/bundle/${token}`;
export const newBundleToken = () => randomBytes(24).toString("base64url"); // 32 chars, unguessable

/* ── DB (secret-gated RPCs) ─────────────────────────────── */
const DB_URL = process.env.ORA_DB_URL || "";
const DB_KEY = process.env.ORA_DB_ANON_KEY || "";
const SECRET = process.env.ORA_DB_RPC_SECRET || "";
export const bundlesConfigured = () => Boolean(DB_URL && DB_KEY && SECRET);

type Rpc<T> = { ok: true; data: T } | { ok: false; error: string };
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<Rpc<T>> {
  if (!bundlesConfigured()) return { ok: false, error: "Bundles database not configured" };
  try {
    const r = await fetch(`${DB_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: DB_KEY, Authorization: `Bearer ${DB_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_secret: SECRET, ...args }),
    });
    const body = await r.json().catch(() => null);
    // Postgres `raise exception` messages are written for reception — pass them through.
    if (!r.ok) return { ok: false, error: (body as any)?.message || `Bundle database error (${r.status})` };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: "Couldn't reach the bundle database" };
  }
}

export const listBundles = () => rpc<Bundle[]>("ora_bundles_list", {});
export const bundlesByEmail = (email: string) => rpc<Bundle[]>("ora_bundles_by_email", { p_email: email });
export const bundleByToken = (token: string) => rpc<Bundle | null>("ora_bundle_by_token", { p_token: token });
export const bundleAction = (id: string, action: "paid" | "void" | "use" | "unuse", p: Record<string, unknown> = {}) =>
  rpc<Bundle>("ora_bundle_action", { p_id: id, p_action: action, p });

/** By appointment, whichever bundle it's on: cancelled / no-show → 'release' (the blow-dry
 *  goes back), rescheduled → 'move'. data is null when the appointment isn't on a bundle. */
export const bundleAppt = (appointmentId: string, action: "release" | "move", visitAt?: string) =>
  rpc<Bundle | null>("ora_bundle_appt", { p_appointment_id: appointmentId, p_action: action, p_visit_at: visitAt ?? null });

/** The bundle this appointment is counted on, if any. Never throws. */
export async function bundleOfAppointment(appointmentId: string): Promise<Bundle | null> {
  const r = await listBundles().catch(() => null);
  return (r?.ok && r.data.find((b) => b.uses.some((u) => u.appointment_id === appointmentId))) || null;
}

/** The paid bundle (with a blow-dry left, still valid on `visitAt`) this email's next blow-dry goes on. */
export async function activeBundleFor(email: string, visitAt: string): Promise<Bundle | null> {
  const r = await bundlesByEmail(email);
  if (!r.ok) return null;
  const when = Date.parse(visitAt);
  return (r.data || [])
    .filter((b) => b.paid_at && !b.voided_at && b.used < b.size && b.expires_at && Date.parse(b.expires_at) >= when)
    .sort((a, b) => Date.parse(a.expires_at!) - Date.parse(b.expires_at!))[0] ?? null;
}

/** Count this visit on the client's paid bundle, if they hold one that covers it. Never throws. */
export async function countOnActiveBundle(email: string, appointmentId: string, visitAt: string, service: string | null): Promise<Bundle | null> {
  if (!email) return null;
  const holder = await activeBundleFor(email, visitAt).catch(() => null);
  if (!holder) return null;
  const used = await bundleAction(holder.id, "use", { appointment_id: appointmentId, visit_at: visitAt, service });
  if (!used.ok) console.error(`[bundles] appointment ${appointmentId} not counted on bundle ${holder.id}:`, used.error);
  return used.ok ? used.data : null;
}

/** "blow-dry 3 of 6" for this appointment. */
export const visitNumber = (b: Bundle, appointmentId: string) => b.uses.findIndex((u) => u.appointment_id === appointmentId) + 1;

export function createBundle(p: {
  client_name: string; email?: string | null; phone?: string | null; contact_id?: string | null;
  size: number; price: number; source: "online" | "desk"; paid: boolean; first_appointment_id?: string | null;
  expiry_months: number; notes?: string | null;
}) {
  return rpc<Bundle>("ora_bundle_create", { p: { ...p, token: newBundleToken() } });
}

/* ── Client email (through GHL conversations, like every other client email) ── */
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }).format(new Date(iso));

/**
 * "You've bought a bundle" / "Visit 2 of 6 used". Never throws — an email failure
 * must never undo what reception just recorded.
 */
export async function sendBundleEmail(b: Bundle, kind: "bought" | "used"): Promise<boolean> {
  if (!b.contact_id) return false;
  try {
    const first = (b.client_name || "there").trim().split(" ")[0];
    const left = Math.max(0, b.size - b.used);
    const html = [
      `Hi ${first},`,
      ``,
      kind === "bought"
        ? `Your Blow-Dry Bundle of ${b.size} is ready to use.${b.used ? ` Your first blow-dry is counted as ${b.used} of ${b.size}.` : ""}`
        : `Thank you for coming in. We've counted blow-dry ${b.used} of ${b.size} on your bundle.`,
      ``,
      `<b>Blow-dries left:</b> ${left} of ${b.size}`,
      b.expires_at ? `<b>Valid until:</b> ${fmtDate(b.expires_at)}` : `<b>Payment:</b> £${b.price}, paid at the clinic on your first visit`,
      ``,
      `<a href="${bundleLink(b.token)}">See your bundle and visits</a>`,
      ``,
      `Book your next blow-dry any time at <a href="${BASE}/book?category=hair">orasuites.com/book</a>.`,
    ].join("<br>") + `<br><br>With love,<br>The ORÁ Suites team<br><a href="mailto:admin@orasuites.com">admin@orasuites.com</a>`;
    const res = await ghlFetch("/conversations/messages", {
      method: "POST",
      version: "2021-04-15",
      body: JSON.stringify({
        type: "Email",
        contactId: b.contact_id,
        subject: kind === "bought" ? `Your Blow-Dry Bundle of ${b.size}` : `Blow-dry ${b.used} of ${b.size} used — ${left} left`,
        html,
      }),
    });
    if (!res.ok) console.error("[bundles] email failed:", res.status, JSON.stringify(res.body));
    return res.ok;
  } catch (e) {
    console.error("[bundles] email threw:", e);
    return false;
  }
}

/** What the public page / app may see: no contact ids, no internal notes. */
export function publicBundle(b: Bundle) {
  return {
    name: `Blow-Dry Bundle of ${b.size}`,
    firstName: (b.client_name || "").trim().split(" ")[0],
    size: b.size, used: b.used, left: Math.max(0, b.size - b.used), price: b.price,
    paid: Boolean(b.paid_at), expiresAt: b.expires_at, cancelled: Boolean(b.voided_at), createdAt: b.created_at,
    visits: b.uses.map((u) => ({ service: u.service, usedAt: u.used_at, visitAt: u.visit_at ?? u.used_at })),
  };
}
