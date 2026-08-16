/**
 * ORA SUITES — Custom Icon Set v2
 * Thin-line SVG icons (1.5px stroke), warm taupe/bronze palette.
 * All 24×24 viewBox, monochrome, designed for Ora brand aesthetic.
 */

import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const defaultProps: IconProps = {
  size: 24,
  color: "currentColor",
  strokeWidth: 1.5,
  className: "",
};

// ─── Wellness & Korean Head Spa ──────────────────────────────────────────────

/** Lotus / petal — Wellness section header */
export function LotusIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20 C12 20 8 16 8 11 C8 7 10 4 12 4 C14 4 16 7 16 11 C16 16 12 20 12 20Z" />
      <path d="M12 18 C12 18 6 15 5 10 C4 6 6 3 9 4 C11 5 12 8 12 11" />
      <path d="M12 18 C12 18 18 15 19 10 C20 6 18 3 15 4 C13 5 12 8 12 11" />
      <path d="M12 20 L12 22" />
      <path d="M8 22 Q12 21 16 22" />
    </svg>
  );
}

/** Korean Wave — Korean Head Spa */
export function KoreanWaveIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 8 Q8 4 12 4 Q16 4 16 8 L16 13 Q16 17 12 17 Q8 17 8 13 Z" />
      <path d="M5 6 Q6.5 4.5 8 6 Q9.5 7.5 11 6" />
      <path d="M13 6 Q14.5 4.5 16 6 Q17.5 7.5 19 6" />
      <path d="M10 17 L9 20 M14 17 L15 20" />
      <path d="M8 20 Q12 22 16 20" />
    </svg>
  );
}

/** Scalp head — detailed scalp/hair icon */
export function ScalpIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Head */}
      <path d="M7 10 Q7 5 12 5 Q17 5 17 10 L17 15 Q17 19 12 19 Q7 19 7 15 Z" />
      {/* Scalp massage waves */}
      <path d="M8.5 8.5 Q10 7 11.5 8.5 Q13 10 14.5 8.5 Q16 7 16 8" strokeWidth={strokeWidth ? strokeWidth * 0.8 : 1.2} />
      {/* Neck */}
      <path d="M10 19 L10 22 M14 19 L14 22" />
      <path d="M9 22 Q12 23 15 22" />
    </svg>
  );
}

/** Crescent Moon — calm / evening marker */
export function CrescentIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 13.5 A8 8 0 1 1 10.5 4 A6 6 0 0 0 20 13.5 Z" />
    </svg>
  );
}

/** Water Drop — Hydration / skincare */
export function WaterDropIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2 L18 10 Q20 13 20 15 A8 8 0 0 1 4 15 Q4 13 6 10 Z" />
      <path d="M9 14 Q10 12 12 11" strokeWidth={1} opacity={0.5} />
    </svg>
  );
}

/** Infinity Loop — Renewal / transformation */
export function InfinityLoopIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 12 C10 8 6 6 4 8 C2 10 2 14 4 16 C6 18 10 16 12 12 C14 8 18 6 20 8 C22 10 22 14 20 16 C18 18 14 16 12 12 Z" />
    </svg>
  );
}

/** Feather — Lightness / softness */
export function FeatherIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5Z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

/** Star Cluster — Premium / results */
export function StarClusterIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="1.5" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="12" cy="5" r="1" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="12" cy="19" r="1" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="5" cy="12" r="1" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="19" cy="12" r="1" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="7.5" cy="7.5" r="0.75" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="16.5" cy="7.5" r="0.75" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="7.5" cy="16.5" r="0.75" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="16.5" cy="16.5" r="0.75" fill={color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

/** Diamond Leaf — Aesthetics service */
export function DiamondLeafIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3 L20 12 L12 21 L4 12 Z" />
      <path d="M12 6 L12 18" />
      <path d="M8.5 9.5 L15.5 14.5" />
    </svg>
  );
}

// ─── Service Icons ────────────────────────────────────────────────────────────

/** Nail Polish — Nails service */
export function NailPolishIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="10" width="6" height="11" rx="1.5" />
      <rect x="10.5" y="7" width="3" height="3" rx="0.5" />
      <rect x="10" y="4" width="4" height="3" rx="1" />
      <line x1="12" y1="4" x2="12" y2="2" />
    </svg>
  );
}

/** Hair Strands — Hair services */
export function HairIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 3 Q9 8 8 14 Q7 18 8 21" />
      <path d="M12 3 Q12 9 12 14 Q12 18 12 21" />
      <path d="M17 3 Q15 8 16 14 Q17 18 16 21" />
      <path d="M5 12 Q12 10 19 12" strokeWidth={1} opacity={0.5} />
    </svg>
  );
}

/** Laser beam — Laser hair removal */
export function LaserIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="8" y="3" width="8" height="5" rx="1.5" />
      <line x1="12" y1="8" x2="12" y2="18" />
      <path d="M9 12 L7 18" opacity={0.4} />
      <path d="M15 12 L17 18" opacity={0.4} />
      <circle cx="12" cy="20" r="2" />
    </svg>
  );
}

/** Massage hands — Wellness */
export function WellnessIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 16 Q8 12 12 13 Q16 14 20 10" />
      <path d="M9 10 Q10 7 12 8 Q14 9 13 12" />
      <path d="M15 5 Q16 4 17 5" strokeWidth={1} />
      <path d="M17 7 Q18.5 6 19 7.5" strokeWidth={1} />
    </svg>
  );
}

/** Aesthetics syringe — Cosmetic procedures */
export function AestheticsIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="6" y1="18" x2="16" y2="8" />
      <line x1="16" y1="8" x2="19" y2="5" />
      <line x1="5" y1="19" x2="3" y2="21" />
      <rect x="8" y="10" width="6" height="3" rx="0.5" transform="rotate(-45 11 11.5)" />
      <line x1="10.5" y1="15" x2="13.5" y2="12" strokeWidth={0.75} />
    </svg>
  );
}

/** ORA Branding mark */
export function OraMarkIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12 Q8 8 12 8 Q16 8 16 12 Q16 16 12 16 Q8 16 8 12" strokeWidth={0.75} opacity={0.5} />
      <circle cx="12" cy="4.5" r="1" fill={color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

// ─── NEW: Wellness / IV / Medical Beauty Icons ────────────────────────────────

/** IV Drip bag — Vitamin infusion / IV therapy */
export function IVDripIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* IV bag */}
      <path d="M9 3 Q9 2 12 2 Q15 2 15 3 L15 9 Q15 12 12 12 Q9 12 9 9 Z" />
      {/* Hanger loop */}
      <path d="M12 2 L12 1" />
      <path d="M10 1 Q12 0.5 14 1" />
      {/* Drip tube */}
      <line x1="12" y1="12" x2="12" y2="16" />
      {/* Drip chamber */}
      <rect x="10.5" y="15" width="3" height="4" rx="0.5" />
      {/* Needle line */}
      <line x1="12" y1="19" x2="12" y2="22" />
      {/* Droplet */}
      <circle cx="12" cy="14" r="0.75" fill={color ?? "currentColor"} stroke="none" opacity={0.6} />
    </svg>
  );
}

/** Vitamin D sun — Vitamin D / light therapy */
export function VitaminDIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Sun circle */}
      <circle cx="12" cy="12" r="4" />
      {/* Rays */}
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="5.5" y1="5.5" x2="7.2" y2="7.2" />
      <line x1="16.8" y1="16.8" x2="18.5" y2="18.5" />
      <line x1="18.5" y1="5.5" x2="16.8" y2="7.2" />
      <line x1="7.2" y1="16.8" x2="5.5" y2="18.5" />
    </svg>
  );
}

/** Oxygen molecule — Oxygen therapy */
export function OxygenIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* O2 molecule — two circles connected */}
      <circle cx="8" cy="12" r="4.5" />
      <circle cx="16" cy="12" r="4.5" />
      {/* Subscript 2 hint — small line below */}
      <line x1="14.5" y1="18" x2="17.5" y2="18" strokeWidth={1} opacity={0.5} />
    </svg>
  );
}

/** Glow face — Facial / skin treatment */
export function FacialIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Face oval */}
      <path d="M8 7 Q8 3 12 3 Q16 3 16 7 L16 14 Q16 19 12 19 Q8 19 8 14 Z" />
      {/* Eyes */}
      <path d="M9.5 10 Q10 9 10.5 10" strokeWidth={1} />
      <path d="M13.5 10 Q14 9 14.5 10" strokeWidth={1} />
      {/* Smile */}
      <path d="M10 14 Q12 16 14 14" strokeWidth={1} />
      {/* Glow rays */}
      <line x1="6" y1="5" x2="4.5" y2="3.5" strokeWidth={0.75} opacity={0.6} />
      <line x1="18" y1="5" x2="19.5" y2="3.5" strokeWidth={0.75} opacity={0.6} />
      <line x1="4" y1="10" x2="2.5" y2="10" strokeWidth={0.75} opacity={0.6} />
      <line x1="20" y1="10" x2="21.5" y2="10" strokeWidth={0.75} opacity={0.6} />
    </svg>
  );
}

/** Lash eye — Lash extensions */
export function LashIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Eye shape */}
      <path d="M3 12 Q8 6 12 6 Q16 6 21 12 Q16 18 12 18 Q8 18 3 12Z" />
      {/* Iris */}
      <circle cx="12" cy="12" r="3" />
      {/* Pupil */}
      <circle cx="12" cy="12" r="1.2" fill={color ?? "currentColor"} stroke="none" opacity={0.4} />
      {/* Lashes */}
      <line x1="8" y1="7" x2="7.5" y2="4.5" />
      <line x1="10.5" y1="6.2" x2="10.5" y2="3.5" />
      <line x1="12" y1="6" x2="12" y2="3" />
      <line x1="13.5" y1="6.2" x2="13.5" y2="3.5" />
      <line x1="16" y1="7" x2="16.5" y2="4.5" />
    </svg>
  );
}

/** Elegant brow arch */
export function BrowIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Brow arch */}
      <path d="M4 14 Q8 7 16 8 Q19 8.5 20 11" />
      {/* Arch highlight */}
      <path d="M5 15.5 Q9 9 16.5 10 Q19 10.5 20 13" strokeWidth={0.75} opacity={0.4} />
      {/* Tweezer hint */}
      <line x1="17" y1="18" x2="20" y2="15" strokeWidth={1} />
      <line x1="18.5" y1="18.5" x2="21.5" y2="15.5" strokeWidth={1} />
      <line x1="20" y1="20" x2="19.2" y2="16.8" strokeWidth={0.5} opacity={0.4} />
    </svg>
  );
}

/** Banana bag / drip — Nutrient infusion */
export function NutrientDripIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Bag body — rounded rectangle */}
      <rect x="8" y="3" width="8" height="11" rx="4" />
      {/* Hanger */}
      <path d="M10 3 Q12 1.5 14 3" />
      {/* Tube going down from bag */}
      <line x1="12" y1="14" x2="12" y2="18" />
      {/* Drip chamber */}
      <ellipse cx="12" cy="19" rx="1.5" ry="2" />
      {/* Micro droplets inside bag */}
      <circle cx="11" cy="8" r="0.6" fill={color ?? "currentColor"} stroke="none" opacity={0.4} />
      <circle cx="13" cy="7" r="0.6" fill={color ?? "currentColor"} stroke="none" opacity={0.4} />
      <circle cx="12" cy="10" r="0.6" fill={color ?? "currentColor"} stroke="none" opacity={0.4} />
    </svg>
  );
}

/** Spa stone — Hot stone massage */
export function SpaStoneIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Large stone */}
      <ellipse cx="12" cy="15" rx="7" ry="4.5" />
      {/* Small stone */}
      <ellipse cx="7" cy="12" rx="3.5" ry="2.5" />
      {/* Heat waves */}
      <path d="M10 8 Q11 6 12 8" strokeWidth={1} opacity={0.6} />
      <path d="M12 7 Q13 5 14 7" strokeWidth={1} opacity={0.6} />
      <path d="M14 8 Q15 6 16 8" strokeWidth={1} opacity={0.6} />
    </svg>
  );
}

/** Collagen / peptide molecule — Anti-aging */
export function CollagenIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none"
      stroke={color ?? "currentColor"} strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Helix strands */}
      <path d="M8 3 Q11 6 8 9 Q5 12 8 15 Q11 18 8 21" />
      <path d="M16 3 Q13 6 16 9 Q19 12 16 15 Q13 18 16 21" />
      {/* Cross links */}
      <line x1="8" y1="6" x2="16" y2="6" strokeWidth={0.75} opacity={0.5} />
      <line x1="8" y1="12" x2="16" y2="12" strokeWidth={0.75} opacity={0.5} />
      <line x1="8" y1="18" x2="16" y2="18" strokeWidth={0.75} opacity={0.5} />
    </svg>
  );
}
