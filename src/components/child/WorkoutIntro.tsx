"use client";

import type { CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExerciseImage } from "@/components/child/ExerciseImage";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { difficultyLabelKey } from "@/lib/workout-labels";
import { BASE_POINTS } from "@/services/points.service";
import type { WorkoutExerciseEntry } from "@/services/workout.service";
import type { BraceletColor, Gender, Workout } from "@/lib/types";

export type CountdownStep = 3 | 2 | 1 | "go";

interface WorkoutIntroProps {
  workout: Workout;
  color: BraceletColor;
  colorLabel: string;
  workoutIndex: number;
  requiredWorkouts: number;
  isReplay: boolean;
  // How long the workout takes, in whole minutes (rounded up).
  minutes: number;
  exercises: WorkoutExerciseEntry[];
  gender: Gender | null;
  error: string | null;
  countdown: CountdownStep | null;
  onReady: () => void;
}

// Bracelet white vanishes on white, so it's drawn in its outline shade.
function stageInk(color: BraceletColor): string {
  return color === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[color];
}

// Before the workout: which stage and workout this is, how long and how hard,
// the exercises in order (each with its picture, description and tip from
// the exercise bank), and one big "I'm ready" — which runs a 3-2-1 count
// before the timer takes over.
export function WorkoutIntro({
  workout,
  color,
  colorLabel,
  workoutIndex,
  requiredWorkouts,
  isReplay,
  minutes,
  exercises,
  gender,
  error,
  countdown,
  onReady,
}: WorkoutIntroProps) {
  const t = useTranslations("workout");
  const locale = useLocale();
  const genderForm = gender ?? "male";
  const difficultyKey = difficultyLabelKey(workout.recommended_difficulty);
  const description = workout.description ? resolveLocalizedText(workout.description, locale) : null;

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-y-auto bg-[#faf8fc]">
      <header className="flex-none bg-white px-4 pb-3.5 pt-5 shadow-[0_1px_0_#ece6f2]">
        <div className="mx-auto flex max-w-sm flex-col gap-2">
          <span className="flex flex-wrap items-center gap-2 text-[13px] font-semibold" style={{ color: stageInk(color) }}>
            {t("colorProgress", { color: colorLabel, index: workoutIndex, total: requiredWorkouts })}
            {isReplay && (
              <span className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-[12px] text-brand-purple">
                {t("replayBadge")}
              </span>
            )}
          </span>
          <h1 className="font-display text-[26px] font-bold leading-tight">
            {resolveLocalizedText(workout.title, locale)}
          </h1>
          <div className="flex flex-wrap gap-2">
            {minutes > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1edf5] px-2.5 py-1 text-[13px] font-medium">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
                  <circle cx="10" cy="10" r="7.5" />
                  <path d="M10 6v4.2l2.5 1.7" />
                </svg>
                {t("aboutMinutes", { minutes })}
              </span>
            )}
            {difficultyKey && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1edf5] px-2.5 py-1 text-[13px] font-medium">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <rect x="3" y="12" width="3" height="5" rx="0.5" />
                  <rect x="8.5" y="8" width="3" height="9" rx="0.5" opacity={(workout.recommended_difficulty ?? 0) >= 2 ? 1 : 0.3} />
                  <rect x="14" y="4" width="3" height="13" rx="0.5" opacity={(workout.recommended_difficulty ?? 0) >= 3 ? 1 : 0.3} />
                </svg>
                {t(difficultyKey)}
              </span>
            )}
            {!isReplay && (
              <span className="rounded-full bg-reward-gold-soft px-2.5 py-1 font-display text-[13px] font-semibold text-reward-gold-ink">
                {t.rich("pointsChip", { points: BASE_POINTS, num: (chunks) => <bdi dir="ltr">{chunks}</bdi> })}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-2.5 px-4 py-4">
        {description && <p className="text-sm text-text-muted">{description}</p>}
        {exercises.length > 0 && (
          <span className="text-sm font-semibold text-text-muted">
            {t("missionHeading", { count: exercises.length })}
          </span>
        )}
        {exercises.map(({ slotNumber, exercise }, i) => {
          const name = locale === "en" ? exercise.name_en : exercise.name_he;
          return (
            <div
              key={`${slotNumber}-${exercise.id}`}
              className="animate-power-fade-up flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5"
              style={{ ["--power-fade-delay" as string]: `${0.1 + i * 0.1}s` } as CSSProperties}
            >
              <span className="relative flex-none">
                <ExerciseImage imageUrl={exercise.image_url} alt={name} className="h-16 w-16 rounded-xl" />
                <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-purple font-display text-[13px] font-bold text-white">
                  {slotNumber}
                </span>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-display text-[17px] font-semibold leading-snug">{name}</span>
                {exercise.description_he && (
                  <span className="text-[13px] leading-snug text-text-muted">{exercise.description_he}</span>
                )}
                {exercise.difficulty_tip_he && (
                  <span className="text-[12px] leading-snug text-brand-purple">
                    <b>{t("tip")}:</b> {exercise.difficulty_tip_he}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </main>

      <footer className="sticky bottom-0 flex-none bg-gradient-to-t from-[#faf8fc] from-70% to-transparent px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3">
        <div className="mx-auto max-w-sm space-y-2">
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={onReady}
            disabled={countdown !== null}
            className="animate-go-pulse block min-h-14 w-full rounded-[18px] bg-green-600 font-display text-xl font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-transform hover:bg-green-700 active:translate-y-[3px]"
          >
            {t("ready", { gender: genderForm })}
          </button>
        </div>
      </footer>

      {countdown !== null && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#221a33]/80" aria-live="assertive">
          {countdown === "go" ? (
            <span key="go" className="animate-workout-go font-display text-7xl font-bold text-white">
              {t("countdownGo")}
            </span>
          ) : (
            <span
              key={countdown}
              className="animate-workout-count font-display text-[150px] font-bold leading-none"
              style={{ color: countdown === 3 ? "#ffffff" : countdown === 2 ? "var(--color-reward-gold)" : "var(--color-bracelet-orange)" }}
            >
              {countdown}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
