/**
 * /bundle/:token — a client's own blow-dry bundle: how many are left, until when,
 * and each visit. Reached only from the private link in their emails (noindex).
 */
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/layout";
import { useSEO } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

interface PublicBundle {
  name: string; firstName: string; size: number; used: number; left: number; price: number;
  paid: boolean; expiresAt: string | null; cancelled: boolean; createdAt: string;
  visits: { service: string | null; usedAt: string; visitAt?: string }[];
}

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }).format(new Date(iso));

export default function BundlePage() {
  const { token = "" } = useParams<{ token: string }>();
  useSEO({ title: "Your blow-dry bundle | ORÁ.", description: "Your ORÁ Suites blow-dry bundle.", path: "/bundle", noindex: true });
  const q = useQuery({
    queryKey: ["bundle", token],
    retry: 1,
    queryFn: async () => {
      const r = await fetch(`/api/booking/bundle?t=${encodeURIComponent(token)}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Your bundle can't be loaded just now.");
      return j.bundle as PublicBundle;
    },
  });
  const b = q.data;
  const expired = Boolean(b?.expiresAt && Date.parse(b.expiresAt) < Date.now());

  return (
    <Layout>
      <section className="bg-ora-milk px-4 pb-20 pt-32">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-md text-center">
          {q.isLoading && <p className="font-sans text-[0.9375rem] text-ora-fog" role="status">Loading your bundle…</p>}
          {q.isError && (
            <>
              <h1 className="font-display text-[1.75rem] text-foreground">We couldn't find that bundle</h1>
              <p className="mt-2 font-sans text-[0.9375rem] text-ora-fog">{(q.error as Error).message} If this keeps happening, email <a className="text-ora-bronze underline-offset-4 hover:underline" href="mailto:admin@orasuites.com">admin@orasuites.com</a>.</p>
            </>
          )}
          {b && (
            <>
              {b.firstName && <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">{b.firstName}</p>}
              <h1 className="mt-2 font-display text-[1.75rem] leading-tight text-foreground">{b.name}</h1>

              <p className="mt-6 font-display text-[3rem] leading-none text-foreground" data-testid="bundle-left">{b.left}</p>
              <p className="mt-1 font-sans text-[0.875rem] text-ora-fog">of {b.size} blow-dries left</p>

              <div className="mt-5 flex justify-center gap-2" aria-hidden>
                {Array.from({ length: b.size }, (_, i) => (
                  <span key={i} className={cn("h-2.5 w-2.5 rounded-full", i < b.used ? "bg-ora-bronze" : "border border-ora-bronze/50")} />
                ))}
              </div>

              <p className="mt-6 font-sans text-[0.875rem] text-foreground">
                {b.cancelled
                  ? "This bundle was cancelled."
                  : !b.paid
                    ? `£${b.price}, paid at the clinic on your first visit.`
                    : expired
                      ? `This bundle expired on ${fmt(b.expiresAt!)}.`
                      : b.expiresAt
                        ? `Valid until ${fmt(b.expiresAt)}.`
                        : null}
              </p>

              {b.visits.length > 0 && (
                <ol className="mx-auto mt-8 max-w-sm divide-y divide-ora-greige/70 border-y border-ora-greige/70 text-left">
                  {b.visits.map((v, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-4 py-2.5 font-sans text-[0.875rem]">
                      <span className="text-foreground">{i + 1}. {v.service || "Blow-dry"}</span>
                      <span className="shrink-0 text-ora-fog">{fmt(v.visitAt ?? v.usedAt)}{Date.parse(v.visitAt ?? v.usedAt) > Date.now() ? " · booked" : ""}</span>
                    </li>
                  ))}
                </ol>
              )}

              {!b.cancelled && !expired && b.left > 0 && (
                <Link href="/book?category=hair" className="mt-8 inline-flex h-11 items-center rounded-full bg-ora-bronze px-6 font-sans text-[0.875rem] text-white transition-colors hover:bg-ora-bronze-deep">
                  Book your next blow-dry
                </Link>
              )}
            </>
          )}
        </motion.div>
      </section>
    </Layout>
  );
}
