/** ORÁ Floor — "Today at a glance": headline numbers, now & next, and the team. */
import * as React from "react";
import { cn } from "@/lib/utils";
import { type Appt, type Block, type RotaRow, useAdmin, phase, time, firstName, durLabel, money, weekday, todayISO, svcLabel } from "./lib";
import { Card, Empty, Stat, StatusPill } from "./ui";
import { WeekSales } from "./week-sales";
import { BusyTimes } from "./busy-times";
import { useBundleList } from "./bundles";

export function TodayOverview({ appts, blocks = [], rota, now, onOpen, onWalkin }: { appts: Appt[]; blocks?: Block[]; rota: RotaRow[]; now: number; onOpen: (a: Appt) => void; onWalkin: () => void }) {
  const { team, svcByName } = useAdmin();
  const live = appts.filter((a) => phase(a, now).kind !== "void");
  const inChair = live.filter((a) => phase(a, now).kind === "now");
  const upcoming = live.filter((a) => phase(a, now).kind === "upcoming");
  const done = live.filter((a) => phase(a, now).kind === "done");
  const next = upcoming[0];
  // Bundles change what's taken: a visit on a bundle is £0, except the visit a bundle is
  // paid at the desk (the bundle price). Bought online = already paid by card.
  const { list: bundles } = useBundleList();
  const bundleCharge = new Map<string, number>();
  for (const b of (bundles || []).filter((x) => !x.voided_at)) {
    b.uses.forEach((u, i) => u.appointment_id && bundleCharge.set(u.appointment_id, i === 0 && b.source === "desk" ? b.price : 0));
    if (!b.paid_at && b.first_appointment_id) bundleCharge.set(b.first_appointment_id, b.price);
  }
  const toCharge = live.reduce((s, a) => s + (bundleCharge.get(a.id) ?? svcByName[a.service]?.price ?? 0), 0);
  const unpriced = live.filter((a) => !bundleCharge.has(a.id) && svcByName[a.service]?.price == null).length;
  const wd = weekday(todayISO());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Appointments" value={live.length} sub={done.length ? `${done.length} finished` : "none finished yet"} />
        <Stat label="In the chair" value={inChair.length} tone="sage" sub={inChair.length ? inChair.map((a) => firstName(a.client)).join(", ") : "nobody right now"} />
        <Stat label="Next up" value={next ? time(next.startTime) : "—"} tone="bronze" sub={next ? `${next.client} · ${firstName(next.practitioner)}` : "nothing else booked"} />
        <Stat label="To charge today" value={toCharge ? money(toCharge) : "£0"} sub={unpriced ? `+ ${unpriced} booking${unpriced > 1 ? "s" : ""} without a listed price` : "at listed prices"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="nn-h" className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="nn-h" className="font-display text-[1.25rem] text-ora-deep">Now &amp; next</h2>
            <span className="font-sans text-[0.8125rem] text-ora-fog">{upcoming.length} still to come</span>
          </div>
          {inChair.length + upcoming.length === 0 ? (
            <Empty title={live.length ? "That's everyone for today." : "Nothing booked today."} line="Walk-ins can be added at any time." action={<button onClick={onWalkin} className="focus-ring font-sans text-[0.875rem] text-ora-bronze underline-offset-4 hover:underline">Add a walk-in →</button>} />
          ) : (
            <ul className="space-y-2">
              {[...inChair, ...upcoming].map((a) => <NowRow key={a.id} a={a} now={now} onOpen={onOpen} price={svcByName[a.service]?.price} />)}
            </ul>
          )}
          {done.length > 0 && (
            <details className="group mt-4">
              <summary className="focus-ring cursor-pointer list-none rounded-lg py-1 font-sans text-[0.8125rem] text-ora-fog hover:text-ora-deep">Finished today ({done.length}) <span className="inline-block transition group-open:rotate-90">›</span></summary>
              <ul className="mt-2 space-y-1.5">{done.map((a) => <NowRow key={a.id} a={a} now={now} onOpen={onOpen} price={svcByName[a.service]?.price} muted />)}</ul>
            </details>
          )}
        </section>

        <section aria-labelledby="team-h" className="min-w-0 space-y-6">
          <WeekSales />
          <BusyTimes />
          <div>
          <h2 id="team-h" className="mb-3 font-display text-[1.25rem] text-ora-deep">Team today</h2>
          <Card className="divide-y divide-ora-taupe/10">
            {team.map((s) => {
              const mine = live.filter((a) => a.practitioner === s.name);
              const cur = mine.find((a) => phase(a, now).kind === "now");
              const nxt = mine.find((a) => phase(a, now).kind === "upcoming");
              const shift = rota.find((r) => r.practitioner_user_id === s.userId && r.weekday === wd);
              const off = rota.some((r) => r.practitioner_user_id === s.userId) && (!shift || shift.start_min == null);
              const busy = blocks.find((b) => b.practitioner === s.name && Date.parse(b.startTime) <= now && now < Date.parse(b.endTime));
              const state = cur ? { dot: "bg-ora-sage", text: `With ${firstName(cur.client)} · ${durLabel(phase(cur, now).minsLeft)} left` }
                : busy ? { dot: "bg-ora-taupe", text: `${busy.title} until ${time(busy.endTime)}` }
                : nxt ? { dot: "bg-ora-bronze", text: `Free · next at ${time(nxt.startTime)}` }
                : off ? { dot: "bg-ora-fog/30", text: "Off today" }
                : { dot: "bg-ora-fog/50", text: mine.length ? "Done for the day" : "No bookings" };
              return (
                <div key={s.userId} className="flex items-center gap-3 px-4 py-3">
                  <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", state.dot, cur && "animate-bronze-pulse")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-[0.9rem] font-medium text-ora-deep">{s.name}</p>
                    <p className="truncate font-sans text-[0.78rem] text-ora-fog">{state.text}</p>
                  </div>
                  <span className="shrink-0 font-sans text-[0.8125rem] tabular-nums text-ora-fog">{mine.length || ""}</span>
                </div>
              );
            })}
          </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

function NowRow({ a, now, onOpen, price, muted }: { a: Appt; now: number; onOpen: (a: Appt) => void; price?: number; muted?: boolean }) {
  const p = phase(a, now);
  const arrived = a.status === "showed" && p.kind !== "done";
  return (
    <li>
      <button onClick={() => onOpen(a)}
        className={cn("focus-ring relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition hover:shadow-luxury",
          arrived ? "border-ora-arrived bg-ora-arrived text-white shadow-glow-bronze [&_*]:!text-white"
            : p.kind === "now" ? "border-ora-bronze/40 bg-white shadow-glow-bronze hover:border-ora-bronze/40" : "border-white/70 bg-white/65 hover:border-ora-bronze/40", muted && "opacity-60")}>
        {p.kind === "now" && <span aria-hidden className={cn("absolute inset-y-0 left-0 transition-[width] duration-1000", arrived ? "bg-black/15" : "bg-ora-bronze/10")} style={{ width: `${p.progress * 100}%` }} />}
        <span className="relative w-14 shrink-0">
          <span className="block font-display text-[1.15rem] leading-none tabular-nums text-ora-deep">{time(a.startTime)}</span>
          <span className="mt-1 block font-sans text-[0.6875rem] tabular-nums text-ora-fog">{time(a.endTime)}</span>
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block truncate font-sans text-[0.9375rem] font-medium text-ora-deep">{a.client}</span>
          <span className="block truncate font-sans text-[0.8125rem] text-ora-fog">{[svcLabel(a.service), firstName(a.practitioner)].filter(Boolean).join(" · ")}</span>
        </span>
        <span className="relative hidden shrink-0 text-right sm:block">
          {p.kind === "now"
            ? <span className="font-sans text-[0.8125rem] font-medium tabular-nums text-ora-bronze">{durLabel(p.minsLeft)} left</span>
            : p.kind === "upcoming" ? <span className="font-sans text-[0.8125rem] tabular-nums text-ora-fog">in {durLabel(Math.max(0, p.minsLeft))}</span>
            : <StatusPill status={a.status} />}
          {price != null && <span className="block font-sans text-[0.75rem] tabular-nums text-ora-fog">{money(price)}</span>}
        </span>
      </button>
    </li>
  );
}
