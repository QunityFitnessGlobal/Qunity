"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import { POWER_ICON } from "@/lib/powers";
import type { BraceletColor } from "@/lib/types";

// "open": the stage's first workout is done, so its power was already
// revealed — the gate shows that power. "next": the closest gate still
// closed, the one the child is heading for — a live mystery box.
// "locked": a gate further up, also closed but at rest.
export type StageGateState = "open" | "next" | "locked";

// Height the journey path reserves for a gate, so the road meets its middle.
export const STAGE_GATE_HEIGHT = 60;

interface JourneyLevelMarkerProps {
  // The stage being entered (the one right above this gate on the path,
  // since higher global_number renders higher up).
  beltColor: BraceletColor;
  gate: StageGateState;
  style?: CSSProperties;
}

const STAR_CLIP = "polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)";

// The gate between two stages. Until its power is revealed it looks like the
// challenges screen's mystery boxes, so "something is waiting" reads the same
// everywhere; once revealed it shows the power that was found there.
export function JourneyLevelMarker({ beltColor, gate, style }: JourneyLevelMarkerProps) {
  const t = useTranslations("journey");
  const tColors = useTranslations("colors");
  const tPowers = useTranslations("powers");
  const stageColor = BRACELET_CSS_VAR[beltColor];

  if (gate === "open") {
    const Icon = POWER_ICON[beltColor];
    return (
      <div
        style={{ ...style, height: STAGE_GATE_HEIGHT, borderColor: stageColor }}
        className="absolute flex w-[200px] items-center gap-3 rounded-2xl border-2 bg-white px-3 shadow-sm"
      >
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full"
          style={{ backgroundColor: stageColor }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
            <Icon className="h-4 w-4" style={{ color: stageColor }} />
          </span>
        </span>
        <span className="min-w-0 text-right">
          <span className="block truncate font-display text-[15px] font-semibold">{tPowers(`${beltColor}.name`)}</span>
          <span className="block text-xs text-text-muted">{tColors("badge", { color: tColors(beltColor) })}</span>
        </span>
      </div>
    );
  }

  const live = gate === "next";

  return (
    <div
      style={{ ...style, height: STAGE_GATE_HEIGHT }}
      className="absolute flex w-[220px] items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-box-a to-box-b px-3 text-right shadow-[0_4px_0_var(--color-box-edge),0_8px_18px_rgba(52,30,99,0.12)]"
    >
      {live && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/70 to-transparent animate-mystery-shine"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-10 top-2 h-2.5 w-2.5 bg-white/80 animate-mystery-twinkle"
            style={{ clipPath: STAR_CLIP }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-3 h-2 w-2 bg-white/80 animate-mystery-twinkle"
            style={{ clipPath: STAR_CLIP, ["--twinkle-delay" as string]: "1.4s" }}
          />
        </>
      )}
      <span className="relative flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-box-tile-a to-box-tile-b shadow-[inset_0_-3px_0_var(--color-box-edge)]">
        <span className={`inline-block font-display text-[26px] font-bold text-box-ink ${live ? "animate-mystery-bob" : ""}`}>?</span>
      </span>
      <span className="relative min-w-0">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 flex-none rounded-full"
            style={{ backgroundColor: stageColor }}
          />
          <span className="truncate font-display text-[15px] font-semibold text-zinc-700">
            {t("gateTitle", { color: tColors(beltColor) })}
          </span>
        </span>
        <span className="block text-xs text-zinc-600">{t("gateHint")}</span>
      </span>
    </div>
  );
}
