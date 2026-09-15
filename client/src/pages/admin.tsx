/**
 * ORÁ — Admin floor dashboard (v3).
 *
 * Calendar (Day / Week / Month) across all practitioners, appointment details
 * with a live time-left timer + source, staff strip, walk-in add. Reads
 * /api/admin/* (GHL for now; a custom backend later). Passcode-gated.
 */
import * as React from "react";

const KEY_STORE = "ora-admin-key";
type View = "day" | "week" | "month";
interface Enquiry { id: string; name: string; email: string | null; phone: string | null; tags: string[]; since: string | null; }

interface Appt { id: string; startTime: string; endTime: string; client: string; service: string; practitioner: string; status: string; source?: string; contactId?: string | null; }
interface Staff { userId: string; name: string; }
interface Svc { id: string; name: string; price: number; duration: number; category: string; }

/* ── date helpers (UTC-noon anchored to dodge tz drift) ──── */
const iso = (d: Date) => d.toISOString().slice(0, 10);
const todayISO = () => iso(new Date());
const at = (s: string) => new Date(s + "T12:00:00Z");
const shift = (s: string, days: number) => { const d = at(s); d.setUTCDate(d.getUTCDate() + days); return iso(d); };
const startOfWeek = (s: string) => { const d = at(s); const dow = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dow); return iso(d); };
const weekDays = (s: string) => { const m = startOfWeek(s); return Array.from({ length: 7 }, (_, i) => shift(m, i)); };
const monthGrid = (s: string) => { const d = at(s); const first = iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))); const gridStart = startOfWeek(first); return Array.from({ length: 42 }, (_, i) => shift(gridStart, i)); };
const prettyDate = (s: string) => at(s).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const dayNum = (s: string) => at(s).getUTCDate();
const monthName = (s: string) => at(s).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const time = (t: string) => { try { return new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }); } catch { return (t || "").slice(11, 16); } };
const money = (n?: number) => (n == null ? "—" : n === 0 ? "No set price" : `£${Number.isInteger(n) ? n : n.toFixed(2)}`);
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-ora-bronze/15 text-ora-bronze",
  showed: "bg-green-600/15 text-green-700",
  noshow: "bg-red-600/15 text-red-700",
  cancelled: "bg-ora-fog/20 text-ora-fog line-through",
};

export default function AdminPage() {
  const [key, setKey] = React.useState<string>(() => { try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; } });
  const [input, setInput] = React.useState("");
  const [view, setView] = React.useState<View>("day");
  const [anchor, setAnchor] = React.useState(todayISO());
  const [appts, setAppts] = React.useState<Appt[]>([]);
  const [team, setTeam] = React.useState<Staff[]>([]);
  const [svcMap, setSvcMap] = React.useState<Record<string, Svc>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [practitioner, setPractitioner] = React.useState("all");
  const [walkinOpen, setWalkinOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Appt | null>(null);
  const [section, setSection] = React.useState<"calendar" | "enquiries">("calendar");
  const [enq, setEnq] = React.useState<Enquiry[]>([]);

  const q = React.useCallback((a: string) => `/api/admin/${a}${a.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`, [key]);
  const rangeParams = React.useMemo(() => {
    if (view === "day") return { start: anchor, end: anchor };
    if (view === "week") { const w = weekDays(anchor); return { start: w[0], end: w[6] }; }
    const g = monthGrid(anchor); return { start: g[0], end: g[41] };
  }, [view, anchor]);

  const load = React.useCallback(async () => {
    if (!key) return;
    setLoading(true); setError(null);
    try {
      const [aR, sR] = await Promise.all([
        fetch(q(`range?start=${rangeParams.start}&end=${rangeParams.end}`), { cache: "no-store" }),
        team.length ? Promise.resolve(null) : fetch(q("staff"), { cache: "no-store" }),
      ]);
      if (aR.status === 401) { setError("Wrong passcode."); setKey(""); try { localStorage.removeItem(KEY_STORE); } catch {} return; }
      const aJ = await aR.json(); if (!aR.ok) throw new Error(aJ?.error || "Failed to load");
      setAppts(aJ.appointments || []);
      if (sR) setTeam((await sR.json())?.staff || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [key, q, rangeParams, team.length]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { if (!key) return; const t = setInterval(load, 60_000); return () => clearInterval(t); }, [key, load]);
  React.useEffect(() => {
    if (!key || Object.keys(svcMap).length) return;
    fetch(q("services"), { cache: "no-store" }).then((r) => r.json()).then((j) => {
      const m: Record<string, Svc> = {}; (j.services || []).forEach((s: Svc) => { m[s.name] = s; }); setSvcMap(m);
    }).catch(() => {});
  }, [key, q, svcMap]);
  React.useEffect(() => {
    if (!key || section !== "enquiries") return;
    fetch(q("enquiries"), { cache: "no-store" }).then((r) => r.json()).then((j) => setEnq(j.enquiries || [])).catch(() => {});
  }, [key, q, section]);

  if (!key) {
    return (
      <div className="min-h-screen bg-ora-milk flex items-center justify-center p-6">
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { try { localStorage.setItem(KEY_STORE, input.trim()); } catch {} setKey(input.trim()); } }}
          className="w-full max-w-sm rounded-2xl bg-white/70 p-8 shadow-luxury text-center">
          <h1 className="font-display text-2xl text-ora-deep">ORÁ · Floor</h1>
          <p className="mt-1 mb-5 text-sm text-ora-fog">Staff dashboard — enter passcode</p>
          <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Passcode" autoFocus
            className="w-full rounded-xl border border-ora-taupe/40 bg-white px-4 py-3 text-center outline-none focus:border-ora-bronze" />
          <button className="mt-4 w-full rounded-xl bg-ora-bronze py-3 font-medium text-white transition hover:opacity-90">Enter</button>
        </form>
      </div>
    );
  }

  const filtered = practitioner === "all" ? appts : appts.filter((a) => a.practitioner === practitioner);
  const byDay = (d: string) => filtered.filter((a) => (a.startTime || "").slice(0, 10) === d);
  const countByName = appts.reduce<Record<string, number>>((m, a) => { m[a.practitioner] = (m[a.practitioner] || 0) + 1; return m; }, {});
  const people = ["all", ...team.map((s) => s.name)];
  const title = view === "day" ? prettyDate(anchor) : view === "week" ? `${prettyDate(weekDays(anchor)[0])} – ${prettyDate(weekDays(anchor)[6])}` : monthName(anchor);
  const nav = (dir: number) => setAnchor(shift(anchor, dir * (view === "day" ? 1 : view === "week" ? 7 : 30)));

  return (
    <div className="min-h-screen bg-ora-milk text-ora-deep">
      <header className="sticky top-0 z-10 border-b border-ora-taupe/20 bg-ora-milk/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h1 className="font-display text-2xl leading-none">ORÁ · Floor</h1>
            <p className="text-sm text-ora-fog">{section === "enquiries" ? "Website enquiries" : title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-ora-taupe/40">
              <button onClick={() => setSection("calendar")} className={`px-3 py-1.5 text-sm ${section === "calendar" ? "bg-ora-deep text-white" : "hover:bg-ora-greige/40"}`}>Calendar</button>
              <button onClick={() => setSection("enquiries")} className={`px-3 py-1.5 text-sm ${section === "enquiries" ? "bg-ora-deep text-white" : "hover:bg-ora-greige/40"}`}>Enquiries</button>
            </div>
            {section === "calendar" && <>
              <div className="flex overflow-hidden rounded-lg border border-ora-taupe/40">
                {(["day", "week", "month"] as View[]).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm capitalize ${view === v ? "bg-ora-bronze text-white" : "hover:bg-ora-greige/40"}`}>{v}</button>
                ))}
              </div>
              <button onClick={() => setWalkinOpen(true)} className="rounded-lg bg-ora-deep px-3 py-1.5 text-sm text-white hover:opacity-90">+ Walk-in</button>
              <button onClick={() => nav(-1)} className="rounded-lg border border-ora-taupe/40 px-3 py-1.5 text-sm hover:border-ora-bronze">←</button>
              <button onClick={() => setAnchor(todayISO())} className="rounded-lg border border-ora-taupe/40 px-3 py-1.5 text-sm hover:border-ora-bronze">Today</button>
              <button onClick={() => nav(1)} className="rounded-lg border border-ora-taupe/40 px-3 py-1.5 text-sm hover:border-ora-bronze">→</button>
            </>}
            <button onClick={() => (section === "enquiries" ? fetch(q("enquiries"), { cache: "no-store" }).then((r) => r.json()).then((j) => setEnq(j.enquiries || [])) : load())} className="rounded-lg bg-ora-bronze px-3 py-1.5 text-sm text-white hover:opacity-90">{loading ? "…" : "↻"}</button>
          </div>
        </div>
        {view === "day" && team.length > 0 && (
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 pb-3">
            <span className="text-[11px] uppercase tracking-wide text-ora-fog">Today</span>
            {team.map((s) => { const n = countByName[s.name] || 0; return (
              <span key={s.userId} title={`${n} appt(s)`} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${n > 0 ? "bg-white/70" : "bg-ora-greige/40 text-ora-fog"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${n > 0 ? "bg-green-500" : "bg-ora-fog/40"}`} />{s.name.split(" ")[0]}{n ? ` · ${n}` : ""}
              </span>); })}
          </div>
        )}
        {section === "calendar" && (
          <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-5 pb-3">
            {people.map((p) => (
              <button key={p} onClick={() => setPractitioner(p)} className={`rounded-full px-3 py-1 text-xs transition ${practitioner === p ? "bg-ora-bronze text-white" : "bg-white/70 text-ora-fog hover:text-ora-deep"}`}>
                {p === "all" ? "Everyone" : p.split(" ")[0]}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6">
        {error && <div className="mb-4 rounded-xl bg-red-600/10 px-4 py-3 text-sm text-red-700">{error}</div>}

        {section === "enquiries" && (
          <ul className="space-y-2">
            {enq.length === 0 && <div className="rounded-2xl bg-white/60 px-6 py-16 text-center text-ora-fog">No website enquiries.</div>}
            {enq.map((e) => (
              <li key={e.id} className="flex items-center gap-4 rounded-xl bg-white/70 px-4 py-3 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="truncate text-sm text-ora-fog">{[e.email, e.phone].filter(Boolean).join(" · ") || "no contact details"}</div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">{e.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-ora-greige/50 px-2 py-0.5 text-[10px] text-ora-fog">{t}</span>)}</div>
                <div className="shrink-0 text-xs text-ora-fog">{e.since ? at(e.since.slice(0, 10)).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : ""}</div>
              </li>
            ))}
          </ul>
        )}

        {section === "calendar" && view === "day" && (
          <ul className="space-y-2">
            {byDay(anchor).length === 0 && <div className="rounded-2xl bg-white/60 px-6 py-16 text-center text-ora-fog">{loading ? "Loading…" : "No appointments."}</div>}
            {byDay(anchor).map((a) => <ApptRow key={a.id} a={a} onClick={() => setDetail(a)} />)}
          </ul>
        )}

        {section === "calendar" && view === "week" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
            {weekDays(anchor).map((d, i) => (
              <div key={d} className="rounded-xl bg-white/50 p-2">
                <div className={`mb-2 text-center text-xs ${d === todayISO() ? "font-semibold text-ora-bronze" : "text-ora-fog"}`}>{DOW[i]} {dayNum(d)}</div>
                <div className="space-y-1.5">
                  {byDay(d).map((a) => (
                    <button key={a.id} onClick={() => setDetail(a)} className="block w-full rounded-lg bg-white/80 p-2 text-left text-xs hover:shadow-sm">
                      <div className="font-mono text-[11px] text-ora-fog">{time(a.startTime)}</div>
                      <div className="truncate font-medium">{a.client}</div>
                      <div className="truncate text-[11px] text-ora-fog">{a.practitioner.split(" ")[0]}</div>
                    </button>
                  ))}
                  {byDay(d).length === 0 && <div className="py-4 text-center text-[11px] text-ora-fog/60">—</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {section === "calendar" && view === "month" && (
          <div>
            <div className="mb-1 grid grid-cols-7 text-center text-[11px] uppercase tracking-wide text-ora-fog">{DOW.map((d) => <div key={d}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {monthGrid(anchor).map((d) => {
                const list = byDay(d); const inMonth = at(d).getUTCMonth() === at(anchor).getUTCMonth();
                return (
                  <button key={d} onClick={() => { setAnchor(d); setView("day"); }}
                    className={`min-h-[84px] rounded-lg p-1.5 text-left align-top transition hover:shadow-sm ${inMonth ? "bg-white/60" : "bg-white/25 text-ora-fog/50"} ${d === todayISO() ? "ring-1 ring-ora-bronze" : ""}`}>
                    <div className="text-xs">{dayNum(d)}</div>
                    <div className="mt-1 space-y-0.5">
                      {list.slice(0, 3).map((a) => <div key={a.id} className="truncate rounded bg-ora-bronze/15 px-1 text-[10px] text-ora-deep">{time(a.startTime)} {a.client}</div>)}
                      {list.length > 3 && <div className="text-[10px] text-ora-fog">+{list.length - 3} more</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {section === "calendar" && <p className="mt-6 text-center text-xs text-ora-fog">{filtered.length} appointment{filtered.length === 1 ? "" : "s"} in view · auto-refreshes every minute</p>}
      </main>

      {walkinOpen && <WalkinModal apiKey={key} onClose={() => setWalkinOpen(false)} onBooked={() => { setWalkinOpen(false); load(); }} />}
      {detail && <ApptDetail a={detail} svc={svcMap[detail.service]} apiKey={key} onClose={() => setDetail(null)} />}
    </div>
  );
}

function ApptRow({ a, onClick }: { a: Appt; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-4 rounded-xl bg-white/70 px-4 py-3 text-left shadow-sm hover:shadow-md">
        <div className="w-16 shrink-0 font-mono text-sm">{time(a.startTime)}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{a.client}</div>
          <div className="truncate text-sm text-ora-fog">{a.service}</div>
        </div>
        <div className="shrink-0 rounded-full bg-ora-greige/60 px-3 py-1 text-xs">{a.practitioner.split(" ")[0]}</div>
        <div className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] capitalize ${STATUS_STYLE[a.status] || "bg-ora-greige/40 text-ora-fog"}`}>{a.status}</div>
      </button>
    </li>
  );
}

/* ── Appointment detail + live timer + client history ────── */
function ApptDetail({ a, svc, apiKey, onClose }: { a: Appt; svc?: Svc; apiKey: string; onClose: () => void }) {
  const [now, setNow] = React.useState(Date.now());
  const [history, setHistory] = React.useState<{ contact: any; appointments: any[] } | null>(null);
  const [loadingHist, setLoadingHist] = React.useState(false);
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const loadHistory = async () => {
    if (!a.contactId) return;
    setLoadingHist(true);
    try {
      const r = await fetch(`/api/admin/client?contactId=${encodeURIComponent(a.contactId)}&key=${encodeURIComponent(apiKey)}`, { cache: "no-store" });
      setHistory(await r.json());
    } catch { /* ignore */ } finally { setLoadingHist(false); }
  };
  const startMs = Date.parse(a.startTime), endMs = Date.parse(a.endTime);
  const durMin = svc?.duration ?? (endMs && startMs ? Math.round((endMs - startMs) / 60000) : null);
  let timer = "";
  if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
    if (now < startMs) { const m = Math.round((startMs - now) / 60000); timer = `Starts in ${m < 60 ? m + "m" : Math.floor(m / 60) + "h " + (m % 60) + "m"}`; }
    else if (now <= endMs) { const m = Math.ceil((endMs - now) / 60000); timer = `${m < 60 ? m + "m" : Math.floor(m / 60) + "h " + (m % 60) + "m"} left`; }
    else timer = "Finished";
  }
  const inProgress = now >= startMs && now <= endMs;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ora-deep/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-ora-milk p-6 shadow-luxury" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl text-ora-deep">{a.client}</h2>
            <p className="text-ora-fog">{a.service}</p>
          </div>
          <button onClick={onClose} className="text-ora-fog hover:text-ora-deep">✕</button>
        </div>
        {timer && <div className={`mb-4 rounded-xl px-4 py-3 text-center font-medium ${inProgress ? "bg-green-600/15 text-green-700" : "bg-ora-greige/50 text-ora-deep"}`}>{timer}</div>}
        <dl className="space-y-2 text-sm">
          <Row k="Practitioner" v={a.practitioner} />
          <Row k="Time" v={`${time(a.startTime)} – ${time(a.endTime)}`} />
          <Row k="Duration" v={durMin != null ? `${durMin} min` : "—"} />
          <Row k="Charge the client" v={money(svc?.price)} />
          <Row k="Status" v={a.status} />
          <Row k="Source" v={a.source || "—"} />
        </dl>

        {a.contactId && !history && (
          <button onClick={loadHistory} disabled={loadingHist} className="mt-4 w-full rounded-xl border border-ora-taupe/40 py-2.5 text-sm hover:border-ora-bronze disabled:opacity-50">
            {loadingHist ? "Loading…" : "View client history"}
          </button>
        )}
        {history && (
          <div className="mt-4 border-t border-ora-taupe/20 pt-4">
            <div className="mb-2 text-sm">
              <div className="font-medium">{history.contact?.name}</div>
              <div className="text-ora-fog">{[history.contact?.email, history.contact?.phone].filter(Boolean).join(" · ") || "no contact details"}</div>
            </div>
            <p className="mb-1 text-xs uppercase tracking-wide text-ora-fog">Visit history ({history.appointments.length})</p>
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {history.appointments.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/60 px-3 py-1.5 text-xs">
                  <span className="text-ora-fog">{at((h.startTime || "").slice(0, 10)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" })}</span>
                  <span className="min-w-0 flex-1 truncate">{h.service}</span>
                  <span className="shrink-0 text-ora-fog">{(h.practitioner || "").split(" ")[0]}</span>
                </li>
              ))}
              {history.appointments.length === 0 && <li className="py-2 text-center text-xs text-ora-fog">No visits on record.</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 border-b border-ora-taupe/15 pb-2"><dt className="text-ora-fog">{k}</dt><dd className="text-right font-medium capitalize">{v}</dd></div>;
}

/* ── Walk-in ─────────────────────────────────────────────── */
function WalkinModal({ apiKey, onClose, onBooked }: { apiKey: string; onClose: () => void; onBooked: () => void }) {
  const [services, setServices] = React.useState<Svc[]>([]);
  const [serviceId, setServiceId] = React.useState("");
  const [times, setTimes] = React.useState<string[]>([]);
  const [startTime, setStartTime] = React.useState("");
  const [name, setName] = React.useState(""); const [email, setEmail] = React.useState(""); const [phone, setPhone] = React.useState("");
  const [busy, setBusy] = React.useState(false); const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ practitioner: string | null; startTime: string; price: number; service: string } | null>(null);
  const call = (a: string, init?: RequestInit) => fetch(`/api/admin/${a}${a.includes("?") ? "&" : "?"}key=${encodeURIComponent(apiKey)}`, { cache: "no-store", ...init });
  React.useEffect(() => { call("services").then((r) => r.json()).then((j) => setServices(j.services || [])).catch(() => {}); }, []);
  React.useEffect(() => { if (!serviceId) { setTimes([]); return; } call(`slots?serviceId=${encodeURIComponent(serviceId)}`).then((r) => r.json()).then((j) => { setTimes(j.slots || []); setStartTime(""); }).catch(() => setTimes([])); }, [serviceId]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !name.trim()) { setError("Pick a service and enter a name."); return; }
    setBusy(true); setError(null);
    try {
      const r = await call("walkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId, clientName: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, startTime: startTime || undefined }) });
      const j = await r.json(); if (!r.ok) throw new Error(j?.error || "Could not book.");
      setDone({ practitioner: j.practitioner, startTime: j.startTime, price: j.price, service: j.service });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ora-deep/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-ora-milk p-6 shadow-luxury" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center">
            <h2 className="font-display text-2xl text-ora-deep">Booked ✓</h2>
            <p className="mt-3"><b>{done.service}</b></p>
            <p className="text-ora-fog">{time(done.startTime)} · with <b className="text-ora-deep">{done.practitioner || "next available"}</b></p>
            <p className="mt-3 text-2xl font-display text-ora-bronze">{money(done.price)}</p>
            <p className="text-xs text-ora-fog">to charge the client</p>
            <button onClick={onBooked} className="mt-5 w-full rounded-xl bg-ora-bronze py-3 text-white hover:opacity-90">Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl text-ora-deep">New walk-in</h2><button type="button" onClick={onClose} className="text-ora-fog hover:text-ora-deep">✕</button></div>
            <label className="mb-1 block text-xs text-ora-fog">Service</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="mb-3 w-full rounded-xl border border-ora-taupe/40 bg-white px-3 py-2.5 outline-none focus:border-ora-bronze">
              <option value="">Choose a treatment…</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}{s.price ? ` — £${s.price}` : ""}</option>)}
            </select>
            {serviceId && (<>
              <label className="mb-1 block text-xs text-ora-fog">Time {times.length ? "" : "(none left today — uses next available)"}</label>
              <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mb-3 w-full rounded-xl border border-ora-taupe/40 bg-white px-3 py-2.5 outline-none focus:border-ora-bronze">
                <option value="">Next available</option>{times.map((t) => <option key={t} value={t}>{time(t)}</option>)}
              </select></>)}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" className="mb-3 w-full rounded-xl border border-ora-taupe/40 bg-white px-3 py-2.5 outline-none focus:border-ora-bronze" />
            <div className="mb-3 grid grid-cols-2 gap-3">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full rounded-xl border border-ora-taupe/40 bg-white px-3 py-2.5 outline-none focus:border-ora-bronze" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full rounded-xl border border-ora-taupe/40 bg-white px-3 py-2.5 outline-none focus:border-ora-bronze" />
            </div>
            {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-ora-deep py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50">{busy ? "Booking…" : "Book walk-in"}</button>
            <p className="mt-2 text-center text-xs text-ora-fog">Auto-assigns to a free practitioner · alerts them · adds to the pipeline</p>
          </form>
        )}
      </div>
    </div>
  );
}
