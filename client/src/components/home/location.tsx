import { motion } from "framer-motion";
import { MapPin, Mail, Clock, Navigation } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import manchesterImage from "@assets/manchester-location_1770213665902.png";

/* Business truth — keep in sync with hooks/use-seo.ts BUSINESS */
const ADDRESS = "49 Deansgate, Manchester M3 2AY";
const EMAIL = "admin@orasuites.com";
const MAPS_URL = "https://maps.google.com/?q=49+Deansgate+Manchester+M3+2AY";
const HOURS = "Every day · 10am – 5pm";

const ROWS = [
  { icon: <MapPin />, label: "Address", value: ADDRESS },
  { icon: <Clock />, label: "Hours", value: HOURS },
  { icon: <Mail />, label: "Email", value: EMAIL, href: `mailto:${EMAIL}` },
];

/** Location (v2) — centred heading; image | tidy info card. No map embed (kept compact). */
export function LocationSection() {
  const m = useMotionSafe();

  return (
    <Section id="location" tone="milk" mesh grain>
      <SectionHeader title="Find us" align="center" className="mb-8" />

      <motion.div
        variants={m.stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mx-auto grid max-w-4xl items-stretch gap-5 sm:grid-cols-2"
      >
        <motion.figure variants={m.fadeUp} className="overflow-hidden rounded-2xl bg-ora-greige shadow-luxury">
          <img
            src={manchesterImage}
            alt="Manchester city skyline at dusk around Deansgate"
            width={1344}
            height={768}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] h-full w-full object-cover"
          />
        </motion.figure>

        <motion.div
          variants={m.fadeUp}
          className="glass-warm flex flex-col justify-center rounded-2xl p-6 sm:p-7"
        >
          <address className="not-italic">
            <ul className="space-y-4">
              {ROWS.map((r) => (
                <li key={r.label} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ora-bronze/10 text-ora-bronze [&_svg]:size-4">
                    {r.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="eyebrow mb-0.5">{r.label}</p>
                    {r.href ? (
                      <a
                        href={r.href}
                        className="focus-ring break-all rounded font-sans text-[0.9375rem] text-foreground underline-offset-4 hover:text-ora-bronze hover:underline"
                      >
                        {r.value}
                      </a>
                    ) : (
                      <p className="font-sans text-[0.9375rem] text-foreground">{r.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </address>
          <div className="mt-6">
            <Button asChild variant="ghost" size="sm">
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" data-testid="button-get-directions">
                <Navigation size={14} />
                Open in Maps
              </a>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </Section>
  );
}
