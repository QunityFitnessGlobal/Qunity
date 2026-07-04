import type { BraceletColor } from "@/lib/types";

// Bracelet-color styling must come from these `bracelet-*` theme tokens (see
// globals.css) rather than one-off hex values in components. Color display
// names live in the "colors" message namespace (messages/he.json, en.json),
// not here, so they go through the normal i18n path.
export const BRACELET_BADGE_CLASSES: Record<BraceletColor, string> = {
  white: "bg-bracelet-white border-2 border-bracelet-white-outline",
  orange: "bg-bracelet-orange",
  green: "bg-bracelet-green",
  blue: "bg-bracelet-blue",
  purple: "bg-bracelet-purple",
};

// CSS custom property name for each belt color (defined in globals.css),
// for contexts (inline styles, gradients) that need the raw color value
// rather than a Tailwind background-color class.
export const BRACELET_CSS_VAR: Record<BraceletColor, string> = {
  white: "var(--color-bracelet-white)",
  orange: "var(--color-bracelet-orange)",
  green: "var(--color-bracelet-green)",
  blue: "var(--color-bracelet-blue)",
  purple: "var(--color-bracelet-purple)",
};

// Road-line tint per belt (JourneyPath's connecting line) — same as
// BRACELET_CSS_VAR except white, which is overridden to a visibly darker
// neutral. The page background is plain white, so a road segment drawn in
// the real bracelet-white (#f1f1f4) would be nearly invisible against it.
export const BRACELET_ROAD_COLOR: Record<BraceletColor, string> = {
  white: "#d4d4d8",
  orange: "var(--color-bracelet-orange)",
  green: "var(--color-bracelet-green)",
  blue: "var(--color-bracelet-blue)",
  purple: "var(--color-bracelet-purple)",
};
