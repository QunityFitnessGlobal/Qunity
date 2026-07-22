"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { COLOR_ORDER } from "@/services/progression.service";
import { PowerRevealScreen } from "@/components/child/PowerRevealScreen";
import type { BraceletColor } from "@/lib/types";

// TEMP — display-only preview so the PowerRevealScreen can be checked for
// every color without actually finishing a belt. Never calls any mutating
// function (no DB writes at all), unlike the old ChallengeTestTrigger.
// Remove once the real level-up flow has been verified end to end.
export function PowerPreviewTester() {
  const t = useTranslations("settings");
  const [levelInput, setLevelInput] = useState("1");
  const [previewColor, setPreviewColor] = useState<BraceletColor | null>(null);

  function handleShow() {
    const color = COLOR_ORDER[Number(levelInput) - 1];
    if (color) setPreviewColor(color);
  }

  return (
    <>
      <div className="w-full max-w-sm rounded-md border border-dashed border-zinc-300 p-3">
        <p className="mb-2 text-xs text-text-muted">{t("powerPreview.label")}</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={COLOR_ORDER.length}
            value={levelInput}
            onChange={(e) => setLevelInput(e.target.value)}
            placeholder={t("powerPreview.placeholder")}
            className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleShow}
            className="flex-1 rounded-md border border-zinc-300 py-1 text-sm hover:bg-zinc-50"
          >
            {t("powerPreview.button")}
          </button>
        </div>
      </div>

      {previewColor && (
        <PowerRevealScreen color={previewColor} onContinue={() => setPreviewColor(null)} />
      )}
    </>
  );
}
