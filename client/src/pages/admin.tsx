/**
 * ORÁ Floor — the reception / owner dashboard (v4). Installable as a desktop app
 * (see /admin.webmanifest) for the clinic's front-desk computer.
 *
 *   Today     at a glance: numbers, now & next, team status
 *   Calendar  day timeline per practitioner (now-line, live progress) · week · month
 *   Rota      weekly hours, tap to edit (shades the calendar)
 *   Renters   room & chair renters, rent + insurance alerts
 *   Enquiries website enquiries · Messages two-pane inbox with email replies
 *
 * Data: /api/admin/* (GHL for bookings, ORÁ Supabase for rota + renters). Passcode-gated;
 * the passcode is sent as a header and kept on this device until "Lock" is pressed.
 */
import * as React from "react";
import { CalendarDays, ChevronLeft, Layers, Search, ChevronRight, Clock3, DoorOpen, Inbox, Lock, MessageCircle, Plus, RefreshCw, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/use-seo";
import {
  AdminContext, KEY_STORE, makeCall, useNow, cache, type AdminCtx, type Appt, type Block, type RotaRow, type Staff, type Svc,
  todayISO, shift, weekDays, monthGrid, prettyDate, fmtDate, londonDate, time,
} from "@/components/admin/lib";
import { Btn, ErrorNote, Segmented, Select } from "@/components/admin/ui";
import { DayTimeline, MonthView, WeekView } from "@/components/admin/calendar";
import { TodayOverview } from "@/components/admin/today";
import { ApptDrawer, WalkinDrawer } from "@/components/admin/drawers";
import { RotaGrid } from "@/components/admin/rota";
import { RentersView } from "@/components/admin/renters";
import { BundlesView } from "@/components/admin/bundles";
import { MoveDialog, type MoveRequest } from "@/components/admin/move";
import { BlockDrawer } from "@/components/admin/blocks";
import { ClientDrawer } from "@/components/admin/clients";
import { EnquiriesView, MessagesView } from "@/components/admin/inbox";

type Section = "today" | "calendar" | "bundles" | "rota" | "renters" | "enquiries" | "messages";
type View = "day" | "week" | "month";
const NAV: { id: Section; label: string; Icon: typeof Sunrise }[] = [
  { id: "today", label: "Today", Icon: Sunrise },
  { id: "calendar", label: "Calendar", Icon: CalendarDays },
  { id: "bundles", label: "Bundles", Icon: Layers },
  { id: "rota", label: "Rota", Icon: Clock3 },
  { id: "renters", label: "Renters", Icon: DoorOpen },
  { id: "enquiries", label: "Enquiries", Icon: Inbox },
  { id: "messages", label: "Messages", Icon: MessageCircle },
];

/** Make /admin installable as its own desktop app without making the public site one. */
function useInstallableApp() {
  React.useEffect(() => {
    const add = (tag: string, attrs: Record<string, string>) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); el.setAttribute("data-ora-floor", ""); document.head.appendChild(el); };
    add("link", { rel: "manifest", href: "/admin.webmanifest" });
    add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    add("meta", { name: "apple-mobile-web-app-title", content: "ORÁ Floor" });
    return () => document.querySelectorAll("[data-ora-floor]").forEach((n) => n.remove());
  }, []);
}

/** Keep the reception screen awake while the dashboard is open (where supported). */
function useWakeLock(on: boolean) {
  React.useEffect(() => {
    if (!on || !("wakeLock" in navigator)) return;
    let lock: { release: () => Promise<void> } | null = null;
    const grab = () => { if (document.visibilityState === "visible") (navigator as any).wakeLock.request("screen").then((l: any) => { lock = l; }).catch(() => {}); };
    grab();
    document.addEventListener("visibilitychange", grab);
    return () => { document.removeEventListener("visibilitychange", grab); lock?.release().catch(() => {}); };
  }, [on]);
}

export default function AdminPage() {
  useSEO({ title: "ORÁ Floor", description: "ORÁ Suites staff dashboard.", noindex: true });
  useInstallableApp();

  const [key, setKey] = React.useState<string>(() => { try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; } });
  const [loginError, setLoginError] = React.useState<string | null>(null);
  // Lock also wipes the cached bookings, so a locked desk shows nothing.
  const lock = React.useCallback((reason?: string) => { try { localStorage.removeItem(KEY_STORE); } catch { /* private mode */ } cache.clear(); setKey(""); setLoginError(reason ?? null); }, []);
  const call = React.useMemo(() => makeCall(key, () => lock("You've been signed out — enter the passcode again.")), [key, lock]);
  useWakeLock(!!key);

  const login = async (passcode: string) => {
    setLoginError(null);
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.token) { setLoginError(j.error || "Couldn't sign in — try again."); return; }
      try { localStorage.setItem(KEY_STORE, j.token); } catch { /* ignore */ }
      setKey(j.token);
    } catch { setLoginError("No connection — check the internet and try again."); }
  };

  if (!key) return <Login error={loginError} onSubmit={login} />;
  return <Floor call={call} onLock={() => lock()} />;
}

function Floor({ call, onLock }: { call: AdminCtx["call"]; onLock: () => void }) {
  const now = useNow(30_000);
  const [section, setSection] = React.useState<Section>("today");
  const [view, setView] = React.useState<View>("day");
  const [anchor, setAnchor] = React.useState(todayISO());
  const [who, setWho] = React.useState("all");
  const [appts, setAppts] = React.useState<Appt[]>(() => cache.get<Appt[]>(`range:${todayISO()}:${todayISO()}`) || []);
  const [blocks, setBlocks] = React.useState<Block[]>(() => cache.get<Block[]>(`blocks:${todayISO()}:${todayISO()}`) || []);
  const [team, setTeam] = React.useState<Staff[]>(() => cache.get<Staff[]>("staff") || []);
  const [services, setServices] = React.useState<Svc[]>(() => cache.get<Svc[]>("services") || []);
  const [rota, setRota] = React.useState<RotaRow[]>(() => cache.get<RotaRow[]>("rota") || []);
  const [rotaReady, setRotaReady] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [synced, setSynced] = React.useState<number | null>(null);
  const [detail, setDetail] = React.useState<Appt | null>(null);
  const [moveReq, setMoveReq] = React.useState<MoveRequest | null>(null);
  const [walkin, setWalkin] = React.useState(false);
  const [blocking, setBlocking] = React.useState(false);
  const [finding, setFinding] = React.useState(false);
  const [openBlock, setOpenBlock] = React.useState<Block | null>(null);

  // reference data, once
  React.useEffect(() => {
    call<{ staff: Staff[] }>("staff").then((j) => { setTeam(j.staff || []); cache.set("staff", j.staff || []); }).catch((e) => setError(e.message));
    call<{ services: Svc[] }>("services").then((j) => { setServices(j.services || []); cache.set("services", j.services || []); }).catch(() => {});
    call<{ rota: RotaRow[] }>("rota").then((j) => { setRota(j.rota || []); cache.set("rota", j.rota || []); setRotaReady(true); }).catch(() => setRotaReady(true));
  }, [call]);

  const range = React.useMemo(() => {
    if (section !== "calendar" || view === "day") { const d = section === "calendar" ? anchor : todayISO(); return { start: d, end: d }; }
    if (view === "week") { const w = weekDays(anchor); return { start: w[0], end: w[6] }; }
    const g = monthGrid(anchor); return { start: g[0], end: g[41] };
  }, [section, view, anchor]);

  // show what we had for this range straight away, then refresh
  React.useEffect(() => {
    const a = cache.get<Appt[]>(`range:${range.start}:${range.end}`); const b = cache.get<Block[]>(`blocks:${range.start}:${range.end}`);
    if (a) setAppts(a); if (b) setBlocks(b);
  }, [range.start, range.end]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const j = await call<{ appointments: Appt[]; blocks?: Block[]; errors: number }>(`range?start=${range.start}&end=${range.end}`);
      setAppts(j.appointments || []); setBlocks(j.blocks || []); setSynced(Date.now());
      cache.set(`range:${range.start}:${range.end}`, j.appointments || []); cache.set(`blocks:${range.start}:${range.end}`, j.blocks || []);
      setError(j.errors ? `Couldn't reach ${j.errors} practitioner calendar${j.errors > 1 ? "s" : ""} in GHL — some bookings may be missing.` : null);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't load bookings."); } finally { setLoading(false); }
  }, [call, range.start, range.end]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    const t = setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [load]);

  const ctx = React.useMemo<AdminCtx>(() => ({ call, team, services, svcByName: Object.fromEntries(services.map((s) => [s.name, s])) }), [call, team, services]);
  const filtered = who === "all" ? appts : appts.filter((a) => a.practitioner === who);
  const byDay = (d: string) => filtered.filter((a) => londonDate(a.startTime) === d);
  const step = (dir: number) => setAnchor((a) => shift(a, dir * (view === "day" ? 1 : view === "week" ? 7 : 30)));
  const openDay = (d: string) => { setAnchor(d); setView("day"); };

  const heading: Record<Section, { title: string; sub: string }> = {
    today: { title: prettyDate(todayISO()), sub: "Today at ORÁ" },
    calendar: { title: view === "day" ? prettyDate(anchor) : view === "week" ? `${fmtDate(weekDays(anchor)[0], { day: "numeric", month: "short" })} – ${fmtDate(weekDays(anchor)[6], { day: "numeric", month: "short" })}` : fmtDate(anchor, { month: "long", year: "numeric" }), sub: "Every practitioner, every booking" },
    bundles: { title: "Blow-dry bundles", sub: "Who has blow-dries left" },
    rota: { title: "Weekly rota", sub: "Who works when" },
    renters: { title: "Renters", sub: "Rooms and chairs rented at ORÁ" },
    enquiries: { title: "Enquiries", sub: "From the website" },
    messages: { title: "Messages", sub: "Client conversations · replies send by email" },
  };

  return (
    <AdminContext.Provider value={ctx}>
      <div className="min-h-screen bg-ora-milk text-ora-deep mesh-bg md:grid md:grid-cols-[15.5rem_1fr]">
        {/* sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen flex-col bg-ora-deep text-ora-cream md:flex">
          <div className="px-6 pb-6 pt-7">
            <p className="font-display text-[1.6rem] leading-none tracking-[0.02em]">ORÁ</p>
            <p className="mt-1 font-sans text-[0.6875rem] uppercase tracking-[0.28em] text-ora-cream/50">Floor</p>
          </div>
          <nav aria-label="Dashboard" className="flex-1 space-y-1 px-3">
            {NAV.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined}
                className={cn("focus-ring flex h-11 w-full items-center gap-3 rounded-xl px-3.5 font-sans text-[0.9rem] transition-colors",
                  section === id ? "bg-ora-cream/10 text-ora-cream" : "text-ora-cream/60 hover:bg-ora-cream/5 hover:text-ora-cream")}>
                <Icon size={17} className={section === id ? "text-ora-bronze" : ""} />{label}
                {section === id && <span aria-hidden className="ml-auto h-1.5 w-1.5 rounded-full bg-ora-bronze" />}
              </button>
            ))}
          </nav>
          <div className="space-y-4 border-t border-ora-cream/10 px-6 py-6">
            <div>
              <p className="font-display text-[2.4rem] leading-none tabular-nums">{time(now)}</p>
              <p className="mt-1.5 font-sans text-[0.78rem] text-ora-cream/55">{fmtDate(todayISO(), { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button onClick={load} className="focus-ring inline-flex items-center gap-2 rounded-lg font-sans text-[0.75rem] text-ora-cream/55 hover:text-ora-cream">
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />{synced ? `Updated ${time(synced)}` : "Syncing…"}
              </button>
              <button onClick={onLock} className="focus-ring inline-flex items-center gap-1.5 rounded-lg font-sans text-[0.75rem] text-ora-cream/55 hover:text-ora-cream"><Lock size={13} />Lock</button>
            </div>
          </div>
        </aside>

        {/* mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-ora-deep px-5 py-3 text-ora-cream md:hidden">
          <p className="font-display text-[1.25rem]">ORÁ <span className="font-sans text-[0.625rem] uppercase tracking-[0.28em] text-ora-cream/50">Floor</span></p>
          <div className="flex items-center gap-4">
            <span className="font-display text-[1.2rem] tabular-nums">{time(now)}</span>
            <button onClick={onLock} aria-label="Lock dashboard" className="focus-ring rounded text-ora-cream/60"><Lock size={16} /></button>
          </div>
        </div>

        <main className="min-w-0 px-5 pb-28 pt-6 md:px-9 md:pb-10 md:pt-8">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-sans text-[0.6875rem] uppercase tracking-[0.22em] text-ora-bronze">{heading[section].sub}</p>
              <h1 className="mt-1.5 font-display text-[clamp(1.6rem,2.4vw,2.2rem)] leading-tight text-ora-deep">{heading[section].title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {section === "calendar" && (<>
                <Segmented label="Calendar view" value={view} onChange={setView} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} />
                <div className="inline-flex items-center gap-1">
                  <Btn size="md" aria-label="Previous" onClick={() => step(-1)} className="w-11 px-0"><ChevronLeft size={18} /></Btn>
                  <Btn size="md" onClick={() => setAnchor(todayISO())}>Today</Btn>
                  <Btn size="md" aria-label="Next" onClick={() => step(1)} className="w-11 px-0"><ChevronRight size={18} /></Btn>
                </div>
                <Select aria-label="Practitioner" value={who} onChange={(e) => setWho(e.target.value)} className="w-auto min-w-[9.5rem]">
                  <option value="all">Everyone</option>
                  {team.map((s) => <option key={s.userId} value={s.name}>{s.name}</option>)}
                </Select>
              </>)}
              <Btn onClick={() => setFinding(true)} aria-label="Find client"><Search size={16} /><span className="hidden sm:inline">Find client</span></Btn>
              {section === "calendar" && <Btn onClick={() => setBlocking(true)}>Block time</Btn>}
              {(section === "today" || section === "calendar") && <Btn variant="dark" onClick={() => setWalkin(true)}><Plus size={16} />Walk-in</Btn>}
            </div>
          </header>

          {error && (section === "today" || section === "calendar") && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

          {section === "today" && <TodayOverview appts={appts.filter((a) => londonDate(a.startTime) === todayISO())} blocks={blocks} rota={rota} now={now} onOpen={setDetail} onWalkin={() => setWalkin(true)} />}
          {section === "calendar" && view === "day" && (
            <DayTimeline date={anchor} appts={byDay(anchor)} blocks={blocks.filter((b) => londonDate(b.startTime) === anchor)} columns={who === "all" ? team.map((t) => t.name) : [who]} team={team} rota={rota} now={now} onOpen={setDetail}
              onMove={(a, toName, startIso) => setMoveReq({ a, toName, startIso })} onBlock={setOpenBlock} />
          )}
          {section === "calendar" && view === "week" && <WeekView anchor={anchor} byDay={byDay} onOpen={setDetail} onDay={openDay} />}
          {section === "calendar" && view === "month" && <MonthView anchor={anchor} byDay={byDay} onDay={openDay} />}
          {section === "rota" && (rotaReady
            ? <RotaGrid team={team} rows={rota} onSaved={(r) => setRota((rs) => [...rs.filter((x) => !(x.practitioner_user_id === r.practitioner_user_id && x.weekday === r.weekday)), r])} />
            : <p className="font-sans text-[0.875rem] text-ora-fog">Loading rota…</p>)}
          {section === "bundles" && <BundlesView />}
          {section === "renters" && <RentersView />}
          {section === "enquiries" && <EnquiriesView />}
          {section === "messages" && <MessagesView />}
        </main>

        {/* mobile bottom nav */}
        <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-ora-cream/10 bg-ora-deep pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined}
              className={cn("focus-ring flex h-16 flex-col items-center justify-center gap-1 font-sans text-[0.625rem]", section === id ? "text-ora-bronze" : "text-ora-cream/55")}>
              <Icon size={19} />{label}
            </button>
          ))}
        </nav>
      </div>

      <MoveDialog req={moveReq} onClose={() => setMoveReq(null)} onMoved={(u) => { setAppts((xs) => xs.map((x) => (x.id === u.id ? u : x))); setTimeout(load, 1500); }} />
      <ApptDrawer a={detail} onClose={() => setDetail(null)} onChanged={(u) => { setDetail(u); setAppts((xs) => xs.map((x) => (x.id === u.id ? u : x))); setTimeout(load, 1500); }} />
      <ClientDrawer open={finding} onClose={() => setFinding(false)} />
      <BlockDrawer open={blocking} day={anchor} block={openBlock} onClose={() => { setBlocking(false); setOpenBlock(null); }} onSaved={() => { setBlocking(false); setOpenBlock(null); load(); }} />
      <WalkinDrawer open={walkin} onClose={() => setWalkin(false)} onBooked={() => { setWalkin(false); load(); }} />
    </AdminContext.Provider>
  );
}

function Login({ error, onSubmit }: { error: string | null; onSubmit: (passcode: string) => Promise<void> }) {
  const [v, setV] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ora-deep p-6 mesh-bg-dark">
      <form onSubmit={async (e) => { e.preventDefault(); if (!v.trim() || busy) return; setBusy(true); await onSubmit(v.trim()); setBusy(false); setV(""); }} className="relative w-full max-w-sm text-center">
        <p className="font-display text-[3rem] leading-none tracking-[0.02em] text-ora-cream">ORÁ</p>
        <p className="mt-2 font-sans text-[0.6875rem] uppercase tracking-[0.32em] text-ora-cream/50">Floor</p>
        <span aria-hidden className="mx-auto mt-8 block h-px w-12 bg-ora-bronze" />
        <label htmlFor="pass" className="mt-8 block font-sans text-[0.875rem] text-ora-cream/70">Enter the staff passcode</label>
        <input id="pass" type="password" inputMode="numeric" autoFocus autoComplete="current-password" value={v} onChange={(e) => setV(e.target.value)}
          className="focus-ring mt-3 h-12 w-full rounded-xl border border-ora-cream/15 bg-ora-cream/[0.06] px-4 text-center font-sans text-[1rem] tracking-[0.2em] text-ora-cream outline-none transition focus:border-ora-bronze" />
        {error && <p role="alert" className="mt-3 font-sans text-[0.8125rem] text-ora-bronze">{error}</p>}
        <button className="focus-ring mt-4 h-12 w-full rounded-xl bg-ora-bronze font-sans text-[0.9375rem] font-medium text-white transition hover:bg-ora-bronze/90 disabled:opacity-60" disabled={busy}>{busy ? "Checking…" : "Open the floor"}</button>
        <p className="mt-6 font-sans text-[0.75rem] text-ora-cream/40">Stays signed in on this device for 90 days, or until you press Lock.</p>
      </form>
    </div>
  );
}
