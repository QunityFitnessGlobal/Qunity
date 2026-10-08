"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExerciseDemo } from "@/components/child/ExerciseDemo";
import { ExerciseImage } from "@/components/child/ExerciseImage";
import { motionFor } from "@/lib/exercise-motion/library";
import { formatMinutesSeconds } from "@/lib/format";
import type { Exercise } from "@/lib/types";

const RING_RADIUS = 96;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
// The last seconds of a work phase beat, to pull the child to the finish.
const FINAL_SECONDS = 3;

interface IntervalProgress {
  phase: "work" | "rest";
  currentSet: number;
  rounds: number;
  phaseRemaining: number;
  phaseLength: number;
}

interface WorkoutTimerViewProps {
  // Null for the rare workout without an interval timer: a plain count-up clock.
  interval: IntervalProgress | null;
  elapsedSeconds: number;
  exercise: Exercise | null;
  // What comes after this round's rest; null after the last round.
  nextExercise: Exercise | null;
  // Shown instead of the exercise card (a challenge has no exercises).
  card?: ReactNode;
  // Override the count-up clock's label and the finish button's text.
  elapsedLabel?: string;
  finishLabel?: string;
  onFinish: () => void;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  error: string | null;
  // TEMP testing shortcuts, rendered under the finish button.
  children?: ReactNode;
}

// During the workout: the round bar, the current exercise (or, while
// resting, the one coming up — shown moving, so the child can learn it
// during the rest), and a big ring counting down the phase — the whole
// screen turns green for work and blue for rest. Pausing freezes the clock
// (and the exercise demo) behind a "short break" card until the child resumes.
export function WorkoutTimerView({
  interval,
  elapsedSeconds,
  exercise,
  nextExercise,
  card,
  elapsedLabel,
  finishLabel,
  onFinish,
  paused,
  onPause,
  onResume,
  error,
  children,
}: WorkoutTimerViewProps) {
  const t = useTranslations("workout");
  const locale = useLocale();
  const resting = interval?.phase === "rest";
  const nameOf = (e: Exercise) => (locale === "en" ? e.name_en : e.name_he);
  const workMotion = exercise ? motionFor(exercise.id) : null;
  const nextMotion = nextExercise ? motionFor(nextExercise.id) : null;

  const progress = interval ? interval.phaseRemaining / interval.phaseLength : 1;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  const beat = interval?.phase === "work" && interval.phaseRemaining <= FINAL_SECONDS;

  return (
    <div
      className={`fixed inset-0 z-10 flex flex-col overflow-y-auto transition-colors duration-500 ${
        resting ? "bg-[#f3f6ff]" : "bg-[#f4fbf6]"
      }`}
    >
      <header className="mx-auto flex w-full max-w-sm flex-none flex-col gap-2.5 px-4 pb-3 pt-5">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold">
            {interval ? t("setOf", { current: interval.currentSet, total: interval.rounds }) : null}
          </span>
          <button
            type="button"
            onClick={onPause}
            aria-label={t("pause")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-[#4f4960] hover:bg-zinc-50"
          >
            <PauseIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
        {interval && (
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: interval.rounds }, (_, i) => i + 1).map((n) => (
              <span
                key={n}
                className={`h-2 flex-1 rounded-full ${
                  n < interval.currentSet
                    ? "bg-bracelet-orange"
                    : n === interval.currentSet
                      ? "bg-brand-purple"
                      : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-4 px-4 pt-2">
        {!resting && card}

        {!resting && !card && exercise && (
          <div key={`work-${interval?.currentSet ?? 0}`} className="animate-power-fade-up w-full overflow-hidden rounded-[20px] border border-zinc-200 bg-white">
            {workMotion ? (
              <ExerciseDemo key={exercise.id} motion={workMotion} playing={!paused} />
            ) : (
              <ExerciseImage
                imageUrl={exercise.image_url}
                alt={nameOf(exercise)}
                className="h-36 w-full"
                figureClassName="h-11 w-11"
              />
            )}
            <div className="flex flex-col gap-0.5 px-3.5 py-3">
              <span className="font-display text-xl font-semibold">{nameOf(exercise)}</span>
              {exercise.description_he && <span className="text-sm text-text-muted">{exercise.description_he}</span>}
              {exercise.difficulty_tip_he && (
                <span className="text-[13px] text-brand-purple">
                  <b>{t("tip")}:</b> {exercise.difficulty_tip_he}
                </span>
              )}
            </div>
          </div>
        )}

        {resting && (
          <div key={`rest-${interval?.currentSet ?? 0}`} className="animate-power-fade-up flex w-full flex-col gap-2.5 rounded-[20px] border border-[#d6e4ff] bg-white px-4 py-4">
            {nextExercise && nextMotion ? (
              <>
                <span className="text-[13px] font-semibold text-[#1d4ed8]">{t("upNext")}</span>
                <ExerciseDemo
                  key={nextExercise.id}
                  motion={nextMotion}
                  tone="rest"
                  playing={!paused}
                  className="rounded-[14px]"
                />
                <span className="font-display text-xl font-semibold">{nameOf(nextExercise)}</span>
              </>
            ) : nextExercise ? (
              <>
                <span className="text-[13px] font-semibold text-[#1d4ed8]">{t("upNext")}</span>
                <div className="flex items-center gap-3">
                  <ExerciseImage
                    imageUrl={nextExercise.image_url}
                    alt={nameOf(nextExercise)}
                    className="h-14 w-14 flex-none rounded-xl"
                    figureClassName="h-7 w-7"
                    tone="blue"
                  />
                  <span className="font-display text-xl font-semibold">{nameOf(nextExercise)}</span>
                </div>
              </>
            ) : (
              <span className="font-display text-xl font-semibold">{t("almostDone")}</span>
            )}
            <span className="flex items-center gap-2 text-sm text-[#4f4960]">
              <span className="animate-workout-breathe h-3.5 w-3.5 rounded-full bg-[#93b4f5]" aria-hidden />
              {t("breathe")}
            </span>
          </div>
        )}

        <div className="relative h-[236px] w-[236px] flex-none">
          <svg viewBox="0 0 236 236" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <circle
              cx="118"
              cy="118"
              r={RING_RADIUS}
              fill="#ffffff"
              stroke={resting ? "#e6efff" : "#e3f8ea"}
              strokeWidth={18}
            />
            {interval && (
              <circle
                cx="118"
                cy="118"
                r={RING_RADIUS}
                fill="none"
                stroke={resting ? "#2563eb" : "#16a34a"}
                strokeWidth={18}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={offset}
                className="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5" role="timer" aria-live="off">
            <span className={`text-[15px] font-bold tracking-wide ${resting ? "text-[#1d4ed8]" : "text-green-700"}`}>
              {interval ? t(resting ? "phaseRest" : "phaseWork") : (elapsedLabel ?? t("elapsedLabel"))}
            </span>
            <span
              dir="ltr"
              className={`font-display text-[58px] font-bold tabular-nums leading-none ${beat ? "animate-workout-beat" : ""}`}
            >
              {formatMinutesSeconds(interval ? interval.phaseRemaining : elapsedSeconds)}
            </span>
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-sm flex-none space-y-2 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3">
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={onFinish}
          className="block min-h-[52px] w-full rounded-2xl bg-zinc-700 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.zinc.900)] transition-transform hover:bg-zinc-800 active:translate-y-[3px]"
        >
          {finishLabel ?? t("finishWorkout")}
        </button>
        {children}
      </footer>

      {paused && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="workout-paused-title"
          className="fixed inset-0 z-20 flex items-center justify-center bg-[#221a33]/75 px-6"
        >
          <div className="animate-power-fade-up flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white px-5 py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
              <PauseIcon className="h-6 w-6" />
            </span>
            <h2 id="workout-paused-title" className="font-display text-2xl font-bold">
              {t("pausedTitle")}
            </h2>
            <p className="text-sm text-text-muted">{t("pausedText")}</p>
            <button
              type="button"
              onClick={onResume}
              autoFocus
              className="mt-1 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-green-600 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-transform hover:bg-green-700 active:translate-y-[3px]"
            >
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                <path d="M6 4l10 6-10 6V4z" />
              </svg>
              {t("resume")}
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="min-h-11 text-sm font-medium text-text-muted underline underline-offset-2"
            >
              {finishLabel ?? t("finishWorkout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden>
      <rect x="5" y="4" width="3.5" height="12" rx="1" />
      <rect x="11.5" y="4" width="3.5" height="12" rx="1" />
    </svg>
  );
}
