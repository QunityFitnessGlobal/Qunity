"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { POWER_REVEAL_THEME } from "@/lib/colors";
import { meetsCompletionThreshold } from "@/services/points.service";
import { prefersReducedMotion } from "@/components/child/MysteryReveal";
import { ChallengeIcon } from "@/components/child/challengeIcons";
import type { CompleteWorkoutResult } from "@/services/workout.service";
import type { ChallengeDefinition } from "@/data/challenges.data";
import type { FeelingCode } from "@/lib/workout-labels";
import type { BraceletColor, Gender } from "@/lib/types";

interface WorkoutCelebrationProps {
  result: CompleteWorkoutResult;
  // Every challenge this workout earned points for, including a power
  // challenge unlocked at the power reveal before the workout started.
  challenges: ChallengeDefinition[];
  stageColor: BraceletColor;
  requiredWorkouts: number;
  // What the child picked in the questionnaire; it picks the closing line.
  feeling: FeelingCode;
  gender: Gender | null;
}

export const EMPOWER_KEYS: Record<FeelingCode, string> = {
  fun: "empowerFun",
  fine: "empowerFine",
  frustrated: "empowerFrustrated",
  tired: "empowerTired",
  exhausted: "empowerExhausted",
};

const STAR_PATH = "M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z";
const STAR_CLIP = "polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)";
const BURST_COLORS = ["var(--color-brand-purple)", "var(--color-reward-gold)", "var(--color-bracelet-orange)"];

// A fixed ring of pieces around the star, every third one star-shaped —
// fixed rather than random so the burst looks the same every time.
const PARTICLES = Array.from({ length: 18 }, (_, k) => {
  const angle = (Math.PI * 2 * k) / 18 + 0.2;
  const dist = 78 + (k % 3) * 22;
  const isStar = k % 3 === 0;
  return {
    size: isStar ? 16 : 9,
    color: BURST_COLORS[k % 3],
    isStar,
    style: {
      "--dx": `${Math.round(Math.cos(angle) * dist * 1.35)}px`,
      "--dy": `${Math.round(Math.sin(angle) * dist * 0.85)}px`,
      "--rot": `${(k % 2 ? 1 : -1) * (120 + k * 17)}deg`,
      "--dur": `${(0.8 + (k % 4) * 0.08).toFixed(2)}s`,
    } as CSSProperties,
  };
});

// The gold glow, ring and flying pieces behind a celebrated star or trophy.
// Sits inside a relative box; the celebrated icon goes on top of it.
export function CelebrationBurst() {
  return (
    <>
      <span
        aria-hidden
        className="animate-result-glow absolute left-[calc(50%-72px)] top-[calc(50%-72px)] h-36 w-36 rounded-full bg-reward-gold opacity-60 blur-2xl"
      />
      <span
        aria-hidden
        className="animate-result-ringout absolute left-1/2 top-1/2 h-14 w-14 rounded-full border-[3px] border-reward-gold"
      />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="animate-result-burst absolute left-1/2 top-1/2"
          style={{
            ...p.style,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isStar ? 0 : 2,
            clipPath: p.isStar ? STAR_CLIP : undefined,
          }}
        />
      ))}
    </>
  );
}

// Counts up to `total` shortly after the screen appears. Decided once when
// the screen appears, not in an effect, so a reduced-motion viewer sees the
// final number straight away.
export function useCountUp(total: number): number {
  const [animate] = useState(() => !prefersReducedMotion());
  const [shown, setShown] = useState(animate ? 0 : total);

  useEffect(() => {
    if (!animate || total <= 0) return;
    let current = 0;
    let tick: ReturnType<typeof setInterval> | undefined;
    const step = Math.max(1, Math.ceil(total / 40));
    const start = setTimeout(() => {
      tick = setInterval(() => {
        current = Math.min(total, current + step);
        setShown(current);
        if (current >= total && tick) clearInterval(tick);
      }, 28);
    }, 900);
    return () => {
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
  }, [animate, total]);

  return shown;
}

// The top of the workout result screen: the station's star (full at 100%,
// half from the 60% pass mark, an empty outline below it) celebrated with a
// burst, the points earned counting up, the stage bar moving forward, and a
// closing line matched to how the child said they felt.
export function WorkoutCelebration({
  result,
  challenges,
  stageColor,
  requiredWorkouts,
  feeling,
  gender,
}: WorkoutCelebrationProps) {
  const t = useTranslations("workout");
  const tColors = useTranslations("colors");
  const locale = useLocale();
  const halfClipId = useId();

  const passed = meetsCompletionThreshold(result.completionPercent);
  const star = !passed ? "none" : result.completionPercent >= 100 ? "full" : "half";
  const totalPoints = result.pointsAwarded + challenges.reduce((sum, c) => sum + c.bonusPoints, 0);

  const shownPoints = useCountUp(totalPoints);

  const completionLine = result.isReplay
    ? result.pointsAwarded > 0
      ? t("resultReplayPoints")
      : t("resultReplayNoPoints")
    : star === "full"
      ? t("resultFullStar", { percent: result.completionPercent })
      : star === "half"
        ? t("resultHalfStar", { percent: result.completionPercent })
        : t("resultBelowThreshold", { percent: result.completionPercent });

  const doneAfter = result.workoutsCompletedInColor;
  const doneBefore = result.advancedStage ? doneAfter - 1 : doneAfter;
  const stagePercent = (done: number) => Math.min(100, (done / requiredWorkouts) * 100);
  const theme = POWER_REVEAL_THEME[stageColor];

  return (
    <div className="flex w-full flex-col gap-3 text-right">
      <h1 className="animate-power-badge-pop text-center font-display text-3xl font-bold">{t("resultTitle")}</h1>

      <div className="relative h-40">
        {star !== "none" && <CelebrationBurst />}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 20 20"
            className={`h-32 w-32 ${star === "none" ? "" : "animate-result-starpop drop-shadow-[0_6px_10px_rgba(217,154,11,0.45)]"}`}
            aria-hidden
          >
            {star === "full" && (
              <path d={STAR_PATH} fill="var(--color-reward-gold)" stroke="#d99a0b" strokeWidth={0.6} strokeLinejoin="round" />
            )}
            {star === "half" && (
              <>
                <defs>
                  <clipPath id={halfClipId}>
                    <rect x="0" y="0" width="10" height="20" />
                  </clipPath>
                </defs>
                <path d={STAR_PATH} fill="#fff4d3" stroke="#d99a0b" strokeWidth={0.6} strokeLinejoin="round" />
                <path d={STAR_PATH} fill="var(--color-reward-gold)" clipPath={`url(#${halfClipId})`} />
              </>
            )}
            {star === "none" && (
              <path d={STAR_PATH} fill="#f4f4f5" stroke="#d4d4d8" strokeWidth={0.6} strokeLinejoin="round" />
            )}
          </svg>
        </div>
      </div>

      <p
        className="animate-power-fade-up text-center text-[15px] text-zinc-600"
        style={{ ["--power-fade-delay" as string]: "0.6s" } as CSSProperties}
      >
        {completionLine}
      </p>

      {totalPoints > 0 && (
        <section
          className="animate-power-fade-up flex flex-col gap-2 rounded-2xl border border-[#f3e3b5] bg-white px-4 py-3"
          style={{ ["--power-fade-delay" as string]: "0.75s" } as CSSProperties}
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold">{t("resultPointsTitle")}</span>
            <span dir="ltr" className="font-display text-[34px] font-bold tabular-nums text-reward-gold-ink">
              +{shownPoints}
            </span>
          </div>
          {result.pointsAwarded > 0 && (
            <div className="flex justify-between text-sm text-zinc-600">
              <span>{t("resultPointsWorkout")}</span>
              <span dir="ltr" className="font-semibold">+{result.pointsAwarded}</span>
            </div>
          )}
          {challenges.map((challenge) => (
            <div key={challenge.id} className="flex items-center justify-between gap-2 text-sm text-zinc-600">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <ChallengeIcon
                  conditionType={challenge.conditionType}
                  challengeType={challenge.challengeType}
                  className="h-4 w-4 flex-none text-reward-gold-ink"
                />
                <span className="truncate">
                  {t("resultPointsChallenge", { title: resolveLocalizedText(challenge.title, locale) })}
                </span>
              </span>
              <span dir="ltr" className="font-semibold">+{challenge.bonusPoints}</span>
            </div>
          ))}
        </section>
      )}

      {requiredWorkouts > 0 && (
        <section
          className="animate-power-fade-up flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
          style={{ ["--power-fade-delay" as string]: "0.9s" } as CSSProperties}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{t("resultStage", { color: tColors(stageColor) })}</span>
            <span className="inline-flex items-center gap-1.5 text-text-muted">
              {t("resultStageProgress", { done: doneAfter, total: requiredWorkouts })}
              {result.advancedStage && (
                <span
                  dir="ltr"
                  className="animate-power-fade-up rounded-full bg-reward-gold px-2 py-0.5 font-display text-xs font-bold text-reward-gold-on"
                  style={{ ["--power-fade-delay" as string]: "1.6s" } as CSSProperties}
                >
                  +1
                </span>
              )}
            </span>
          </div>
          <div className="h-[18px] overflow-hidden rounded-full bg-black/80">
            <div
              className={`h-full rounded-full ${result.advancedStage ? "animate-result-grow" : ""}`}
              style={
                {
                  width: `${stagePercent(doneAfter)}%`,
                  background: `linear-gradient(to left, ${theme.gradientFrom}, ${theme.gradientTo})`,
                  "--from": `${stagePercent(doneBefore)}%`,
                  "--to": `${stagePercent(doneAfter)}%`,
                } as CSSProperties
              }
            />
          </div>
        </section>
      )}

      <section
        className="animate-power-fade-up flex items-start gap-2.5 rounded-2xl bg-brand-purple/[0.07] px-3.5 py-3"
        style={{ ["--power-fade-delay" as string]: "1.1s" } as CSSProperties}
      >
        <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none text-brand-purple" fill="currentColor" aria-hidden>
          <path d="M10 17.5s-6.5-4-6.5-9.2A3.7 3.7 0 0110 6.1a3.7 3.7 0 016.5 2.2c0 5.2-6.5 9.2-6.5 9.2z" />
        </svg>
        <p className="text-sm leading-relaxed text-[#4a1c44]">{t(EMPOWER_KEYS[feeling], { gender: gender ?? "male" })}</p>
      </section>
    </div>
  );
}
