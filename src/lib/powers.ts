import type { ComponentType, SVGProps } from "react";
import { PlayIcon, FlameIcon, StarIcon, TrendingUpIcon, SparkleIcon, TrophyIcon } from "@/components/child/powerIcons";
import type { BraceletColor } from "@/lib/types";

// Which icon represents each belt color's "power" on PowerRevealScreen.
// Name/code/quote text lives in the "powers" message namespace
// (messages/he.json, en.json) since it's translatable content — this map
// is icon-only, since icons aren't localized.
export const POWER_ICON: Record<BraceletColor, ComponentType<SVGProps<SVGSVGElement>>> = {
  white: PlayIcon,
  orange: FlameIcon,
  green: StarIcon,
  blue: TrendingUpIcon,
  purple: SparkleIcon,
};

// The bonus power for finishing the last stage ("כוח ההצלחה"): its trophy,
// and how it's drawn — a gold disc ringed in the five stage colors.
export const BONUS_POWER_ICON = TrophyIcon;
export const BONUS_POWER_RING =
  "conic-gradient(var(--color-bracelet-white) 0deg 72deg, var(--color-bracelet-orange) 72deg 144deg, var(--color-bracelet-green) 144deg 216deg, var(--color-bracelet-blue) 216deg 288deg, var(--color-bracelet-purple) 288deg 360deg)";
export const BONUS_POWER_GOLD = "radial-gradient(circle at 35% 30%, #fff3c4, var(--color-reward-gold) 55%, #d99a0b)";
