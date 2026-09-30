/**
 * ORÁ Floor — clients (straight from GHL).
 *   ClientPanel  : notes (allergies, preferences) + add a note, upcoming & past visits,
 *                  blow-dry bundles. Shown on every appointment and in Find client.
 *   ClientDrawer : search by name, phone or email → ClientPanel.
 */
import * as React from "react";
import { Search } from "lucide-react";
import { useAdmin, fmtDate, londonDate, time } from "./lib";
import { Btn, Drawer, ErrorNote, Input, Textarea } from "./ui";
import { bundleState, useBundleList } from "./bundles";

interface ClientData {
  contact: { name: string; email: string | null; phone: string | null };
  appointments: { id: string; startTime: string; service: string; practitioner: string | null; status: string }[];
  notes: { id: string; text: string; date: string | null }[];
}
const short = (iso: string) => fmtDate(londonDate(iso), { day: "numeric", month: "short", year: "2-digit" });

export function ClientPanel({ contactId, showContact = false }: { contactId: string; showContact?: boolean }) {
  const { call } = useAdmin();
  const [data, setData] = React.useState<ClientData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const { list: bundles } = useBundleList();
  const load = React.useCallback(() => {
    setError(null);
    call<ClientData>(`client?contactId=${encodeURIComponent(contactId)}`).then(setData).catch(() => setError("Couldn't load this client from GHL."));
  }, [call, contactId]);
  React.useEffect(load, [load]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try { await call("note-add", { method: "POST", body: JSON.stringify({ contactId, text: draft.trim() }) }); setDraft(""); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't save the note."); } finally { setSaving(false); }
  };

  if (error && !data) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return <p className="font-sans text-[0.8125rem] text-ora-fog">Loading client…</p>;
  const now = Date.now();
  const live = data.appointments.filter((a) => !/cancel|noshow|invalid/i.test(a.status));
  const upcoming = live.filter((a) => Date.parse(a.startTime) > now).reverse();
  const past = live.filter((a) => Date.parse(a.startTime) <= now);
  const theirs = (bundles || []).filter((b) => b.contact_id === contactId && !b.voided_at);

  return (
    <div className="space-y-5">
      {showContact && (
        <div>
          <p className="font-display text-[1.2rem] text-ora-deep">{data.contact.name}</p>
          <p className="font-sans text-[0.8125rem] text-ora-fog">{[data.contact.phone, data.contact.email].filter(Boolean).join(" · ") || "No contact details"}</p>
        </div>
      )}

      <section aria-label="Notes">
        <p className="mb-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-bronze">Notes {data.notes.length ? `(${data.notes.length})` : ""}</p>
        {data.notes.length > 0 && (
          <ul className="mb-2 space-y-1.5">
            {data.notes.slice(0, 5).map((n) => (
              <li key={n.id} className="rounded-xl border border-ora-bronze/20 bg-ora-bronze/[0.05] px-3 py-2 font-sans text-[0.8125rem] text-ora-deep">
                <span className="whitespace-pre-line">{n.text}</span>
                {n.date && <span className="mt-0.5 block text-[0.7rem] text-ora-fog">{short(n.date)}</span>}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addNote} className="flex gap-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} maxLength={2000} placeholder="Add a note: allergies, preferences…" aria-label="New note" className="min-h-[44px] flex-1" />
          <Btn type="submit" disabled={saving || !draft.trim()}>{saving ? "Saving…" : "Add"}</Btn>
        </form>
        {error && data && <div className="mt-2"><ErrorNote>{error}</ErrorNote></div>}
      </section>

      {theirs.length > 0 && (
        <section aria-label="Bundles">
          <p className="mb-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-fog">Bundles</p>
          <ul className="space-y-1.5">{theirs.map((b) => <li key={b.id} className="flex justify-between rounded-xl bg-white/70 px-3 py-2 font-sans text-[0.8125rem]"><span className="text-ora-deep">Blow-dry bundle of {b.size}</span><span className="text-ora-fog">{bundleState(b).label}</span></li>)}</ul>
        </section>
      )}

      <section aria-label="Visits">
        <p className="mb-2 font-sans text-[0.6875rem] uppercase tracking-[0.16em] text-ora-fog">Upcoming ({upcoming.length}) · Past visits ({past.length})</p>
        <ul className="space-y-1.5">
          {[...upcoming, ...past.slice(0, 8)].map((h) => (
            <li key={h.id} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2 font-sans text-[0.8125rem]">
              <span className="w-24 shrink-0 tabular-nums text-ora-fog">{h.startTime ? `${short(h.startTime)}${Date.parse(h.startTime) > now ? ` ${time(h.startTime)}` : ""}` : "—"}</span>
              <span className="min-w-0 flex-1 truncate text-ora-deep">{h.service}</span>
              <span className="shrink-0 text-ora-fog">{(h.practitioner || "").split(" ")[0]}</span>
            </li>
          ))}
          {live.length === 0 && <li className="py-3 text-center font-sans text-[0.8125rem] text-ora-fog">First visit.</li>}
        </ul>
      </section>
    </div>
  );
}

export function ClientDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="Find client" subtitle="Search GHL by name, phone or email.">
      {open && <ClientSearch />}
    </Drawer>
  );
}

function ClientSearch() {
  const { call } = useAdmin();
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<{ id: string; name: string; email: string | null; phone: string | null }[] | null>(null);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return; }
    const t = setTimeout(() => {
      call<{ clients: any[] }>(`clients?q=${encodeURIComponent(q.trim())}`).then((j) => { setResults(j.clients || []); setError(null); }).catch((e) => setError(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [q, call]);

  if (picked) return (
    <div className="space-y-4">
      <Btn size="sm" variant="ghost" onClick={() => setPicked(null)}>← Back to results</Btn>
      <ClientPanel contactId={picked} showContact />
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ora-fog" aria-hidden />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or email" aria-label="Search clients" className="pl-10" />
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      {results && results.length === 0 && <p className="py-6 text-center font-sans text-[0.875rem] text-ora-fog">No client matches “{q}”.</p>}
      {results && results.length > 0 && (
        <ul className="divide-y divide-ora-taupe/10 overflow-hidden rounded-2xl border border-white/70 bg-white/70">
          {results.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setPicked(c.id)} className="focus-ring flex w-full flex-col px-4 py-3 text-left transition hover:bg-ora-bronze/[0.06]">
                <span className="font-sans text-[0.9rem] font-medium text-ora-deep">{c.name}</span>
                <span className="font-sans text-[0.78rem] text-ora-fog">{[c.phone, c.email].filter(Boolean).join(" · ") || "No contact details"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
