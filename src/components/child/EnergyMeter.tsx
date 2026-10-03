import { POWER_REVEAL_THEME } from "@/lib/colors";
import type { BraceletColor } from "@/lib/types";

interface EnergyMeterProps {
  percent: number;
  color: BraceletColor;
}

// Replaces the old flat ProgressBar: a thicker, glowing bar in the
// belt-color gradient (same two stops as PowerRevealScreen), so the
// everyday progress display shares the power reveal's visual language.
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
    </div>
  );
}
