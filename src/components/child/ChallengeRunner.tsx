"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  finishChallengeSession,
  saveChallengeAnswers,
  startChallengeSession,
  type FinishedChallenge,
} from "@/services/challenge.service";
import { ChallengeIntro } from "@/components/child/ChallengeIntro";
import { ChallengeCelebration } from "@/components/child/ChallengeCelebration";
import { ChallengeRevealPopup } from "@/components/child/ChallengeRevealPopup";
import { StairsIcon } from "@/components/child/challengeIcons";
import { useReadyCountdown } from "@/components/child/ReadyCountdown";
import { WorkoutCheckin, type CheckinAnswers } from "@/components/child/WorkoutCheckin";
import { WorkoutTimerView } from "@/components/child/WorkoutTimerView";
import { resolveGenderedText, resolveLocalizedText } from "@/lib/i18n-content";
import type { ChallengeDefinition } from "@/data/challenges.data";
import type { FeelingCode } from "@/lib/workout-labels";
import type { BraceletColor, Gender } from "@/lib/types";
import type { LocalizedText } from "@/lib/i18n-content";

interface ChallengeRunnerProps {
  childId: string;
  challengeId: string;
  title: LocalizedText;
  description: LocalizedText | null;
  // The most a single run pays (a quick finish pays less, see schema.sql's
  // "ADDED FOR TIMED CHALLENGE POINTS").
  bonusPoints: number;
  // The stage whose finish unlocked this challenge.
  color: BraceletColor | null;
  colorLabel: string | null;
  // Most points from one run so far, and how many times it was done.
  bestPoints: number | null;
  timesDone: number;
  gender: Gender | null;
}

type Stage = "idle" | "running" | "questionnaire" | "result";

interface ChallengeOutcome {
  pointsAwarded: number;
  durationSeconds: number;
  previousBestPoints: number | null;
  feeling: FeelingCode;
  // Parent Power, when "my parent trained with me" earned it just now.
  earned: ChallengeDefinition | null;
}

// A "type B" repeatable challenge (see schema.sql's "ADDED FOR REPEATABLE
// CHALLENGES" note), in the same screens as a workout: the intro with its
// 3-2-1, a count-up clock, the tap-to-answer check-in, and a celebration.
// The server times it from the end of the 3-2-1 to "finished" and pays by
// that time, so there's no pause here. It can be done again straight from
// the result.
export function ChallengeRunner({
  childId,
  challengeId,
  title,
  description,
  bonusPoints,
  color,
  colorLabel,
  bestPoints: initialBest,
  timesDone: initialTimes,
  gender,
}: ChallengeRunnerProps) {
  const t = useTranslations("challengeRunner");
  const tWorkout = useTranslations("workout");
  const locale = useLocale();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState<FinishedChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<ChallengeOutcome | null>(null);
  const [revealDismissed, setRevealDismissed] = useState(false);
  // Kept here so "try again" shows the best and count including this run.
  const [bestPoints, setBestPoints] = useState(initialBest);
  const [timesDone, setTimesDone] = useState(initialTimes);
  // The server session of the current run, opened as the 3-2-1 ends.
  const sessionRef = useRef<Promise<string> | null>(null);
  const finishingRef = useRef(false);
  const countdown = useReadyCountdown(() => {
    setElapsedSeconds(0);
    setStage("running");
    const start = startChallengeSession(challengeId);
    sessionRef.current = start;
    start.catch(() => {
      setStage("idle");
      setError(tWorkout("startError"));
    });
  });

  const titleText = resolveLocalizedText(title, locale);
  const descriptionText = description ? resolveGenderedText(description, locale, gender) : null;

  useEffect(() => {
    if (stage !== "running") {
      return;
    }
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [stage]);

  async function handleFinish() {
    if (finishingRef.current || !sessionRef.current) return;
    finishingRef.current = true;
    setError(null);
    try {
      const sessionId = await sessionRef.current;
      setFinished(await finishChallengeSession(sessionId));
      setStage("questionnaire");
    } catch {
      setError(tWorkout("finishError"));
    } finally {
      finishingRef.current = false;
    }
  }

  async function handleSubmit(answers: CheckinAnswers) {
    if (!finished || !sessionRef.current) return;
    setError(null);
    setSubmitting(true);
    try {
      const sessionId = await sessionRef.current;
      const earned = await saveChallengeAnswers(childId, sessionId, {
        difficultyReported: answers.difficulty,
        parentTrainedTogether: answers.trainedTogether,
        feelingAfter: answers.feeling,
      });
      setOutcome({
        pointsAwarded: finished.points,
        durationSeconds: finished.seconds,
        previousBestPoints: bestPoints,
        feeling: answers.feeling,
        earned,
      });
      setBestPoints((best) => (best === null ? finished.points : Math.max(best, finished.points)));
      setTimesDone((n) => n + 1);
      setRevealDismissed(false);
      setStage("result");
    } catch {
      setError(tWorkout("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "result" && outcome) {
    return (
      <>
        <ChallengeCelebration
          pointsAwarded={outcome.pointsAwarded}
          maxPoints={bonusPoints}
          durationSeconds={outcome.durationSeconds}
          previousBestPoints={outcome.previousBestPoints}
          feeling={outcome.feeling}
          gender={gender}
          onTryAgain={() => {
            setOutcome(null);
            setFinished(null);
            sessionRef.current = null;
            setStage("idle");
          }}
          onBack={() => router.push("/dashboard/challenges")}
        />
        {outcome.earned && !revealDismissed && (
          <ChallengeRevealPopup challenges={[outcome.earned]} onDone={() => setRevealDismissed(true)} />
        )}
      </>
    );
  }

  if (stage === "questionnaire" && finished) {
    return (
      <WorkoutCheckin
        kind="challenge"
        actualDurationSeconds={finished.seconds}
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
      bestPoints={bestPoints}
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
