import type { CSSProperties } from "react";

// The child's skins: how the child screens look. A skin only swaps the
// --skin-* tokens (defaults in globals.css = the regular look) and adds a
// decorated backdrop (SkinBackdrop). Colors that mean something — stage
// colors, green for go/work, blue for rest, gold for points — never change.
// Skins are store_items rows (kind 'skin'); the key below is store_items.key.

export const SKIN_KEYS = ["qunity", "jungle", "space", "adventure"] as const;
export type SkinKey = (typeof SKIN_KEYS)[number];

export function isSkinKey(value: unknown): value is SkinKey {
  return typeof value === "string" && (SKIN_KEYS as readonly string[]).includes(value);
}

export interface SkinPalette {
  // The backdrop behind the screens (a gradient; SkinBackdrop adds the decorations).
  backdrop: string;
  tokens: Record<string, string>;
}

// The tokens each skin overrides. "page" is transparent so the backdrop
// (with its decorations) shows behind the screens.
export const SKIN_PALETTES: Record<Exclude<SkinKey, "qunity">, SkinPalette> = {
  space: {
    backdrop: "linear-gradient(180deg, #0a0d2a 0%, #141846 55%, #21184d 100%)",
    tokens: {
      page: "transparent",
      "page-solid": "#21184d",
      canvas: "transparent",
      surface: "#1a1f50",
      "surface-2": "#242a66",
      line: "#2d3574",
      divide: "#262c64",
      ink: "#f3f1ff",
      "ink-2": "#d3d1f2",
      muted: "#a6a9d8",
      faint: "#8186c0",
      accent: "#7c5cf0",
      "accent-ink": "#c4b5fd",
      "accent-deep": "#ddd3fe",
      "stage-white": "#f1f1f4",
      "gold-ink": "#ffd166",
      tab: "#11153a",
      road: "#283070",
      "road-dash": "#8f9bff",
      locked: "#2b3270",
      "locked-ink": "#c9c6ef",
      "work-bg": "rgba(12, 40, 44, 0.55)",
      "rest-bg": "rgba(14, 22, 64, 0.55)",
      "work-track": "#163838",
      "rest-track": "#1e2a62",
      "rest-line": "#2d3a7a",
      "ring-fill": "#141943",
      "work-label": "#4ade80",
      "rest-label": "#93c5fd",
      finish: "#3a4287",
      "finish-edge": "#1f2459",
      "demo-wall": "#ecebff",
      "demo-floor": "#dcd9fb",
      "demo-edge": "#c8c3f1",
      "demo-mat": "#cdc6f4",
      "demo-rest-wall": "#e8f0ff",
      "demo-rest-floor": "#d6e3fb",
      "demo-rest-edge": "#c2d3f4",
      "demo-rest-mat": "#c6d6f6",
    },
  },
  jungle: {
    backdrop: "linear-gradient(180deg, #f3f9ea 0%, #e9f3dc 100%)",
    tokens: {
      page: "transparent",
      "page-solid": "#e9f3dc",
      canvas: "transparent",
      surface: "#fffdf5",
      "surface-2": "#f3f1e2",
      line: "#dfe7cc",
      ink: "#1d2a17",
      "ink-2": "#3d4a33",
      muted: "#5d6b52",
      faint: "#7d8a70",
      accent: "#0f766e",
      "accent-ink": "#0f766e",
      "accent-deep": "#0b5a54",
      tab: "#fffdf5",
      road: "#e6d6a8",
      "road-dash": "#fffaf0",
      locked: "#d9d6c3",
      "locked-ink": "#5b5a4c",
      "work-bg": "rgba(238, 247, 228, 0.82)",
      "rest-bg": "rgba(234, 242, 251, 0.85)",
      "work-track": "#d6eecd",
      "rest-track": "#dbe7fb",
      "ring-fill": "#fffdf5",
      finish: "#3d4a33",
      "finish-edge": "#232b1d",
      "demo-wall": "#f1f6e6",
      "demo-floor": "#e1ebcd",
      "demo-edge": "#cfdcb6",
      "demo-mat": "#d3e2bc",
    },
  },
  adventure: {
    backdrop: "linear-gradient(180deg, #f3e4c2 0%, #ead3a3 100%)",
    tokens: {
      page: "transparent",
      "page-solid": "#ead3a3",
      canvas: "transparent",
      surface: "#fbf3df",
      "surface-2": "#f1e3c2",
      line: "#d8bf8c",
      ink: "#2b1d12",
      "ink-2": "#4a3523",
      muted: "#6b5640",
      faint: "#8a7458",
      accent: "#9b2c2c",
      "accent-ink": "#8f2525",
      "accent-deep": "#6f1f1f",
      tab: "#fbf3df",
      road: "#d6bb83",
      "road-dash": "#9b2c2c",
      locked: "#e6d5ae",
      "locked-ink": "#6b5640",
      "work-bg": "rgba(238, 240, 214, 0.82)",
      "rest-bg": "rgba(232, 236, 236, 0.85)",
      "work-track": "#d8e8c3",
      "rest-track": "#d4dfee",
      "ring-fill": "#fbf3df",
      finish: "#3b2416",
      "finish-edge": "#1f130b",
      "demo-wall": "#f6ecd2",
      "demo-floor": "#e7d4aa",
      "demo-edge": "#d2b986",
      "demo-mat": "#dcc596",
      "demo-rest-wall": "#edf0f4",
      "demo-rest-floor": "#dde3ec",
      "demo-rest-edge": "#c9d3e2",
      "demo-rest-mat": "#cbd6e6",
    },
  },
};

// The inline style for a skinned screen's root: its token overrides, and
// the text color they imply. The regular look needs nothing.
export function skinStyle(skin: SkinKey): CSSProperties | undefined {
  if (skin === "qunity") return undefined;
  const style: Record<string, string> = { color: "var(--skin-ink)" };
  for (const [name, value] of Object.entries(SKIN_PALETTES[skin].tokens)) style[`--skin-${name}`] = value;
  return style as CSSProperties;
}

// What the picker draws for each skin: its colors for the small preview.
export interface SkinPreview {
  bg: string;
  surface: string;
  line: string;
  header: string;
  accent: string;
  ink: string;
  tab: string;
}

export const SKIN_PREVIEWS: Record<SkinKey, SkinPreview> = {
  qunity: { bg: "#faf8fc", surface: "#ffffff", line: "#ece6f2", header: "#140e0c", accent: "#a32894", ink: "#221a33", tab: "#ffffff" },
  jungle: { bg: SKIN_PALETTES.jungle.backdrop, surface: "#fffdf5", line: "#dfe7cc", header: "#1f4a2c", accent: "#0f766e", ink: "#1d2a17", tab: "#fffdf5" },
  space: { bg: SKIN_PALETTES.space.backdrop, surface: "#1a1f50", line: "#2d3574", header: "transparent", accent: "#a78bfa", ink: "#f3f1ff", tab: "#1a1f50" },
  adventure: { bg: SKIN_PALETTES.adventure.backdrop, surface: "#fbf3df", line: "#d8bf8c", header: "#3b2416", accent: "#9b2c2c", ink: "#2b1d12", tab: "#fbf3df" },
};
