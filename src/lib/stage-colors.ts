import type { BraceletColor } from "@/lib/types";

// The small dot in a child's stage color, as Tailwind classes — the white
// stage gets an outline so it shows on white.
export const STAGE_DOT_CLASS: Record<BraceletColor, string> = {
  white: "bg-bracelet-white shadow-[inset_0_0_0_1.5px_var(--color-bracelet-white-outline)]",
  orange: "bg-bracelet-orange",
  green: "bg-bracelet-green",
  blue: "bg-bracelet-blue",
  purple: "bg-bracelet-purple",
};
