/**
 * ORÁ Floor — shared types, London-time helpers and the admin API client.
 * All times are shown in Europe/London regardless of the desk computer's zone.
 */
import * as React from "react";

export const KEY_STORE = "ora-admin-key";

/* ── types (mirror api/admin/[action].ts) ───────────────── */
export interface Appt { id: string; startTime: string; endTime: string; client: string; service: string; practitioner: string; status: string; source?: string; contactId?: string | null; }
export interface Staff { userId: string; name: string; }
/** Blocked time: from the practitioner's own Google calendar ("Busy"), team meetings, etc. */
export interface Block { id: string; startTime: string; endTime: string; practitioner: string; title: string; }
export interface Svc { id: string; name: string; price: number; duration: number; category: string; }
export interface Enquiry { id: string; name: string; email: string | null; phone: string | null; tags: string[]; since: string | null; }
export interface Conversation { id: string; contactId: string | null; name: string; lastType: string; snippet: string; date: string | null; unread: number; }
export interface Message { id: string; direction: string; type: string; body: string; date: string; }
export interface RotaRow { practitioner_user_id: string; weekday: number; start_min: number | null; end_min: number | null; }
export type Plan = "half-day" | "full-day" | "monthly" | "other";
export type RenterStatus = "active" | "paused" | "ended";
export interface Renter {
  id: string; business: string; contact_name: string | null; email: string | null; phone: string | null; room: string | null;
  plan: Plan; rate: number | null; start_date: string | null; end_date: string | null; insurance_expiry: string | null;
  status: RenterStatus; notes: string | null; updated_at?: string;
}

/* ── London time ─────────────────────────────────────────── */
const LON_TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const LON_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }); // → YYYY-MM-DD

export const time = (t: string | number | Date) => { const d = new Date(t); return Number.isNaN(+d) ? "—" : LON_TIME.format(d); };
export const londonDate = (t: string | number | Date = Date.now()) => LON_DATE.format(new Date(t));
export const todayISO = () => londonDate();
/** minutes since London midnight */
export function londonMinutes(t: string | number | Date): number {
  const parts = LON_TIME.formatToParts(new Date(t));
  return Number(parts.find((p) => p.type === "hour")?.value) * 60 + Number(parts.find((p) => p.type === "minute")?.value);
}

/* calendar arithmetic on YYYY-MM-DD strings, UTC-noon anchored so DST never shifts a day */
const at = (s: string) => new Date(s + "T12:00:00Z");
const iso = (d: Date) => d.toISOString().slice(0, 10);
export const shift = (s: string, days: number) => { const d = at(s); d.setUTCDate(d.getUTCDate() + days); return iso(d); };
export const startOfWeek = (s: string) => { const d = at(s); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return iso(d); };
export const weekDays = (s: string) => Array.from({ length: 7 }, (_, i) => shift(startOfWeek(s), i));
export const monthGrid = (s: string) => { const d = at(s); const first = iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))); return Array.from({ length: 42 }, (_, i) => shift(startOfWeek(first), i)); };
export const weekday = (s: string) => at(s).getUTCDay(); // 0 = Sunday
export const dayNum = (s: string) => at(s).getUTCDate();
export const sameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);
export const fmtDate = (s: string, o: Intl.DateTimeFormatOptions) => at(s).toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
export const prettyDate = (s: string) => fmtDate(s, { weekday: "long", day: "numeric", month: "long" });

/** ORÁ opening hours in minutes (Mon–Sat 10:00–19:30, Sun 10:00–17:00). */
export const openHours = (dateStr: string) => ({ open: 600, close: weekday(dateStr) === 0 ? 1020 : 1170 });

export const money = (n?: number | null) => (n == null ? "—" : n === 0 ? "POA" : `£${n.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`);
/** GHL titles without a recognisable treatment come back as "—" — hide rather than show a dash. */
export const svcLabel = (s: string) => (s && s !== "—" ? s : "");
export const firstName = (n: string) => (n || "").split(" ")[0];
export const durLabel = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`);

/** Where an appointment is relative to `now`: upcoming / in-chair (0–1 progress) / done. */
export function phase(a: Appt, now: number): { kind: "upcoming" | "now" | "done" | "void"; progress: number; minsLeft: number } {
  const s = Date.parse(a.startTime), e = Date.parse(a.endTime);
  if (a.status === "cancelled" || a.status === "noshow") return { kind: "void", progress: 0, minsLeft: 0 };
  if (Number.isNaN(s) || Number.isNaN(e) || now < s) return { kind: "upcoming", progress: 0, minsLeft: Math.round((s - now) / 60000) };
  if (now <= e) return { kind: "now", progress: (now - s) / Math.max(1, e - s), minsLeft: Math.ceil((e - now) / 60000) };
  return { kind: "done", progress: 1, minsLeft: 0 };
}

/* ── API client: the signed device token (from login) goes in a header, never the URL ── */
export type Call = <T = any>(action: string, init?: RequestInit) => Promise<T>;
export function makeCall(key: string, onUnauthorised: () => void): Call {
  return async (action, init) => {
    const r = await fetch(`/api/admin/${action}`, {
      cache: "no-store",
      ...init,
      headers: { "x-admin-token": key, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...(init?.headers || {}) },
    });
    if (r.status === 401) { onUnauthorised(); throw new Error("Wrong passcode."); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `Request failed (${r.status})`);
    return j;
  };
}

export interface AdminCtx { call: Call; team: Staff[]; svcByName: Record<string, Svc>; services: Svc[]; }
export const AdminContext = React.createContext<AdminCtx | null>(null);
export function useAdmin(): AdminCtx {
  const c = React.useContext(AdminContext);
  if (!c) throw new Error("useAdmin outside AdminContext");
  return c;
}

/** Re-render every `ms` (clock, now-line, timers). */
/** Last good response per key, so screens paint instantly and refresh in the background. */
export const cache = {
  get<T>(k: string): T | null { try { const v = localStorage.getItem(`ora-floor:${k}`); return v ? (JSON.parse(v) as T) : null; } catch { return null; } },
  set(k: string, v: unknown) { try { localStorage.setItem(`ora-floor:${k}`, JSON.stringify(v)); } catch { /* full/private */ } },
  clear() { try { Object.keys(localStorage).filter((k) => k.startsWith("ora-floor:")).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ } },
};

export function useNow(ms = 30_000) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/**
 * Email HTML → plain text, safely. DOMParser documents are inert: no scripts run and
 * no images/resources load — so a hostile email can't execute inside the dashboard
 * (which holds the passcode). Never inject message HTML into the page.
 */
export function htmlToText(html: string): string {
  if (!/[<&]/.test(html)) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,head,title").forEach((n) => n.remove());
  doc.querySelectorAll("br").forEach((n) => n.replaceWith("\n"));
  doc.querySelectorAll("p,div,li,tr,h1,h2,h3,h4,blockquote").forEach((n) => n.append("\n"));
  return (doc.body.textContent || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
