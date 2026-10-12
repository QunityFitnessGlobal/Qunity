import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SKIN_KEYS, SKIN_PALETTES, SKIN_PREVIEWS, isSkinKey, skinStyle } from "@/lib/skins";
import { skinDecorSvg, skinMiniDecorSvg } from "@/lib/skin-decor";

// The --skin-* tokens globals.css defines (with the regular look's values).
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");
const rootTokens = new Set([...css.matchAll(/^\s*--skin-([a-z0-9-]+):/gm)].map((m) => m[1]));

describe("skins", () => {
  it("knows its keys", () => {
    expect(isSkinKey("space")).toBe(true);
    expect(isSkinKey("qunity")).toBe(true);
    expect(isSkinKey("lava")).toBe(false);
    expect(isSkinKey(null)).toBe(false);
  });

  it("leaves the regular look alone", () => {
    expect(skinStyle("qunity")).toBeUndefined();
  });

  it("only overrides tokens globals.css defines, so every one has a default", () => {
    expect(rootTokens.size).toBeGreaterThan(20);
    for (const palette of Object.values(SKIN_PALETTES)) {
      for (const name of Object.keys(palette.tokens)) {
        expect(rootTokens, `--skin-${name}`).toContain(name);
      }
    }
  });

  it("gives every token a color, and shows the backdrop through the page", () => {
    const color = /^(#[0-9a-f]{6}|rgba\(\d+, \d+, \d+, [\d.]+\)|transparent)$/;
    for (const palette of Object.values(SKIN_PALETTES)) {
      expect(palette.tokens.page).toBe("transparent");
      expect(palette.tokens.canvas).toBe("transparent");
      for (const value of Object.values(palette.tokens)) expect(value).toMatch(color);
    }
  });

  it("sets the text color and the tokens on a skinned root", () => {
    const style = skinStyle("space") as Record<string, string>;
    expect(style.color).toBe("var(--skin-ink)");
    expect(style["--skin-surface"]).toBe(SKIN_PALETTES.space.tokens.surface);
  });

  it("has a preview for every skin", () => {
    for (const key of SKIN_KEYS) expect(SKIN_PREVIEWS[key]).toBeDefined();
  });

  it("draws every decoration from numbers only", () => {
    for (const key of SKIN_KEYS) {
      const svg = key === "qunity" ? skinMiniDecorSvg(key, 170, 74) : skinDecorSvg(key) + skinMiniDecorSvg(key, 170, 74);
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    }
    expect(skinDecorSvg("space")).toBe(skinDecorSvg("space"));
  });
});
