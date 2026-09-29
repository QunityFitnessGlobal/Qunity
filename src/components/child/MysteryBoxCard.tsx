"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MysteryBoxContents } from "@/components/child/MysteryBoxContents";

// A locked challenge, of either kind (condition or repeatable), shown as an
// identical grey "mystery box" until it unlocks — see getPendingChallenges
// (challenge.service.ts), which now returns every not-yet-unlocked challenge
// instead of only condition ones. Deliberately shows no title, description
// or points: the point is that a child can't tell what's inside, or which
// kind it is, until they earn it. Tapping it gives a "not yet" wiggle
// (reusing the same shake already used for a locked journey-map station)
// rather than doing nothing, so it doesn't feel broken.
export function MysteryBoxCard() {
  const t = useTranslations("challengesPage");
  const [shaking, setShaking] = useState(false);

  function handleTap() {
    setShaking(true);
    window.setTimeout(() => setShaking(false), 300);
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label={t("mysteryHint")}
      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-box-edge/40 bg-gradient-to-br from-box-a to-box-b p-3 text-right shadow-[0_3px_0_var(--color-box-edge)] transition-transform hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-box-edge)] ${
        shaking ? "animate-journey-shake" : ""
      }`}
    >
      <MysteryBoxContents size="sm" />
    </button>
  );
}
