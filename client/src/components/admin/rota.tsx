/**
 * ORÁ Floor — weekly rota = the source of truth for working hours. Tap an off day to add that
 * day's opening hours; edit or clear. Each save updates the person's GHL availability, so online
 * booking and round-robin only ever offer people who are on the rota.
 */
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type RotaRow, type Staff, useAdmin } from "./lib";
import { Card, ErrorNote } from "./ui";

const DAYS = [1, 2, 3, 4, 5, 6, 0] as const; // Mon → Sun (JS weekday numbers, as stored)
const LABEL: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun" };
const DEFAULT = (wd: number) => ({ start: 600, end: wd === 0 ? 1020 : 1170 }); // opening hours
const toHHMM = (m: number | null) => (m == null ? "" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
const toMin = (t: string) => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + m; };

type Cell = { start: number | null; end: number | null };

export function RotaGrid({ team, rows, onSaved }: { team: Staff[]; rows: RotaRow[]; onSaved: (r: RotaRow) => void }) {
  const { call } = useAdmin();
  const [map, setMap] = React.useState<Record<string, Cell>>(() => Object.fromEntries(rows.map((r) => [`${r.practitioner_user_id}-${r.weekday}`, { start: r.start_min, end: r.end_min }])));
  const [status, setStatus] = React.useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const save = async (p: Staff, wd: number, cell: Cell) => {
    const k = `${p.userId}-${wd}`;
    const prev = map[k];
    if (cell.start != null && cell.end != null && cell.end <= cell.start) { setStatus({ kind: "err", text: `${p.name.split(" ")[0]}'s ${LABEL[wd]} finish time must be after the start.` }); return; }
    setMap((m) => ({ ...m, [k]: cell }));
    try {
      const j = await call<{ ghl: boolean; ghlError: string | null }>("rota-set", { method: "POST", body: JSON.stringify({ practitioner_user_id: p.userId, practitioner_name: p.name, weekday: wd, start_min: cell.start, end_min: cell.end }) });
      onSaved({ practitioner_user_id: p.userId, weekday: wd, start_min: cell.start, end_min: cell.end });
      setStatus(j.ghl
        ? { kind: "ok", text: `Saved · ${p.name.split(" ")[0]}'s online bookings updated` }
        : { kind: "err", text: `Saved on the rota, but online bookings didn't update (${j.ghlError || "GHL unavailable"}). Change it again in a minute.` });
    } catch (e) {
      setMap((m) => ({ ...m, [k]: prev ?? { start: null, end: null } }));
      setStatus({ kind: "err", text: e instanceof Error ? e.message : "Couldn't save — try again." });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-[0.875rem] text-ora-fog">Tap a day to add hours. Saves instantly — online booking only offers people when they're on the rota.</p>
        {status && (status.kind === "ok"
          ? <span role="status" className="font-sans text-[0.8125rem] text-ora-sage">✓ {status.text}</span>
          : null)}
      </div>
      {status?.kind === "err" && <ErrorNote>{status.text}</ErrorNote>}

      <Card className="overflow-x-auto p-2">
        <table className="w-full min-w-[860px] border-separate border-spacing-1.5">
          <thead>
            <tr>
              <th scope="col" className="px-2 text-left font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ora-fog">Team</th>
              {DAYS.map((d) => <th key={d} scope="col" className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ora-fog">{LABEL[d]}</th>)}
              <th scope="col" className="px-2 text-right font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ora-fog">Week</th>
            </tr>
          </thead>
          <tbody>
            {team.map((p) => {
              const total = DAYS.reduce<number>((s, wd) => { const c = map[`${p.userId}-${wd}`]; return s + (c?.start != null && c?.end != null ? c.end - c.start : 0); }, 0);
              return (
                <tr key={p.userId}>
                  <th scope="row" className="whitespace-nowrap px-2 text-left font-sans text-[0.875rem] font-medium text-ora-deep">{p.name}</th>
                  {DAYS.map((wd) => {
                    const c = map[`${p.userId}-${wd}`] || { start: null, end: null };
                    const on = c.start != null;
                    return (
                      <td key={wd} className="align-top">
                        {on ? (
                          <div className="group relative rounded-xl border border-ora-bronze/35 bg-white px-1.5 py-1.5">
                            <input type="time" step={900} aria-label={`${p.name} ${LABEL[wd]} start`} value={toHHMM(c.start)} onChange={(e) => { const s = toMin(e.target.value); if (s != null) save(p, wd, { start: s, end: c.end }); }}
                              className="focus-ring block w-full rounded-md bg-transparent px-1 py-0.5 text-center font-sans text-[0.8125rem] tabular-nums text-ora-deep" />
                            <input type="time" step={900} aria-label={`${p.name} ${LABEL[wd]} finish`} value={toHHMM(c.end)} onChange={(e) => { const en = toMin(e.target.value); if (en != null) save(p, wd, { start: c.start, end: en }); }}
                              className="focus-ring block w-full rounded-md bg-transparent px-1 py-0.5 text-center font-sans text-[0.8125rem] tabular-nums text-ora-fog" />
                            <button onClick={() => save(p, wd, { start: null, end: null })} aria-label={`Clear ${p.name} ${LABEL[wd]}`}
                              className="focus-ring absolute -right-1.5 -top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-ora-deep text-ora-cream shadow group-hover:inline-flex group-focus-within:inline-flex"><X size={12} /></button>
                          </div>
                        ) : (
                          <button onClick={() => { const d = DEFAULT(wd); save(p, wd, d); }} aria-label={`Add ${p.name} on ${LABEL[wd]}`}
                            className={cn("focus-ring flex h-[62px] w-full items-center justify-center rounded-xl border border-dashed border-ora-taupe/30 font-sans text-[0.75rem] text-ora-fog/70 transition hover:border-ora-bronze hover:bg-ora-bronze/[0.04] hover:text-ora-bronze")}>
                            Off
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap px-2 text-right font-sans text-[0.8125rem] tabular-nums text-ora-fog">{total ? `${Math.floor(total / 60)}h${total % 60 ? ` ${total % 60}m` : ""}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
