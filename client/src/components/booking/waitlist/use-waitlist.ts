/**
 * Waiting-list mutation + the little prefill store behind it.
 *
 * POST /api/booking/waitlist { serviceId, date, name, email, phone }
 *
 * Whatever the visitor types is kept in sessionStorage for the rest of their
 * visit, so trying a second closed day doesn't mean typing their details again.
 * It is deliberately session-scoped and never touched on the server.
 */
import { useMutation } from "@tanstack/react-query";

const PREFILL_KEY = "ora:waitlist-contact";

export interface WaitlistContact {
  name: string;
  email: string;
  phone: string;
}

export const EMPTY_CONTACT: WaitlistContact = { name: "", email: "", phone: "" };

export function readPrefill(): WaitlistContact {
  if (typeof window === "undefined") return EMPTY_CONTACT;
  try {
    const raw = window.sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return EMPTY_CONTACT;
    const parsed = JSON.parse(raw) as Partial<WaitlistContact>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };
  } catch {
    return EMPTY_CONTACT;
  }
}

export function writePrefill(value: WaitlistContact): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PREFILL_KEY, JSON.stringify(value));
  } catch {
    /* private mode / quota — prefill is a convenience, never a requirement */
  }
}

export interface WaitlistRequest {
  serviceId: string;
  date: string;
  name: string;
  email: string;
  phone?: string;
}

export interface WaitlistResponse {
  ok: boolean;
  /** true when this person was already on the list for that treatment + day */
  already?: boolean;
  serviceName?: string;
  date?: string;
  error?: string;
}

export function useJoinWaitlist() {
  return useMutation<WaitlistResponse, Error, WaitlistRequest>({
    mutationFn: async (body) => {
      const res = await fetch("/api/booking/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as WaitlistResponse;
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "We couldn't save your place just now.");
      }
      return json;
    },
  });
}
