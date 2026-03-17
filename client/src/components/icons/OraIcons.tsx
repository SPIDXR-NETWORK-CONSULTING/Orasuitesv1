/**
 * ORA SUITES — Custom Icon Set
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

/** Lotus / petal — Wellness section header */
export function LotusIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Central petal */}
      <path d="M12 20 C12 20 8 16 8 11 C8 7 10 4 12 4 C14 4 16 7 16 11 C16 16 12 20 12 20Z" />
      {/* Left petal */}
      <path d="M12 18 C12 18 6 15 5 10 C4 6 6 3 9 4 C11 5 12 8 12 11" />
      {/* Right petal */}
      <path d="M12 18 C12 18 18 15 19 10 C20 6 18 3 15 4 C13 5 12 8 12 11" />
      {/* Stem */}
      <path d="M12 20 L12 22" />
      {/* Water line */}
      <path d="M8 22 Q12 21 16 22" />
    </svg>
  );
}

/** Diamond Leaf — Aesthetics service */
export function DiamondLeafIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Diamond shape */}
      <path d="M12 3 L20 12 L12 21 L4 12 Z" />
      {/* Leaf vein */}
      <path d="M12 6 L12 18" />
      <path d="M8.5 9.5 L15.5 14.5" />
    </svg>
  );
}

/** Korean Wave — Korean Head Spa */
export function KoreanWaveIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Head silhouette */}
      <path d="M8 8 Q8 4 12 4 Q16 4 16 8 L16 13 Q16 17 12 17 Q8 17 8 13 Z" />
      {/* Wave lines over head (water flowing) */}
      <path d="M5 6 Q6.5 4.5 8 6 Q9.5 7.5 11 6" />
      <path d="M13 6 Q14.5 4.5 16 6 Q17.5 7.5 19 6" />
      {/* Neck/shoulders */}
      <path d="M10 17 L9 20 M14 17 L15 20" />
      <path d="M8 20 Q12 22 16 20" />
    </svg>
  );
}

/** Crescent Moon — Women-only marker */
export function CrescentIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 13.5 A8 8 0 1 1 10.5 4 A6 6 0 0 0 20 13.5 Z" />
    </svg>
  );
}

/** Water Drop — Hydration / skincare */
export function WaterDropIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2 L18 10 Q20 13 20 15 A8 8 0 0 1 4 15 Q4 13 6 10 Z" />
      {/* Inner highlight */}
      <path d="M9 14 Q10 12 12 11" strokeWidth={1} opacity={0.5} />
    </svg>
  );
}

/** Infinity Loop — Renewal / transformation */
export function InfinityLoopIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 12 C10 8 6 6 4 8 C2 10 2 14 4 16 C6 18 10 16 12 12 C14 8 18 6 20 8 C22 10 22 14 20 16 C18 18 14 16 12 12 Z" />
    </svg>
  );
}

/** Feather — Lightness / softness */
export function FeatherIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Feather body */}
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5Z" />
      {/* Quill */}
      <line x1="16" y1="8" x2="2" y2="22" />
      {/* Vane lines */}
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

/** Star Cluster — Premium / results */
export function StarClusterIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Central star */}
      <circle cx="12" cy="12" r="1.5" fill={color ?? "currentColor"} stroke="none" />
      {/* Radiating dots */}
      <circle cx="12" cy="5" r="1" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="12" cy="19" r="1" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="5" cy="12" r="1" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="19" cy="12" r="1" fill={color ?? "currentColor"} stroke="none" />
      {/* Diagonal dots */}
      <circle cx="7.5" cy="7.5" r="0.75" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="16.5" cy="7.5" r="0.75" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="7.5" cy="16.5" r="0.75" fill={color ?? "currentColor"} stroke="none" />
      <circle cx="16.5" cy="16.5" r="0.75" fill={color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

/** Nail Polish — Nails service */
export function NailPolishIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Bottle body */}
      <rect x="9" y="10" width="6" height="11" rx="1.5" />
      {/* Bottle neck */}
      <rect x="10.5" y="7" width="3" height="3" rx="0.5" />
      {/* Cap */}
      <rect x="10" y="4" width="4" height="3" rx="1" />
      {/* Brush handle */}
      <line x1="12" y1="4" x2="12" y2="2" />
    </svg>
  );
}

/** Hair Scissors — Hair services */
export function HairIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Hair strands */}
      <path d="M7 3 Q9 8 8 14 Q7 18 8 21" />
      <path d="M12 3 Q12 9 12 14 Q12 18 12 21" />
      <path d="M17 3 Q15 8 16 14 Q17 18 16 21" />
      {/* Comb/style line */}
      <path d="M5 12 Q12 10 19 12" strokeWidth={1} opacity={0.5} />
    </svg>
  );
}

/** Laser beam — Laser hair removal */
export function LaserIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Device */}
      <rect x="8" y="3" width="8" height="5" rx="1.5" />
      {/* Beam */}
      <line x1="12" y1="8" x2="12" y2="18" />
      {/* Beam spread */}
      <path d="M9 12 L7 18" opacity={0.4} />
      <path d="M15 12 L17 18" opacity={0.4} />
      {/* Target */}
      <circle cx="12" cy="20" r="2" />
    </svg>
  );
}

/** Massage hands — Wellness */
export function WellnessIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Body outline (reclining) */}
      <path d="M4 16 Q8 12 12 13 Q16 14 20 10" />
      {/* Hands above */}
      <path d="M9 10 Q10 7 12 8 Q14 9 13 12" />
      {/* Relaxation lines */}
      <path d="M15 5 Q16 4 17 5" strokeWidth={1} />
      <path d="M17 7 Q18.5 6 19 7.5" strokeWidth={1} />
    </svg>
  );
}

/** Aesthetics syringe — Cosmetic procedures */
export function AestheticsIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Syringe body at 45° */}
      <line x1="6" y1="18" x2="16" y2="8" />
      {/* Needle */}
      <line x1="16" y1="8" x2="19" y2="5" />
      {/* Plunger */}
      <line x1="5" y1="19" x2="3" y2="21" />
      {/* Barrel */}
      <rect x="8" y="10" width="6" height="3" rx="0.5" transform="rotate(-45 11 11.5)" />
      {/* Level marks */}
      <line x1="10.5" y1="15" x2="13.5" y2="12" strokeWidth={0.75} />
    </svg>
  );
}

/** ORA Branding mark — "O" monogram minimal */
export function OraMarkIcon({ size, color, strokeWidth, className }: IconProps = defaultProps) {
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="9" />
      {/* Inner accent arc */}
      <path d="M8 12 Q8 8 12 8 Q16 8 16 12 Q16 16 12 16 Q8 16 8 12" strokeWidth={0.75} opacity={0.5} />
      {/* Accent dot */}
      <circle cx="12" cy="4.5" r="1" fill={color ?? "currentColor"} stroke="none" />
    </svg>
  );
}
