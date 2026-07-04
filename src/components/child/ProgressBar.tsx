import { BRACELET_CSS_VAR } from "@/lib/colors";
import type { BraceletColor } from "@/lib/types";

interface ProgressBarProps {
  percent: number;
  color: BraceletColor;
}

export function ProgressBar({ percent, color }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-black">
      <div
        className="h-full rounded-full border border-black transition-all"
        style={{ width: `${clamped}%`, backgroundColor: BRACELET_CSS_VAR[color] }}
      />
    </div>
  );
}
