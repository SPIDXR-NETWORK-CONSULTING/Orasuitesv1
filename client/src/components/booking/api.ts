/**
 * TanStack Query hooks for the GHL booking endpoints.
 *
 *  useSlots(calendarId, ymd)   GET  /api/ghl/slots?calendarId&startDate=<ms>&endDate=<ms>
 *  useCreateBooking()          POST /api/ghl/booking { name,email,phone,notes,calendarId,serviceId,serviceName,startTime,endTime,paymentIntentId? }
 *
 * The deposit is HELD by useStripeDeposit() BEFORE this mutation runs; only the
 * resulting paymentIntentId is passed here. The server re-verifies the hold
 * against the catalogue price and takes the money only after the appointment
 * has been created.
 */
import * as React from "react";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { findCategory, type ResolvedService } from "@/lib/catalogue";
import { extractSlots, londonDayBounds } from "./time";
import type { BookingRequest, BookingResponse, SlotsResponse } from "./types";

export function slotsQueryKey(calendarId: string | undefined, ymd: string | undefined) {
  return ["ghl-slots", calendarId ?? "", ymd ?? ""] as const;
}

export function useSlots(calendarId: string | undefined, ymd: string | undefined) {
  return useQuery<string[], Error>({
    queryKey: slotsQueryKey(calendarId, ymd),
    enabled: Boolean(calendarId && ymd),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    queryFn: async () => {
      const { start, end } = londonDayBounds(ymd!);
      const qs = new URLSearchParams({
        calendarId: calendarId!,
        startDate: String(start),
        endDate: String(end),
      });
      const res = await fetch(`/api/ghl/slots?${qs.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: could not load times`);
      const data = (await res.json()) as SlotsResponse;
      const now = Date.now();
      // Only future slots for the requested day
      return extractSlots(data, ymd).filter((iso) => new Date(iso).getTime() > now);
    },
  });
}

async function fetchSlots(calendarId: string, ymd: string): Promise<string[]> {
  const { start, end } = londonDayBounds(ymd);
  const qs = new URLSearchParams({ calendarId, startDate: String(start), endDate: String(end) });
  const res = await fetch(`/api/ghl/slots?${qs.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}: could not load times`);
  const now = Date.now();
  return extractSlots((await res.json()) as SlotsResponse, ymd).filter((iso) => new Date(iso).getTime() > now);
}

/** Same person doing two treatments in a row needs GHL's 15-minute buffer between them. */
const BUFFER_MS = 15 * 60_000;
/** Longest gap we'll leave a client waiting between two treatments. */
const MAX_GAP_MS = 30 * 60_000;
const sharesTeam = (a: ResolvedService, b: ResolvedService) => {
  const ta = findCategory(a.categoryId)?.team ?? [], tb = findCategory(b.categoryId)?.team ?? [];
  return ta.some((k) => tb.includes(k));
};

/**
 * Start times for a visit of several treatments, back-to-back: the first treatment's free
 * slots, kept only when every next treatment also has a free slot right after the previous
 * one ends (within MAX_GAP_MS; at least BUFFER_MS later if the same team could do both).
 * Each result carries the plan, so the booking can create every appointment at its time.
 */
export function useVisitSlots(services: ResolvedService[], ymd: string | undefined) {
  const results = useQueries({
    queries: services.map((s) => ({
      queryKey: slotsQueryKey(s.ghlCalendarId, ymd),
      enabled: Boolean(s.ghlCalendarId && ymd),
      staleTime: 60_000,
      retry: 1,
      queryFn: () => fetchSlots(s.ghlCalendarId!, ymd!),
    })),
  });
  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const isFetching = results.some((r) => r.isFetching);
  const ready = results.every((r) => r.data);
  const options = React.useMemo(() => {
    // No visit (a single treatment) → nothing to work out. (An empty list would crash below.)
    if (!services.length || !ready) return undefined;
    const lists = results.map((r) => (r.data as string[]).map((iso) => ({ iso, ms: Date.parse(iso) })));
    const out: { start: string; plan: { serviceId: string; startTime: string; endTime: string }[] }[] = [];
    for (const first of lists[0]) {
      const plan = [{ serviceId: services[0].id, startTime: first.iso, endTime: new Date(first.ms + services[0].duration * 60_000).toISOString() }];
      let end = first.ms + services[0].duration * 60_000;
      let ok = true;
      for (let i = 1; i < services.length && ok; i++) {
        const min = end + (sharesTeam(services[i - 1], services[i]) ? BUFFER_MS : 0);
        const next = lists[i].find((s) => s.ms >= min && s.ms <= end + MAX_GAP_MS);
        if (!next) { ok = false; break; }
        end = next.ms + services[i].duration * 60_000;
        plan.push({ serviceId: services[i].id, startTime: next.iso, endTime: new Date(end).toISOString() });
      }
      if (ok) out.push({ start: first.iso, plan });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ...results.map((r) => r.dataUpdatedAt), services.map((s) => s.id).join(",")]);
  return { options, isLoading, isError, isFetching, refetch: () => results.forEach((r) => r.refetch()) };
}

export function useCreateBooking() {
  return useMutation<BookingResponse, Error, BookingRequest>({
    mutationFn: async (body) => {
      // Deliberately not apiRequest(): a 402 from the deposit gate carries a
      // customer-facing message in `error`, and apiRequest would bury it inside
      // a `"402: {json}"` string.
      const res = await fetch("/api/ghl/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as BookingResponse;
      if (!res.ok || !json.success) {
        throw new Error(json.error || `${res.status}: Booking failed`);
      }
      return json;
    },
  });
}
