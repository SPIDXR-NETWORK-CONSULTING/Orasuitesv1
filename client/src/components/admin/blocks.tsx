/**
 * ORÁ Floor — blocked time (lunch, training, day off…). Not bookable online, shown on the
 * calendar, and sent to the practitioner's own Google Calendar. Blocks that come FROM a
 * practitioner's Google Calendar ("Busy") are changed there, not here.
 */
import * as React from "react";
import { type Block, useAdmin, time, todayISO, openHours, londonIso, londonDate, prettyDate } from "./lib";
import { Btn, Drawer, ErrorNote, Field, Input, Select } from "./ui";
import { cn } from "@/lib/utils";

const REASONS = ["Lunch", "Break", "Training", "Day off", "Other"];
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function BlockDrawer({ open, day, block, onClose, onSaved }: { open: boolean; day?: string; block: Block | null; onClose: () => void; onSaved: () => void }) {
  return (
    <Drawer open={open || !!block} onClose={onClose} title={block ? block.title : "Block time"} subtitle={block ? `${block.practitioner} · ${prettyDate(londonDate(block.startTime))}, ${time(block.startTime)} – ${time(block.endTime)}` : "Lunch, training or a day off. Not bookable, and it goes on their Google Calendar."}>
      {block ? <RemoveBlock block={block} onDone={onSaved} /> : open && <NewBlock day={day || todayISO()} onDone={onSaved} />}
    </Drawer>
  );
}

function NewBlock({ day: startDay, onDone }: { day: string; onDone: () => void }) {
  const { call, team } = useAdmin();
  const [who, setWho] = React.useState(team[0]?.userId || "");
  const [day, setDay] = React.useState(startDay < todayISO() ? todayISO() : startDay);
  const [reason, setReason] = React.useState("Lunch");
  const [other, setOther] = React.useState("");
  const [from, setFrom] = React.useState("13:00");
  const [to, setTo] = React.useState("14:00");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const wholeDay = reason === "Day off";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { open, close } = openHours(day);
    const s = wholeDay ? open : toMin(from), en = wholeDay ? close : toMin(to);
    if (!(en > s)) { setError("The end must be after the start."); return; }
    setBusy(true); setError(null);
    try {
      await call("block", { method: "POST", body: JSON.stringify({ userId: who, startTime: londonIso(day, s), endTime: londonIso(day, en), reason: reason === "Other" ? other.trim() || "Blocked" : reason }) });
      onDone();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't block that time."); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Practitioner"><Select value={who} onChange={(e) => setWho(e.target.value)}>{team.map((t) => <option key={t.userId} value={t.userId}>{t.name}</option>)}</Select></Field>
      <div>
        <p className="mb-2 font-sans text-[0.75rem] font-medium text-ora-fog">Reason</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Reason">
          {REASONS.map((r) => (
            <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)}
              className={cn("focus-ring h-10 rounded-xl border px-3.5 font-sans text-[0.8125rem] transition", reason === r ? "border-ora-deep bg-ora-deep text-ora-cream" : "border-ora-taupe/35 bg-white text-ora-deep hover:border-ora-bronze")}>{r}</button>
          ))}
        </div>
        {reason === "Other" && <Input className="mt-2" value={other} onChange={(e) => setOther(e.target.value)} placeholder="e.g. Doctor's appointment" maxLength={60} aria-label="Reason" />}
      </div>
      <Field label="Day"><Input type="date" value={day} min={todayISO()} onChange={(e) => setDay(e.target.value)} required /></Field>
      {wholeDay ? (
        <p className="font-sans text-[0.8125rem] text-ora-fog">Blocks the whole opening day ({hhmm(openHours(day).open)}–{hhmm(openHours(day).close)}).</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="From"><Input type="time" step={300} value={from} onChange={(e) => setFrom(e.target.value)} required /></Field>
          <Field label="To"><Input type="time" step={300} value={to} onChange={(e) => setTo(e.target.value)} required /></Field>
        </div>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
      <Btn variant="dark" disabled={busy || !who} className="w-full">{busy ? "Blocking…" : "Block time"}</Btn>
    </form>
  );
}

function RemoveBlock({ block, onDone }: { block: Block; onDone: () => void }) {
  const { call } = useAdmin();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  if (block.title === "Busy") return <p className="font-sans text-[0.875rem] text-ora-fog">This comes from {block.practitioner.split(" ")[0]}'s own Google Calendar, so it's changed there. It updates here within 5 minutes.</p>;
  return (
    <div className="space-y-3">
      <p className="font-sans text-[0.875rem] text-ora-fog">Remove this blocked time? The slot becomes bookable again and it's taken off their Google Calendar.</p>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Btn variant="dark" className="w-full" disabled={busy} onClick={async () => {
        setBusy(true); setError(null);
        try { await call("unblock", { method: "POST", body: JSON.stringify({ id: block.id }) }); onDone(); }
        catch (e) { setError(e instanceof Error ? e.message : "Couldn't remove it."); } finally { setBusy(false); }
      }}>{busy ? "Removing…" : "Remove blocked time"}</Btn>
    </div>
  );
}
