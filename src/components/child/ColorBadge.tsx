import { getTranslations } from "next-intl/server";
import { BRACELET_BADGE_CLASSES } from "@/lib/colors";
import type { BraceletColor } from "@/lib/types";

interface ColorBadgeProps {
  color: BraceletColor;
  size?: "sm" | "lg";
}

export async function ColorBadge({ color, size = "lg" }: ColorBadgeProps) {
  const t = await getTranslations("colors");
  const dimensionClass = size === "lg" ? "h-20 w-20" : "h-10 w-10";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${dimensionClass} rounded-full ${BRACELET_BADGE_CLASSES[color]}`} />
      <span className="text-sm font-semibold text-zinc-700">
        {t("badge", { color: t(color) })}
      </span>
    </div>
  );
}
