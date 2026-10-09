"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { CelebrationBurst, EMPOWER_KEYS, useCountUp } from "@/components/child/WorkoutCelebration";
import { durationParts } from "@/lib/format";
import type { FeelingCode } from "@/lib/workout-labels";
import type { Gender } from "@/lib/types";

interface ChallengeCelebrationProps {
  pointsAwarded: number;
  // The most one run pays.
  maxPoints: number;
  durationSeconds: number;
  // Most points from one run before this one; null when this was the first.
  previousBestPoints: number | null;
  feeling: FeelingCode;
  gender: Gender | null;
  onTryAgain: () => void;
  onBack: () => void;
}

const TROPHY_PATH =
  "M6 3.5h8V8a4 4 0 01-8 0zM6 5H3.5v1.5A2.5 2.5 0 006 9M14 5h2.5v1.5A2.5 2.5 0 0114 9M10 12v3M7 17h6";

function delay(seconds: number): CSSProperties {
  return { ["--power-fade-delay" as string]: `${seconds}s` } as CSSProperties;
}

// The end of a challenge, in the same line as the workout result: a trophy,
// the time, the points it paid out of the most it can (a quick finish pays
// less: it probably wasn't all the stairs), the child's best, and a closing
// line matched to how they felt.
export function ChallengeCelebration({
  pointsAwarded,
  maxPoints,
  durationSeconds,
  previousBestPoints,
  feeling,
  gender,
  onTryAgain,
  onBack,
}: ChallengeCelebrationProps) {
  const t = useTranslations("challengeRunner");
  const tWorkout = useTranslations("workout");
  const shownPoints = useCountUp(pointsAwarded);
  const genderForm = gender ?? "male";
  const full = pointsAwarded >= maxPoints;
  const isNewBest = previousBestPoints !== null && pointsAwarded > previousBestPoints;
  const best = previousBestPoints === null ? null : Math.max(previousBestPoints, pointsAwarded);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3 text-right">
      <h1 className="animate-power-badge-pop text-center font-display text-3xl font-bold">{tWorkout("resultTitle")}</h1>

      <div className="relative h-40">
        {pointsAwarded > 0 && <CelebrationBurst />}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="animate-result-starpop flex h-28 w-28 items-center justify-center rounded-full bg-reward-gold shadow-[0_6px_14px_rgba(217,154,11,0.45)]">
            <svg viewBox="0 0 20 20" className="h-16 w-16" fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={TROPHY_PATH} />
            </svg>
          </span>
        </div>
      </div>

      <p className="animate-power-fade-up text-center text-[15px] text-zinc-600" style={delay(0.6)}>
        {t("finishedIn", durationParts(durationSeconds))}
      </p>

      {pointsAwarded > 0 ? (
        <section
          className={`animate-power-fade-up flex items-center justify-between rounded-2xl px-4 py-3 ${
            full ? "bg-reward-gold-soft" : "border border-[#f3e3b5] bg-white"
          }`}
          style={delay(0.75)}
        >
          <span className="flex flex-col">
            <span className={`text-[15px] font-semibold ${full ? "text-reward-gold-on" : ""}`}>
              {full ? t("fullPoints") : t("pointsTitle")}
            </span>
            {!full && <span className="text-[13px] text-text-muted">{t("pointsOutOf", { max: maxPoints })}</span>}
          </span>
          <span dir="ltr" className="font-display text-[34px] font-bold tabular-nums text-reward-gold-ink">
            +{shownPoints}
          </span>
        </section>
      ) : (
        <section
          className="animate-power-fade-up flex flex-col gap-0.5 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
          style={delay(0.75)}
        >
          <span className="text-[15px] font-semibold">{t("noPointsTitle")}</span>
          <span className="text-[13px] text-text-muted">{t("noPointsNote")}</span>
        </section>
      )}

      {best !== null && (
        <section
          className="animate-power-fade-up flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
          style={delay(0.9)}
        >
          <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
            {t("bestLabel")}
            {isNewBest && (
              <span className="rounded-full bg-reward-gold px-2 py-0.5 font-display text-xs font-bold text-reward-gold-on">
                {t("newBest")}
              </span>
            )}
          </span>
          <span className="font-display text-xl font-bold text-reward-gold-ink">{t("bestPoints", { points: best })}</span>
        </section>
      )}

      <section
        className="animate-power-fade-up flex items-start gap-2.5 rounded-2xl bg-brand-purple/[0.07] px-3.5 py-3"
        style={delay(1.1)}
      >
        <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none text-brand-purple" fill="currentColor" aria-hidden>
          <path d="M10 17.5s-6.5-4-6.5-9.2A3.7 3.7 0 0110 6.1a3.7 3.7 0 016.5 2.2c0 5.2-6.5 9.2-6.5 9.2z" />
        </svg>
        <p className="text-sm leading-relaxed text-[#4a1c44]">{tWorkout(EMPOWER_KEYS[feeling], { gender: genderForm })}</p>
      </section>

      <div className="mt-1 space-y-2">
        <button
          type="button"
          onClick={onTryAgain}
          className="block min-h-[52px] w-full rounded-2xl bg-green-600 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-transform hover:bg-green-700 active:translate-y-[3px]"
        >
          {t("tryAgain")}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="block min-h-12 w-full rounded-2xl border border-zinc-200 bg-white font-display text-base font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          {t("backToChallenges")}
        </button>
      </div>
    </div>
  );
}
