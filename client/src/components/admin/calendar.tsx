/**
 * ORÁ Floor — calendar views.
 *   DayTimeline : one column per practitioner, bronze "now" line, in-chair bookings fill
 *                 with bronze as the treatment progresses, off-rota time hatched.
 *   WeekView / MonthView : compact overviews; tap a day to open it.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type Appt, type Block, type Staff, type RotaRow, time, londonMinutes, openHours, weekday, phase, firstName, durLabel,
  weekDays, monthGrid, dayNum, sameMonth, todayISO, fmtDate, svcLabel,
} from "./lib";

const PX = 1.6; // px per minute → 96px per hour
const HATCH = "repeating-linear-gradient(135deg, rgb(var(--ora-bronze-rgb) / 0.06) 0 6px, transparent 6px 12px)";

/** Side-by-side lanes for overlapping bookings in one column. */
function layout(list: Appt[]) {
  const sorted = [...list].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  const out: { a: Appt; lane: number; lanes: number }[] = [];
  let group: { a: Appt; lane: number }[] = [];
  let groupEnd = -Infinity;
  const flush = () => { const n = Math.max(1, ...group.map((g) => g.lane + 1)); group.forEach((g) => out.push({ ...g, lanes: n })); group = []; };
  for (const a of sorted) {
    const s = Date.parse(a.startTime), e = Date.parse(a.endTime);
    if (s >= groupEnd && group.length) flush();
    const laneEnds: number[] = [];
    group.forEach((g) => { laneEnds[g.lane] = Math.max(laneEnds[g.lane] ?? -Infinity, Date.parse(g.a.endTime)); });
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) lane = laneEnds.length;
    group.push({ a, lane });
    groupEnd = Math.max(groupEnd, e);
  }
  if (group.length) flush();
  return out;
}

export function DayTimeline({ date, appts, blocks = [], columns, team, rota, now, onOpen }: {
  date: string; appts: Appt[]; blocks?: Block[]; columns: string[]; team: Staff[]; rota: RotaRow[]; now: number; onOpen: (a: Appt) => void;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const { open, close } = openHours(date);
  const starts = appts.map((a) => londonMinutes(a.startTime));
  const ends = appts.map((a) => londonMinutes(a.endTime));
  const from = Math.floor(Math.min(open, ...starts) / 60) * 60;
  const to = Math.ceil(Math.max(close, ...ends) / 60) * 60;
  const hours = Array.from({ length: (to - from) / 60 + 1 }, (_, i) => from + i * 60);
  const isToday = date === todayISO();
  const nowMin = londonMinutes(now);
  const showNow = isToday && nowMin >= from && nowMin <= to;
  const wd = weekday(date);
  const uidByName = React.useMemo(() => Object.fromEntries(team.map((t) => [t.name, t.userId])), [team]);

  // land the now-line a third of the way down on open
  React.useEffect(() => {
    const el = scroller.current;
    if (el && showNow) el.scrollTop = Math.max(0, (nowMin - from) * PX - el.clientHeight / 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const cols = columns.length ? columns : ["—"];
  const grid = { gridTemplateColumns: `3.5rem repeat(${cols.length}, minmax(${cols.length > 3 ? 150 : 220}px, 1fr))` };

  return (
    <div ref={scroller} className="relative max-h-[calc(100vh-15rem)] min-h-[420px] overflow-auto rounded-2xl border border-white/70 bg-white/55 shadow-[0_18px_40px_-28px_rgba(26,16,8,0.35)]">
      {/* sticky practitioner header */}
      <div className="sticky top-0 z-20 grid border-b border-ora-taupe/15 bg-ora-milk/95 backdrop-blur" style={grid}>
        <div className="sticky left-0 z-10 bg-ora-milk/95" />
        {cols.map((name) => {
          const n = appts.filter((a) => a.practitioner === name).length;
          return (
            <div key={name} className="flex items-baseline justify-between gap-2 border-l border-ora-taupe/10 px-3 py-3">
              <span className="truncate font-display text-[1rem] text-ora-deep">{firstName(name)}</span>
              <span className="shrink-0 font-sans text-[0.75rem] tabular-nums text-ora-fog">{n || "—"}</span>
            </div>
          );
        })}
      </div>

      <div className="relative grid" style={{ ...grid, height: (to - from) * PX }}>
        {/* hour gutter — sticks left when the columns scroll sideways */}
        <div className="sticky left-0 z-[5] bg-ora-milk/90">
          {hours.map((h) => (
            <span key={h} className="absolute right-2 -translate-y-1/2 font-sans text-[0.6875rem] tabular-nums text-ora-fog" style={{ top: (h - from) * PX }}>
              {h === from ? "" : `${String(Math.floor(h / 60)).padStart(2, "0")}:00`}
            </span>
          ))}
        </div>

        {cols.map((name) => {
          const uid = uidByName[name];
          const shift = rota.find((r) => r.practitioner_user_id === uid && r.weekday === wd);
          const rotaSet = rota.some((r) => r.practitioner_user_id === uid);
          const off = rotaSet && (!shift || shift.start_min == null);
          return (
            <div key={name} className="relative border-l border-ora-taupe/10" style={off ? { backgroundImage: HATCH } : undefined}>
              {/* hour + half-hour rules */}
              {hours.map((h) => <div key={h} className="absolute inset-x-0 border-t border-ora-taupe/10" style={{ top: (h - from) * PX }} />)}
              {hours.slice(0, -1).map((h) => <div key={`h${h}`} className="absolute inset-x-0 border-t border-dashed border-ora-taupe/[0.07]" style={{ top: (h + 30 - from) * PX }} />)}
              {/* outside rota hours */}
              {shift && shift.start_min != null && shift.end_min != null && (<>
                <div aria-hidden className="absolute inset-x-0 top-0" style={{ height: Math.max(0, (shift.start_min - from) * PX), backgroundImage: HATCH }} />
                <div aria-hidden className="absolute inset-x-0 bottom-0" style={{ top: Math.max(0, (shift.end_min - from) * PX), backgroundImage: HATCH }} />
              </>)}
              {off && <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/80 px-2.5 py-1 font-sans text-[0.6875rem] text-ora-fog">Off today</span>}

              {/* blocked time — not bookable (their own Google calendar, meetings…) */}
              {blocks.filter((b) => b.practitioner === name).map((b) => {
                const top = Math.max(0, (londonMinutes(b.startTime) - from) * PX);
                const bottom = Math.min((to - from) * PX, (londonMinutes(b.endTime) - from) * PX);
                if (bottom <= top) return null;
                return (
                  <div key={b.id} role="note" aria-label={`${b.title}, ${time(b.startTime)} to ${time(b.endTime)}, not bookable`}
                    className="absolute inset-x-1 overflow-hidden rounded-xl border border-dashed border-ora-taupe/35 bg-ora-greige/50 px-2.5 py-1.5"
                    style={{ top: top + 1.5, height: bottom - top - 3, backgroundImage: HATCH }}>
                    <span className="block font-sans text-[0.6875rem] tabular-nums text-ora-fog">{time(b.startTime)} – {time(b.endTime)}</span>
                    <span className="block truncate font-sans text-[0.78rem] font-medium text-ora-fog">{b.title}</span>
                  </div>
                );
              })}

              {layout(appts.filter((a) => a.practitioner === name)).map(({ a, lane, lanes }) => {
                const top = (londonMinutes(a.startTime) - from) * PX;
                const mins = Math.max(15, londonMinutes(a.endTime) - londonMinutes(a.startTime));
                const h = mins * PX - 3;
                const p = phase(a, now);
                const arrived = a.status === "showed" && p.kind !== "done";
                const compact = h < 46;
                return (
                  <button key={a.id} onClick={() => onOpen(a)} data-testid={`block-${a.id}`}
                    aria-label={`${time(a.startTime)} ${a.client}${svcLabel(a.service) ? `, ${a.service}` : ""}, with ${name}`}
                    className={cn(
                      "focus-ring group absolute overflow-hidden rounded-xl border px-2.5 text-left transition-[box-shadow,transform] duration-200 hover:z-10 hover:-translate-y-px hover:shadow-luxury",
                      compact ? "flex items-center gap-2 py-0" : "flex flex-col justify-start py-2",
                      arrived && "border-ora-arrived bg-ora-arrived text-white shadow-glow-bronze",
                      !arrived && p.kind === "now" && "border-ora-bronze/50 bg-white shadow-glow-bronze",
                      !arrived && p.kind === "upcoming" && "border-ora-taupe/20 bg-white/95",
                      p.kind === "done" && "border-ora-taupe/10 bg-ora-greige/40",
                      p.kind === "void" && "border-dashed border-ora-fog/40 bg-transparent opacity-60",
                    )}
                    style={{ top: top + 1.5, height: h, left: `calc(${(lane / lanes) * 100}% + 4px)`, width: `calc(${100 / lanes}% - 8px)` }}>
                    {/* bronze progress fill for the treatment in the chair */}
                    {p.kind === "now" && <span aria-hidden className={cn("absolute inset-x-0 top-0 transition-[height] duration-1000", arrived ? "bg-black/15" : "bg-ora-bronze/15")} style={{ height: `${p.progress * 100}%` }} />}
                    <span aria-hidden className={cn("absolute inset-y-2 left-0 w-[3px] rounded-r-full", arrived ? "bg-white/70" : p.kind === "done" || p.kind === "void" ? "bg-ora-fog/30" : "bg-ora-bronze")} />
                    <span className="relative block min-w-0">
                      <span className={cn("block font-sans text-[0.6875rem] tabular-nums", arrived ? "text-white/85" : p.kind === "now" ? "text-ora-bronze" : "text-ora-fog")}>
                        {time(a.startTime)}{!compact && ` – ${time(a.endTime)}`}{p.kind === "now" ? ` · ${durLabel(p.minsLeft)} left` : arrived ? " · arrived" : ""}
                      </span>
                      <span className={cn("block truncate font-sans text-[0.8125rem] font-medium", arrived ? "text-white" : "text-ora-deep", p.kind === "void" && "line-through")}>{a.client}</span>
                      {!compact && h > 62 && svcLabel(a.service) && <span className={cn("block truncate font-sans text-[0.75rem]", arrived ? "text-white/80" : "text-ora-fog")}>{svcLabel(a.service)}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}

        {showNow && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10" style={{ top: (nowMin - from) * PX }}>
            <div className="absolute left-0 w-14 -translate-y-1/2 pr-2 text-right font-sans text-[0.6875rem] font-semibold tabular-nums text-ora-bronze">{time(now)}</div>
            <div className="absolute left-14 right-0 h-[1.5px] -translate-y-1/2 bg-ora-bronze" />
            <div className="absolute left-14 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ora-bronze shadow-glow-bronze" />
          </div>
        )}
      </div>
    </div>
  );
}

export function WeekView({ anchor, byDay, onOpen, onDay }: { anchor: string; byDay: (d: string) => Appt[]; onOpen: (a: Appt) => void; onDay: (d: string) => void }) {
  const today = todayISO();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {weekDays(anchor).map((d) => {
        const list = byDay(d);
        return (
          <div key={d} className={cn("flex min-h-[220px] flex-col rounded-2xl border bg-white/55 p-2", d === today ? "border-ora-bronze/40" : "border-white/70")}>
            <button onClick={() => onDay(d)} className="focus-ring mb-2 rounded-lg px-1 py-1.5 text-left hover:bg-ora-greige/40">
              <span className="block font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-ora-fog">{fmtDate(d, { weekday: "short" })}</span>
              <span className={cn("block font-display text-[1.35rem] leading-none tabular-nums", d === today ? "text-ora-bronze" : "text-ora-deep")}>{dayNum(d)}</span>
            </button>
            <div className="flex-1 space-y-1.5">
              {list.map((a) => (
                <button key={a.id} onClick={() => onOpen(a)} className="focus-ring block w-full rounded-lg border border-ora-taupe/15 bg-white/90 px-2 py-1.5 text-left transition hover:border-ora-bronze/50">
                  <span className="block font-sans text-[0.6875rem] tabular-nums text-ora-fog">{time(a.startTime)} · {firstName(a.practitioner)}</span>
                  <span className="block truncate font-sans text-[0.8125rem] font-medium text-ora-deep">{a.client}</span>
                </button>
              ))}
              {list.length === 0 && <p className="pt-6 text-center font-sans text-[0.75rem] text-ora-fog/60">—</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MonthView({ anchor, byDay, onDay }: { anchor: string; byDay: (d: string) => Appt[]; onDay: (d: string) => void }) {
  const today = todayISO();
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-ora-fog">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {monthGrid(anchor).map((d) => {
          const list = byDay(d);
          const inMonth = sameMonth(d, anchor);
          return (
            <button key={d} onClick={() => onDay(d)}
              className={cn("focus-ring flex min-h-[96px] flex-col rounded-xl border p-2 text-left transition hover:border-ora-bronze/50",
                inMonth ? "border-white/70 bg-white/60" : "border-transparent bg-white/20 text-ora-fog/50", d === today && "border-ora-bronze/50 ring-1 ring-ora-bronze/30")}>
              <span className={cn("font-sans text-[0.8125rem] tabular-nums", d === today && "font-semibold text-ora-bronze")}>{dayNum(d)}</span>
              {list.length > 0 && (
                <span className="mt-auto flex items-center gap-1.5">
                  <span className="flex -space-x-0.5">{list.slice(0, 5).map((a) => <span key={a.id} className="h-1.5 w-1.5 rounded-full bg-ora-bronze ring-1 ring-white" />)}</span>
                  <span className="font-sans text-[0.6875rem] tabular-nums text-ora-fog">{list.length}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
