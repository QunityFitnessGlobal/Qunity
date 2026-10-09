"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { WorkoutIntro } from "@/components/child/WorkoutIntro";
import { useReadyCountdown } from "@/components/child/ReadyCountdown";
import { WorkoutTimerView } from "@/components/child/WorkoutTimerView";
import { ChallengeUnlockedModal } from "@/components/child/ChallengeUnlockedModal";
import { ChallengeRevealPopup } from "@/components/child/ChallengeRevealPopup";
import { WorkoutCelebration } from "@/components/child/WorkoutCelebration";
import { WorkoutCheckin, type CheckinAnswers } from "@/components/child/WorkoutCheckin";
import { LevelUpScreen } from "@/components/child/LevelUpScreen";
import { readQaTools } from "@/lib/qa-tools";
import { unlockPowerChallenge } from "@/services/challenge.service";
import { calculateCompletionPercent, meetsCompletionThreshold } from "@/services/points.service";
import type { ChallengeDefinition } from "@/data/challenges.data";
import { PowerRevealScreen } from "@/components/child/PowerRevealScreen";
import {
  getWorkoutSoundPreference,
  playWorkoutSound,
  stopWorkoutSound,
  unlockWorkoutAudio,
} from "@/lib/workout-sounds";
import { FEELING_CODES, type FeelingCode } from "@/lib/workout-labels";
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
  // The power challenge's bonus, shown on the reveal; null when unknown.
  powerBonusPoints: number | null;
  requiredWorkouts: number;
  color: BraceletColor;
  colorLabel: string;
  intervalRounds: number | null;
  intervalWorkSeconds: number | null;
  intervalRestSeconds: number | null;
  gender: Gender | null;
  exercises: WorkoutExerciseEntry[];
  // TEMP: admins (and children linked to them) may use the quick-finish
  // testing shortcuts, once also switched on in Settings on the device.
  qaToolsAllowed: boolean;
}

type Stage = "idle" | "running" | "questionnaire" | "power-reveal" | "result";

interface IntervalTimerState {
  phase: "work" | "rest";
  currentSet: number;
  phaseRemaining: number;
  totalRemaining: number;
}

// "Repeat workout" (a run that ended under 60%) starts the same workout over
// as a fresh run. Pushing the same address wouldn't (the screen keeps its
// state), so a new key does it instead, with what a reload would work out:
// the station now counts as another try at it, and its power was already
// revealed.
export function WorkoutRunner(props: WorkoutRunnerProps) {
  const [attempt, setAttempt] = useState(0);
  const repeated = attempt > 0;
  return (
    <WorkoutRun
      key={attempt}
      {...props}
      replayStation={repeated ? (props.replayStation ?? props.workoutIndex) : props.replayStation}
      showPowerReveal={props.showPowerReveal && !repeated}
      onRepeat={() => {
        setAttempt((n) => n + 1);
        window.scrollTo(0, 0);
      }}
    />
  );
}

function WorkoutRun({
  childId,
  workout,
  workoutIndex,
  replayStation,
  showPowerReveal,
  powerBonusPoints,
  requiredWorkouts,
  color,
  colorLabel,
  intervalRounds,
  intervalWorkSeconds,
  intervalRestSeconds,
  gender,
  exercises,
  qaToolsAllowed,
  onRepeat,
}: WorkoutRunnerProps & { onRepeat: () => void }) {
  const t = useTranslations("workout");
  const tColors = useTranslations("colors");
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timer, setTimer] = useState<IntervalTimerState | null>(null);
  const [actualDurationSeconds, setActualDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CompleteWorkoutResult | null>(null);

  // What the child picked in the check-in; only read on the result screen,
  // which is reached after it's been set.
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
  // The child paused from the timer screen; the clock waits until they resume.
  const [paused, setPaused] = useState(false);
  const [powerChallenge, setPowerChallenge] = useState<ChallengeDefinition | null>(null);
  // A level-up takes over the result screen once its stage bar has filled
  // ("open"); the challenge popups wait until it's closed ("done").
  const [levelUpPhase, setLevelUpPhase] = useState<"pending" | "open" | "done">("pending");
  // TEMP testing shortcuts (Settings › "כלי בדיקה באימון"), read when the
  // workout starts.
  const [qaTools, setQaTools] = useState(false);
  // The 3-2-1 before the timer starts. The session row is created as soon as
  // the child taps "ready", so it's usually there by the time the count ends.
  const sessionStartRef = useRef<Promise<string> | null>(null);
  const countdown = useReadyCountdown(launchWorkout);

  const recommendedDurationMinutes = workout.recommended_duration_minutes ?? 0;

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
    if (stage !== "running" || hasIntervalStructure || stopConfirmOpen || paused) {
      return;
    }
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [stage, hasIntervalStructure, stopConfirmOpen, paused]);

  useEffect(() => {
    if (stage !== "running" || !hasIntervalStructure || stopConfirmOpen || paused) {
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
  }, [stage, hasIntervalStructure, stopConfirmOpen, paused, intervalWorkSeconds, intervalRestSeconds]);

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

  // "I'm ready": still inside the tap here, which is what lets the browser
  // play the timer's later, gesture-less transition sounds.
  function startCountdown() {
    unlockWorkoutAudio();
    setError(null);
    const start = startWorkoutSession(childId, workout.id, {
      stationNumber: replayStation ?? workoutIndex,
      isReplay: replayStation !== null,
    });
    // Awaited when the count ends; this only keeps an early failure from
    // surfacing as an unhandled rejection in the meantime.
    start.catch(() => {});
    sessionStartRef.current = start;
    countdown.start();
  }

  async function launchWorkout() {
    try {
      const id = await sessionStartRef.current!;
      setSessionId(id);
      setQaTools(qaToolsAllowed && readQaTools());
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
    startCountdown();
  }

  function handlePowerContinue() {
    startCountdown();
    setStage("idle");
    unlockPowerChallenge(createClient(), childId, color)
      .then(setPowerChallenge)
      // Not worth blocking the workout over; the reveal just shows again next time.
      .catch(() => {});
  }

  async function finishSession(actualSeconds: number) {
    if (!sessionId) return;
    setError(null);
    try {
      await finishWorkoutSession(sessionId, actualSeconds);
      setPaused(false);
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

  async function handleSubmitQuestionnaire(answers: CheckinAnswers) {
    if (!sessionId) return;
    setError(null);
    setSubmitting(true);
    setFeelingAfter(answers.feeling);
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
        hasIntervalTimer: hasIntervalStructure,
        answers: {
          activityReported: "",
          difficultyReported: answers.difficulty,
          parentTrainedTogether: answers.trainedTogether,
          feelingAfter: answers.feeling,
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
    return (
      <PowerRevealScreen
        color={color}
        onContinue={handlePowerContinue}
        gender={gender}
        bonusPoints={powerBonusPoints}
      />
    );
  }

  if (stage === "result" && result) {
    // The power challenge was unlocked back at the reveal; list it with the
    // ones from this workout so the child sees everything they earned.
    const announcedChallenges = powerChallenge
      ? [powerChallenge, ...result.newChallenges]
      : result.newChallenges;
    // Under 60% the station is still open, so the next workout would be this
    // same one: offer it straight away as a repeat.
    const passed = meetsCompletionThreshold(result.completionPercent);
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
            onClick={passed ? handleNextWorkout : onRepeat}
            className="block min-h-[52px] w-full rounded-2xl bg-green-600 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-[transform,box-shadow] hover:bg-green-700 active:translate-y-[3px] active:shadow-[0_1px_0_theme(colors.green.800)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {nextWorkoutLoading ? t("loading") : passed ? t("nextWorkout") : t("repeatWorkout")}
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

        {levelUpPhase === "open" && result.nextStage && result.newColor && (
          <LevelUpScreen
            fromColor={color}
            toColor={result.newColor}
            workouts={result.nextStage.workouts}
            points={result.nextStage.points}
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
            gender={gender}
            onDoNow={() => router.push(`/challenge/${result.unlockedChallenge!.id}`)}
            onPostpone={() => router.push("/dashboard/journey")}
          />
        )}
      </div>
    );
  }

  if (stage === "questionnaire") {
    return (
      <WorkoutCheckin
        actualDurationSeconds={actualDurationSeconds}
        plannedDurationSeconds={plannedDurationSeconds}
        hasIntervalTimer={hasIntervalStructure}
        recommendedDurationMinutes={recommendedDurationMinutes}
        gender={gender}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmitQuestionnaire}
      />
    );
  }

  const qaButtons = qaTools && (
    // TEMP — testing shortcut: finishes as if exactly that share of the
    // planned time was done, so the whole points/star/level-up path can be
    // checked without exercising. Only shown when switched on in Settings on
    // this device (lib/qa-tools.ts).
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => finishSession(plannedDurationSeconds)}
        className="flex-1 rounded-md border border-dashed border-zinc-400 bg-white/70 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {t("qaFinish100")}
      </button>
      <button
        type="button"
        onClick={() => finishSession(Math.round(plannedDurationSeconds * 0.7))}
        className="flex-1 rounded-md border border-dashed border-zinc-400 bg-white/70 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {t("qaFinish70")}
      </button>
    </div>
  );

  if (stage === "running") {
    const nextSet = (timer?.currentSet ?? 1) + 1;
    const nextExercise =
      hasIntervalStructure && exercises.length > 0 && nextSet <= intervalRounds
        ? exercises[(nextSet - 1) % exercises.length].exercise
        : null;
    return (
      <>
        <WorkoutTimerView
          interval={
            hasIntervalStructure && timer
              ? {
                  phase: timer.phase,
                  currentSet: timer.currentSet,
                  rounds: intervalRounds,
                  phaseRemaining: timer.phaseRemaining,
                  phaseLength: timer.phase === "work" ? intervalWorkSeconds : intervalRestSeconds,
                }
              : null
          }
          elapsedSeconds={elapsedSeconds}
          exercise={currentExercise}
          nextExercise={nextExercise}
          onFinish={handleManualFinish}
          paused={paused}
          onPause={() => setPaused(true)}
          onResume={() => setPaused(false)}
          error={error}
        >
          {qaButtons}
        </WorkoutTimerView>

        {stopConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-xs space-y-4 rounded-2xl bg-white p-5 text-center">
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
      </>
    );
  }

  return (
    <WorkoutIntro
      workout={workout}
      color={color}
      colorLabel={colorLabel}
      workoutIndex={workoutIndex}
      requiredWorkouts={requiredWorkouts}
      isReplay={replayStation !== null}
      minutes={Math.ceil(plannedDurationSeconds / 60)}
      exercises={exercises}
      gender={gender}
      error={error}
      countdown={countdown.step}
      onReady={handleStart}
    />
  );
}
