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

// Full-screen "power discovered" reveal (PowerRevealScreen) — one set of
// raw hex values per belt, since the screen needs a two-stop gradient plus
// several text/badge colors tuned for contrast against it, not just the
// single flat brand color BRACELET_CSS_VAR gives. White is special-cased
// (dark badge/text on a light neutral background) for the same contrast
// reason BRACELET_ROAD_COLOR is.
export interface PowerRevealTheme {
  gradientFrom: string;
  gradientTo: string;
  badgeBg: string;
  badgeIcon: string;
  badgeBorder: string | null;
  heading: string;
  muted: string;
  buttonBg: string;
  buttonText: string;
}

export const POWER_REVEAL_THEME: Record<BraceletColor, PowerRevealTheme> = {
  white: {
    gradientFrom: "#ECECEF",
    gradientTo: "#D6D6DB",
    badgeBg: "#ffffff",
    badgeIcon: "#2C2C30",
    badgeBorder: "#2C2C30",
    heading: "#2C2C30",
    muted: "#6A6A72",
    buttonBg: "#2C2C30",
    buttonText: "#ffffff",
  },
  orange: {
    gradientFrom: "#FF8A3D",
    gradientTo: "#E85D1F",
    badgeBg: "#ffffff",
    badgeIcon: "#E85D1F",
    badgeBorder: null,
    heading: "#ffffff",
    muted: "#FFE8D6",
    buttonBg: "#ffffff",
    buttonText: "#E85D1F",
  },
  green: {
    gradientFrom: "#22C55E",
    gradientTo: "#178F45",
    badgeBg: "#ffffff",
    badgeIcon: "#178F45",
    badgeBorder: null,
    heading: "#ffffff",
    muted: "#DCFCE7",
    buttonBg: "#ffffff",
    buttonText: "#178F45",
  },
  blue: {
    gradientFrom: "#3B82F6",
    gradientTo: "#1D5FD1",
    badgeBg: "#ffffff",
    badgeIcon: "#1D5FD1",
    badgeBorder: null,
    heading: "#ffffff",
    muted: "#DCE9FE",
    buttonBg: "#ffffff",
    buttonText: "#1D5FD1",
  },
  purple: {
    gradientFrom: "#A32894",
    gradientTo: "#7A1D6E",
    badgeBg: "#ffffff",
    badgeIcon: "#7A1D6E",
    badgeBorder: null,
    heading: "#ffffff",
    muted: "#F3DCF0",
    buttonBg: "#ffffff",
    buttonText: "#7A1D6E",
  },
};
