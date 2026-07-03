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
