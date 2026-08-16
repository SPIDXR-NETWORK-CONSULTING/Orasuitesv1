/**
 * Step 4 — review + deposit (preview) + confirm. Fires POST /api/ghl/booking.
 */
import * as React from "react";
import { AlertCircle, Clock, Pencil } from "lucide-react";
import { formatDuration, formatPrice, type ResolvedService } from "@/lib/catalogue";
import { Button } from "@/components/ui/button";
import { DepositPanel } from "../deposit-panel";
import { StepHeader, StepNav } from "../step-shell";
import { formatLongDate, formatTime } from "../time";
import type { BookingState } from "../types";

interface Props {
  state: BookingState & { service: ResolvedService; date: string; slot: string };
  onBack: () => void;
  onEdit: (step: number) => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string | null;
}

export function ConfirmStep({ state, onBack, onEdit, onConfirm, loading, error }: Props) {
  const s = state.service;
  const free = s.price === 0;

  return (
    <div>
      <StepHeader step={3} title={free ? "Confirm your consultation" : "Review & confirm"} />

      {/* Review card */}
      <dl className="overflow-hidden rounded-2xl border border-glass-border-warm bg-ora-cream/50 backdrop-blur-glass-sm">
        <ReviewRow label="Treatment" onEdit={() => onEdit(0)}>
          <span className="font-display text-[1.125rem] leading-tight text-foreground">{s.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.8125rem] text-ora-fog">
            <span>{s.categoryTitle} · {s.groupName}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-ora-bronze" aria-hidden />{formatDuration(s.duration)}</span>
            <span className="text-foreground">{free ? "Complimentary" : formatPrice(s.price)}</span>
          </span>
        </ReviewRow>
        <ReviewRow label="When" onEdit={() => onEdit(1)}>
          <span className="font-sans text-[0.9375rem] text-foreground">
            {formatLongDate(state.date)} · <span className="text-ora-bronze">{formatTime(state.slot)}</span>
          </span>
        </ReviewRow>
        <ReviewRow label="Your details" onEdit={() => onEdit(2)}>
          <span className="font-sans text-[0.9375rem] text-foreground">{state.details.name}</span>
          <span className="mt-0.5 block font-sans text-[0.8125rem] text-ora-fog">{state.details.email} · {state.details.phone}</span>
          {state.details.notes && <span className="mt-1 block font-sans text-[0.8125rem] italic text-ora-fog">“{state.details.notes}”</span>}
        </ReviewRow>
      </dl>

      <DepositPanel mode="preview" price={s.price} className="mt-6" />

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <div className="font-sans text-[0.875rem]">
            <p className="font-medium text-foreground">We couldn't place your booking</p>
            <p className="mt-0.5 text-ora-fog">{error} — try again, or email <a href="mailto:admin@orasuites.com" className="text-ora-bronze underline-offset-4 hover:underline">admin@orasuites.com</a>.</p>
          </div>
        </div>
      )}

      <StepNav
        onBack={onBack}
        onNext={onConfirm}
        loading={loading}
        nextLabel={free ? "Confirm consultation" : "Confirm booking"}
        hint={free ? undefined : "Nothing is charged today"}
      />
    </div>
  );
}

function ReviewRow({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ora-greige/70 px-5 py-4 last:border-b-0 sm:px-6">
      <div className="min-w-0">
        <dt className="mb-1.5 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-ora-bronze">{label}</dt>
        <dd className="min-w-0">{children}</dd>
      </div>
      <Button type="button" variant="link" size="sm" onClick={onEdit} className="shrink-0 text-ora-fog hover:text-foreground" aria-label={`Change ${label.toLowerCase()}`}>
        <Pencil aria-hidden className="!size-3.5" /> Change
      </Button>
    </div>
  );
}
