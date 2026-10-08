"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CameraIcon, ExerciseDemo } from "@/components/child/ExerciseDemo";
import { ExerciseImage } from "@/components/child/ExerciseImage";
import { ReadyCountdownOverlay, type CountdownStep } from "@/components/child/ReadyCountdown";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { difficultyLabelKey } from "@/lib/workout-labels";
import { mainAngle } from "@/lib/exercise-motion/engine";
import { motionFor } from "@/lib/exercise-motion/library";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { BASE_POINTS } from "@/services/points.service";
import type { WorkoutExerciseEntry } from "@/services/workout.service";
import type { BraceletColor, Gender, Workout } from "@/lib/types";

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
// a player on top that shows each exercise moving in turn (tap an exercise
// below to jump to it), the exercises in order (each with its picture,
// description and tip from the exercise bank), and one big "I'm ready" —
// which runs a 3-2-1 count before the timer takes over.
// How long the player stays on each exercise before moving on.
const PLAYER_TURN_MS = 6000;

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
  const reduced = useReducedMotion();

  // Exercises that have a moving demo play in the player, one after another.
  const playable = exercises
    .map((entry) => ({ entry, motion: motionFor(entry.exercise.id) }))
    .filter((d): d is { entry: WorkoutExerciseEntry; motion: NonNullable<typeof d.motion> } => d.motion !== null);
  const [current, setCurrent] = useState(0);
  const [angle, setAngle] = useState<"main" | "alt">("main");
  // Bumped when the child picks an exercise, to restart its turn.
  const [turn, setTurn] = useState(0);
  const playing = playable[current] ?? null;

  useEffect(() => {
    if (reduced || playable.length < 2) return;
    const timer = setTimeout(() => {
      setCurrent((c) => (c + 1) % playable.length);
      setAngle("main");
    }, PLAYER_TURN_MS);
    return () => clearTimeout(timer);
  }, [current, angle, turn, reduced, playable.length]);

  function show(index: number, nextAngle: "main" | "alt" = "main") {
    setCurrent(index);
    setAngle(nextAngle);
    setTurn((n) => n + 1);
  }

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
        {playing && (
          <div className="relative flex-none overflow-hidden rounded-[20px] border border-[#ece6f2]">
            <ExerciseDemo
              key={`${playing.entry.exercise.id}-${angle}-${turn}`}
              motion={playing.motion}
              angle={angle}
              showAngle={!playing.motion.alt}
              angleBelowTop={playable.length > 1}
            />
            {playable.length > 1 && (
              <div className="absolute inset-x-2.5 top-2 flex gap-1" aria-hidden>
                {playable.map((d, i) => (
                  <span key={d.entry.exercise.id} className="flex h-1 flex-1 overflow-hidden rounded-full bg-[#221a33]/10">
                    {i < current && <span className="h-full w-full rounded-full bg-brand-purple" />}
                    {i === current && (
                      <span
                        key={`${current}-${angle}-${turn}`}
                        className="animate-motion-seg h-full rounded-full bg-brand-purple"
                        style={{ ["--seg-dur" as string]: `${PLAYER_TURN_MS}ms` } as CSSProperties}
                      />
                    )}
                  </span>
                ))}
              </div>
            )}
            {playing.motion.alt && (
              <div
                role="group"
                aria-label={t("motion.angleChoice")}
                className="absolute start-2.5 top-5 inline-flex items-center gap-0.5 rounded-full bg-white/90 p-0.5 text-[#4f4960] shadow-[0_1px_3px_rgba(34,26,51,0.08)]"
              >
                <span className="px-1">
                  <CameraIcon />
                </span>
                {(["main", "alt"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => show(current, a)}
                    aria-pressed={angle === a}
                    className={`min-h-7 rounded-full px-2.5 text-xs font-semibold ${
                      angle === a ? "bg-brand-purple text-white" : ""
                    }`}
                  >
                    {t(`motion.angle.${a === "alt" ? (playing.motion.alt?.angle ?? "front") : mainAngle(playing.motion)}`)}
                  </button>
                ))}
              </div>
            )}
            <span className="absolute bottom-2.5 start-2.5 rounded-full bg-[#221a33]/70 px-2.5 py-1 text-[13px] font-semibold text-white">
              {playing.entry.slotNumber} · {locale === "en" ? playing.entry.exercise.name_en : playing.entry.exercise.name_he}
            </span>
          </div>
        )}
        {description && <p className="text-sm text-text-muted">{description}</p>}
        {exercises.length > 0 && (
          <span className="text-sm font-semibold text-text-muted">
            {t("missionHeading", { count: exercises.length })}
          </span>
        )}
        {exercises.map(({ slotNumber, exercise }, i) => {
          const name = locale === "en" ? exercise.name_en : exercise.name_he;
          const demoIndex = playable.findIndex((d) => d.entry.exercise.id === exercise.id && d.entry.slotNumber === slotNumber);
          const demo = demoIndex >= 0 ? playable[demoIndex] : null;
          const active = demo !== null && demoIndex === current;
          const rowClass = `animate-power-fade-up flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-start transition-colors ${
            active ? "border-brand-purple bg-[#fdf6fc]" : "border-zinc-200"
          }`;
          const rowStyle = { ["--power-fade-delay" as string]: `${0.1 + i * 0.1}s` } as CSSProperties;
          const content = (
            <>
              <span className="relative flex-none">
                {demo ? (
                  <ExerciseDemo motion={demo.motion} variant="thumb" className="h-16 w-16 rounded-xl" />
                ) : (
                  <ExerciseImage imageUrl={exercise.image_url} alt={name} className="h-16 w-16 rounded-xl" />
                )}
                <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-purple font-display text-[13px] font-bold text-white">
                  {slotNumber}
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
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
              {demo && active && (
                <span
                  className="flex h-8 w-8 flex-none items-center justify-center gap-0.5 rounded-full bg-brand-purple/10"
                  aria-label={t("motion.playing")}
                >
                  {[0, 0.3, 0.6].map((delay) => (
                    <span
                      key={delay}
                      className="animate-motion-eq h-3.5 w-[3px] rounded-sm bg-brand-purple"
                      style={{ ["--bar-delay" as string]: `${delay}s` } as CSSProperties}
                    />
                  ))}
                </span>
              )}
              {demo && !active && (
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#f1edf5]" aria-hidden>
                  <svg viewBox="0 0 20 20" className="h-3 w-3 fill-brand-purple">
                    <path d="M6 3.5l11 6.5-11 6.5z" />
                  </svg>
                </span>
              )}
            </>
          );
          return demo ? (
            <button
              key={`${slotNumber}-${exercise.id}`}
              type="button"
              onClick={() => show(demoIndex)}
              aria-label={active ? undefined : `${t("motion.watch")}: ${name}`}
              className={rowClass}
              style={rowStyle}
            >
              {content}
            </button>
          ) : (
            <div key={`${slotNumber}-${exercise.id}`} className={rowClass} style={rowStyle}>
              {content}
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

      <ReadyCountdownOverlay step={countdown} />
    </div>
  );
}
