/**
 * ORÁ Floor — moving a booking to another time and/or practitioner.
 *   MoveDialog : the confirm step for a drag & drop on the day calendar
 *   MoveForm   : the same, typed in from the appointment drawer (keyboard / touch)
 * Both call /api/admin/move, which checks the practitioner does the treatment and is
 * free, updates GHL + Google Calendar, and emails the client only if the time changed.
 */
import * as React from "react";
import { type Appt, useAdmin, time, prettyDate, londonDate, firstName, londonIso } from "./lib";
import { Btn, ErrorNote, Field, Input, Select } from "./ui";

export interface MoveRequest { a: Appt; toName: string; startIso: string }
type Result = { startTime: string; endTime: string; practitioner: string | null };

function useMove(onMoved: (a: Appt) => void) {
  const { call, team } = useAdmin();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<{ text: string; clash: boolean } | null>(null);
  const run = async (r: MoveRequest, force = false) => {
    const userId = team.find((t) => t.name === r.toName)?.userId;
    if (!userId) { setError({ text: "Unknown practitioner.", clash: false }); return false; }
    setBusy(true); setError(null);
    try {
      const res = await fetchMove(call, { id: r.a.id, userId, startTime: r.startIso, force });
      onMoved({ ...r.a, startTime: res.startTime, endTime: res.endTime, practitioner: res.practitioner || r.toName });
      return true;
    } catch (e) {
      const err = e as Error & { clash?: boolean };
      setError({ text: err.message || "Couldn't move it.", clash: Boolean(err.clash) });
      return false;
    } finally { setBusy(false); }
  };
  return { run, busy, error, reset: () => setError(null) };
}

/** call() throws on non-2xx but drops the body; the clash flag matters here, so read it. */
async function fetchMove(call: ReturnType<typeof useAdmin>["call"], body: object): Promise<Result> {
  try { return await call<Result>("move", { method: "POST", body: JSON.stringify(body) }); }
  catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const err = new Error(msg) as Error & { clash?: boolean };
    err.clash = /busy then/.test(msg);
    throw err;
  }
}

function summary(r: MoveRequest) {
  const same = r.toName === r.a.practitioner, sameTime = Date.parse(r.startIso) === Date.parse(r.a.startTime);
  const when = `${londonDate(r.startIso) === londonDate(r.a.startTime) ? "" : `${prettyDate(londonDate(r.startIso))}, `}${time(r.startIso)}`;
  return {
    line: same ? `Move to ${when}` : sameTime ? `Give to ${firstName(r.toName)}` : `Move to ${firstName(r.toName)} at ${when}`,
    emailsClient: !sameTime,
  };
}

export function MoveDialog({ req, onClose, onMoved }: { req: MoveRequest | null; onClose: () => void; onMoved: (a: Appt) => void }) {
  const m = useMove(onMoved);
  React.useEffect(() => { m.reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [req]);
  React.useEffect(() => {
    if (!req) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [req, onClose]);
  if (!req) return null;
  const s = summary(req);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ora-deep/30 p-4 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="move-h" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/70 bg-ora-milk p-6 shadow-luxury">
        <p className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-bronze">Move booking</p>
        <h2 id="move-h" className="mt-1 font-display text-[1.35rem] leading-tight text-ora-deep">{req.a.client}</h2>
        <p className="mt-1 font-sans text-[0.875rem] text-ora-fog">{req.a.service} · now {firstName(req.a.practitioner)} at {time(req.a.startTime)}</p>
        <p className="mt-4 font-sans text-[1rem] font-medium text-ora-deep">{s.line}</p>
        <p className="mt-1 font-sans text-[0.78rem] text-ora-fog">{s.emailsClient ? "The client is emailed the new time. Both practitioners are told." : "Same time, so the client isn't emailed. Both practitioners are told."}</p>
        {m.error && <div className="mt-3"><ErrorNote>{m.error.text}</ErrorNote></div>}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Btn onClick={onClose} disabled={m.busy}>Cancel</Btn>
          {m.error?.clash
            ? <Btn variant="dark" disabled={m.busy} onClick={async () => { if (await m.run(req, true)) onClose(); }}>{m.busy ? "Moving…" : "Move anyway"}</Btn>
            : <Btn variant="primary" disabled={m.busy} onClick={async () => { if (await m.run(req)) onClose(); }}>{m.busy ? "Moving…" : "Move"}</Btn>}
        </div>
      </div>
    </div>
  );
}

/** Drawer version: pick practitioner, day and time. */
export function MoveForm({ a, onMoved }: { a: Appt; onMoved: (a: Appt) => void }) {
  const { team } = useAdmin();
  const [open, setOpen] = React.useState(false);
  const [who, setWho] = React.useState(a.practitioner);
  const [day, setDay] = React.useState(londonDate(a.startTime));
  const [at, setAt] = React.useState(time(a.startTime));
  const [req, setReq] = React.useState<MoveRequest | null>(null);
  if (!open) return <Btn onClick={() => setOpen(true)} className="w-full">Move or reassign…</Btn>;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const [h, m] = at.split(":").map(Number);
    setReq({ a, toName: who, startIso: londonIso(day, h * 60 + m) });
  };
  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-ora-taupe/20 bg-white/60 p-4">
      <p className="font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-fog">Move or reassign</p>
      <Field label="Practitioner">
        <Select value={who} onChange={(e) => setWho(e.target.value)}>{team.map((t) => <option key={t.userId} value={t.name}>{t.name}</option>)}</Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Day"><Input type="date" value={day} onChange={(e) => setDay(e.target.value)} required /></Field>
        <Field label="Time"><Input type="time" step={300} value={at} onChange={(e) => setAt(e.target.value)} required /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Btn type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Btn>
        <Btn type="submit" variant="dark">Review move</Btn>
      </div>
      <MoveDialog req={req} onClose={() => setReq(null)} onMoved={(x) => { onMoved(x); setOpen(false); }} />
    </form>
  );
}
