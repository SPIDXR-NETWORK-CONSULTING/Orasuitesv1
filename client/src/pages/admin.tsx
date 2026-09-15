/**
 * ORÁ — Admin floor dashboard (v2).
 *
 * One-glance day + who's working + walk-in add (auto-assign, alerts the
 * practitioner, lands in the pipeline). Reads /api/admin/* (GHL today; a custom
 * backend later). Internal tool: passcode-gated, not in the public nav.
 */
import * as React from "react";

const KEY_STORE = "ora-admin-key";

interface Appt { id: string; startTime: string; endTime: string; client: string; service: string; practitioner: string; status: string; }
interface Staff { userId: string; name: string; }
interface Svc { id: string; name: string; price: number; duration: number; category: string; }

const todayISO = () => new Date().toISOString().slice(0, 10);
const shiftDay = (iso: string, d: number) => { const x = new Date(iso + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + d); return x.toISOString().slice(0, 10); };
const prettyDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" });
const time = (t: string) => { try { return new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }); } catch { return (t || "").slice(11, 16); } };
const money = (n: number) => (n === 0 ? "POA" : `£${Number.isInteger(n) ? n : n.toFixed(2)}`);

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-ora-bronze/15 text-ora-bronze",
  showed: "bg-green-600/15 text-green-700",
  noshow: "bg-red-600/15 text-red-700",
  cancelled: "bg-ora-fog/20 text-ora-fog line-through",
};

export default function AdminPage() {
  const [key, setKey] = React.useState<string>(() => { try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; } });
  const [input, setInput] = React.useState("");
  const [date, setDate] = React.useState(todayISO());
  const [appts, setAppts] = React.useState<Appt[]>([]);
  const [team, setTeam] = React.useState<Staff[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [practitioner, setPractitioner] = React.useState("all");
  const [walkinOpen, setWalkinOpen] = React.useState(false);

  const api = React.useCallback((action: string, init?: RequestInit) =>
    fetch(`/api/admin/${action}${action.includes("?") ? "&" : "?"}date=${date}&key=${encodeURIComponent(key)}`, { cache: "no-store", ...init }), [date, key]);

  const load = React.useCallback(async () => {
    if (!key) return;
    setLoading(true); setError(null);
    try {
      const [tR, sR] = await Promise.all([api("today"), api("staff")]);
      if (tR.status === 401) { setError("Wrong passcode."); setKey(""); try { localStorage.removeItem(KEY_STORE); } catch {} return; }
      const tJ = await tR.json(); if (!tR.ok) throw new Error(tJ?.error || "Failed to load");
      setAppts(tJ.appointments || []);
      setTeam((await sR.json())?.staff || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [key, api]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { if (!key) return; const t = setInterval(load, 60_000); return () => clearInterval(t); }, [key, load]);

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

  const countByName = appts.reduce<Record<string, number>>((m, a) => { m[a.practitioner] = (m[a.practitioner] || 0) + 1; return m; }, {});
  const people = ["all", ...Array.from(new Set(appts.map((a) => a.practitioner))).sort()];
  const shown = practitioner === "all" ? appts : appts.filter((a) => a.practitioner === practitioner);

  return (
    <div className="min-h-screen bg-ora-milk text-ora-deep">
      <header className="sticky top-0 z-10 border-b border-ora-taupe/20 bg-ora-milk/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h1 className="font-display text-2xl leading-none">Today at ORÁ</h1>
            <p className="text-sm text-ora-fog">{prettyDate(date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWalkinOpen(true)} className="rounded-lg bg-ora-deep px-3 py-1.5 text-sm text-white hover:opacity-90">+ Walk-in</button>
            <button onClick={() => setDate(shiftDay(date, -1))} className="rounded-lg border border-ora-taupe/40 px-3 py-1.5 text-sm hover:border-ora-bronze">←</button>
            <button onClick={() => setDate(todayISO())} className="rounded-lg border border-ora-taupe/40 px-3 py-1.5 text-sm hover:border-ora-bronze">Today</button>
            <button onClick={() => setDate(shiftDay(date, 1))} className="rounded-lg border border-ora-taupe/40 px-3 py-1.5 text-sm hover:border-ora-bronze">→</button>
            <button onClick={load} className="rounded-lg bg-ora-bronze px-3 py-1.5 text-sm text-white hover:opacity-90">{loading ? "…" : "Refresh"}</button>
          </div>
        </div>
        {/* Staff — appointments today (reliable) */}
        {team.length > 0 && (
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-5 pb-3">
            <span className="text-[11px] uppercase tracking-wide text-ora-fog">Today</span>
            {team.map((s) => {
              const n = countByName[s.name] || 0;
              return (
                <span key={s.userId} title={`${n} appointment${n === 1 ? "" : "s"} today`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${n > 0 ? "bg-white/70 text-ora-deep" : "bg-ora-greige/40 text-ora-fog"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${n > 0 ? "bg-green-500" : "bg-ora-fog/40"}`} />
                  {s.name.split(" ")[0]}{n ? ` · ${n}` : ""}
                </span>
              );
            })}
          </div>
        )}
        {people.length > 2 && (
          <div className="mx-auto flex max-w-5xl flex-wrap gap-2 px-5 pb-3">
            {people.map((p) => (
              <button key={p} onClick={() => setPractitioner(p)}
                className={`rounded-full px-3 py-1 text-xs transition ${practitioner === p ? "bg-ora-bronze text-white" : "bg-white/70 text-ora-fog hover:text-ora-deep"}`}>
                {p === "all" ? "Everyone" : p}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        {error && <div className="mb-4 rounded-xl bg-red-600/10 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!error && shown.length === 0 && (
          <div className="rounded-2xl bg-white/60 px-6 py-16 text-center text-ora-fog">{loading ? "Loading…" : "No appointments for this day."}</div>
        )}
        <ul className="space-y-2">
          {shown.map((a) => (
            <li key={a.id} className="flex items-center gap-4 rounded-xl bg-white/70 px-4 py-3 shadow-sm">
              <div className="w-16 shrink-0 font-mono text-sm">{time(a.startTime)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{a.client}</div>
                <div className="truncate text-sm text-ora-fog">{a.service}</div>
              </div>
              <div className="shrink-0 rounded-full bg-ora-greige/60 px-3 py-1 text-xs">{a.practitioner}</div>
              <div className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] capitalize ${STATUS_STYLE[a.status] || "bg-ora-greige/40 text-ora-fog"}`}>{a.status}</div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-ora-fog">{shown.length} appointment{shown.length === 1 ? "" : "s"} · auto-refreshes every minute</p>
      </main>

      {walkinOpen && <WalkinModal apiKey={key} onClose={() => setWalkinOpen(false)} onBooked={() => { setWalkinOpen(false); load(); }} />}
    </div>
  );
}

/* ── Walk-in ─────────────────────────────────────────────── */
function WalkinModal({ apiKey, onClose, onBooked }: { apiKey: string; onClose: () => void; onBooked: () => void }) {
  const [services, setServices] = React.useState<Svc[]>([]);
  const [serviceId, setServiceId] = React.useState("");
  const [times, setTimes] = React.useState<string[]>([]);
  const [startTime, setStartTime] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ practitioner: string | null; startTime: string; price: number; service: string } | null>(null);

  const call = (a: string, init?: RequestInit) => fetch(`/api/admin/${a}${a.includes("?") ? "&" : "?"}key=${encodeURIComponent(apiKey)}`, { cache: "no-store", ...init });

  React.useEffect(() => { call("services").then((r) => r.json()).then((j) => setServices(j.services || [])).catch(() => {}); }, []);
  React.useEffect(() => {
    if (!serviceId) { setTimes([]); return; }
    call(`slots?serviceId=${encodeURIComponent(serviceId)}`).then((r) => r.json()).then((j) => { setTimes(j.slots || []); setStartTime(""); }).catch(() => setTimes([]));
  }, [serviceId]);

  const svc = services.find((s) => s.id === serviceId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !name.trim()) { setError("Pick a service and enter a name."); return; }
    setBusy(true); setError(null);
    try {
      const r = await call("walkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId, clientName: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, startTime: startTime || undefined }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Could not book the walk-in.");
      setDone({ practitioner: j.practitioner, startTime: j.startTime, price: j.price, service: j.service });
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ora-deep/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-ora-milk p-6 shadow-luxury" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center">
            <h2 className="font-display text-2xl text-ora-deep">Booked ✓</h2>
            <p className="mt-3 text-ora-deep"><b>{done.service}</b></p>
            <p className="text-ora-fog">{time(done.startTime)} · with <b className="text-ora-deep">{done.practitioner || "next available"}</b></p>
            <p className="mt-3 text-2xl font-display text-ora-bronze">{money(done.price)}</p>
            <p className="text-xs text-ora-fog">to charge the client</p>
            <button onClick={onBooked} className="mt-5 w-full rounded-xl bg-ora-bronze py-3 text-white hover:opacity-90">Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ora-deep">New walk-in</h2>
              <button type="button" onClick={onClose} className="text-ora-fog hover:text-ora-deep">✕</button>
            </div>
            <label className="mb-1 block text-xs text-ora-fog">Service</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="mb-3 w-full rounded-xl border border-ora-taupe/40 bg-white px-3 py-2.5 outline-none focus:border-ora-bronze">
              <option value="">Choose a treatment…</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {money(s.price)}</option>)}
            </select>
            {svc && (
              <>
                <label className="mb-1 block text-xs text-ora-fog">Time {times.length ? "" : "(no free slots today — will use next available)"}</label>
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mb-3 w-full rounded-xl border border-ora-taupe/40 bg-white px-3 py-2.5 outline-none focus:border-ora-bronze">
                  <option value="">Next available</option>
                  {times.map((t) => <option key={t} value={t}>{time(t)}</option>)}
                </select>
              </>
            )}
            <label className="mb-1 block text-xs text-ora-fog">Client name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="mb-3 w-full rounded-xl border border-ora-taupe/40 bg-white px-3 py-2.5 outline-none focus:border-ora-bronze" />
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
