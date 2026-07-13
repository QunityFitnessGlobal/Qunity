"use client";

import { useLocale, useTranslations } from "next-intl";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { Button } from "@/components/ui/Button";
import type { LocalizedText } from "@/lib/i18n-content";

interface ChallengeUnlockedModalProps {
  title: LocalizedText;
  colorLabel: string;
  onDoNow: () => void;
  onPostpone: () => void;
}

// Shown when a "type B" repeatable challenge unlocks (a belt color was just
// finished) — either right after the level-up screen (WorkoutRunner) or
// from the child's own test trigger on the Challenges page.
export function ChallengeUnlockedModal({
  title,
  colorLabel,
  onDoNow,
  onPostpone,
}: ChallengeUnlockedModalProps) {
  const t = useTranslations("challengeUnlockedModal");
  const locale = useLocale();

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm space-y-2 rounded-lg bg-white p-5 text-center shadow-lg">
        <p className="text-sm font-semibold text-brand-purple">{t("title")}</p>
        <h2 className="text-lg font-bold">{resolveLocalizedText(title, locale)}</h2>
        <p className="text-sm text-zinc-600">{t("body", { color: colorLabel })}</p>
        <div className="space-y-2 pt-2">
          <Button className="w-full" onClick={onDoNow}>
            {t("doNow")}
          </Button>
          <Button className="w-full bg-zinc-700 hover:bg-zinc-800" onClick={onPostpone}>
            {t("postpone")}
          </Button>
        </div>
      </div>
    </div>
  );
}
