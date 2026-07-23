import { getTranslations } from "next-intl/server";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import { POWER_ICON } from "@/lib/powers";
import type { BraceletColor } from "@/lib/types";

interface MinimalAvatarProps {
  color: BraceletColor;
}

// Minimal avatar MVP: a plain neutral circle (no illustrated character) with
// a colored ring showing the current belt and a small corner badge showing
// the belt's "power" icon (see src/lib/powers.ts) — same visual language as
// PowerRevealScreen, just at everyday-dashboard scale. Placed wherever
// ColorBadge used to sit (child's own dashboard home, parent's per-child
// view of that dashboard); ColorBadge itself is unchanged and still used
// for the leaderboard's small per-row badges.
export async function MinimalAvatar({ color }: MinimalAvatarProps) {
  const t = await getTranslations("colors");
  const Icon = POWER_ICON[color];
  const braceletVar = BRACELET_CSS_VAR[color];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div
          className="animate-power-glow-pulse absolute inset-0 rounded-full blur-md"
          style={{ backgroundColor: braceletVar }}
        />
        <div
          className="relative h-full w-full rounded-full border-4 bg-zinc-100"
          style={{ borderColor: braceletVar }}
        />
        <div className="animate-power-badge-pop absolute -end-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white">
          <Icon className="h-5 w-5" style={{ color: braceletVar }} />
        </div>
      </div>
      <span className="text-sm font-semibold text-zinc-700">
        {t("badge", { color: t(color) })}
      </span>
    </div>
  );
}
