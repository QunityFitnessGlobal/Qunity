import type { ComponentType, SVGProps } from "react";
import { PlayIcon, FlameIcon, StarIcon, TrendingUpIcon, SparkleIcon } from "@/components/child/powerIcons";
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
