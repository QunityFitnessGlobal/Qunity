"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { COLOR_ORDER } from "@/services/progression.service";
import { LevelUpScreen } from "@/components/child/LevelUpScreen";
import type { BraceletColor } from "@/lib/types";

export type StageRequirements = Partial<Record<BraceletColor, { workouts: number; points: number }>>;

interface LevelUpPreviewTesterProps {
  // Each stage's real requirements (bracelet_levels), so the preview shows
  // the same numbers a real level-up into that stage would.
  stages: StageRequirements;
}

// TEMP — display-only preview so the LevelUpScreen can be checked for every
// stage transition without actually finishing a stage. Never writes to the
// DB. Remove once the real level-up flow has been verified end to end.
export function LevelUpPreviewTester({ stages }: LevelUpPreviewTesterProps) {
  const t = useTranslations("settings");
  const [stageInput, setStageInput] = useState("2");
  const [preview, setPreview] = useState<{ from: BraceletColor; to: BraceletColor } | null>(null);

  function handleShow() {
    const index = Number(stageInput) - 1;
    const to = COLOR_ORDER[index];
    const from = COLOR_ORDER[index - 1];
    if (to && from) setPreview({ from, to });
  }

  return (
    <>
      <div className="w-full max-w-sm rounded-md border border-dashed border-zinc-300 p-3">
        <p className="mb-2 text-xs text-text-muted">{t("levelUpPreview.label")}</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={2}
            max={COLOR_ORDER.length}
            value={stageInput}
            onChange={(e) => setStageInput(e.target.value)}
            placeholder={t("levelUpPreview.placeholder")}
            className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleShow}
            className="flex-1 rounded-md border border-zinc-300 py-1 text-sm hover:bg-zinc-50"
          >
            {t("levelUpPreview.button")}
          </button>
        </div>
      </div>

      {preview && (
        <LevelUpScreen
          fromColor={preview.from}
          toColor={preview.to}
          workouts={stages[preview.to]?.workouts ?? 0}
          points={stages[preview.to]?.points ?? 0}
          onContinue={() => setPreview(null)}
        />
      )}
    </>
  );
}
