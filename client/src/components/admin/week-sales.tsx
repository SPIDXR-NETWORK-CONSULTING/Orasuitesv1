/**
 * ORÁ Floor — "Sales this week / last week": one small bar per day (Mon–Sun).
 * Sales = listed price of every booking that wasn't cancelled or a no-show.
 * Single series → no legend; the title names it. Busiest day is labelled; every
 * bar has a hover/focus tooltip; a hidden table carries the same numbers.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { type Appt, useAdmin, cache, todayISO, startOfWeek, shift, weekDays, londonDate, fmtDate, money } from "./lib";
import { Card, Segmented } from "./ui";

type Week = "this" | "last";

export function WeekSales() {
  const { call, svcByName } = useAdmin();
  const [week, setWeek] = React.useState<Week>("this");
  const today = todayISO();
  const monday = week === "this" ? startOfWeek(today) : shift(startOfWeek(today), -7);
  const days = weekDays(monday);
  const key = `range:${days[0]}:${days[6]}`;
  const [appts, setAppts] = React.useState<Appt[] | null>(() => cache.get<Appt[]>(key));
  const [hover, setHover] = React.useState<number | null>(null);

  React.useEffect(() => {
    setAppts(cache.get<Appt[]>(key));
    let live = true;
    call<{ appointments: Appt[] }>(`range?start=${days[0]}&end=${days[6]}`)
      .then((j) => { if (live) { setAppts(j.appointments || []); cache.set(key, j.appointments || []); } })
      .catch(() => { if (live) setAppts((a) => a ?? []); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, call]);

  const rows = days.map((d) => {
    const list = (appts || []).filter((a) => londonDate(a.startTime) === d && a.status !== "cancelled" && a.status !== "noshow");
    const priced = list.filter((a) => svcByName[a.service]?.price != null);
    return { d, total: priced.reduce((s, a) => s + (svcByName[a.service]?.price || 0), 0), count: list.length, unpriced: list.length - priced.length, future: d > today };
  });
  const max = Math.max(1, ...rows.map((r) => r.total));
  const total = rows.reduce((s, r) => s + r.total, 0);
  const busiest = rows.reduce((b, r, i) => (r.total > (rows[b]?.total ?? 0) ? i : b), 0);
  const unpriced = rows.reduce((s, r) => s + (r.future ? 0 : r.unpriced), 0);
  const H = 112; // plot height px

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ora-fog">Sales {week === "this" ? "this week" : "last week"}</p>
          <p className="mt-1 font-display text-[1.6rem] leading-none tabular-nums text-ora-deep">{appts ? money(total) : "—"}</p>
        </div>
        <Segmented label="Which week" value={week} onChange={(v) => { setWeek(v); setHover(null); }} options={[{ value: "this", label: "This" }, { value: "last", label: "Last" }]} />
      </div>

      {/* plot */}
      <div className="relative mt-5" style={{ height: H + 22 }} onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-x-0 border-t border-ora-taupe/25" style={{ top: H }} aria-hidden />
        <div className="absolute inset-0 grid grid-cols-7 gap-[2px]">
          {rows.map((r, i) => {
            const h = r.total ? Math.max(4, (r.total / max) * (H - 18)) : 0;
            const isToday = r.d === today;
            return (
              <button key={r.d} type="button" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                aria-label={`${fmtDate(r.d, { weekday: "long", day: "numeric", month: "short" })}: ${money(r.total)} from ${r.count} booking${r.count === 1 ? "" : "s"}`}
                className="focus-ring group relative flex flex-col items-center rounded-md outline-none">
                <div className="relative w-full" style={{ height: H }}>
                  {i === busiest && r.total > 0 && hover === null && (
                    <span className="absolute inset-x-0 text-center font-sans text-[0.6875rem] font-medium tabular-nums text-ora-deep" style={{ bottom: h + 4 }}>{money(r.total)}</span>
                  )}
                  {r.future
                    ? <span aria-hidden className="absolute bottom-0 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-ora-taupe/25" />
                    : <span aria-hidden className={cn("absolute bottom-0 left-1/2 w-[62%] max-w-[26px] -translate-x-1/2 rounded-t-[4px] bg-ora-bronze-deep transition-[height,opacity] duration-500", hover !== null && hover !== i && "opacity-45")} style={{ height: h }} />}
                </div>
                <span className={cn("mt-1.5 font-sans text-[0.6875rem] tabular-nums", isToday ? "font-semibold text-ora-deep" : "text-ora-fog")}>
                  {fmtDate(r.d, { weekday: "short" }).slice(0, 2)}
                </span>
              </button>
            );
          })}
        </div>
        {hover !== null && (
          <div role="status" className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ora-deep px-2.5 py-1.5 font-sans text-[0.75rem] text-ora-cream shadow-luxury"
            style={{ left: `${((hover + 0.5) / 7) * 100}%` }}>
            <span className="font-medium">{fmtDate(rows[hover].d, { weekday: "short", day: "numeric", month: "short" })}</span>
            {" · "}{rows[hover].future ? "not yet" : `${money(rows[hover].total)} · ${rows[hover].count} booking${rows[hover].count === 1 ? "" : "s"}`}
          </div>
        )}
      </div>

      <p className="mt-2 font-sans text-[0.72rem] text-ora-fog">
        {rows[busiest].total > 0 ? `Busiest: ${fmtDate(rows[busiest].d, { weekday: "long" })}` : "No sales yet"}
        {unpriced > 0 && ` · ${unpriced} without a listed price`}
      </p>

      {/* tables won't shrink to sr-only's 1px, so hide a wrapper instead of the table */}
      <div className="sr-only"><table>
        <caption>Sales per day, {week === "this" ? "this week" : "last week"} (listed prices, excluding cancelled and no-shows)</caption>
        <thead><tr><th>Day</th><th>Sales</th><th>Bookings</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.d}><td>{fmtDate(r.d, { weekday: "long", day: "numeric", month: "short" })}</td><td>{money(r.total)}</td><td>{r.count}</td></tr>)}</tbody>
      </table></div>
    </Card>
  );
}
