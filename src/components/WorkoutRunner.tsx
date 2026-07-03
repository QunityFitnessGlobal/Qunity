"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  startWorkoutSession,
  finishWorkoutSession,
  completeWorkout,
  getNextWorkout,
  type CompleteWorkoutResult,
} from "@/services/workout.service";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { formatDurationClock } from "@/lib/format";
import { resolveLocalizedText } from "@/lib/i18n-content";
import type { Workout } from "@/lib/types";

interface WorkoutRunnerProps {
  childId: string;
  workout: Workout;
  workoutIndex: number;
  requiredWorkouts: number;
  colorLabel: string;
}

type Stage = "idle" | "running" | "questionnaire" | "result";

// Stable, locale-independent codes stored in workout_results.feeling_after
// (tip-conditions/all-feelings-are-allowed.ts matches against "hard"). Only
// the displayed label ("workout.feeling*" message keys) is translated.
const FEELING_CODES = ["great", "ok", "hard"] as const;
type FeelingCode = (typeof FEELING_CODES)[number];
const FEELING_LABEL_KEYS: Record<FeelingCode, string> = {
  great: "feelingGreat",
  ok: "feelingOk",
  hard: "feelingHard",
};

export function WorkoutRunner({
  childId,
  workout,
  workoutIndex,
  requiredWorkouts,
  colorLabel,
}: WorkoutRunnerProps) {
  const t = useTranslations("workout");
  const locale = useLocale();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actualDurationSeconds, setActualDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CompleteWorkoutResult | null>(null);

  const [activityReported, setActivityReported] = useState("");
  const [difficultyReported, setDifficultyReported] = useState("3");
  const [parentTrainedTogether, setParentTrainedTogether] = useState("no");
  const [feelingAfter, setFeelingAfter] = useState<FeelingCode>(FEELING_CODES[0]);
  const [nextWorkoutLoading, setNextWorkoutLoading] = useState(false);

  const recommendedDurationMinutes = workout.recommended_duration_minutes ?? 0;
  const extraMinutes = Math.round(actualDurationSeconds / 60) - recommendedDurationMinutes;

  useEffect(() => {
    if (stage !== "running") {
      return;
    }
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [stage]);

  async function handleStart() {
    setError(null);
    try {
      const id = await startWorkoutSession(childId, workout.id);
      setSessionId(id);
      setElapsedSeconds(0);
      setStage("running");
    } catch {
      setError(t("startError"));
    }
  }

  async function handleFinish() {
    if (!sessionId) return;
    setError(null);
    try {
      await finishWorkoutSession(sessionId, elapsedSeconds);
      setActualDurationSeconds(elapsedSeconds);
      setStage("questionnaire");
    } catch {
      setError(t("finishError"));
    }
  }

  async function handleSubmitQuestionnaire() {
    if (!sessionId) return;
    setError(null);
    setSubmitting(true);
    try {
      const outcome = await completeWorkout({
        childId,
        sessionId,
        recommendedDifficulty: workout.recommended_difficulty ?? 1,
        recommendedDurationMinutes,
        actualDurationSeconds,
        answers: {
          activityReported,
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

  if (stage === "result" && result) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("resultTitle")}</h1>
        <p className="text-zinc-600">{t("pointsAwarded", { points: result.pointsAwarded })}</p>

        {result.didLevelUp && result.newColor && (
          <div className="rounded-lg bg-yellow-50 p-4 text-lg font-bold text-yellow-800">
            {t("leveledUp")}
          </div>
        )}

        {result.newChallenges.length > 0 && (
          <div className="space-y-2 rounded-lg bg-blue-50 p-4 text-right">
            {result.newChallenges.map((challenge) => (
              <p key={challenge.id} className="text-sm font-medium text-blue-800">
                {t("challengeUnlocked", {
                  title: resolveLocalizedText(challenge.title, locale),
                  points: challenge.bonusPoints,
                })}
              </p>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Button className="w-full" disabled={nextWorkoutLoading} onClick={handleNextWorkout}>
            {nextWorkoutLoading ? t("loading") : t("nextWorkout")}
          </Button>
          <Button
            className="w-full bg-zinc-700 hover:bg-zinc-800"
            onClick={() => router.push("/dashboard")}
          >
            {t("finishSession")}
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "questionnaire") {
    return (
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-bold">{t("questionnaireTitle")}</h1>

        <TextField
          label={t("activityLabel")}
          name="activity"
          value={activityReported}
          onChange={setActivityReported}
          required
        />

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
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
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
                {t(FEELING_LABEL_KEYS[code])}
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
      <h1 className="text-2xl font-bold">{resolveLocalizedText(workout.title, locale)}</h1>
      {workout.description && (
        <p className="text-zinc-600">{resolveLocalizedText(workout.description, locale)}</p>
      )}
      <p className="text-sm text-zinc-500">
        {t("recommended", {
          minutes: workout.recommended_duration_minutes ?? "-",
          difficulty: workout.recommended_difficulty ?? "-",
        })}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {stage === "idle" && (
        <Button className="w-full" onClick={handleStart}>
          {t("start")}
        </Button>
      )}

      {stage === "running" && (
        <div className="space-y-4">
          <p className="font-mono text-4xl font-bold text-blue-700">
            {formatDurationClock(elapsedSeconds)}
          </p>
          <Button className="w-full" onClick={handleFinish}>
            {t("finish")}
          </Button>
        </div>
      )}
    </div>
  );
}
