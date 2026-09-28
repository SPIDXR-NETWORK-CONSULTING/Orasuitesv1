/** ORÁ Floor — appointment detail + walk-in drawers. */
import * as React from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Appt, type Svc, useAdmin, useNow, phase, time, money, durLabel, prettyDate, londonDate, fmtDate, svcLabel } from "./lib";
import { Btn, Drawer, ErrorNote, Field, Input, StatusPill } from "./ui";

/* ── Appointment ─────────────────────────────────────────── */
export function ApptDrawer({ a, onClose, onChanged }: { a: Appt | null; onClose: () => void; onChanged: (a: Appt) => void }) {
  return (
    <Drawer open={!!a} onClose={onClose} title={a?.client ?? ""} subtitle={a ? [svcLabel(a.service), prettyDate(londonDate(a.startTime))].filter(Boolean).join(" · ") : undefined}>
      {a && <ApptBody a={a} onChanged={onChanged} />}
    </Drawer>
  );
}

/** Arrived / no-show / cancel — the reception actions. Cancel needs a second tap. */
function StatusActions({ a, onChanged }: { a: Appt; onChanged: (a: Appt) => void }) {
  const { call } = useAdmin();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [armed, setArmed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  const set = async (status: string) => {
    setBusy(status); setError(null);
    try { await call("status", { method: "POST", body: JSON.stringify({ id: a.id, status }) }); onChanged({ ...a, status }); setArmed(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't update."); }
    finally { setBusy(null); }
  };
  if (a.status === "showed") return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-ora-arrived px-5 py-4 text-white">
      <span className="font-sans text-[0.9375rem] font-medium">✓ Arrived — in the chair</span>
      <button onClick={() => set("confirmed")} disabled={!!busy} className="focus-ring rounded-lg px-2 py-1 font-sans text-[0.8125rem] text-white/80 underline-offset-4 hover:underline">{busy ? "…" : "Undo"}</button>
    </div>
  );
  if (a.status === "noshow" || a.status === "cancelled") return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ora-taupe/25 bg-white/60 px-5 py-4">
      <span className="font-sans text-[0.9375rem] text-ora-fog">{a.status === "noshow" ? "Marked as no-show" : "Cancelled"}</span>
      <Btn size="sm" variant="ghost" onClick={() => set("confirmed")} disabled={!!busy}>{busy ? "Restoring…" : "Restore booking"}</Btn>
    </div>
  );
  return (
    <div className="space-y-2.5">
      <Btn variant="primary" onClick={() => set("showed")} disabled={!!busy} className="h-12 w-full text-[0.9375rem]">{busy === "showed" ? "Checking in…" : "✓ Client has arrived"}</Btn>
      <div className="grid grid-cols-2 gap-2.5">
        <Btn onClick={() => set("noshow")} disabled={!!busy}>{busy === "noshow" ? "Saving…" : "No-show"}</Btn>
        <Btn onClick={() => (armed ? set("cancelled") : setArmed(true))} disabled={!!busy}
          className={armed ? "border-ora-clay bg-ora-clay text-white hover:bg-ora-clay/90 hover:text-white" : "hover:border-ora-clay hover:text-ora-clay"}>
          {busy === "cancelled" ? "Cancelling…" : armed ? "Tap again to cancel" : "Cancel booking"}
        </Btn>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}

function ApptBody({ a, onChanged }: { a: Appt; onChanged: (a: Appt) => void }) {
  const { call, svcByName } = useAdmin();
  const now = useNow(1000);
  const svc: Svc | undefined = svcByName[a.service];
  const p = phase(a, now);
  const mins = Math.round((Date.parse(a.endTime) - Date.parse(a.startTime)) / 60000);
  const [hist, setHist] = React.useState<{ contact: any; appointments: any[] } | null>(null);
  const [histState, setHistState] = React.useState<"idle" | "loading" | "error">("idle");

  const loadHistory = async () => {
    if (!a.contactId) return;
    setHistState("loading");
    try { setHist(await call(`client?contactId=${encodeURIComponent(a.contactId)}`)); setHistState("idle"); } catch { setHistState("error"); }
  };

  const R = 46, C = 2 * Math.PI * R;
  const ring = p.kind === "now" ? p.progress : p.kind === "done" ? 1 : 0;
  const label = p.kind === "now" ? `${durLabel(p.minsLeft)}` : p.kind === "upcoming" ? `in ${durLabel(Math.max(0, p.minsLeft))}` : p.kind === "done" ? "Finished" : "—";
  const caption = p.kind === "now" ? "left in the chair" : p.kind === "upcoming" ? "until it starts" : p.kind === "void" ? a.status : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 110 110" className="h-28 w-28 shrink-0 -rotate-90" aria-hidden>
          <circle cx="55" cy="55" r={R} fill="none" stroke="rgb(var(--ora-bronze-rgb) / 0.15)" strokeWidth="6" />
          <circle cx="55" cy="55" r={R} fill="none" stroke="var(--ora-bronze)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - ring)} className="transition-[stroke-dashoffset] duration-1000" />
        </svg>
        <div>
          <p className="font-display text-[2rem] leading-none tabular-nums text-ora-deep">{label}</p>
          <p className="mt-1.5 font-sans text-[0.875rem] text-ora-fog">{caption}</p>
          <p className="mt-3 font-sans text-[0.875rem] tabular-nums text-ora-deep">{time(a.startTime)} – {time(a.endTime)} <span className="text-ora-fog">· {durLabel(svc?.duration ?? mins)}</span></p>
        </div>
      </div>

      <StatusActions a={a} onChanged={onChanged} />

      <div className="rounded-2xl bg-ora-deep px-5 py-4 text-ora-cream">
        <p className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-cream/60">Charge the client</p>
        <p className="mt-1 font-display text-[2rem] leading-none tabular-nums">{money(svc?.price)}</p>
        {!svc && <p className="mt-1.5 font-sans text-[0.75rem] text-ora-cream/60">No listed price for this service — confirm at the desk.</p>}
      </div>

      <dl className="divide-y divide-ora-taupe/15 font-sans text-[0.875rem]">
        {[["Practitioner", a.practitioner], ["Booked via", a.source || "—"]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-ora-fog">{k}</dt><dd className="text-right font-medium text-ora-deep">{v}</dd></div>
        ))}
        <div className="flex items-center justify-between gap-4 py-2.5"><dt className="text-ora-fog">Status</dt><dd><StatusPill status={a.status} /></dd></div>
      </dl>

      {a.contactId && !hist && (
        <Btn onClick={loadHistory} disabled={histState === "loading"} className="w-full">{histState === "loading" ? "Loading…" : "View client history"}</Btn>
      )}
      {histState === "error" && <ErrorNote>Couldn't load the client's history. Try again.</ErrorNote>}
      {hist && (
        <section>
          <p className="font-sans text-[0.9375rem] font-medium text-ora-deep">{hist.contact?.name}</p>
          <p className="font-sans text-[0.8125rem] text-ora-fog">{[hist.contact?.email, hist.contact?.phone].filter(Boolean).join(" · ") || "No contact details"}</p>
          <p className="mb-2 mt-4 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-fog">Visits ({hist.appointments.length})</p>
          <ul className="space-y-1.5">
            {hist.appointments.map((h) => (
              <li key={h.id} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2 font-sans text-[0.8125rem]">
                <span className="w-20 shrink-0 tabular-nums text-ora-fog">{h.startTime ? fmtDate(londonDate(h.startTime), { day: "numeric", month: "short", year: "2-digit" }) : "—"}</span>
                <span className="min-w-0 flex-1 truncate text-ora-deep">{h.service}</span>
                <span className="shrink-0 text-ora-fog">{(h.practitioner || "").split(" ")[0]}</span>
              </li>
            ))}
            {hist.appointments.length === 0 && <li className="py-3 text-center font-sans text-[0.8125rem] text-ora-fog">First visit.</li>}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ── Walk-in ─────────────────────────────────────────────── */
const CAT_LABEL: Record<string, string> = { nails: "Nails", hair: "Hair", makeup: "Makeup", beauty: "Beauty", "iv-therapy": "IV Therapy", laser: "Laser" };

export function WalkinDrawer({ open, onClose, onBooked }: { open: boolean; onClose: () => void; onBooked: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="New walk-in" subtitle="Pick a treatment — we'll find who's free.">
      {open && <WalkinBody onBooked={onBooked} />}
    </Drawer>
  );
}

function WalkinBody({ onBooked }: { onBooked: () => void }) {
  const { call, services } = useAdmin();
  const [q, setQ] = React.useState("");
  const [svc, setSvc] = React.useState<Svc | null>(null);
  const [slots, setSlots] = React.useState<string[] | null>(null);
  const [start, setStart] = React.useState<string>("");
  const [name, setName] = React.useState(""); const [email, setEmail] = React.useState(""); const [phone, setPhone] = React.useState("");
  const [busy, setBusy] = React.useState(false); const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ practitioner: string | null; startTime: string; price: number; service: string } | null>(null);

  React.useEffect(() => {
    if (!svc) return;
    setSlots(null); setStart("");
    call<{ slots: string[] }>(`slots?serviceId=${encodeURIComponent(svc.id)}`).then((j) => setSlots((j.slots || []).filter((s) => Date.parse(s) >= Date.now() - 5 * 60_000))).catch(() => setSlots([]));
  }, [svc, call]);

  const groups = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const m = new Map<string, Svc[]>();
    services.filter((s) => !needle || s.name.toLowerCase().includes(needle)).forEach((s) => { const k = s.category; m.set(k, [...(m.get(k) || []), s]); });
    return Array.from(m.entries());
  }, [services, q]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!svc || !name.trim()) { setError("Pick a treatment and enter the client's name."); return; }
    setBusy(true); setError(null);
    try {
      const j = await call("walkin", { method: "POST", body: JSON.stringify({ serviceId: svc.id, clientName: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, startTime: start || undefined }) });
      setDone({ practitioner: j.practitioner, startTime: j.startTime, price: j.price, service: j.service });
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't book."); } finally { setBusy(false); }
  }

  if (done) return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-ora-sage/15 text-ora-sage"><Check size={26} /></span>
      <p className="font-display text-[1.6rem] text-ora-deep">Booked</p>
      <p className="mt-2 font-sans text-[0.9375rem] text-ora-deep">{done.service}</p>
      <p className="font-sans text-[0.875rem] text-ora-fog">{time(done.startTime)} · with <span className="font-medium text-ora-deep">{done.practitioner || "next available"}</span></p>
      <div className="mt-6 w-full rounded-2xl bg-ora-deep px-5 py-4 text-ora-cream">
        <p className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-cream/60">Charge the client</p>
        <p className="mt-1 font-display text-[2rem] leading-none tabular-nums">{money(done.price)}</p>
      </div>
      <Btn variant="primary" onClick={onBooked} className="mt-6 w-full">Done</Btn>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      {!svc ? (
        <div>
          <div className="relative mb-4">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ora-fog" aria-hidden />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search treatments" aria-label="Search treatments" className="pl-10" />
          </div>
          <div className="space-y-5">
            {groups.map(([cat, list]) => (
              <div key={cat}>
                <p className="mb-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-bronze">{CAT_LABEL[cat] || cat}</p>
                <ul className="divide-y divide-ora-taupe/10 overflow-hidden rounded-2xl border border-white/70 bg-white/70">
                  {list.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => setSvc(s)} className="focus-ring flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ora-bronze/[0.06]">
                        <span className="min-w-0 flex-1 truncate font-sans text-[0.875rem] text-ora-deep">{s.name}</span>
                        <span className="shrink-0 font-sans text-[0.75rem] tabular-nums text-ora-fog">{durLabel(s.duration)}</span>
                        <span className="w-12 shrink-0 text-right font-sans text-[0.875rem] tabular-nums text-ora-deep">{money(s.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {groups.length === 0 && <p className="py-8 text-center font-sans text-[0.875rem] text-ora-fog">No treatment matches “{q}”.</p>}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-ora-bronze/30 bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-sans text-[0.9375rem] font-medium text-ora-deep">{svc.name}</p>
              <p className="font-sans text-[0.8125rem] tabular-nums text-ora-fog">{durLabel(svc.duration)} · {money(svc.price)}</p>
            </div>
            <Btn type="button" size="sm" variant="ghost" onClick={() => setSvc(null)}>Change</Btn>
          </div>

          <div>
            <p className="mb-2 font-sans text-[0.75rem] font-medium text-ora-fog">Time</p>
            <div className="flex flex-wrap gap-2">
              <TimeChip on={start === ""} onClick={() => setStart("")}>Next available</TimeChip>
              {slots === null && <span className="self-center font-sans text-[0.8125rem] text-ora-fog">Checking…</span>}
              {slots?.slice(0, 16).map((s) => <TimeChip key={s} on={start === s} onClick={() => setStart(s)}>{time(s)}</TimeChip>)}
            </div>
            {slots?.length === 0 && <p className="mt-2 font-sans text-[0.8125rem] text-ora-fog">No free times left today — “Next available” will try the soonest slot.</p>}
          </div>

          <div className="space-y-3">
            <Field label="Client name"><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email (optional)"><Input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" /></Field>
              <Field label="Phone (optional)"><Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" /></Field>
            </div>
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}
          <div>
            <Btn variant="dark" disabled={busy} className="w-full">{busy ? "Booking…" : "Book walk-in"}</Btn>
            <p className="mt-2 text-center font-sans text-[0.75rem] text-ora-fog">Assigns a free practitioner, alerts them and adds the client to GHL.</p>
          </div>
        </>
      )}
    </form>
  );
}

function TimeChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={cn("focus-ring h-10 rounded-xl border px-3.5 font-sans text-[0.8125rem] tabular-nums transition", on ? "border-ora-deep bg-ora-deep text-ora-cream" : "border-ora-taupe/35 bg-white text-ora-deep hover:border-ora-bronze")}>
      {children}
    </button>
  );
}
