"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  startWorkoutSession,
  finishWorkoutSession,
  completeWorkout,
  getNextWorkout,
  type CompleteWorkoutResult,
  type WorkoutExerciseEntry,
} from "@/services/workout.service";
import { Button } from "@/components/ui/Button";
import { ChallengeUnlockedModal } from "@/components/child/ChallengeUnlockedModal";
import { ChallengeRevealPopup } from "@/components/child/ChallengeRevealPopup";
import { WorkoutCelebration } from "@/components/child/WorkoutCelebration";
import { LevelUpScreen } from "@/components/child/LevelUpScreen";
import { readQaTools } from "@/lib/qa-tools";
import { unlockPowerChallenge } from "@/services/challenge.service";
import { calculateCompletionPercent, meetsCompletionThreshold } from "@/services/points.service";
import type { ChallengeDefinition } from "@/data/challenges.data";
import { PowerRevealScreen } from "@/components/child/PowerRevealScreen";
import { formatDurationClock } from "@/lib/format";
import {
  getWorkoutSoundPreference,
  playWorkoutSound,
  stopWorkoutSound,
  unlockWorkoutAudio,
} from "@/lib/workout-sounds";
import { resolveLocalizedText } from "@/lib/i18n-content";
import {
  DIFFICULTY_VALUES,
  DIFFICULTY_LABEL_KEYS,
  FEELING_CODES,
  FEELING_LABEL_KEYS,
  FEELING_ICONS,
  type FeelingCode,
} from "@/lib/workout-labels";
import type { BraceletColor, Gender, Workout } from "@/lib/types";

interface WorkoutRunnerProps {
  childId: string;
  workout: Workout;
  workoutIndex: number;
  // Set when repeating an already-passed station from the journey map; such a
  // run never advances the color progress (see completeWorkout).
  replayStation: number | null;
  // First workout of a color whose power has not been revealed yet.
  showPowerReveal: boolean;
  requiredWorkouts: number;
  color: BraceletColor;
  colorLabel: string;
  intervalRounds: number | null;
  intervalWorkSeconds: number | null;
  intervalRestSeconds: number | null;
  gender: Gender | null;
  exercises: WorkoutExerciseEntry[];
}

type Stage = "idle" | "running" | "questionnaire" | "power-reveal" | "result";

interface IntervalTimerState {
  phase: "work" | "rest";
  currentSet: number;
  phaseRemaining: number;
  totalRemaining: number;
}

export function WorkoutRunner({
  childId,
  workout,
  workoutIndex,
  replayStation,
  showPowerReveal,
  requiredWorkouts,
  color,
  colorLabel,
  intervalRounds,
  intervalWorkSeconds,
  intervalRestSeconds,
  gender,
  exercises,
}: WorkoutRunnerProps) {
  const t = useTranslations("workout");
  const tColors = useTranslations("colors");
  const locale = useLocale();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timer, setTimer] = useState<IntervalTimerState | null>(null);
  const [actualDurationSeconds, setActualDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CompleteWorkoutResult | null>(null);

  const [difficultyReported, setDifficultyReported] = useState("2");
  const [parentTrainedTogether, setParentTrainedTogether] = useState("no");
  const [feelingAfter, setFeelingAfter] = useState<FeelingCode>(FEELING_CODES[0]);
  const [nextWorkoutLoading, setNextWorkoutLoading] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  // The mystery-box reveal popup for condition challenges earned by THIS
  // workout (result.newChallenges) — shown once, over the result screen,
  // then dismissed for good. A power challenge is never included here: its
  // own reveal already happened on the power screen (handlePowerContinue).
  const [revealDismissed, setRevealDismissed] = useState(false);
  // Finishing below the points threshold asks for confirmation first; the
  // timer stays paused while that question is open.
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  const [powerChallenge, setPowerChallenge] = useState<ChallengeDefinition | null>(null);
  // A level-up takes over the result screen once its stage bar has filled
  // ("open"); the challenge popups wait until it's closed ("done").
  const [levelUpPhase, setLevelUpPhase] = useState<"pending" | "open" | "done">("pending");
  // TEMP testing shortcuts (Settings › "כלי בדיקה באימון"), read when the
  // workout starts.
  const [qaTools, setQaTools] = useState(false);

  const recommendedDurationMinutes = workout.recommended_duration_minutes ?? 0;
  const extraMinutes = Math.round(actualDurationSeconds / 60) - recommendedDurationMinutes;

  // Which exercise corresponds to "right now": set 1 before starting, then
  // cycling through the workout's exercise list as timer.currentSet
  // advances (modulo, in case there are fewer exercises than rounds — same
  // defensive pattern as getNextWorkout's belt-workout cycling). This is
  // pure derived client state, so it updates instantly on every set change
  // with no refresh or network round-trip.
  const currentSetNumber = stage === "running" && timer ? timer.currentSet : 1;
  const currentExercise =
    exercises.length > 0 ? exercises[(currentSetNumber - 1) % exercises.length].exercise : null;

  // Belt-wide Tabata structure (rounds/work/rest, from the spreadsheet's
  // levels_overview sheet — see bracelet_levels.interval_*). Falls back to
  // a plain count-up stopwatch (the pre-existing behavior) if a belt hasn't
  // had this data imported yet.
  const hasIntervalStructure =
    intervalRounds != null && intervalWorkSeconds != null && intervalRestSeconds != null;
  const totalDurationSeconds = hasIntervalStructure
    ? intervalRounds * (intervalWorkSeconds + intervalRestSeconds)
    : 0;
  // What 100% of the workout means: the whole interval timer, or the
  // recommended time for workouts without one.
  const plannedDurationSeconds = hasIntervalStructure
    ? totalDurationSeconds
    : recommendedDurationMinutes * 60;

  useEffect(() => {
    if (stage !== "running" || hasIntervalStructure || stopConfirmOpen) {
      return;
    }
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [stage, hasIntervalStructure, stopConfirmOpen]);

  useEffect(() => {
    if (stage !== "running" || !hasIntervalStructure || stopConfirmOpen) {
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (!prev) return prev;
        const totalRemaining = prev.totalRemaining - 1;
        if (totalRemaining <= 0) {
          return { ...prev, totalRemaining: 0, phaseRemaining: 0 };
        }
        const phaseRemaining = prev.phaseRemaining - 1;
        if (phaseRemaining <= 0) {
          return prev.phase === "work"
            ? { phase: "rest", currentSet: prev.currentSet, phaseRemaining: intervalRestSeconds, totalRemaining }
            : { phase: "work", currentSet: prev.currentSet + 1, phaseRemaining: intervalWorkSeconds, totalRemaining };
        }
        return { ...prev, phaseRemaining, totalRemaining };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, hasIntervalStructure, stopConfirmOpen, intervalWorkSeconds, intervalRestSeconds]);

  // Cue sound when the timer starts and on each work<->rest switch (chosen in
  // Settings -> "סוג צלצול לאימון"). Driven off the phase changing rather than
  // played inside the timer's state updater, which must stay free of side
  // effects. The start counts as a change (null -> "work"), so it rings too.
  const currentPhase = stage === "running" && timer ? timer.phase : null;
  const previousPhaseRef = useRef<typeof currentPhase>(null);
  useEffect(() => {
    const previous = previousPhaseRef.current;
    previousPhaseRef.current = currentPhase;
    if (currentPhase && previous !== currentPhase) {
      playWorkoutSound(getWorkoutSoundPreference(), currentPhase);
    }
  }, [currentPhase]);

  useEffect(() => () => stopWorkoutSound(), []);

  // Let the result screen's star, points and stage bar play out first (the
  // bar finishes filling at about 2.3s), then bring in the level-up screen.
  const leveledUp = stage === "result" && result?.didLevelUp === true;
  useEffect(() => {
    if (!leveledUp || levelUpPhase !== "pending") return;
    const timer = setTimeout(() => setLevelUpPhase("open"), 2600);
    return () => clearTimeout(timer);
  }, [leveledUp, levelUpPhase]);

  // Time ran out on its own — finish automatically using the full duration,
  // as opposed to a manual mid-workout "Finish" tap (see handleManualFinish).
  useEffect(() => {
    if (stage === "running" && hasIntervalStructure && timer?.totalRemaining === 0) {
      finishSession(totalDurationSeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer?.totalRemaining]);

  async function beginWorkoutSession() {
    // Still inside the Start / Continue tap here, which is what lets the
    // browser play the timer's later, gesture-less transition sounds.
    unlockWorkoutAudio();
    setError(null);
    try {
      const id = await startWorkoutSession(childId, workout.id, {
        stationNumber: replayStation ?? workoutIndex,
        isReplay: replayStation !== null,
      });
      setSessionId(id);
      setQaTools(readQaTools());
      setElapsedSeconds(0);
      setTimer(
        hasIntervalStructure
          ? { phase: "work", currentSet: 1, phaseRemaining: intervalWorkSeconds, totalRemaining: totalDurationSeconds }
          : null,
      );
      setStage("running");
    } catch {
      setError(t("startError"));
    }
  }

  // The power for a color is discovered at the START of that color first
  // workout (including white first workout ever) - not at the end of the
  // previous one - and only once: continuing from the reveal unlocks the
  // "received power" challenge, which is what marks it as seen.
  function handleStart() {
    if (showPowerReveal) {
      setStage("power-reveal");
      return;
    }
    beginWorkoutSession();
  }

  async function handlePowerContinue() {
    try {
      setPowerChallenge(await unlockPowerChallenge(createClient(), childId, color));
    } catch {
      // Not worth blocking the workout over; the reveal just shows again next time.
    }
    await beginWorkoutSession();
  }

  async function finishSession(actualSeconds: number) {
    if (!sessionId) return;
    setError(null);
    try {
      await finishWorkoutSession(sessionId, actualSeconds);
      setActualDurationSeconds(actualSeconds);
      setStage("questionnaire");
    } catch {
      setError(t("finishError"));
    }
  }

  function manualFinishSeconds() {
    return hasIntervalStructure
      ? totalDurationSeconds - (timer?.totalRemaining ?? 0)
      : elapsedSeconds;
  }

  function handleManualFinish() {
    const percent = calculateCompletionPercent(manualFinishSeconds(), plannedDurationSeconds);
    if (!meetsCompletionThreshold(percent)) {
      setStopConfirmOpen(true);
      return;
    }
    finishSession(manualFinishSeconds());
  }

  function handleConfirmStop() {
    setStopConfirmOpen(false);
    finishSession(manualFinishSeconds());
  }

  async function handleSubmitQuestionnaire() {
    if (!sessionId) return;
    setError(null);
    setSubmitting(true);
    try {
      const outcome = await completeWorkout({
        childId,
        sessionId,
        beltColor: color,
        stationNumber: replayStation ?? workoutIndex,
        recommendedDifficulty: workout.recommended_difficulty ?? 1,
        recommendedDurationMinutes,
        plannedDurationSeconds,
        actualDurationSeconds,
        answers: {
          activityReported: "",
          difficultyReported: Number(difficultyReported),
          parentTrainedTogether: parentTrainedTogether === "yes",
          feelingAfter,
        },
      });
      setResult(outcome);
      setStage("result");
    } catch {
      setError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNextWorkout() {
    setNextWorkoutLoading(true);
    try {
      const supabase = createClient();
      const next = await getNextWorkout(supabase, childId);
      router.push(next ? `/workout/${next.workout.id}` : "/dashboard");
    } finally {
      setNextWorkoutLoading(false);
    }
  }

  if (stage === "power-reveal") {
    return <PowerRevealScreen color={color} onContinue={handlePowerContinue} />;
  }

  if (stage === "result" && result) {
    // The power challenge was unlocked back at the reveal; list it with the
    // ones from this workout so the child sees everything they earned.
    const announcedChallenges = powerChallenge
      ? [powerChallenge, ...result.newChallenges]
      : result.newChallenges;
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <WorkoutCelebration
          result={result}
          challenges={announcedChallenges}
          stageColor={color}
          requiredWorkouts={requiredWorkouts}
          feeling={feelingAfter}
          gender={gender}
        />

        <div className="space-y-2">
          <button
            type="button"
            disabled={nextWorkoutLoading}
            onClick={handleNextWorkout}
            className="block min-h-[52px] w-full rounded-2xl bg-green-600 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-[transform,box-shadow] hover:bg-green-700 active:translate-y-[3px] active:shadow-[0_1px_0_theme(colors.green.800)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {nextWorkoutLoading ? t("loading") : t("nextWorkout")}
          </button>
          {result.unlockedChallenge && result.newColor && (
            <Button className="w-full" onClick={() => setShowChallengeModal(true)}>
              {t("advanceToChallenge", { color: tColors(result.newColor) })}
            </Button>
          )}
          <button
            type="button"
            onClick={() => router.push("/dashboard/journey")}
            className="block min-h-12 w-full rounded-2xl border border-zinc-200 bg-white font-display text-base font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            {t("finishSession")}
          </button>
        </div>

        {levelUpPhase === "open" && result.completedStage && result.newColor && (
          <LevelUpScreen
            fromColor={result.completedStage.color}
            toColor={result.newColor}
            workouts={result.completedStage.workouts}
            points={result.completedStage.points}
            onContinue={() => setLevelUpPhase("done")}
          />
        )}

        {!revealDismissed && result.newChallenges.length > 0 && (!result.didLevelUp || levelUpPhase === "done") && (
          <ChallengeRevealPopup
            challenges={result.newChallenges}
            onDone={() => setRevealDismissed(true)}
          />
        )}

        {showChallengeModal && result.unlockedChallenge && result.newColor && (
          <ChallengeUnlockedModal
            title={result.unlockedChallenge.title}
            colorLabel={tColors(result.newColor)}
            onDoNow={() => router.push(`/challenge/${result.unlockedChallenge!.id}`)}
            onPostpone={() => router.push("/dashboard/journey")}
          />
        )}
      </div>
    );
  }

  if (stage === "questionnaire") {
    return (
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-bold">{t("questionnaireTitle")}</h1>

        <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
          <p>
            {t("actualDurationLabel", { duration: formatDurationClock(actualDurationSeconds) })}
          </p>
          {extraMinutes > 0 && (
            <p className="mt-1 font-medium text-green-700">
              {t("trainedLongerPraise", { minutes: extraMinutes })}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">
            {t("difficultyLabel")}
          </label>
          <select
            value={difficultyReported}
            onChange={(e) => setDifficultyReported(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {DIFFICULTY_VALUES.map((n) => (
              <option key={n} value={n}>
                {t(DIFFICULTY_LABEL_KEYS[n])}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">
            {t("parentTogetherLabel")}
          </label>
          <select
            value={parentTrainedTogether}
            onChange={(e) => setParentTrainedTogether(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="no">{t("no")}</option>
            <option value="yes">{t("yes")}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">{t("feelingLabel")}</label>
          <select
            value={feelingAfter}
            onChange={(e) => setFeelingAfter(e.target.value as FeelingCode)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {FEELING_CODES.map((code) => (
              <option key={code} value={code}>
                {FEELING_ICONS[code]} {t(FEELING_LABEL_KEYS[code], { gender: gender ?? "male" })}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button className="w-full" disabled={submitting} onClick={handleSubmitQuestionnaire}>
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      <p className="text-sm font-medium text-zinc-500">
        {t("colorProgress", { color: colorLabel, index: workoutIndex, total: requiredWorkouts })}
      </p>
      {replayStation !== null && (
        <p className="text-sm font-semibold text-brand-purple">{t("replayBadge")}</p>
      )}
      <h1 className="text-2xl font-bold">{resolveLocalizedText(workout.title, locale)}</h1>
      <p className="text-sm text-zinc-500">
        {t("recommended", {
          minutes: workout.recommended_duration_minutes ?? "-",
          difficulty: workout.recommended_difficulty ?? "-",
        })}
      </p>

      {stage === "idle" && exercises.length > 0 && (
        <div className="w-full space-y-2 text-right">
          <h2 className="text-base font-semibold text-text-muted">{t("exercisesHeading")}</h2>
          {exercises.map(({ slotNumber, exercise }) => (
            <div key={exercise.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
              {exercise.image_url && (
                // eslint-disable-next-line @next/next/no-img-element -- external Storage URLs, no remotePatterns configured
                <img
                  src={exercise.image_url}
                  alt={locale === "en" ? exercise.name_en : exercise.name_he}
                  className="mb-2 h-40 w-full rounded-md object-cover"
                />
              )}
              <p className="text-lg font-semibold">
                {slotNumber}. {locale === "en" ? exercise.name_en : exercise.name_he}
              </p>
              {exercise.description_he && (
                <p className="mt-1 text-base text-zinc-600">{exercise.description_he}</p>
              )}
              {exercise.difficulty_tip_he && (
                <p className="mt-1 text-sm text-brand-purple">
                  {t("difficultyTipLabel")}: {exercise.difficulty_tip_he}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {stage === "running" && currentExercise && (
        <div className="w-full rounded-md border border-zinc-200 bg-zinc-50 p-3 text-right">
          <p className="text-sm font-semibold text-text-muted">{t("currentExerciseLabel")}</p>
          {currentExercise.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- external Storage URLs, no remotePatterns configured
            <img
              src={currentExercise.image_url}
              alt={locale === "en" ? currentExercise.name_en : currentExercise.name_he}
              className="mt-1 h-40 w-full rounded-md object-cover"
            />
          )}
          <p className="mt-0.5 text-lg font-semibold">
            {locale === "en" ? currentExercise.name_en : currentExercise.name_he}
          </p>
          {currentExercise.description_he && (
            <p className="mt-1 text-base text-zinc-600">{currentExercise.description_he}</p>
          )}
          {currentExercise.difficulty_tip_he && (
            <p className="mt-1 text-sm text-brand-purple">
              {t("difficultyTipLabel")}: {currentExercise.difficulty_tip_he}
            </p>
          )}
        </div>
      )}

      {workout.description && (
        <p className="text-zinc-600">{resolveLocalizedText(workout.description, locale)}</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {stage === "idle" && (
        <Button className="w-full" onClick={handleStart}>
          {t("start")}
        </Button>
      )}

      {stage === "running" && hasIntervalStructure && timer && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-text-muted">
            {t(timer.phase === "work" ? "phaseWork" : "phaseRest")}
          </p>
          <div className="flex items-center justify-center gap-6">
            <p
              className={`font-mono text-5xl font-bold ${
                timer.phase === "work" ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatDurationClock(timer.phaseRemaining)}
            </p>
            <div className="rounded-lg bg-zinc-100 px-3 py-2 text-center">
              <p className="text-xs text-text-muted">{t("setLabel")}</p>
              <p className="text-lg font-bold">
                {t("setProgress", { current: timer.currentSet, total: intervalRounds })}
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={handleManualFinish}>
            {t("finish")}
          </Button>
        </div>
      )}

      {stage === "running" && !hasIntervalStructure && (
        <div className="space-y-4">
          <p className="font-mono text-4xl font-bold text-blue-700">
            {formatDurationClock(elapsedSeconds)}
          </p>
          <Button className="w-full" onClick={handleManualFinish}>
            {t("finish")}
          </Button>
        </div>
      )}

      {/* TEMP — testing shortcut: finishes as if exactly that share of the
          planned time was done, so the whole points/star/level-up path can
          be checked without exercising. Only shown when switched on in
          Settings on this device (lib/qa-tools.ts). */}
      {stage === "running" && qaTools && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => finishSession(plannedDurationSeconds)}
            className="flex-1 rounded-md border border-dashed border-zinc-400 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            {t("qaFinish100")}
          </button>
          <button
            type="button"
            onClick={() => finishSession(Math.round(plannedDurationSeconds * 0.7))}
            className="flex-1 rounded-md border border-dashed border-zinc-400 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            {t("qaFinish70")}
          </button>
        </div>
      )}

      {stopConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xs space-y-4 rounded-lg bg-white p-5 text-center">
            <p className="text-base font-semibold">{t("stopConfirmMessage")}</p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setStopConfirmOpen(false)}>
                {t("stopConfirmContinue")}
              </Button>
              <Button className="flex-1 bg-zinc-700 hover:bg-zinc-800" onClick={handleConfirmStop}>
                {t("stopConfirmStop")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
