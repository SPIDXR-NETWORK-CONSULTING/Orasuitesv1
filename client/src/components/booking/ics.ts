/** Client-side .ics generation for the "Add to calendar" affordance. */

function icsDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export interface IcsEvent {
  title: string;
  description?: string;
  location?: string;
  startIso: string;
  endIso: string;
  uid?: string;
}

export function buildIcs(ev: IcsEvent): string {
  const start = new Date(ev.startIso).getTime();
  const end = new Date(ev.endIso).getTime();
  const uid = ev.uid ?? `${start}-${Math.random().toString(36).slice(2)}@orasuites.com`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ORÁ Suites//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : "",
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function icsDataUrl(ev: IcsEvent): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcs(ev))}`;
}
