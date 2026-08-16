/**
 * Europe/London time helpers for the booking flow.
 * The clinic runs on London time; the visitor may not — so every day boundary
 * and every displayed hour is computed in the clinic's zone, not the browser's.
 */
export const CLINIC_TZ = "Europe/London";

const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: CLINIC_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

interface ZonedParts {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  ss: number;
}

/** Wall-clock parts of an instant in Europe/London. */
export function zonedParts(ms: number): ZonedParts {
  const parts = partsFmt.formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  // Intl may return hour "24" at midnight in some engines
  const hh = get("hour") % 24;
  return { y: get("year"), m: get("month"), d: get("day"), hh, mm: get("minute"), ss: get("second") };
}

/** Offset (minutes) of Europe/London from UTC at a given instant. */
function tzOffsetMinutes(ms: number): number {
  const p = zonedParts(ms);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return Math.round((asUtc - ms) / 60000);
}

/** YYYY-MM-DD for an instant, in London. */
export function isoDate(ms: number): string {
  const p = zonedParts(ms);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Start + end (exclusive) of a London calendar day, as epoch ms. */
export function londonDayBounds(ymd: string): { start: number; end: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  const start = guess - tzOffsetMinutes(guess) * 60000;
  const nextGuess = Date.UTC(y, m - 1, d + 1, 0, 0, 0);
  const end = nextGuess - tzOffsetMinutes(nextGuess) * 60000 - 1;
  return { start, end };
}

/** Days from today (London) — `count` entries. */
export interface DayOption {
  ymd: string;
  /** JS weekday 0–6 (Sun–Sat), London */
  weekday: number;
  dayNum: number;
  monthShort: string;
  weekdayShort: string;
  isToday: boolean;
  /** Sunday = closed */
  closed: boolean;
}

const wdFmt = new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TZ, weekday: "short" });
const moFmt = new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TZ, month: "short" });
const wdIdxFmt = new Intl.DateTimeFormat("en-US", { timeZone: CLINIC_TZ, weekday: "short" });
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function upcomingDays(count = 14, from = Date.now()): DayOption[] {
  const todayYmd = isoDate(from);
  const out: DayOption[] = [];
  const { start } = londonDayBounds(todayYmd);
  for (let i = 0; i < count; i++) {
    // step by ~day then re-anchor to noon to dodge DST edges
    const noon = start + i * 86400000 + 12 * 3600000;
    const ymd = isoDate(noon);
    const p = zonedParts(noon);
    const weekday = WD.indexOf(wdIdxFmt.format(new Date(noon)));
    out.push({
      ymd,
      weekday,
      dayNum: p.d,
      monthShort: moFmt.format(new Date(noon)),
      weekdayShort: wdFmt.format(new Date(noon)),
      isToday: ymd === todayYmd,
      closed: weekday === 0,
    });
  }
  return out;
}

/** "10:30" in London for an ISO string. */
export function formatTime(iso: string): string {
  const p = zonedParts(new Date(iso).getTime());
  return `${String(p.hh).padStart(2, "0")}:${String(p.mm).padStart(2, "0")}`;
}

/** "Tuesday 18 August" in London. */
export function formatLongDate(ymd: string): string {
  const { start } = londonDayBounds(ymd);
  return new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TZ, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(start + 12 * 3600000),
  );
}

export type DayPart = "Morning" | "Afternoon" | "Evening";
export function dayPart(iso: string): DayPart {
  const { hh } = zonedParts(new Date(iso).getTime());
  if (hh < 12) return "Morning";
  if (hh < 17) return "Afternoon";
  return "Evening";
}

/** ISO end time = start + minutes. Preserves the slot's own offset formatting via Date. */
export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

/** Extract slot list from GHL free-slots payload `{ "YYYY-MM-DD": { slots: [...] }, traceId }`. */
export function extractSlots(payload: unknown, ymd?: string): string[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  const collect: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (ymd && key !== ymd) continue;
    if (val && typeof val === "object" && Array.isArray((val as { slots?: unknown }).slots)) {
      for (const s of (val as { slots: unknown[] }).slots) if (typeof s === "string") collect.push(s);
    }
  }
  return collect.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}
