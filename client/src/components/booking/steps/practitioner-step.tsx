/**
 * Step 2 — practitioner preference.
 * "First available" is the default. A named practitioner is a *preference* only:
 * the backend books on the service calendar (round-robin), so we pass it in notes.
 */
import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { IconOrb } from "@/components/ui/glass";
import { teamFor, type ResolvedService } from "@/lib/catalogue";
import { useMotionSafe } from "@/lib/motion";
import { StepHeader, StepNav, ChoiceCard } from "../step-shell";
import type { PractitionerChoice } from "../types";

interface Props {
  service: ResolvedService;
  value: PractitionerChoice;
  onChange: (v: PractitionerChoice) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PractitionerStep({ service, value, onChange, onBack, onNext }: Props) {
  const team = React.useMemo(() => teamFor(service.categoryId), [service.categoryId]);
  const m = useMotionSafe();

  return (
    <div>
      <StepHeader
        step={1}
        title="Who would you like to see?"
        lede={`Our ${service.categoryTitle.toLowerCase()} team at ORÁ. Choose “First available” for the widest choice of times.`}
      />

      <motion.div role="radiogroup" aria-label="Practitioner" variants={m.stagger(0.07)} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
        <motion.div variants={m.fadeUp} className="sm:col-span-2">
          <ChoiceCard selected={value === "first"} onSelect={() => onChange("first")} data-testid="book-practitioner-first">
            <span className="flex items-center gap-4">
              <IconOrb size="lg" tone="bronze" aria-hidden>
                <Sparkles />
              </IconOrb>
              <span className="min-w-0 pr-8">
                <span className="block font-display text-[1.25rem] leading-tight text-foreground">First available</span>
                <span className="mt-1 block font-sans text-[0.875rem] text-ora-fog">Recommended · soonest appointment with any of our {service.categoryTitle.toLowerCase()} practitioners</span>
              </span>
            </span>
          </ChoiceCard>
        </motion.div>

        {team.map((t) => (
          <motion.div key={t.key} variants={m.fadeUp}>
            <ChoiceCard selected={value === t.key} onSelect={() => onChange(t.key)} className="h-full" data-testid={`book-practitioner-${t.key}`}>
              <span className="flex items-center gap-4">
                <IconOrb size="lg" tone="warm" initials={t.initials} aria-hidden />
                <span className="min-w-0 pr-8">
                  <span className="block font-display text-[1.125rem] leading-tight text-foreground">{t.name}</span>
                  <span className="mt-1 block font-sans text-[0.8125rem] text-ora-fog">{t.role}</span>
                </span>
              </span>
            </ChoiceCard>
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-6 max-w-xl font-sans text-[0.75rem] leading-relaxed text-ora-fog">
        Choosing a practitioner records your preference — we do our very best to honour it, but availability is confirmed by the clinic
        when your booking is placed.
      </p>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
