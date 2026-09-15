/**
 * ORÁ — Admin floor dashboard (v1).
 *
 * The one-glance "who's on today" view the clinic asked for: every
 * appointment across ALL practitioners, merged and sorted — no selecting each
 * member like GHL forces. Reads /api/admin/today (which reads GHL today; a
 * custom backend later). Internal tool: passcode-gated, not in the public nav.
 */
import * as React from "react";

const KEY_STORE = "ora-admin-key";

interface Appt {
  id: string;
  startTime: string;
  endTime: string;
  client: string;
  service: string;
  practitioner: string;
  status: string;
  contactId: string | null;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
function prettyDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London",
  });
}
function time(t: string): string {
  try {
    return new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  } catch { return t?.slice(11, 16) || ""; }
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-ora-bronze/15 text-ora-bronze",
  showed: "bg-green-600/15 text-green-700",
  noshow: "bg-red-600/15 text-red-700",
  cancelled: "bg-ora-fog/20 text-ora-fog line-through",
  invalid: "bg-ora-fog/20 text-ora-fog",
};

export default function AdminPage() {
  const [key, setKey] = React.useState<string>(() => {
    try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; }
  });
  const [input, setInput] = React.useState("");
  const [date, setDate] = React.useState(todayISO());
  const [appts, setAppts] = React.useState<Appt[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [practitioner, setPractitioner] = React.useState<string>("all");

  const load = React.useCallback(async () => {
    if (!key) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/admin/today?date=${date}&key=${encodeURIComponent(key)}`, { cache: "no-store" });
      if (r.status === 401) { setError("Wrong passcode."); setKey(""); try { localStorage.removeItem(KEY_STORE); } catch {} return; }
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load");
      setAppts(j.appointments || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoading(false); }
  }, [key, date]);

  React.useEffect(() => { load(); }, [load]);
  // auto-refresh every 60s
  React.useEffect(() => {
    if (!key) return;
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [key, load]);

  if (!key) {
    return (
      <div className="min-h-screen bg-ora-milk flex items-center justify-center p-6">
        <form
          onSubmit={(e) => { e.preventDefault(); if (input.trim()) { try { localStorage.setItem(KEY_STORE, input.trim()); } catch {} setKey(input.trim()); } }}
          className="w-full max-w-sm rounded-2xl bg-white/70 p-8 shadow-luxury text-center"
        >
          <h1 className="font-display text-2xl text-ora-deep">ORÁ · Floor</h1>
          <p className="mt-1 mb-5 text-sm text-ora-fog">Staff dashboard — enter passcode</p>
          <input
            type="password" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Passcode" autoFocus
            className="w-full rounded-xl border border-ora-taupe/40 bg-white px-4 py-3 text-center outline-none focus:border-ora-bronze"
          />
          <button className="mt-4 w-full rounded-xl bg-ora-bronze py-3 font-medium text-white transition hover:opacity-90">Enter</button>
        </form>
      </div>
    );
  }

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
            <button onClick={() => setDate(shiftDay(date, -1))} className="rounded-lg border border-ora-taupe/40 px-3 py-1.5 text-sm hover:border-ora-bronze">←</button>
            <button onClick={() => setDate(todayISO())} className="rounded-lg border border-ora-taupe/40 px-3 py-1.5 text-sm hover:border-ora-bronze">Today</button>
            <button onClick={() => setDate(shiftDay(date, 1))} className="rounded-lg border border-ora-taupe/40 px-3 py-1.5 text-sm hover:border-ora-bronze">→</button>
            <button onClick={load} className="rounded-lg bg-ora-bronze px-3 py-1.5 text-sm text-white hover:opacity-90">{loading ? "…" : "Refresh"}</button>
          </div>
        </div>
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
          <div className="rounded-2xl bg-white/60 px-6 py-16 text-center text-ora-fog">
            {loading ? "Loading…" : "No appointments for this day."}
          </div>
        )}
        <ul className="space-y-2">
          {shown.map((a) => (
            <li key={a.id} className="flex items-center gap-4 rounded-xl bg-white/70 px-4 py-3 shadow-sm">
              <div className="w-16 shrink-0 font-mono text-sm text-ora-deep">{time(a.startTime)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{a.client}</div>
                <div className="truncate text-sm text-ora-fog">{a.service}</div>
              </div>
              <div className="shrink-0 rounded-full bg-ora-greige/60 px-3 py-1 text-xs text-ora-deep">{a.practitioner}</div>
              <div className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] capitalize ${STATUS_STYLE[a.status] || "bg-ora-greige/40 text-ora-fog"}`}>{a.status}</div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-ora-fog">{shown.length} appointment{shown.length === 1 ? "" : "s"} · auto-refreshes every minute</p>
      </main>
    </div>
  );
}
