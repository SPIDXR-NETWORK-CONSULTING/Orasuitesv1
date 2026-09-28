/**
 * ORÁ Floor — room & chair renters (e.g. 25 Clinic). Stored in the locked ORÁ database.
 * No delete: set a renter to "Ended" to archive them, so history is never lost by accident.
 */
import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Plan, type Renter, type RenterStatus, useAdmin, money, fmtDate, todayISO } from "./lib";
import { Btn, Card, Drawer, Empty, ErrorNote, Field, Input, Segmented, Select, Stat, Textarea } from "./ui";

const PLAN_LABEL: Record<Plan, string> = { "half-day": "Half day", "full-day": "Full day", monthly: "Monthly", other: "Other" };
const PER: Record<Plan, string> = { "half-day": "/ half day", "full-day": "/ day", monthly: "/ month", other: "" };
const STATUS_CLS: Record<RenterStatus, string> = { active: "bg-ora-sage/10 text-ora-sage", paused: "bg-ora-bronze/10 text-ora-bronze", ended: "bg-ora-fog/15 text-ora-fog" };
const shortDate = (d: string) => fmtDate(d, { day: "numeric", month: "short", year: "numeric" });

function insurance(r: Renter): { tone: "ok" | "warn" | "bad"; text: string } {
  if (!r.insurance_expiry) return { tone: "bad", text: "No insurance on file" };
  const days = Math.round((Date.parse(r.insurance_expiry) - Date.parse(todayISO())) / 86_400_000);
  if (days < 0) return { tone: "bad", text: `Insurance expired ${shortDate(r.insurance_expiry)}` };
  if (days <= 30) return { tone: "warn", text: `Insurance expires in ${days}d` };
  return { tone: "ok", text: `Insured to ${shortDate(r.insurance_expiry)}` };
}

export function RentersView() {
  const { call } = useAdmin();
  const [list, setList] = React.useState<Renter[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"current" | "all">("current");
  const [editing, setEditing] = React.useState<Partial<Renter> | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    call<{ renters: Renter[] }>("renters").then((j) => setList(j.renters || [])).catch((e) => setError(e.message));
  }, [call]);
  React.useEffect(load, [load]);

  const active = (list || []).filter((r) => r.status === "active");
  const monthly = active.filter((r) => r.plan === "monthly").reduce((s, r) => s + (Number(r.rate) || 0), 0);
  const alerts = active.filter((r) => insurance(r).tone !== "ok").length;
  const shown = (list || []).filter((r) => filter === "all" || r.status !== "ended");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Active renters" value={list ? active.length : "—"} sub={list && list.length > active.length ? `${list.length - active.length} paused or ended` : "renting now"} />
        <Stat label="Monthly rent" value={list ? money(monthly) : "—"} tone="bronze" sub="active monthly renters" />
        <Stat label="Insurance alerts" value={list ? alerts : "—"} tone={alerts ? "bronze" : "sage"} sub={alerts ? "missing, expired or due in 30 days" : "all active renters covered"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Show renters" value={filter} onChange={setFilter} options={[{ value: "current", label: "Current" }, { value: "all", label: "All, incl. ended" }]} />
        <Btn variant="dark" onClick={() => setEditing({ plan: "monthly", status: "active" })}><Plus size={16} /> Add renter</Btn>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {!list && !error && <Empty title="Loading renters…" />}
      {list && shown.length === 0 && (
        <Empty title="No renters yet." line="Add everyone renting a room or chair at ORÁ — including 25 Clinic." action={<Btn variant="primary" onClick={() => setEditing({ plan: "monthly", status: "active" })}><Plus size={16} /> Add the first renter</Btn>} />
      )}

      {shown.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => {
            const ins = insurance(r);
            return (
              <button key={r.id} onClick={() => setEditing(r)} className={cn("focus-ring group text-left", r.status === "ended" && "opacity-60")}>
                <Card className="h-full p-5 transition group-hover:border-ora-bronze/40 group-hover:shadow-luxury">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[1.2rem] leading-tight text-ora-deep">{r.business}</p>
                      <p className="mt-0.5 truncate font-sans text-[0.8125rem] text-ora-fog">{[r.contact_name, r.room].filter(Boolean).join(" · ") || "No contact yet"}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-sans text-[0.6875rem] font-medium capitalize", STATUS_CLS[r.status])}>{r.status}</span>
                  </div>
                  <p className="mt-4 font-sans text-[0.875rem] text-ora-deep">
                    <span className="font-display text-[1.35rem] tabular-nums">{r.rate != null ? money(Number(r.rate)) : "—"}</span>
                    <span className="ml-1.5 text-ora-fog">{PER[r.plan]} · {PLAN_LABEL[r.plan]}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[0.78rem]">
                    <span className={cn(ins.tone === "ok" ? "text-ora-sage" : ins.tone === "warn" ? "text-ora-bronze" : "text-ora-clay")}>● {ins.text}</span>
                    {r.start_date && <span className="text-ora-fog">Since {shortDate(r.start_date)}</span>}
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <RenterDrawer value={editing} onClose={() => setEditing(null)} onSaved={(saved) => { setList((l) => { const rest = (l || []).filter((x) => x.id !== saved.id); return [saved, ...rest].sort((a, b) => Number(b.status === "active") - Number(a.status === "active") || a.business.localeCompare(b.business)); }); setEditing(null); }} />
    </div>
  );
}

function RenterDrawer({ value, onClose, onSaved }: { value: Partial<Renter> | null; onClose: () => void; onSaved: (r: Renter) => void }) {
  const { call } = useAdmin();
  const [f, setF] = React.useState<Partial<Renter>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { if (value) { setF(value); setError(null); } }, [value]);
  const set = <K extends keyof Renter>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const isNew = !f.id;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.business?.trim()) { setError("Add the business name."); return; }
    setBusy(true); setError(null);
    try {
      const j = await call<{ renter: Renter }>("renter-set", { method: "POST", body: JSON.stringify({ ...f, rate: f.rate ?? "" }) });
      onSaved(j.renter);
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't save."); } finally { setBusy(false); }
  }

  return (
    <Drawer open={!!value} onClose={onClose} title={isNew ? "New renter" : f.business || "Renter"} subtitle={isNew ? "Room or chair rental at ORÁ." : "Edit details — set to Ended to archive."}
      footer={<Btn form="renter-form" variant="dark" disabled={busy} className="w-full">{busy ? "Saving…" : isNew ? "Add renter" : "Save changes"}</Btn>}>
      <form id="renter-form" onSubmit={submit} className="space-y-4">
        <Field label="Business name *"><Input autoFocus value={f.business || ""} onChange={set("business")} placeholder="e.g. 25 Clinic" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact name"><Input value={f.contact_name || ""} onChange={set("contact_name")} /></Field>
          <Field label="Room / chair"><Input value={f.room || ""} onChange={set("room")} placeholder="e.g. Room 2" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email"><Input type="email" inputMode="email" value={f.email || ""} onChange={set("email")} /></Field>
          <Field label="Phone"><Input type="tel" inputMode="tel" value={f.phone || ""} onChange={set("phone")} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Plan">
            <Select value={f.plan || "monthly"} onChange={set("plan")}>{(Object.keys(PLAN_LABEL) as Plan[]).map((p) => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}</Select>
          </Field>
          <Field label={`Rate (£) ${PER[(f.plan || "monthly") as Plan]}`}><Input type="number" min={0} step="0.01" inputMode="decimal" value={f.rate ?? ""} onChange={set("rate")} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date"><Input type="date" value={f.start_date || ""} onChange={set("start_date")} /></Field>
          <Field label="End date" hint="Leave blank if ongoing"><Input type="date" value={f.end_date || ""} onChange={set("end_date")} /></Field>
        </div>
        <Field label="Insurance expiry" hint="Renters must hold valid insurance — you'll be warned 30 days before it lapses.">
          <Input type="date" value={f.insurance_expiry || ""} onChange={set("insurance_expiry")} />
        </Field>
        <Field label="Status">
          <Select value={f.status || "active"} onChange={set("status")}>
            <option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended (archive)</option>
          </Select>
        </Field>
        <Field label="Notes"><Textarea rows={3} value={f.notes || ""} onChange={set("notes")} placeholder="Access, deposit, anything to remember" /></Field>
        {error && <ErrorNote>{error}</ErrorNote>}
      </form>
    </Drawer>
  );
}
