/**
 * ORÁ Floor — blow-dry bundles (4 or 6 blow-dries, paid in full at the desk, valid 6 months
 * from payment). Stored in the locked ORÁ database; every change goes through
 * /api/admin/bundle-*. The client is emailed after a sale and after every visit.
 *
 *   useApptBundle + ApptBundle  the box on an appointment: sell / take payment / count
 *                               today's blow-dry / undo
 *   BundlesView                 the Bundles tab: who has what left, visit history
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { bundleFor, findService } from "@/lib/catalogue";
import { type Appt, useAdmin, cache, money, fmtDate, londonDate } from "./lib";
import { Btn, Card, Empty, ErrorNote, Input, Segmented, Stat } from "./ui";

export interface BundleUse { id: string; appointment_id: string | null; service: string | null; used_at: string }
export interface Bundle {
  id: string; client_name: string; email: string | null; phone: string | null; contact_id: string | null;
  size: number; price: number; source: "online" | "desk"; first_appointment_id: string | null;
  paid_at: string | null; expires_at: string | null; voided_at: string | null; created_at: string;
  used: number; uses: BundleUse[];
}

const shortDate = (iso: string) => fmtDate(londonDate(iso), { day: "numeric", month: "short", year: "numeric" });
const expired = (b: Bundle) => Boolean(b.expires_at && Date.parse(b.expires_at) < Date.now());
const left = (b: Bundle) => Math.max(0, b.size - b.used);
export function bundleState(b: Bundle): { label: string; tone: "live" | "wait" | "done" } {
  if (b.voided_at) return { label: "Cancelled", tone: "done" };
  if (!b.paid_at) return { label: `To pay ${money(b.price)}`, tone: "wait" };
  if (expired(b)) return { label: `Expired ${shortDate(b.expires_at!)}`, tone: "done" };
  if (!left(b)) return { label: "All used", tone: "done" };
  return { label: `${left(b)} of ${b.size} left`, tone: "live" };
}
const TONE = { live: "bg-ora-sage/10 text-ora-sage", wait: "bg-ora-bronze/10 text-ora-bronze", done: "bg-ora-fog/15 text-ora-fog" };

/** All bundles (tiny list), painted from cache then refreshed. Shared by the drawer and the tab. */
export function useBundleList() {
  const { call } = useAdmin();
  const [list, setList] = React.useState<Bundle[] | null>(() => cache.get<Bundle[]>("bundles"));
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(() => {
    setError(null);
    call<{ bundles: Bundle[] }>("bundles").then((j) => { setList(j.bundles || []); cache.set("bundles", j.bundles || []); }).catch((e) => setError(e.message));
  }, [call]);
  React.useEffect(load, [load]);
  const replace = (b: Bundle) => setList((l) => { const next = [b, ...(l || []).filter((x) => x.id !== b.id)]; cache.set("bundles", next); return next; });
  return { list, error, load, replace };
}

/** Everything the appointment drawer needs to know about bundles for this booking. */
export function useApptBundle(a: Appt) {
  const { list, error, replace } = useBundleList();
  const svc = a.calendarId ? findService(a.calendarId) : undefined;
  const offer = bundleFor(svc);
  const mine = (list || []).filter((b) => !b.voided_at && ((a.contactId && b.contact_id === a.contactId) || b.first_appointment_id === a.id));
  const usedHere = mine.find((b) => b.uses.some((u) => u.appointment_id === a.id));
  const toPay = !usedHere ? mine.find((b) => !b.paid_at && b.first_appointment_id === a.id) : undefined;
  const active = !usedHere && !toPay ? mine.find((b) => b.paid_at && !expired(b) && left(b) > 0) : undefined;
  /** what reception charges today when a bundle changes it: the bundle price on the visit
   *  it was bought, nothing on later visits */
  const boughtToday = usedHere?.uses[0]?.appointment_id === a.id;
  const charge: { amount: number; note: string } | null = usedHere
    ? boughtToday ? { amount: usedHere.price, note: `Blow-Dry Bundle of ${usedHere.size}` } : { amount: 0, note: "Covered by their bundle" }
    : toPay ? { amount: toPay.price, note: `Blow-Dry Bundle of ${toPay.size}, booked online` } : null;
  return { loaded: Boolean(list), error, offer, svc, usedHere, toPay, active, charge, replace, relevant: Boolean(offer || usedHere || toPay) };
}

export function ApptBundle({ a, s }: { a: Appt; s: ReturnType<typeof useApptBundle> }) {
  const { call } = useAdmin();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [armed, setArmed] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState<string | null>(null);
  React.useEffect(() => { if (armed == null) return; const t = setTimeout(() => setArmed(null), 4000); return () => clearTimeout(t); }, [armed]);
  if (!s.relevant) return null;

  const act = async (key: string, fn: () => Promise<{ bundle: Bundle; emailed?: boolean; warning?: string }>) => {
    setBusy(key); setError(null); setNote(null);
    try {
      const r = await fn();
      s.replace(r.bundle);
      setNote(r.warning || (r.emailed ? "Client emailed with their bundle." : null));
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't update the bundle."); }
    finally { setBusy(null); setArmed(null); }
  };
  const post = (action: string, body: object) => call<{ bundle: Bundle; emailed?: boolean; warning?: string }>(action, { method: "POST", body: JSON.stringify(body) });
  const use = (b: Bundle) => post("bundle-act", { id: b.id, action: "use", appointmentId: a.id, service: s.svc?.name ?? a.service });

  let body: React.ReactNode;
  if (!s.loaded) body = <p className="font-sans text-[0.8125rem] text-ora-fog">Checking bundles…</p>;
  else if (s.usedHere) {
    const b = s.usedHere;
    const n = b.uses.findIndex((u) => u.appointment_id === a.id) + 1;
    const useId = b.uses.find((u) => u.appointment_id === a.id)!.id;
    body = (
      <div className="flex items-center justify-between gap-3">
        <p className="font-sans text-[0.9375rem] font-medium text-ora-deep">✓ Blow-dry {n} of {b.size} <span className="font-normal text-ora-fog">· {left(b)} left</span></p>
        <button onClick={() => act("undo", () => post("bundle-act", { id: b.id, action: "unuse", useId }))} disabled={!!busy} className="focus-ring rounded-lg px-2 py-1 font-sans text-[0.8125rem] text-ora-fog underline-offset-4 hover:underline">{busy ? "…" : "Undo"}</button>
      </div>
    );
  } else if (s.toPay) {
    const b = s.toPay;
    body = (
      <>
        <p className="font-sans text-[0.9375rem] text-ora-deep">Booked online as a <b className="font-medium">Bundle of {b.size}</b>. Take {money(b.price)}, then this is blow-dry 1.</p>
        <Btn variant="primary" className="mt-3 w-full" disabled={!!busy}
          onClick={() => act("pay", async () => { await post("bundle-act", { id: b.id, action: "paid" }); return use(b); })}>
          {busy ? "Saving…" : `Paid ${money(b.price)} · count today's blow-dry`}
        </Btn>
      </>
    );
  } else if (s.active) {
    const b = s.active;
    body = (
      <>
        <p className="font-sans text-[0.9375rem] text-ora-deep">Has a Bundle of {b.size}: <b className="font-medium">{left(b)} left</b>{b.expires_at ? <span className="text-ora-fog"> · until {shortDate(b.expires_at)}</span> : null}</p>
        {s.offer ? (
          <Btn variant="primary" className="mt-3 w-full" disabled={!!busy} onClick={() => act("use", () => use(b))}>{busy ? "Saving…" : "Use the bundle for today's blow-dry"}</Btn>
        ) : <p className="mt-1 font-sans text-[0.78rem] text-ora-fog">This treatment isn't covered by the bundle.</p>}
      </>
    );
  } else if (s.offer) {
    body = (
      <>
        <p className="font-sans text-[0.875rem] text-ora-fog">Sell a bundle. It's paid now and today counts as blow-dry 1.</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {s.offer.sizes.map((z) => (
            <Btn key={z.count} disabled={!!busy || !a.contactId}
              className={armed === z.count ? "border-ora-bronze bg-ora-bronze text-white hover:bg-ora-bronze/90 hover:text-white" : ""}
              onClick={() => armed === z.count
                ? act(`sell${z.count}`, () => post("bundle-sell", { calendarId: a.calendarId, size: z.count, contactId: a.contactId, clientName: a.client, appointmentId: a.id, service: s.svc?.name ?? a.service }))
                : setArmed(z.count)}>
              {busy === `sell${z.count}` ? "Selling…" : armed === z.count ? `Tap again · ${money(z.price)} paid` : `${z.count} for ${money(z.price)}`}
            </Btn>
          ))}
        </div>
        {!a.contactId && <p className="mt-2 font-sans text-[0.75rem] text-ora-fog">This booking has no client record, so a bundle can't be attached.</p>}
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-ora-bronze/25 bg-ora-bronze/[0.06] px-5 py-4" data-testid="appt-bundle">
      <p className="mb-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-bronze">Blow-dry bundle</p>
      {body}
      {error && <div className="mt-2"><ErrorNote>{error}</ErrorNote></div>}
      {note && <p className="mt-2 font-sans text-[0.75rem] text-ora-fog" role="status">{note}</p>}
      {s.error && !s.loaded && <div className="mt-2"><ErrorNote>{s.error}</ErrorNote></div>}
    </section>
  );
}

/* ── Bundles tab ─────────────────────────────────────────── */
export function BundlesView() {
  const { call } = useAdmin();
  const { list, error, load, replace } = useBundleList();
  const [filter, setFilter] = React.useState<"current" | "all">("current");
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [actError, setActError] = React.useState<string | null>(null);

  const act = async (b: Bundle, action: string, extra: object = {}) => {
    setBusy(`${b.id}:${action}`); setActError(null);
    try { replace((await call<{ bundle: Bundle }>("bundle-act", { method: "POST", body: JSON.stringify({ id: b.id, action, ...extra }) })).bundle); }
    catch (e) { setActError(e instanceof Error ? e.message : "Couldn't update."); }
    finally { setBusy(null); }
  };

  const all = list || [];
  const current = all.filter((b) => bundleState(b).tone !== "done");
  const shown = (filter === "all" ? all : current).filter((b) => !q.trim() || `${b.client_name} ${b.email || ""} ${b.phone || ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  const toPay = all.filter((b) => bundleState(b).tone === "wait").length;
  const leftTotal = all.filter((b) => bundleState(b).tone === "live").reduce((n, b) => n + left(b), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Active bundles" value={list ? all.filter((b) => bundleState(b).tone === "live").length : "—"} sub="paid, with blow-dries left" />
        <Stat label="Blow-dries owed" value={list ? leftTotal : "—"} tone="bronze" sub="still to use across all bundles" />
        <Stat label="To pay" value={list ? toPay : "—"} tone={toPay ? "bronze" : "sage"} sub={toPay ? "booked online, pay on first visit" : "nothing outstanding"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Show bundles" value={filter} onChange={setFilter} options={[{ value: "current", label: "Current" }, { value: "all", label: "All, incl. used" }]} />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client" aria-label="Search bundles by client" className="w-full sm:w-64" />
      </div>

      {(error || actError) && <ErrorNote>{actError || error}</ErrorNote>}
      {!list && !error && <Empty title="Loading bundles…" />}
      {list && shown.length === 0 && <Empty title={q ? "No bundle for that name." : "No bundles yet."} line="Bundles appear here when a client books one online or you sell one from a blow-dry appointment." />}

      {shown.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((b) => {
            const st = bundleState(b);
            const isOpen = open === b.id;
            return (
              <Card key={b.id} className={cn("p-5", st.tone === "done" && "opacity-70")}>
                <button onClick={() => setOpen(isOpen ? null : b.id)} aria-expanded={isOpen} className="focus-ring w-full rounded-lg text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[1.2rem] leading-tight text-ora-deep">{b.client_name}</p>
                      <p className="mt-0.5 truncate font-sans text-[0.8125rem] text-ora-fog">Bundle of {b.size} · {money(b.price)} · {b.source === "online" ? "booked online" : "sold at the desk"}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-sans text-[0.6875rem] font-medium", TONE[st.tone])}>{st.label}</span>
                  </div>
                  <div className="mt-4 flex gap-1.5" aria-label={`${b.used} of ${b.size} used`}>
                    {Array.from({ length: b.size }, (_, i) => <span key={i} className={cn("h-2 flex-1 rounded-full", i < b.used ? "bg-ora-bronze" : "bg-ora-bronze/15")} />)}
                  </div>
                  <p className="mt-2 font-sans text-[0.78rem] text-ora-fog">{b.expires_at ? `Valid until ${shortDate(b.expires_at)}` : `Created ${shortDate(b.created_at)}`}</p>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-3 border-t border-ora-taupe/15 pt-4">
                    <p className="font-sans text-[0.8125rem] text-ora-fog">{[b.email, b.phone].filter(Boolean).join(" · ") || "No contact details"}</p>
                    <ol className="space-y-1.5">
                      {b.uses.map((u, i) => (
                        <li key={u.id} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2 font-sans text-[0.8125rem]">
                          <span className="w-5 shrink-0 tabular-nums text-ora-fog">{i + 1}</span>
                          <span className="min-w-0 flex-1 truncate text-ora-deep">{u.service || "Blow-dry"}</span>
                          <span className="shrink-0 tabular-nums text-ora-fog">{shortDate(u.used_at)}</span>
                          <button onClick={() => act(b, "unuse", { useId: u.id })} disabled={!!busy} className="focus-ring shrink-0 rounded px-1 text-ora-fog underline-offset-4 hover:underline">Undo</button>
                        </li>
                      ))}
                      {!b.uses.length && <li className="py-2 text-center font-sans text-[0.8125rem] text-ora-fog">No visits yet.</li>}
                    </ol>
                    {!b.voided_at && (
                      <div className="flex flex-wrap gap-2">
                        {!b.paid_at && <Btn size="sm" variant="primary" disabled={!!busy} onClick={() => act(b, "paid")}>Mark {money(b.price)} paid</Btn>}
                        {b.paid_at && !expired(b) && left(b) > 0 && <Btn size="sm" disabled={!!busy} onClick={() => act(b, "use", { service: "Blow-dry (added by hand)" })}>Count a blow-dry</Btn>}
                        {!b.uses.length && <Btn size="sm" variant="ghost" disabled={!!busy} onClick={() => act(b, "void")}>Cancel bundle</Btn>}
                      </div>
                    )}
                    <p className="font-sans text-[0.72rem] text-ora-fog">Tip: count visits from the appointment itself so each one is linked to the booking.</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <div className="flex justify-end"><Btn size="sm" variant="ghost" onClick={load}>Refresh</Btn></div>
    </div>
  );
}
