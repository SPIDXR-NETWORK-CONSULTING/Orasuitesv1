/** ORÁ Floor — website enquiries + two-pane message inbox (email replies via GHL). */
import * as React from "react";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Conversation, type Enquiry, type Message, useAdmin, htmlToText, fmtDate, londonDate, time } from "./lib";
import { Btn, Card, Empty, ErrorNote, Textarea } from "./ui";

const when = (d: string | null) => {
  if (!d) return "";
  const day = londonDate(d);
  return day === londonDate() ? time(d) : fmtDate(day, { day: "numeric", month: "short" });
};

export function EnquiriesView() {
  const { call } = useAdmin();
  const [list, setList] = React.useState<Enquiry[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { call<{ enquiries: Enquiry[] }>("enquiries").then((j) => setList(j.enquiries || [])).catch((e) => setError(e.message)); }, [call]);
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!list) return <Empty title="Loading enquiries…" />;
  if (!list.length) return <Empty title="No website enquiries." line="Anything sent from the contact or room-rental forms appears here." />;
  return (
    <Card className="divide-y divide-ora-taupe/10">
      {list.map((e) => (
        <div key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-[0.9375rem] font-medium text-ora-deep">{e.name}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[0.8125rem] text-ora-fog">
              {e.email && <a href={`mailto:${e.email}`} className="focus-ring inline-flex items-center gap-1.5 rounded hover:text-ora-bronze"><Mail size={13} />{e.email}</a>}
              {e.phone && <a href={`tel:${e.phone}`} className="focus-ring inline-flex items-center gap-1.5 rounded hover:text-ora-bronze"><Phone size={13} />{e.phone}</a>}
              {!e.email && !e.phone && <span>No contact details</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">{e.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-ora-greige/60 px-2.5 py-0.5 font-sans text-[0.6875rem] text-ora-fog">{t}</span>)}</div>
          <span className="w-16 shrink-0 text-right font-sans text-[0.8125rem] tabular-nums text-ora-fog">{when(e.since)}</span>
        </div>
      ))}
    </Card>
  );
}

export function MessagesView() {
  const { call } = useAdmin();
  const [list, setList] = React.useState<Conversation[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<Conversation | null>(null);
  React.useEffect(() => { call<{ conversations: Conversation[] }>("conversations").then((j) => setList(j.conversations || [])).catch((e) => setError(e.message)); }, [call]);
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!list) return <Empty title="Loading messages…" />;
  if (!list.length) return <Empty title="No messages yet." />;
  return (
    <div className="grid h-[calc(100vh-11rem)] min-h-[480px] gap-4 md:grid-cols-[21rem_1fr]">
      <Card className={cn("overflow-y-auto", active && "hidden md:block")}>
        <ul className="divide-y divide-ora-taupe/10">
          {list.map((c) => (
            <li key={c.id}>
              <button onClick={() => setActive(c)} aria-current={active?.id === c.id}
                className={cn("focus-ring flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-ora-bronze/[0.05]", active?.id === c.id && "bg-ora-bronze/[0.08]")}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn("truncate font-sans text-[0.9rem] text-ora-deep", c.unread ? "font-semibold" : "font-medium")}>{c.name}</span>
                    <span className="shrink-0 font-sans text-[0.72rem] tabular-nums text-ora-fog">{when(c.date)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 font-sans text-[0.8125rem] text-ora-fog">{htmlToText(c.snippet) || "—"}</p>
                </div>
                {c.unread > 0 && <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ora-bronze px-1.5 font-sans text-[0.6875rem] text-white">{c.unread}</span>}
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className={cn("flex min-h-0 flex-col", !active && "hidden md:flex")}>
        {active ? <Thread key={active.id} conv={active} onBack={() => setActive(null)} /> : <div className="m-auto p-6 text-center font-sans text-[0.875rem] text-ora-fog">Choose a conversation.</div>}
      </Card>
    </div>
  );
}

function Thread({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const { call } = useAdmin();
  const [msgs, setMsgs] = React.useState<Message[] | null>(null);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [note, setNote] = React.useState<{ ok: boolean; text: string } | null>(null);
  const end = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(() => { call<{ messages: Message[] }>(`thread?id=${encodeURIComponent(conv.id)}`).then((j) => setMsgs(j.messages || [])).catch(() => setMsgs([])); }, [call, conv.id]);
  React.useEffect(load, [load]);
  React.useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  async function send() {
    if (!conv.contactId) return;
    if (!text.trim()) { setNote({ ok: false, text: "Type a message first." }); return; }
    setSending(true); setNote(null);
    try {
      await call("reply", { method: "POST", body: JSON.stringify({ contactId: conv.contactId, message: text.trim() }) });
      setText(""); setNote({ ok: true, text: "Sent" }); setTimeout(load, 1200);
    } catch (e) { setNote({ ok: false, text: e instanceof Error ? e.message : "Couldn't send." }); } finally { setSending(false); }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-ora-taupe/15 px-5 py-4">
        <button onClick={onBack} aria-label="Back to messages" className="focus-ring -ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-ora-fog hover:bg-ora-greige/60 md:hidden"><ArrowLeft size={18} /></button>
        <p className="truncate font-display text-[1.2rem] text-ora-deep">{conv.name}</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {!msgs && <p className="py-10 text-center font-sans text-[0.875rem] text-ora-fog">Loading…</p>}
        {msgs?.length === 0 && <p className="py-10 text-center font-sans text-[0.875rem] text-ora-fog">No messages in this thread.</p>}
        {msgs?.map((m) => {
          const out = m.direction === "outbound";
          return (
            <div key={m.id} className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", out ? "ml-auto rounded-br-md bg-ora-deep text-ora-cream" : "rounded-bl-md bg-white text-ora-deep")}>
              <p className="whitespace-pre-wrap break-words font-sans text-[0.875rem] leading-relaxed">{htmlToText(m.body).slice(0, 4000)}</p>
              <p className={cn("mt-1 font-sans text-[0.6875rem]", out ? "text-ora-cream/55" : "text-ora-fog")}>
                {m.type.toLowerCase()} · {when(m.date)}
                {m.delivery && <span className={cn("ml-1.5", m.delivery === "failed" ? "font-semibold text-[#f2a08f]" : "")}> · {{ opened: "✓✓ Opened", delivered: "✓ Delivered", sending: "Sending…", failed: "⚠ Not delivered. Call or text them instead" }[m.delivery]}</span>}
              </p>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <div className="border-t border-ora-taupe/15 p-4">
        <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} disabled={!conv.contactId} aria-label="Reply"
          placeholder={conv.contactId ? `Reply to ${conv.name.split(" ")[0]} by email…` : "No contact on this thread — can't reply"} />
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <span role="status" className={cn("font-sans text-[0.8125rem]", note?.ok ? "text-ora-sage" : "text-ora-clay")}>{note ? (note.ok ? `✓ ${note.text}` : note.text) : ""}</span>
          <Btn variant="primary" onClick={send} disabled={sending || !conv.contactId}>{sending ? "Sending…" : "Send reply"}</Btn>
        </div>
      </div>
    </>
  );
}
