import type { CSSProperties } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { FeelingFace } from "@/components/FeelingFace";
import { APP_TIME_ZONE, formatMinutesSeconds } from "@/lib/format";
import { resolveGenderedText, resolveLocalizedText } from "@/lib/i18n-content";
import { difficultyLabelKey, FEELING_LABEL_KEYS } from "@/lib/workout-labels";
import type { HistoryGroup, HistoryWorkoutEntry, WorkoutHistory } from "@/services/workout-history.service";

interface WorkoutHistoryViewProps {
  history: WorkoutHistory;
}

const GROUP_ORDER: HistoryGroup[] = ["thisWeek", "lastWeek", "earlier"];
const RING_CIRCUMFERENCE = 113.1;

function ringColor(percent: number | null): string {
  if (percent === null || percent >= 100) return "var(--color-brand-purple)";
  if (percent >= 60) return "var(--color-bracelet-orange)";
  return "#b9b3c6";
}

function delayStyle(seconds: number): CSSProperties {
  return { ["--history-delay" as string]: `${seconds.toFixed(2)}s` } as CSSProperties;
}

// The parent's workouts screen: how the child felt over the last two weeks
// with one tip read off those workouts, then every recent workout grouped by
// week — completion ring, title, day/duration/difficulty and the face the
// child picked (with a heart when you trained together).
export async function WorkoutHistoryView({ history }: WorkoutHistoryViewProps) {
  const t = await getTranslations("workoutHistory");
  const tWorkout = await getTranslations("workout");
  const tColors = await getTranslations("colors");
  const locale = await getLocale();

  const gender = history.childGender ?? "male";
  const name = history.childName;
  const weekdayNarrow = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: APP_TIME_ZONE });
  const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: APP_TIME_ZONE });
  const shortDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", timeZone: APP_TIME_ZONE });

  const smiles = history.feelings.filter((f) => f.feeling === "fun" || f.feeling === "fine").length;
  const tipText = history.tip
    ? resolveGenderedText(history.tip, locale, history.childGender, { name })
    : null;

  const titleOf = (workout: HistoryWorkoutEntry) =>
    workout.workoutColor && workout.orderInColor !== null
      ? t("workoutTitle", { number: workout.orderInColor, color: tColors(workout.workoutColor) })
      : workout.workoutTitle
        ? resolveLocalizedText(workout.workoutTitle, locale)
        : t("unknownWorkout");

  const metaOf = (workout: HistoryWorkoutEntry) => {
    const date = new Date(workout.startTime);
    const difficultyKey = difficultyLabelKey(workout.difficulty);
    return [
      workout.group === "earlier" ? shortDate.format(date) : weekdayShort.format(date),
      workout.durationSeconds !== null ? formatMinutesSeconds(workout.durationSeconds) : null,
      difficultyKey ? tWorkout(difficultyKey) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  // Rows arrive one after another, in the order they appear.
  const rowDelay = new Map(history.workouts.map((w, i) => [w.sessionId, 0.38 + i * 0.08]));

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {(history.feelings.length > 0 || tipText) && (
        <section className="animate-power-fade-up flex flex-col gap-2.5 rounded-[20px] border border-zinc-200 bg-white px-4 py-3.5">
          {history.feelings.length > 0 && (
            <>
              <span className="text-[13px] font-semibold text-brand-purple">
                {t("feelingsHeading", { name, gender })}
              </span>
              {smiles > 0 && history.feelings.length > 1 && (
                <span className="font-display text-[19px] font-semibold leading-snug">
                  {t("smilesSummary", { smiles, total: history.feelings.length })}
                </span>
              )}
              <div className="flex flex-wrap gap-x-1 gap-y-2">
                {history.feelings.map((f, i) => {
                  const label = tWorkout(FEELING_LABEL_KEYS[f.feeling], { gender });
                  return (
                    <div key={f.sessionId} className="flex w-[52px] flex-col items-center gap-1">
                      <FeelingFace
                        code={f.feeling}
                        label={label}
                        className="animate-history-face-pop h-[38px] w-[38px]"
                        style={delayStyle(0.3 + i * 0.08)}
                      />
                      <span className="text-[11px] text-text-muted">{weekdayNarrow.format(new Date(f.startTime))}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {tipText && (
            <p className="flex items-start gap-2 rounded-xl bg-brand-purple/[0.06] px-2.5 py-2 text-[13px] leading-relaxed text-[#4a1c44]">
              <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 flex-none fill-brand-purple" aria-hidden>
                <path d="M10 1c0 4 1.5 6.5 5.5 7.5-4 1-5.5 3.5-5.5 7.5 0-4-1.5-6.5-5.5-7.5C8.5 7.5 10 5 10 1z" />
              </svg>
              {tipText}
            </p>
          )}
        </section>
      )}

      {history.workouts.length === 0 && <p className="text-center text-sm text-text-muted">{t("empty")}</p>}

      {GROUP_ORDER.map((group) => {
        const items = history.workouts.filter((w) => w.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-2">
            <h2 className="pt-1 text-[13px] font-semibold text-text-muted">{t(`groups.${group}`)}</h2>
            {items.map((workout) => {
              const delay = rowDelay.get(workout.sessionId) ?? 0;
              const percent = workout.completionPercent;
              const offset = RING_CIRCUMFERENCE * (1 - Math.min(100, percent ?? 100) / 100);
              return (
                <div
                  key={workout.sessionId}
                  className="animate-power-fade-up flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5"
                  style={{ ["--power-fade-delay" as string]: `${delay.toFixed(2)}s` } as CSSProperties}
                >
                  <div className="relative h-[46px] w-[46px] flex-none">
                    <svg viewBox="0 0 46 46" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                      <circle cx="23" cy="23" r="18" fill="none" stroke="#f1edf5" strokeWidth={5} />
                      {percent !== null && (
                        <circle
                          cx="23"
                          cy="23"
                          r="18"
                          fill="none"
                          stroke={ringColor(percent)}
                          strokeWidth={5}
                          strokeLinecap="round"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          strokeDashoffset={offset.toFixed(1)}
                          className="animate-history-ring-in"
                          style={
                            {
                              ["--ring-off" as string]: offset.toFixed(1),
                              ["--history-delay" as string]: `${delay.toFixed(2)}s`,
                            } as CSSProperties
                          }
                        />
                      )}
                    </svg>
                    <span
                      dir="ltr"
                      className="absolute inset-0 flex items-center justify-center font-display text-xs font-bold"
                    >
                      {percent !== null ? `${percent}%` : "–"}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 font-display text-[15px] font-semibold">
                      {titleOf(workout)}
                      {workout.isReplay && (
                        <span className="rounded-full bg-[#f1edf5] px-1.5 py-0.5 font-sans text-[11px] font-semibold text-[#4f4960]">
                          {t("replay")}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-text-muted">{metaOf(workout)}</span>
                  </div>
                  {(workout.feeling || workout.trainedTogether) && (
                    <div className="relative h-8 w-8 flex-none">
                      {workout.feeling && (
                        <FeelingFace
                          code={workout.feeling}
                          label={tWorkout(FEELING_LABEL_KEYS[workout.feeling], { gender })}
                          className="h-8 w-8"
                        />
                      )}
                      {workout.trainedTogether && (
                        <span
                          role="img"
                          aria-label={t("together")}
                          className="absolute -end-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.18)]"
                        >
                          <svg viewBox="0 0 20 20" className="h-[11px] w-[11px] fill-[#e0457b]" aria-hidden>
                            <path d="M10 17.5s-6.5-4-6.5-9.2A3.7 3.7 0 0110 6.1a3.7 3.7 0 016.5 2.2c0 5.2-6.5 9.2-6.5 9.2z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
