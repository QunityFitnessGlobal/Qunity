"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { calculateCompletionPercent, COMPLETION_THRESHOLD_PERCENT } from "@/services/points.service";
import {
  DIFFICULTY_VALUES,
  DIFFICULTY_LABEL_KEYS,
  FEELING_CODES,
  FEELING_LABEL_KEYS,
  type DifficultyValue,
  type FeelingCode,
} from "@/lib/workout-labels";
import type { Gender } from "@/lib/types";

export interface CheckinAnswers {
  difficulty: DifficultyValue;
  trainedTogether: boolean;
  feeling: FeelingCode;
}

interface WorkoutCheckinProps {
  actualDurationSeconds: number;
  plannedDurationSeconds: number;
  // The stage's fixed work/rest timer (every journey workout). The rare
  // count-up clock keeps its old "longer than recommended" line instead.
  hasIntervalTimer: boolean;
  recommendedDurationMinutes: number;
  gender: Gender | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (answers: CheckinAnswers) => void;
}

// "8:00" rather than the clock's "08:00" — reads as a time to a child, and
// is followed by the word "minutes" in the copy.
function formatMinutesForKids(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

interface FaceLook {
  fill: string;
  stroke: string;
  eyes: string;
  mouth: string;
  mouthFilled: boolean;
}

// One drawn face per feeling, from a big grin down to worn out.
const FACES: Record<FeelingCode, FaceLook> = {
  fun: { fill: "#fff4d3", stroke: "#8a5d00", eyes: "M9.8 13.4q1.8-2.4 3.6 0M18.6 13.4q1.8-2.4 3.6 0", mouth: "M9.5 18.2q6.5 7.2 13 0z", mouthFilled: true },
  fine: { fill: "#e3f8ea", stroke: "#15803d", eyes: "M11.5 12.2v1.9M20.5 12.2v1.9", mouth: "M11 19.2q5 4.2 10 0", mouthFilled: false },
  frustrated: { fill: "#fff0e4", stroke: "#b9530f", eyes: "M11.5 13.2v1.9M20.5 13.2v1.9M9.6 10.2l3.6 1.6M22.4 10.2l-3.6 1.6", mouth: "M11 22.4q5-4 10 0", mouthFilled: false },
  tired: { fill: "#e6efff", stroke: "#1d4ed8", eyes: "M9.8 14h3.6M18.6 14h3.6", mouth: "M12.5 21.2h7", mouthFilled: false },
  exhausted: { fill: "#eeedf3", stroke: "#4a4458", eyes: "M10 12l3 3M13 12l-3 3M19 12l3 3M22 12l-3 3", mouth: "M10.5 21.5q1.75-2 3.5 0t3.5 0t3.5 0", mouthFilled: false },
};

// The questionnaire after a workout: three questions answered by tapping,
// with nothing pre-selected — the answers feed the points (harder than
// recommended, trained together) and the closing line on the result
// screen, so a guessed default would skew both. The button stays closed
// until all three are answered and says how many are left.
export function WorkoutCheckin({
  actualDurationSeconds,
  plannedDurationSeconds,
  hasIntervalTimer,
  recommendedDurationMinutes,
  gender,
  submitting,
  error,
  onSubmit,
}: WorkoutCheckinProps) {
  const t = useTranslations("checkin");
  const tWorkout = useTranslations("workout");
  const [difficulty, setDifficulty] = useState<DifficultyValue | null>(null);
  const [trainedTogether, setTrainedTogether] = useState<boolean | null>(null);
  const [feeling, setFeeling] = useState<FeelingCode | null>(null);

  const answersLeft = [difficulty, trainedTogether, feeling].filter((answer) => answer === null).length;
  const genderForm = gender ?? "male";

  function handleSubmit() {
    if (difficulty === null || trainedTogether === null || feeling === null) return;
    onSubmit({ difficulty, trainedTogether, feeling });
  }

  return (
    <div className="w-full max-w-sm space-y-4 text-right">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="text-sm text-text-muted">{t("subtitle")}</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5">
        <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none text-green-700" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 6v4.2l2.5 1.7" />
        </svg>
        <div className="flex flex-col">
          <span className="text-sm">
            {actualDurationSeconds < 60
              ? t("trainedForSeconds", { seconds: actualDurationSeconds })
              : t("trainedFor", { duration: formatMinutesForKids(actualDurationSeconds) })}
          </span>
          <TimeFeedback
            actualSeconds={actualDurationSeconds}
            plannedSeconds={plannedDurationSeconds}
            hasIntervalTimer={hasIntervalTimer}
            recommendedMinutes={recommendedDurationMinutes}
          />
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold">{t("difficultyQuestion")}</h2>
        <div className="grid grid-cols-4 gap-2">
          {DIFFICULTY_VALUES.map((level) => {
            const on = difficulty === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={on}
                onClick={() => setDifficulty(level)}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 text-[13px] font-semibold transition-colors ${
                  on ? "animate-checkin-pick border-brand-purple bg-brand-purple text-white" : "border-zinc-200 bg-white text-zinc-800"
                }`}
              >
                <span className="flex h-5 items-end gap-[3px]" aria-hidden>
                  {DIFFICULTY_VALUES.map((bar) => (
                    <span
                      key={bar}
                      className={`w-[5px] rounded-sm ${
                        bar <= level ? (on ? "bg-white" : "bg-brand-purple") : on ? "bg-white/35" : "bg-zinc-200"
                      }`}
                      style={{ height: 2 + bar * 4 }}
                    />
                  ))}
                </span>
                {tWorkout(DIFFICULTY_LABEL_KEYS[level])}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold">{t("togetherQuestion")}</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            aria-pressed={trainedTogether === true}
            onClick={() => setTrainedTogether(true)}
            className={`flex min-h-[76px] items-center justify-center gap-2.5 rounded-2xl border-2 transition-colors ${
              trainedTogether === true
                ? "animate-checkin-pick border-reward-gold bg-reward-gold-soft"
                : "border-zinc-200 bg-white"
            }`}
          >
            <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="#4f4960" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
              <circle cx="10" cy="7" r="3.2" />
              <path d="M10 11v9M10 20l-3.5 7M10 20l3.5 7M4.5 14.5h11" />
              <circle cx="29" cy="9" r="2.6" />
              <path d="M29 12.5v7M29 19.5l-3 6M29 19.5l3 6M24.5 15.5h9" />
              <path d="M19.5 6.2s-2.4-1.5-2.4-3.2a1.3 1.3 0 0 1 2.4-.7 1.3 1.3 0 0 1 2.4.7c0 1.7-2.4 3.2-2.4 3.2z" fill="#e0457b" stroke="#e0457b" strokeWidth={1} />
            </svg>
            <span className="font-display text-[17px] font-semibold">{t("togetherYes")}</span>
          </button>
          <button
            type="button"
            aria-pressed={trainedTogether === false}
            onClick={() => setTrainedTogether(false)}
            className={`flex min-h-[76px] items-center justify-center gap-2.5 rounded-2xl border-2 transition-colors ${
              trainedTogether === false ? "border-brand-purple bg-brand-purple/[0.07]" : "border-zinc-200 bg-white"
            }`}
          >
            <svg width="22" height="30" viewBox="0 0 22 30" fill="none" stroke="#4f4960" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="7" r="3.2" />
              <path d="M11 11v9M11 20l-3.5 7M11 20l3.5 7M5.5 14.5h11" />
            </svg>
            <span className="font-display text-[17px] font-semibold">{t("togetherNo")}</span>
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold">{t("feelingQuestion")}</h2>
        <div className="grid grid-cols-5 gap-1">
          {FEELING_CODES.map((code) => {
            const on = feeling === code;
            const face = FACES[code];
            const label = tWorkout(FEELING_LABEL_KEYS[code], { gender: genderForm });
            return (
              <button
                key={code}
                type="button"
                aria-pressed={on}
                aria-label={label}
                onClick={() => setFeeling(code)}
                className="flex min-h-[88px] flex-col items-center gap-1.5 py-1"
              >
                <svg
                  viewBox="0 0 32 32"
                  className={`h-[54px] w-[54px] rounded-full transition-opacity ${on ? "animate-checkin-pick" : ""} ${
                    feeling && !on ? "opacity-55" : ""
                  }`}
                  style={{ boxShadow: on ? `0 0 0 3px ${face.stroke}` : undefined }}
                  aria-hidden
                >
                  <circle cx="16" cy="16" r="15" fill={face.fill} />
                  <path d={face.eyes} fill="none" stroke={face.stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d={face.mouth}
                    fill={face.mouthFilled ? face.stroke : "none"}
                    stroke={face.stroke}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className={`text-xs ${on ? "font-bold" : "font-medium"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={answersLeft > 0 || submitting}
        onClick={handleSubmit}
        className={`block min-h-14 w-full rounded-2xl font-display text-lg font-semibold transition-[transform,box-shadow] ${
          answersLeft > 0
            ? "cursor-not-allowed bg-zinc-200 text-zinc-600"
            : "animate-checkin-ready bg-green-600 text-white shadow-[0_4px_0_theme(colors.green.800)] hover:bg-green-700 active:translate-y-[3px] disabled:cursor-wait disabled:opacity-70"
        }`}
      >
        {submitting ? tWorkout("submitting") : answersLeft > 0 ? t("answersLeft", { count: answersLeft }) : t("submit")}
      </button>
    </div>
  );
}

interface TimeFeedbackProps {
  actualSeconds: number;
  plannedSeconds: number;
  hasIntervalTimer: boolean;
  recommendedMinutes: number;
}

// The line under "you trained X". On the fixed timer: how far from the 60%
// that earns points, how far past it ("recommended"), or a full finish. The
// count-up clock keeps its original "longer than recommended" line.
function TimeFeedback({ actualSeconds, plannedSeconds, hasIntervalTimer, recommendedMinutes }: TimeFeedbackProps) {
  const t = useTranslations("checkin");
  const tWorkout = useTranslations("workout");
  const praise = "text-[13px] font-semibold text-green-700";
  const style = { ["--power-fade-delay" as string]: "0.3s" } as CSSProperties;

  if (!hasIntervalTimer) {
    const extraMinutes = Math.round(actualSeconds / 60) - recommendedMinutes;
    return extraMinutes > 0 ? (
      <span className={`animate-power-fade-up ${praise}`} style={style}>
        {tWorkout("trainedLongerPraise", { minutes: extraMinutes })}
      </span>
    ) : null;
  }

  const percent = calculateCompletionPercent(actualSeconds, plannedSeconds);
  const thresholdSeconds = Math.ceil((plannedSeconds * COMPLETION_THRESHOLD_PERCENT) / 100);

  if (percent >= 100) {
    return (
      <span className={`animate-power-fade-up ${praise}`} style={style}>
        {t("completed")}
      </span>
    );
  }

  if (percent < COMPLETION_THRESHOLD_PERCENT) {
    // Rounded up, so the child is never told they need less than they do.
    const missingSeconds = Math.max(1, thresholdSeconds - actualSeconds);
    const unit = missingSeconds < 60 ? "seconds" : Math.ceil(missingSeconds / 60) === 1 ? "minute" : "minutes";
    const count = missingSeconds < 60 ? missingSeconds : Math.ceil(missingSeconds / 60);
    return (
      <span className="animate-power-fade-up text-[13px] font-semibold text-brand-purple" style={style}>
        {t("belowThreshold", { unit, count })}
      </span>
    );
  }

  const extraMinutes = Math.floor((actualSeconds - thresholdSeconds) / 60);
  return extraMinutes >= 1 ? (
    <span className={`animate-power-fade-up ${praise}`} style={style}>
      {t("aboveRecommended", { minutes: extraMinutes })}
    </span>
  ) : null;
}
