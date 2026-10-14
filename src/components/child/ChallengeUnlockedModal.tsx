"use client";

import { useLocale, useTranslations } from "next-intl";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { StairsIcon } from "@/components/child/challengeIcons";
import type { LocalizedText } from "@/lib/i18n-content";
import type { Gender } from "@/lib/types";

interface ChallengeUnlockedModalProps {
  title: LocalizedText;
  // The most a single run pays.
  bonusPoints: number;
  // The stage just finished, which this challenge belongs to.
  colorLabel: string;
  gender: Gender | null;
  onDoNow: () => void;
  onPostpone: () => void;
}

// Shown when a "type B" repeatable challenge unlocks (a stage was just
// finished), from the result screen's "new challenge" button: a popup in the
// middle of the screen, in the challenge screens' look — the stairs on gold,
// the challenge's name and the most it pays.
export function ChallengeUnlockedModal({
  title,
  bonusPoints,
  colorLabel,
  gender,
  onDoNow,
  onPostpone,
}: ChallengeUnlockedModalProps) {
  const t = useTranslations("challengeUnlockedModal");
  const tRunner = useTranslations("challengeRunner");
  const locale = useLocale();
  const genderForm = gender ?? "male";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#221a33]/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenge-unlocked-title"
        className="animate-power-fade-up flex w-full max-w-sm flex-col items-center gap-2.5 rounded-[26px] bg-skin-surface px-5 pb-3 pt-6 text-center shadow-[0_20px_50px_rgba(34,26,51,0.25)]"
      >
        <span className="animate-power-badge-pop flex h-16 w-16 items-center justify-center rounded-2xl bg-reward-gold-soft">
          <StairsIcon className="h-9 w-9 text-reward-gold-ink" aria-hidden />
        </span>
        <span className="mt-1 text-[13px] font-semibold text-skin-accent-ink">{t("title")}</span>
        <h2 id="challenge-unlocked-title" className="font-display text-2xl font-bold leading-tight">
          {resolveLocalizedText(title, locale)}
        </h2>
        <p className="text-sm text-skin-muted">{t("body", { color: colorLabel, gender: genderForm })}</p>
        <span className="rounded-full bg-reward-gold-soft px-3 py-1 font-display text-[13px] font-semibold text-reward-gold-ink">
          {tRunner.rich("upToPoints", { points: bonusPoints, num: (chunks) => <bdi dir="ltr">{chunks}</bdi> })}
        </span>
        <button
          type="button"
          onClick={onDoNow}
          autoFocus
          className="mt-2 flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-green-600 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-transform hover:bg-green-700 active:translate-y-[3px]"
        >
          {t("doNow", { gender: genderForm })}
        </button>
        <button type="button" onClick={onPostpone} className="min-h-11 px-4 text-sm font-semibold text-skin-muted">
          {t("postpone")}
        </button>
      </div>
    </div>
  );
}
