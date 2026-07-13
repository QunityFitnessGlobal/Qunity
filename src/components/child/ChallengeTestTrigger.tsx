"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { unlockColorChallenge } from "@/services/challenge.service";
import { COLOR_ORDER } from "@/services/progression.service";
import { ChallengeUnlockedModal } from "@/components/child/ChallengeUnlockedModal";
import type { ChallengeDefinition } from "@/data/challenges.data";

interface ChallengeTestTriggerProps {
  childId: string;
}

// TEMP — testing-only control so the type-B unlock flow can be exercised
// without actually grinding out an entire belt color. Remove once real
// level-finish events have been verified end to end (same convention as the
// old tips manual-test-mode field).
export function ChallengeTestTrigger({ childId }: ChallengeTestTriggerProps) {
  const t = useTranslations("challengesPage");
  const tColors = useTranslations("colors");
  const router = useRouter();
  const [levelNumber, setLevelNumber] = useState("1");
  const [unlocked, setUnlocked] = useState<ChallengeDefinition | null>(null);

  async function handleTrigger() {
    const index = Number(levelNumber) - 1;
    const color = COLOR_ORDER[index];
    if (!color) return;

    const supabase = createClient();
    const result = await unlockColorChallenge(supabase, childId, color);
    if (result) {
      setUnlocked(result);
    }
  }

  return (
    <div className="rounded-md border border-dashed border-zinc-300 p-3">
      <p className="mb-2 text-xs text-text-muted">{t("testTriggerLabel")}</p>
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={COLOR_ORDER.length}
          value={levelNumber}
          onChange={(e) => setLevelNumber(e.target.value)}
          placeholder={t("testTriggerPlaceholder")}
          className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={handleTrigger}
          className="flex-1 rounded-md border border-zinc-300 py-1 text-sm hover:bg-zinc-50"
        >
          {t("testTriggerButton")}
        </button>
      </div>

      {unlocked && (
        <ChallengeUnlockedModal
          title={unlocked.title}
          colorLabel={unlocked.unlockColor ? tColors(unlocked.unlockColor) : ""}
          onDoNow={() => router.push(`/challenge/${unlocked.id}`)}
          onPostpone={() => setUnlocked(null)}
        />
      )}
    </div>
  );
}
