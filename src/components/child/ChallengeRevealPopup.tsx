"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { MysteryReveal, prefersReducedMotion } from "@/components/child/MysteryReveal";
import type { ChallengeDefinition } from "@/data/challenges.data";

interface ChallengeRevealPopupProps {
  // One-time ("condition") challenges just earned by this workout — see
  // WorkoutRunner's result stage. Revealed one at a time, in order; a power
  // challenge is never included here, since its own reveal already happened
  // on the power screen (see handlePowerContinue).
  challenges: ChallengeDefinition[];
  onDone: () => void;
}

interface RevealCardProps {
  challenge: ChallengeDefinition;
  indexLabel: string | null;
  onContinue: () => void;
}

// One challenge's own box→card reveal. Keyed by challenge id from the
// parent, so a fresh mount (and a fresh `revealed` state) is what advances
// to the next queued challenge.
function RevealCard({ challenge, indexLabel, onContinue }: RevealCardProps) {
  const t = useTranslations("challengeRevealPopup");
  // Matches MysteryReveal's own choice: with reduced motion it starts open.
  const [revealed, setRevealed] = useState(prefersReducedMotion);

  return (
    <div className="w-full max-w-sm rounded-[26px] bg-skin-surface p-5 text-center shadow-[0_20px_50px_rgba(34,26,51,0.25)]">
      <p className="text-[13px] font-semibold text-skin-accent-ink">{t("label")}</p>
      <h2 className="mt-0.5 font-display text-2xl font-bold">{revealed ? t("titleRevealed") : t("titleLocked")}</h2>

      <div className="mt-4">
        <MysteryReveal
          challenge={challenge}
          pointsLine={t("pointsAdded", { points: challenge.bonusPoints })}
          delayMs={900}
          size="lg"
          onRevealed={() => setRevealed(true)}
        />
      </div>

      {revealed && (
        <div className="mt-4 space-y-2">
          {indexLabel && (
            <p
              className="text-xs text-skin-muted animate-power-fade-up"
              style={{ "--power-fade-delay": "0s" } as CSSProperties}
            >
              {indexLabel}
            </p>
          )}
          <div className="animate-power-fade-up" style={{ "--power-fade-delay": "0.12s" } as CSSProperties}>
            <button
              type="button"
              onClick={onContinue}
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-green-600 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-transform hover:bg-green-700 active:translate-y-[3px]"
            >
              {t("continue")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Popup shown over the workout result screen the moment a "condition"
// challenge is newly earned — the box shakes, flips and bursts open into the
// real challenge card. The challenges screen then replays the same reveal
// once, on the child's next visit (see ChallengesTabs).
export function ChallengeRevealPopup({ challenges, onDone }: ChallengeRevealPopupProps) {
  const t = useTranslations("challengeRevealPopup");
  const [index, setIndex] = useState(0);
  const current = challenges[index];
  if (!current) return null;

  function handleContinue() {
    if (index < challenges.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onDone();
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#221a33]/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <RevealCard
        key={current.id}
        challenge={current}
        indexLabel={challenges.length > 1 ? t("progress", { current: index + 1, total: challenges.length }) : null}
        onContinue={handleContinue}
      />
    </div>
  );
}
