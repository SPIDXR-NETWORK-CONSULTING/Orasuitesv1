/**
 * ORÁ Floor — rewards customers redeemed with points in the ORÁ app (for example a free
 * Classic Blow Dry). Reception honours them at the desk:
 *   Used    → the reward was given (charge £0 for it)
 *   Cancel  → not used; the points go back to the customer
 *
 *   useRedemptions   shared list (tiny), painted from cache then refreshed
 *   RewardsToHonour  top of the Bundles tab: every reward waiting, plus recent history
 *   ApptReward       on an appointment, when that client has a reward waiting
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { type Appt, useAdmin, cache, money, fmtDate, londonDate } from "./lib";
import { Btn, Card, ErrorNote } from "./ui";

export interface Redemption {
  id: string; status: "requested" | "applied" | "cancelled"; method: string; cost: number; created_at: string;
  reward: { code: string; name: string; kind: string; cash_value_pence: number | null };
  customer: { name: string | null; email: string | null; phone: string | null; ghl_contact_id: string | null };
}

const when = (iso: string) => fmtDate(londonDate(iso), { day: "numeric", month: "short" });
const value = (r: Redemption) => (r.reward.cash_value_pence ? ` · worth ${money(r.reward.cash_value_pence / 100)}` : "");

export function useRedemptions() {
  const { call } = useAdmin();
  const [list, setList] = React.useState<Redemption[] | null>(() => cache.get<Redemption[]>("redemptions"));
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(() => {
    call<{ redemptions: Redemption[] }>("redemptions")
      .then((j) => { setList(j.redemptions || []); cache.set("redemptions", j.redemptions || []); setError(null); })
      .catch((e) => setError(e.message));
  }, [call]);
  React.useEffect(load, [load]);
  const act = async (id: string, action: "applied" | "cancelled") => {
    await call("redemption-act", { method: "POST", body: JSON.stringify({ id, action }) });
    setList((l) => { const next = (l || []).map((r) => (r.id === id ? { ...r, status: action } : r)); cache.set("redemptions", next); return next; });
  };
  return { list, error, load, act };
}

function Actions({ r, act }: { r: Redemption; act: ReturnType<typeof useRedemptions>["act"] }) {
  const [busy, setBusy] = React.useState(false);
  const [armed, setArmed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  const run = async (action: "applied" | "cancelled") => {
    setBusy(true); setError(null);
    try { await act(r.id, action); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't update."); } finally { setBusy(false); setArmed(false); }
  };
  return (
    <div>
      <div className="flex gap-2">
        <Btn size="sm" variant="primary" disabled={busy} onClick={() => run("applied")}>{busy ? "Saving…" : "Used today"}</Btn>
        <Btn size="sm" variant="ghost" disabled={busy} onClick={() => (armed ? run("cancelled") : setArmed(true))}>
          {armed ? `Tap again · return ${r.cost} pts` : "Cancel"}
        </Btn>
      </div>
      {error && <div className="mt-2"><ErrorNote>{error}</ErrorNote></div>}
    </div>
  );
}

export function RewardsToHonour() {
  const { list, error, act } = useRedemptions();
  const [showHistory, setShowHistory] = React.useState(false);
  const waiting = (list || []).filter((r) => r.status === "requested");
  const done = (list || []).filter((r) => r.status !== "requested");
  if (!list && !error) return null;
  return (
    <section aria-labelledby="rw-h" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="rw-h" className="font-display text-[1.35rem] text-ora-deep">Rewards to honour</h2>
        {done.length > 0 && (
          <button type="button" onClick={() => setShowHistory((v) => !v)} className="focus-ring rounded font-sans text-[0.8125rem] text-ora-fog underline-offset-4 hover:underline">
            {showHistory ? "Hide history" : `History (${done.length})`}
          </button>
        )}
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      {list && waiting.length === 0 && (
        <p className="font-sans text-[0.875rem] text-ora-fog">No app rewards waiting. When a client redeems points in the ORÁ app, it shows here.</p>
      )}
      {waiting.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {waiting.map((r) => (
            <Card key={r.id} className="space-y-3 border-ora-bronze/30 p-5">
              <div>
                <p className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-bronze">Redeemed {when(r.created_at)} · {r.cost} pts</p>
                <p className="mt-1 font-display text-[1.2rem] leading-tight text-ora-deep">{r.reward.name}</p>
                <p className="mt-0.5 font-sans text-[0.8125rem] text-ora-fog">{r.customer.name || "App customer"}{value(r)}</p>
                <p className="font-sans text-[0.78rem] text-ora-fog">{[r.customer.phone, r.customer.email].filter(Boolean).join(" · ")}</p>
              </div>
              <Actions r={r} act={act} />
            </Card>
          ))}
        </div>
      )}
      {showHistory && done.length > 0 && (
        <ul className="divide-y divide-ora-taupe/10 overflow-hidden rounded-2xl border border-white/70 bg-white/70">
          {done.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 font-sans text-[0.8125rem]">
              <span className="w-14 shrink-0 tabular-nums text-ora-fog">{when(r.created_at)}</span>
              <span className="min-w-0 flex-1 truncate text-ora-deep">{r.reward.name} · {r.customer.name || "App customer"}</span>
              <span className={cn("shrink-0", r.status === "applied" ? "text-ora-sage" : "text-ora-fog")}>{r.status === "applied" ? "Used" : "Cancelled, points back"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** On an appointment: this client has an app reward waiting to be used. */
export function ApptReward({ a }: { a: Appt }) {
  const { list, act } = useRedemptions();
  const mine = (list || []).filter((r) => r.status === "requested" && a.contactId && r.customer.ghl_contact_id === a.contactId);
  if (!mine.length) return null;
  return (
    <section className="space-y-3 rounded-2xl border border-ora-bronze/25 bg-ora-bronze/[0.06] px-5 py-4" data-testid="appt-reward">
      <p className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-bronze">App reward to use</p>
      {mine.map((r) => (
        <div key={r.id} className="space-y-2">
          <p className="font-sans text-[0.9375rem] text-ora-deep"><b className="font-medium">{r.reward.name}</b><span className="text-ora-fog"> · redeemed {when(r.created_at)} for {r.cost} points{value(r)}</span></p>
          <Actions r={r} act={act} />
        </div>
      ))}
    </section>
  );
}
