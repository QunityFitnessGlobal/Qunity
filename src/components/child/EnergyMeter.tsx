import { POWER_REVEAL_THEME } from "@/lib/colors";
import type { BraceletColor } from "@/lib/types";
import type { SVGProps } from "react";

interface EnergyMeterProps {
  percent: number;
  color: BraceletColor;
}

function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M11 1L4 12h4l-1 7 7-11H10l1-7z" />
    </svg>
  );
}

// Replaces the old flat ProgressBar: a thicker, glowing bar (belt-color
// gradient, same two stops as PowerRevealScreen) with a small lightning
// badge riding the leading edge of the fill, so the everyday progress
// display shares the same "energy" visual language as the power reveal.
export function EnergyMeter({ percent, color }: EnergyMeterProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const theme = POWER_REVEAL_THEME[color];

  return (
    <div className="relative h-6 w-full">
      <div
        className="animate-power-glow-pulse absolute inset-0 rounded-full blur-md"
        style={{ background: `linear-gradient(90deg, ${theme.gradientFrom}, ${theme.gradientTo})` }}
      />
      <div className="relative h-full w-full overflow-hidden rounded-full bg-black/80">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
          }}
        />
      </div>
      <div
        className="absolute top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
        style={{ insetInlineStart: `clamp(0px, calc(${clamped}% - 12px), calc(100% - 24px))` }}
      >
        <BoltIcon className="h-3.5 w-3.5" style={{ color: theme.badgeIcon }} />
      </div>
    </div>
  );
}
