"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { completeChallenge } from "@/services/challenge.service";
import { Button } from "@/components/ui/Button";
import { formatDurationClock } from "@/lib/format";
import { resolveLocalizedText } from "@/lib/i18n-content";
import {
  DIFFICULTY_VALUES,
  DIFFICULTY_LABEL_KEYS,
  FEELING_CODES,
  FEELING_LABEL_KEYS,
  FEELING_ICONS,
  type FeelingCode,
} from "@/lib/workout-labels";
import type { Gender } from "@/lib/types";
import type { LocalizedText } from "@/lib/i18n-content";

interface ChallengeRunnerProps {
  childId: string;
  challengeId: string;
  title: LocalizedText;
  description: LocalizedText | null;
  bonusPoints: number;
  gender: Gender | null;
}

type Stage = "idle" | "running" | "questionnaire" | "result";

// A "type B" repeatable challenge (see schema.sql's "ADDED FOR REPEATABLE
// CHALLENGES" note) — same end-of-session questionnaire as a regular
// workout, but always a plain count-up stopwatch (no interval structure),
// and can be done again afterward, unlike a regular belt workout.
export function ChallengeRunner({
  childId,
  challengeId,
  title,
  description,
  bonusPoints,
  gender,
}: ChallengeRunnerProps) {
  const t = useTranslations("workout");
  const tChallenge = useTranslations("challengeRunner");
  const locale = useLocale();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actualDurationSeconds, setActualDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  const [difficultyReported, setDifficultyReported] = useState("2");
  const [parentTrainedTogether, setParentTrainedTogether] = useState("no");
  const [feelingAfter, setFeelingAfter] = useState<FeelingCode>(FEELING_CODES[0]);

  useEffect(() => {
    if (stage !== "running") {
      return;
    }
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [stage]);

  function handleStart() {
    setError(null);
    setElapsedSeconds(0);
    setStage("running");
  }

  function handleFinish() {
    setActualDurationSeconds(elapsedSeconds);
    setStage("questionnaire");
  }

  async function handleSubmitQuestionnaire() {
    setError(null);
    setSubmitting(true);
    try {
      const outcome = await completeChallenge(childId, challengeId, actualDurationSeconds, {
        difficultyReported: Number(difficultyReported),
        parentTrainedTogether: parentTrainedTogether === "yes",
        feelingAfter,
      });
      setPointsAwarded(outcome.pointsAwarded);
      setStage("result");
    } catch {
      setError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "result") {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">{tChallenge("resultTitle")}</h1>
        <p className="text-zinc-600">{tChallenge("pointsAwarded", { points: pointsAwarded })}</p>
        <Button className="w-full" onClick={() => router.push("/dashboard/journey")}>
          {tChallenge("backToJourney")}
        </Button>
      </div>
    );
  }

  if (stage === "questionnaire") {
    return (
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-bold">{t("questionnaireTitle")}</h1>

        <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
          <p>{t("actualDurationLabel", { duration: formatDurationClock(actualDurationSeconds) })}</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">{t("difficultyLabel")}</label>
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
          <label className="block text-sm font-medium text-zinc-700">{t("parentTogetherLabel")}</label>
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
      <p className="text-sm font-medium text-zinc-500">{tChallenge("badge")}</p>
      <h1 className="text-2xl font-bold">{resolveLocalizedText(title, locale)}</h1>
      {description && <p className="text-zinc-600">{resolveLocalizedText(description, locale)}</p>}
      <p className="text-sm text-zinc-500">{tChallenge("bonusPoints", { points: bonusPoints })}</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {stage === "idle" && (
        <Button className="w-full" onClick={handleStart}>
          {t("start")}
        </Button>
      )}

      {stage === "running" && (
        <div className="space-y-4">
          <p className="font-mono text-4xl font-bold text-blue-700">{formatDurationClock(elapsedSeconds)}</p>
          <Button className="w-full" onClick={handleFinish}>
            {t("finish")}
          </Button>
        </div>
      )}
    </div>
  );
}
