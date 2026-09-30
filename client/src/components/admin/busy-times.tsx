/**
 * ORÁ Floor — footfall & busy times (Today screen, under Sales).
 *   Footfall  = distinct clients with a booking that day (not cancelled / no-show).
 *   Busyness  = clients in a chair during each opening hour.
 *   "Today vs yesterday": two lines (today bronze solid, yesterday dark dashed + direct labels).
 *   "Typical week": heatmap, weekday × hour, average over the last 4 weeks (one-hue ramp).
 * Every mark has a hover/focus tooltip; hidden tables carry the same numbers.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { type Appt, useAdmin, cache, todayISO, shift, londonDate, londonMinutes, weekday, fmtDate } from "./lib";
import { Card, Segmented } from "./ui";

const HOURS = Array.from({ length: 10 }, (_, i) => 10 + i); // 10:00 … 19:00
const hourLabel = (h: number) => (h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`);
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Mon … Sun
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY_C = "rgb(var(--ora-bronze-deep-rgb))";
const PREV_C = "#3d3228";

export function BusyTimes() {
  const { call } = useAdmin();
  const today = todayISO();
  const start = shift(today, -27);
  const key = `range:${start}:${today}`;
  const [appts, setAppts] = React.useState<Appt[] | null>(() => cache.get<Appt[]>(key));
  const [mode, setMode] = React.useState<"day" | "week">("day");
  React.useEffect(() => {
    let live = true;
    call<{ appointments: Appt[] }>(`range?start=${start}&end=${today}`)
      .then((j) => { if (live) { setAppts(j.appointments || []); cache.set(key, j.appointments || []); } })
      .catch(() => { if (live) setAppts((a) => a ?? []); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, call]);

  const byDay = React.useMemo(() => {
    const m = new Map<string, Appt[]>();
    for (const a of appts || []) {
      if (a.status === "cancelled" || a.status === "noshow") continue;
      const d = londonDate(a.startTime); m.set(d, [...(m.get(d) || []), a]);
    }
    return m;
  }, [appts]);
  const footfall = (d: string) => new Set((byDay.get(d) || []).map((a) => a.contactId || a.client)).size;
  const occ = (d: string, h: number) => (byDay.get(d) || []).filter((a) => londonMinutes(a.startTime) < (h + 1) * 60 && londonMinutes(a.endTime) > h * 60).length;

  const yesterday = shift(today, -1), lastWeek = shift(today, -7);
  const nToday = footfall(today), nY = footfall(yesterday), nW = footfall(lastWeek);
  const delta = (a: number, b: number) => (a === b ? "same" : `${a > b ? "+" : "−"}${Math.abs(a - b)}`);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ora-fog">Footfall today</p>
          <p className="mt-1 font-display text-[1.6rem] leading-none tabular-nums text-ora-deep">{appts ? nToday : "—"} <span className="font-sans text-[0.8125rem] text-ora-fog">clients</span></p>
          {appts && <p className="mt-1.5 font-sans text-[0.75rem] text-ora-fog">{delta(nToday, nY)} vs yesterday · {delta(nToday, nW)} vs last {DAY_SHORT[weekday(today)]}</p>}
        </div>
        <Segmented label="Busy times view" value={mode} onChange={setMode} options={[{ value: "day", label: "Today" }, { value: "week", label: "Usual week" }]} />
      </div>
      {!appts ? <p className="mt-6 font-sans text-[0.8125rem] text-ora-fog">Loading…</p>
        : mode === "day" ? <DayLines today={today} yesterday={yesterday} occ={occ} />
        : <WeekHeat today={today} occ={occ} />}
    </Card>
  );
}

function DayLines({ today, yesterday, occ }: { today: string; yesterday: string; occ: (d: string, h: number) => number }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const nowH = Math.floor(londonMinutes(Date.now()) / 60);
  const t = HOURS.map((h) => (h <= nowH ? occ(today, h) : null));
  const y = HOURS.map((h) => occ(yesterday, h));
  const max = Math.max(2, ...y, ...t.filter((v): v is number => v != null));
  const W = 300, H = 150, L = 20, R = 54, T = 12, B = 22;
  const x = (i: number) => L + (i / (HOURS.length - 1)) * (W - L - R);
  const yy = (v: number) => T + (1 - v / max) * (H - T - B);
  const path = (vals: (number | null)[]) => vals.map((v, i) => (v == null ? "" : `${i && vals[i - 1] != null ? "L" : "M"}${x(i).toFixed(1)},${yy(v).toFixed(1)}`)).join(" ");
  const lastT = t.reduce<number>((k, v, i) => (v != null ? i : k), -1);
  const ticks = Array.from(new Set([0, Math.round(max / 2), max]));
  const busiest = y.indexOf(Math.max(...y));

  return (
    <div className="mt-4">
      <div className="mb-2 flex gap-4 font-sans text-[0.72rem] text-ora-fog" aria-hidden>
        <span className="inline-flex items-center gap-1.5"><span className="h-[2px] w-4 rounded-full" style={{ background: TODAY_C }} />Today</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: PREV_C }} />Yesterday</span>
      </div>
      <div className="relative" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Clients in chairs by hour, today and yesterday">
          {ticks.map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={yy(v)} y2={yy(v)} stroke="rgb(0 0 0 / 0.06)" />
              <text x={L - 6} y={yy(v) + 3} textAnchor="end" className="fill-ora-fog font-sans text-[10px] tabular-nums">{v}</text>
            </g>
          ))}
          {HOURS.map((h, i) => i % 2 === 0 && <text key={h} x={x(i)} y={H - 6} textAnchor="middle" className="fill-ora-fog font-sans text-[10px]">{hourLabel(h)}</text>)}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="rgb(0 0 0 / 0.15)" />}
          <path d={path(y)} fill="none" stroke={PREV_C} strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
          <path d={path(t)} fill="none" stroke={TODAY_C} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {lastT >= 0 && <circle cx={x(lastT)} cy={yy(t[lastT]!)} r={4} fill={TODAY_C} stroke="white" strokeWidth={2} />}
          <text x={W - R + 6} y={yy(y[y.length - 1]) + 3} className="font-sans text-[10px]" fill={PREV_C}>Yesterday</text>
          {lastT >= 0 && <text x={Math.min(x(lastT) + 8, W - R + 6)} y={yy(t[lastT]!) - 7} className="font-sans text-[10px] font-semibold" fill={TODAY_C}>Today</text>}
          {HOURS.map((h, i) => (
            <rect key={h} x={x(i) - (W - L - R) / (HOURS.length - 1) / 2} y={T} width={(W - L - R) / (HOURS.length - 1)} height={H - T - B} fill="transparent"
              tabIndex={0} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} aria-label={`${hourLabel(h)}: today ${t[i] ?? "not yet"}, yesterday ${y[i]}`} />
          ))}
        </svg>
        {hover !== null && (
          <div role="status" className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ora-deep px-2.5 py-1.5 font-sans text-[0.75rem] text-ora-cream shadow-luxury" style={{ left: `${(x(hover) / W) * 100}%` }}>
            <span className="font-medium">{hourLabel(HOURS[hover])}</span> · today {t[hover] ?? "—"} · yesterday {y[hover]}
          </div>
        )}
      </div>
      <p className="mt-1 font-sans text-[0.72rem] text-ora-fog">Clients in chairs each hour.{Math.max(...y) > 0 ? ` Yesterday peaked at ${hourLabel(HOURS[busiest])}.` : ""}</p>
      <div className="sr-only"><table><caption>Clients in chairs by hour</caption><thead><tr><th>Hour</th><th>Today</th><th>Yesterday</th></tr></thead>
        <tbody>{HOURS.map((h, i) => <tr key={h}><td>{hourLabel(h)}</td><td>{t[i] ?? "—"}</td><td>{y[i]}</td></tr>)}</tbody></table></div>
    </div>
  );
}

function WeekHeat({ today, occ }: { today: string; occ: (d: string, h: number) => number }) {
  const [hover, setHover] = React.useState<string | null>(null);
  // average per weekday × hour over the last 28 days (today included only for hours already past)
  const days = Array.from({ length: 28 }, (_, i) => shift(today, -i));
  const nowH = Math.floor(londonMinutes(Date.now()) / 60);
  const grid = WEEK.map((wd) => HOURS.map((h) => {
    const ds = days.filter((d) => weekday(d) === wd && !(d === today && h > nowH));
    return ds.length ? ds.reduce((s, d) => s + occ(d, h), 0) / ds.length : 0;
  }));
  const max = Math.max(0.5, ...grid.flat());
  let best = { v: -1, r: 0, c: 0 };
  grid.forEach((row, r) => row.forEach((v, c) => { if (v > best.v) best = { v, r, c }; }));
  const step = (v: number) => (v <= 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5)));
  const ALPHA = [0, 0.14, 0.3, 0.48, 0.68, 0.9];

  return (
    <div className="mt-4">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `2.2rem repeat(${HOURS.length}, minmax(0, 1fr))` }}>
        <span />
        {HOURS.map((h, i) => <span key={h} className="text-center font-sans text-[10px] text-ora-fog">{i % 2 === 0 ? hourLabel(h) : ""}</span>)}
        {WEEK.map((wd, r) => (
          <React.Fragment key={wd}>
            <span className={cn("self-center font-sans text-[10px]", weekday(today) === wd ? "font-semibold text-ora-deep" : "text-ora-fog")}>{DAY_SHORT[wd]}</span>
            {HOURS.map((h, c) => {
              const v = grid[r][c], k = `${r}-${c}`, isBest = best.v > 0 && best.r === r && best.c === c;
              return (
                <button key={h} type="button" onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(k)} onBlur={() => setHover(null)}
                  aria-label={`${DAY_SHORT[wd]} ${hourLabel(h)}: about ${v.toFixed(1)} clients in chairs`}
                  className={cn("focus-ring relative h-6 rounded-[4px]", isBest && "ring-2 ring-ora-deep ring-offset-1")}
                  style={{ background: v > 0 ? `rgb(var(--ora-bronze-deep-rgb) / ${ALPHA[step(v)]})` : "rgb(0 0 0 / 0.035)" }}>
                  {hover === k && (
                    <span role="status" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ora-deep px-2 py-1 font-sans text-[0.7rem] text-ora-cream shadow-luxury">
                      {DAY_SHORT[wd]} {hourLabel(h)} · ~{v.toFixed(1)} in chairs
                    </span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 font-sans text-[0.72rem] text-ora-fog">
        <span>{best.v > 0 ? `Busiest: ${DAY_SHORT[WEEK[best.r]]} ${hourLabel(HOURS[best.c])} (~${best.v.toFixed(1)} in chairs)` : "Not enough bookings yet"}</span>
        <span className="inline-flex items-center gap-1" aria-hidden>quiet {ALPHA.slice(1).map((a) => <span key={a} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: `rgb(var(--ora-bronze-deep-rgb) / ${a})` }} />)} busy</span>
      </div>
      <p className="mt-1 font-sans text-[0.72rem] text-ora-fog">Average over the last 4 weeks ({fmtDate(shift(today, -27), { day: "numeric", month: "short" })} – today).</p>
      <div className="sr-only"><table><caption>Average clients in chairs, weekday by hour, last 4 weeks</caption>
        <thead><tr><th>Day</th>{HOURS.map((h) => <th key={h}>{hourLabel(h)}</th>)}</tr></thead>
        <tbody>{WEEK.map((wd, r) => <tr key={wd}><td>{DAY_SHORT[wd]}</td>{grid[r].map((v, c) => <td key={c}>{v.toFixed(1)}</td>)}</tr>)}</tbody></table></div>
    </div>
  );
}
