// Clean-up after the 4 Oct 2026 duplicate-invite loop (npx tsx script/calendar-dedupe.mts). SILENT (sendUpdates=none): nobody is emailed.
//  1. duplicate ORÁ events for the same GHL appointment → keep the newest copy, delete the rest
//  2. drop ruslana.stupina87@gmail.com (bounces) from every remaining event
// Run with APPLY=1 to change anything; otherwise it only counts.
process.loadEnvFile(".env");
const G = await import(process.cwd() + "/api/_lib/google-calendar.ts") as any;
const tok = await G.getAccessToken(); const cal = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!);
const H = { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
const apply = process.env.APPLY === "1", BAD = "ruslana.stupina87@gmail.com";
let items: any[] = [], pageToken = "";
do {
  const q = new URLSearchParams({ privateExtendedProperty: "oraManaged=1", timeMin: new Date(Date.now() - 45 * 864e5).toISOString(), timeMax: new Date(Date.now() + 120 * 864e5).toISOString(), singleEvents: "true", maxResults: "2500", ...(pageToken ? { pageToken } : {}) });
  const j: any = await (await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events?${q}`, { headers: H })).json();
  items.push(...(j.items || [])); pageToken = j.nextPageToken || "";
} while (pageToken);
const groups = new Map<string, any[]>();
for (const e of items) { const k = e.extendedProperties?.private?.ghlId; if (k) groups.set(k, [...(groups.get(k) || []), e]); }
const dupes = [...groups.values()].flatMap((g) => g.sort((a, b) => Date.parse(b.created) - Date.parse(a.created)).slice(1));
const keep = new Set(dupes.map((e) => e.id));
const bad = items.filter((e) => !keep.has(e.id) && (e.attendees || []).some((a: any) => a.email === BAD));
const byWho: Record<string, number> = {};
for (const e of dupes) for (const a of e.attendees || []) byWho[a.email] = (byWho[a.email] || 0) + 1;
console.log(`managed events: ${items.length} · duplicates to delete: ${dupes.length} · events still inviting ${BAD}: ${bad.length}`);
console.log("duplicates per invited person:", JSON.stringify(byWho));
if (!apply) process.exit(0);
let del = 0, fixed = 0, fail = 0;
for (const e of dupes) { const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events/${e.id}?sendUpdates=none`, { method: "DELETE", headers: H }); r.ok || r.status === 410 ? del++ : fail++; }
for (const e of bad) {
  const attendees = (e.attendees || []).filter((a: any) => a.email !== BAD);
  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events/${e.id}?sendUpdates=none`, { method: "PATCH", headers: H, body: JSON.stringify({ attendees }) });
  r.ok ? fixed++ : fail++;
}
console.log(`deleted ${del} duplicates silently · removed ${BAD} from ${fixed} events · failures ${fail}`);
