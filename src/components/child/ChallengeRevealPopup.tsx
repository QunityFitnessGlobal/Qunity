"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
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
    <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-xl">
      <p className="text-xs font-semibold tracking-wide text-brand-purple">{t("label")}</p>
      <h2 className="mt-0.5 text-lg font-bold">{revealed ? t("titleRevealed") : t("titleLocked")}</h2>

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
              className="text-xs text-zinc-500 animate-power-fade-up"
              style={{ "--power-fade-delay": "0s" } as CSSProperties}
            >
              {indexLabel}
            </p>
          )}
          <div className="animate-power-fade-up" style={{ "--power-fade-delay": "0.12s" } as CSSProperties}>
            <Button className="w-full" onClick={onContinue}>
              {t("continue")}
            </Button>
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
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
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
