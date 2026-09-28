/** ORÁ Floor — UI primitives. Touch-sized (≥44px) for a reception desk screen. */
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { easeLuxury } from "@/lib/motion";

/* ── Button ──────────────────────────────────────────────── */
type BtnVariant = "primary" | "dark" | "outline" | "ghost";
const btnBase = "focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-sans font-medium transition-[background-color,border-color,color,opacity,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";
const btnVariant: Record<BtnVariant, string> = {
  primary: "bg-ora-bronze text-white hover:bg-ora-bronze/90",
  dark: "bg-ora-deep text-ora-cream hover:bg-ora-deep/90",
  outline: "border border-ora-taupe/35 bg-white/60 text-ora-deep hover:border-ora-bronze hover:text-ora-bronze",
  ghost: "text-ora-fog hover:bg-ora-greige/50 hover:text-ora-deep",
};
export const Btn = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" }>(
  function Btn({ variant = "outline", size = "md", className, ...rest }, ref) {
    return <button ref={ref} className={cn(btnBase, btnVariant[variant], size === "sm" ? "h-9 px-3 text-[0.8125rem]" : "h-11 px-4 text-[0.875rem]", className)} {...rest} />;
  },
);

/* ── Segmented control ───────────────────────────────────── */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl border border-ora-taupe/30 bg-white/50 p-1">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn("focus-ring h-9 rounded-lg px-3.5 font-sans text-[0.8125rem] transition-colors duration-200", value === o.value ? "bg-ora-deep text-ora-cream shadow-sm" : "text-ora-fog hover:text-ora-deep")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Status ──────────────────────────────────────────────── */
const STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-ora-bronze/10 text-ora-bronze" },
  showed: { label: "Showed", cls: "bg-ora-sage/10 text-ora-sage" },
  noshow: { label: "No-show", cls: "bg-ora-clay/10 text-ora-clay" },
  cancelled: { label: "Cancelled", cls: "bg-ora-fog/15 text-ora-fog line-through" },
};
export function StatusPill({ status, className }: { status: string; className?: string }) {
  const s = STATUS[status] || { label: status, cls: "bg-ora-greige/60 text-ora-fog" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 font-sans text-[0.6875rem] font-medium", s.cls, className)}>{s.label}</span>;
}

/* ── Surfaces ────────────────────────────────────────────── */
export function Card({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-white/70 bg-white/65 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_18px_40px_-28px_rgba(26,16,8,0.35)] backdrop-blur-sm", className)} {...rest} />;
}
export function Empty({ title, line, action }: { title: string; line?: string; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <span aria-hidden className="mb-4 block h-px w-10 bg-ora-bronze/60" />
      <p className="font-display text-[1.15rem] text-ora-deep">{title}</p>
      {line && <p className="mt-1.5 max-w-sm font-sans text-[0.875rem] text-ora-fog">{line}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
export function Stat({ label, value, sub, tone = "default" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "default" | "bronze" | "sage" }) {
  return (
    <Card className="px-5 py-4">
      <p className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ora-fog">{label}</p>
      <p className={cn("mt-1.5 font-display text-[1.9rem] leading-none tabular-nums", tone === "bronze" ? "text-ora-bronze" : tone === "sage" ? "text-ora-sage" : "text-ora-deep")}>{value}</p>
      {sub && <p className="mt-1.5 truncate font-sans text-[0.8125rem] text-ora-fog">{sub}</p>}
    </Card>
  );
}
export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <div role="alert" className="rounded-xl border border-ora-clay/25 bg-ora-clay/[0.06] px-4 py-3 font-sans text-[0.875rem] text-ora-clay">{children}</div>;
}

/* ── Fields ──────────────────────────────────────────────── */
const fieldCls = "focus-ring h-11 w-full rounded-xl border border-ora-taupe/35 bg-white px-3.5 font-sans text-[0.9375rem] text-ora-deep outline-none transition-colors placeholder:text-ora-fog/70 focus:border-ora-bronze";
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[0.75rem] font-medium text-ora-fog">{label}</span>
      {children}
      {hint && <span className="mt-1 block font-sans text-[0.72rem] text-ora-fog/80">{hint}</span>}
    </label>
  );
}
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...r }, ref) {
  return <input ref={ref} className={cn(fieldCls, className)} {...r} />;
});
export function Select({ className, ...r }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldCls, "pr-8", className)} {...r} />;
}
export function Textarea({ className, ...r }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldCls, "h-auto resize-none py-3", className)} {...r} />;
}

/* ── Drawer (right panel on desktop, bottom sheet on phones) ─ */
export function Drawer({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  const reduced = useReducedMotion();
  const panel = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus?.(); };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div aria-hidden className="absolute inset-0 bg-ora-deep/35 backdrop-blur-[2px]" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.div ref={panel} role="dialog" aria-modal="true" tabIndex={-1}
            className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-ora-milk shadow-luxury outline-none md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-3xl"
            initial={reduced ? { opacity: 0 } : { x: "100%" }} animate={reduced ? { opacity: 1 } : { x: 0 }} exit={reduced ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: 0.38, ease: easeLuxury }}>
            <div className="flex items-start justify-between gap-4 border-b border-ora-taupe/15 px-6 pb-4 pt-6">
              <div className="min-w-0">
                <h2 className="truncate font-display text-[1.45rem] leading-tight text-ora-deep">{title}</h2>
                {subtitle && <p className="mt-1 font-sans text-[0.875rem] text-ora-fog">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close" className="focus-ring -mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ora-fog transition hover:bg-ora-greige/60 hover:text-ora-deep"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-ora-taupe/15 px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
