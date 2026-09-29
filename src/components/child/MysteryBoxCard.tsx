"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

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
      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-zinc-300/60 bg-gradient-to-br from-zinc-200 to-zinc-300 p-3 text-right shadow-[0_3px_0_theme(colors.zinc.400)] ${
        shaking ? "animate-journey-shake" : ""
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/60 to-transparent animate-mystery-shine"
      />
      <span className="relative flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-200 shadow-[inset_0_-2px_0_theme(colors.zinc.400)]">
        <span className="inline-block animate-mystery-bob font-bold text-zinc-500" style={{ fontSize: 28 }}>
          ?
        </span>
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-sm font-semibold text-zinc-500">{t("mysteryTitle")}</span>
        <span className="block text-xs text-zinc-400">{t("mysteryHint")}</span>
      </span>
    </button>
  );
}
