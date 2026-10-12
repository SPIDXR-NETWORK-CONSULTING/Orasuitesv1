// One-off (10 Oct 2026): open Brow & Lash for online booking with Amani. Creates the GHL
// group + one calendar per service (same setup as hair), copies the hair calendar's
// notification set, and writes the ids back into shared/catalogue.json. Idempotent by name.
import fs from "node:fs";
const P = "shared/catalogue.json", APPLY = process.argv.includes("--apply");
const cat = JSON.parse(fs.readFileSync(P, "utf8"));
const B = "https://services.leadconnectorhq.com", LOC = process.env.GHL_LOCATION_ID;
const H = { Authorization: "Bearer " + process.env.GHL_API_KEY, Version: "2021-04-15", "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0 ora-suites/1.0" };
const api = async (m, p, body) => { const r = await fetch(B + p, { method: m, headers: H, body: body ? JSON.stringify(body) : undefined }); const j = await r.json().catch(() => ({})); return r.ok ? j : { error: r.status, j }; };
const TEMPLATE = "8GjWYEE76ZxMMRkRvtYh"; // Straight Blow Dry — Short (Amani)
const beauty = cat.categories.find((c) => c.id === "beauty");
const rename = { "Chin": "Chin Threading", "Lower Lip": "Lower Lip Threading", "Upper Lip": "Upper Lip Threading", "Forehead": "Forehead Threading", "Lip & Chin": "Lip & Chin Threading", "Sides": "Sides Threading", "Full Face": "Full Face Threading", "Full Face including Eyebrows": "Full Face Threading incl. Eyebrows", "Eyebrow": "Eyebrow Threading" };
for (const g of beauty.groups) for (const s of g.services) if (rename[s.name]) s.name = rename[s.name];
const amani = cat._meta.team.amani.ghlUserId;
const tmpl = (await api("GET", `/calendars/${TEMPLATE}`)).calendar;
const tmplNotes = await api("GET", `/calendars/${TEMPLATE}/notifications`);
const existing = new Map(((await api("GET", `/calendars/?locationId=${LOC}`)).calendars || []).map((c) => [c.name, c]));
let groupId = beauty.ghlGroupId;
if (!groupId) {
  const gs = (await api("GET", `/calendars/groups?locationId=${LOC}`)).groups || [];
  groupId = gs.find((g) => g.name === "ORÁ Beauty")?.id;
  if (!groupId && APPLY) { const r = await api("POST", "/calendars/groups", { locationId: LOC, name: "ORÁ Beauty", description: "ORÁ Suites — Brow & Lash (threading, tinting)", slug: "ora-beauty", isActive: true }); groupId = (r.group || r).id; }
  console.log("group", groupId || "(would create)");
}
const key = (n) => `${n.channel}|${n.notificationType}|${n.receiverType}`;
for (const g of beauty.groups) for (const s of g.services) {
  const payload = { locationId: LOC, name: s.name, description: `${g.name} · £${s.price} · ${s.duration} min`, calendarType: "service_booking", eventType: "RoundRobin_OptimizeForEqualDistribution", groupId, teamMembers: [{ userId: amani, priority: 0.5 }], slotDuration: s.duration, slotDurationUnit: "mins", slotInterval: 15, slotIntervalUnit: "mins", slotBuffer: tmpl.slotBuffer ?? 15, slotBufferUnit: "mins", appoinmentPerSlot: 1, autoConfirm: true, allowReschedule: true, allowCancellation: true, eventTitle: "{{contact.name}} — " + s.name, eventColor: "#b98867", openHours: tmpl.openHours, isActive: true };
  let id = s.ghlCalendarId || existing.get(s.name)?.id;
  if (!APPLY) { console.log(id ? "  keep  " : "  create", s.name); continue; }
  if (!id) { const r = await api("POST", "/calendars/", payload); id = r.calendar?.id; if (!id) { console.log("  !! create failed", s.name, JSON.stringify(r).slice(0, 200)); continue; } console.log("  created", s.name, id); await new Promise((r) => setTimeout(r, 250)); }
  s.ghlCalendarId = id;
  // notifications: match the hair calendar exactly
  const mine = await api("GET", `/calendars/${id}/notifications`);
  for (const t of tmplNotes) {
    const m = (Array.isArray(mine) ? mine : []).find((x) => key(x) === key(t));
    if (m && m.isActive !== t.isActive) await api("PUT", `/calendars/${id}/notifications/${m._id}`, { isActive: t.isActive });
    if (!m && t.isActive) { const { _id, altId, createdAt, updatedAt, version, deleted, ...rest } = t; await api("POST", `/calendars/${id}/notifications`, [rest]); }
  }
}
if (APPLY) {
  beauty.ghlGroupId = groupId; beauty.team = ["amani"]; beauty.live = true; beauty.bookable = true;
  fs.writeFileSync(P, JSON.stringify(cat, null, 2) + "\n");
  console.log("catalogue updated");
}
