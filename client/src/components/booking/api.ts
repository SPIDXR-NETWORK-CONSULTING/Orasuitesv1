/**
 * TanStack Query hooks for the GHL booking endpoints.
 *
 *  useSlots(calendarId, ymd)   GET  /api/ghl/slots?calendarId&startDate=<ms>&endDate=<ms>
 *  useCreateBooking()          POST /api/ghl/booking { name,email,phone,notes,calendarId,serviceName,startTime,endTime }
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
      const res = await apiRequest("POST", "/api/ghl/booking", body);
      const json = (await res.json()) as BookingResponse;
      if (!json.success) throw new Error(json.error || "Booking failed");
      return json;
    },
  });
}
