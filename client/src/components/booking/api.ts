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
import { useMutation, useQuery } from "@tanstack/react-query";
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
