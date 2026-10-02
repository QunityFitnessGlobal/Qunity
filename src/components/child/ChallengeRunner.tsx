"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { completeChallenge } from "@/services/challenge.service";
import { ChallengeIntro } from "@/components/child/ChallengeIntro";
import { ChallengeCelebration } from "@/components/child/ChallengeCelebration";
import { StairsIcon } from "@/components/child/challengeIcons";
import { useReadyCountdown } from "@/components/child/ReadyCountdown";
import { WorkoutCheckin, type CheckinAnswers } from "@/components/child/WorkoutCheckin";
import { WorkoutTimerView } from "@/components/child/WorkoutTimerView";
import { resolveGenderedText, resolveLocalizedText } from "@/lib/i18n-content";
import type { FeelingCode } from "@/lib/workout-labels";
import type { BraceletColor, Gender } from "@/lib/types";
import type { LocalizedText } from "@/lib/i18n-content";

interface ChallengeRunnerProps {
  childId: string;
  challengeId: string;
  title: LocalizedText;
  description: LocalizedText | null;
  bonusPoints: number;
  // The stage whose finish unlocked this challenge.
  color: BraceletColor | null;
  colorLabel: string | null;
  // Fastest finish so far, and how many times it was done.
  bestSeconds: number | null;
  timesDone: number;
  gender: Gender | null;
}

type Stage = "idle" | "running" | "questionnaire" | "result";

interface ChallengeOutcome {
  pointsAwarded: number;
  durationSeconds: number;
  previousBestSeconds: number | null;
  feeling: FeelingCode;
}

// A "type B" repeatable challenge (see schema.sql's "ADDED FOR REPEATABLE
// CHALLENGES" note), in the same screens as a workout: the intro with its
// 3-2-1, a count-up clock with pause, the tap-to-answer check-in, and a
// celebration — with the child's record instead of a star. It pays its
// bonus every time and can be done again straight from the result.
export function ChallengeRunner({
  childId,
  challengeId,
  title,
  description,
  bonusPoints,
  color,
  colorLabel,
  bestSeconds: initialBest,
  timesDone: initialTimes,
  gender,
}: ChallengeRunnerProps) {
  const t = useTranslations("challengeRunner");
  const tWorkout = useTranslations("workout");
  const locale = useLocale();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actualDurationSeconds, setActualDurationSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<ChallengeOutcome | null>(null);
  // Kept here so "try again" shows the record and count including this run.
  const [bestSeconds, setBestSeconds] = useState(initialBest);
  const [timesDone, setTimesDone] = useState(initialTimes);
  const countdown = useReadyCountdown(() => {
    setElapsedSeconds(0);
    setPaused(false);
    setStage("running");
  });

  const titleText = resolveLocalizedText(title, locale);
  const descriptionText = description ? resolveGenderedText(description, locale, gender) : null;

  useEffect(() => {
    if (stage !== "running" || paused) {
      return;
    }
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [stage, paused]);

  function handleFinish() {
    setActualDurationSeconds(elapsedSeconds);
    setPaused(false);
    setStage("questionnaire");
  }

  async function handleSubmit(answers: CheckinAnswers) {
    setError(null);
    setSubmitting(true);
    try {
      const { pointsAwarded } = await completeChallenge(childId, challengeId, actualDurationSeconds, {
        difficultyReported: answers.difficulty,
        parentTrainedTogether: answers.trainedTogether,
        feelingAfter: answers.feeling,
      });
      setOutcome({
        pointsAwarded,
        durationSeconds: actualDurationSeconds,
        previousBestSeconds: bestSeconds,
        feeling: answers.feeling,
      });
      if (actualDurationSeconds > 0 && (bestSeconds === null || actualDurationSeconds < bestSeconds)) {
        setBestSeconds(actualDurationSeconds);
      }
      setTimesDone((n) => n + 1);
      setStage("result");
    } catch {
      setError(tWorkout("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "result" && outcome) {
    return (
      <ChallengeCelebration
        pointsAwarded={outcome.pointsAwarded}
        durationSeconds={outcome.durationSeconds}
        previousBestSeconds={outcome.previousBestSeconds}
        feeling={outcome.feeling}
        gender={gender}
        onTryAgain={() => {
          setOutcome(null);
          setStage("idle");
        }}
        onBack={() => router.push("/dashboard/challenges")}
      />
    );
  }

  if (stage === "questionnaire") {
    return (
      <WorkoutCheckin
        kind="challenge"
        actualDurationSeconds={actualDurationSeconds}
        plannedDurationSeconds={0}
        hasIntervalTimer={false}
        recommendedDurationMinutes={0}
        gender={gender}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
    );
  }

  if (stage === "running") {
    return (
      <WorkoutTimerView
        interval={null}
        elapsedSeconds={elapsedSeconds}
        exercise={null}
        nextExercise={null}
        card={
          <div className="animate-power-fade-up flex w-full items-center gap-3.5 rounded-[20px] border border-zinc-200 bg-white px-4 py-4">
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-reward-gold-soft">
              <StairsIcon className="h-8 w-8 text-reward-gold-ink" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-display text-xl font-semibold">{titleText}</span>
              {descriptionText && <span className="text-sm text-text-muted">{descriptionText}</span>}
            </span>
          </div>
        }
        elapsedLabel={t("elapsedLabel")}
        finishLabel={t("finish")}
        onFinish={handleFinish}
        paused={paused}
        onPause={() => setPaused(true)}
        onResume={() => setPaused(false)}
        error={error}
      />
    );
  }

  return (
    <ChallengeIntro
      title={titleText}
      description={descriptionText}
      bonusPoints={bonusPoints}
      color={color}
      colorLabel={colorLabel}
      bestSeconds={bestSeconds}
      timesDone={timesDone}
      gender={gender}
      error={error}
      countdown={countdown.step}
      onReady={() => {
        setError(null);
        countdown.start();
      }}
    />
  );
}
