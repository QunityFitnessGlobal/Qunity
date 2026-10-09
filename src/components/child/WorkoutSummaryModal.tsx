"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getStationWorkoutSummary, type StationWorkoutSummary } from "@/services/journey.service";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { formatDurationClock } from "@/lib/format";
import { BRACELET_BADGE_CLASSES, POWER_REVEAL_THEME } from "@/lib/colors";
import { HalfStarIcon, StarIcon } from "@/components/child/journeyIcons";
import { difficultyLabelKey, feelingLabelKey, FEELING_ICONS, type FeelingCode } from "@/lib/workout-labels";
import type { BraceletColor, Gender } from "@/lib/types";

interface WorkoutSummaryModalProps {
  childId: string;
  beltColor: BraceletColor;
  localNumber: number;
  // Done but never finished at 100% (a half star on the map).
  partial: boolean;
  gender: Gender | null;
  onReplay: () => void;
  onClose: () => void;
}

const STAR_PATH = "M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z";
// The pass mark: from here a workout earns its half star.
const HALF_STAR_PERCENT = 60;

// A done workout on the journey, tapped: a popup with its star and how much
// of it was done, the time, how hard it felt and how the child felt, the
// points it earned, and a way to do it again. Reuses the RecentWorkoutEntry-
// shaped data (via journey.service's getStationWorkoutSummary) instead of a
// new query.
export function WorkoutSummaryModal({
  childId,
  beltColor,
  localNumber,
  partial,
  gender,
  onReplay,
  onClose,
}: WorkoutSummaryModalProps) {
  const t = useTranslations("journey.summary");
  const tWorkout = useTranslations("workout");
  const tColors = useTranslations("colors");
  const locale = useLocale();
  const halfClipId = useId();
  const [summary, setSummary] = useState<StationWorkoutSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    getStationWorkoutSummary(supabase, childId, beltColor, localNumber).then((data) => {
      if (!cancelled) {
        setSummary(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [childId, beltColor, localNumber]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const full = !partial;
  const percent = summary?.bestCompletionPercent ?? null;
  const difficultyKey = summary ? difficultyLabelKey(summary.difficultyReported) : null;
  const feelingKey = summary ? feelingLabelKey(summary.feelingAfter) : null;
  const tile = "flex flex-col items-center gap-0.5 rounded-2xl border border-[#ece6f2] bg-[#faf8fc] px-1.5 py-2.5 text-center";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#221a33]/45 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-summary-title"
        className="animate-power-fade-up flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-3.5 overflow-y-auto rounded-[28px] bg-white px-[18px] pb-5 pt-[18px] text-right shadow-[0_20px_50px_rgba(34,26,51,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={`flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full shadow-[0_3px_0_rgba(0,0,0,0.2)] ${BRACELET_BADGE_CLASSES[beltColor]}`}
          >
            {full ? <StarIcon className="h-[26px] w-[26px] text-yellow-400" /> : <HalfStarIcon className="h-[26px] w-[26px] text-yellow-400" />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="text-[13px] font-semibold" style={{ color: POWER_REVEAL_THEME[beltColor].badgeIcon }}>
              {t("stationLabel", { number: localNumber, color: tColors(beltColor) })}
            </span>
            <h2 id="workout-summary-title" className="font-display text-[22px] font-bold leading-tight">
              {summary?.workoutTitle ? resolveLocalizedText(summary.workoutTitle, locale) : t("unknownWorkout")}
            </h2>
            {summary && (
              <span className="text-[13px] text-[#8a8399]">
                {new Date(summary.date).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f4f2f7] text-[#6c6580]"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {loading && <p className="py-6 text-center text-sm text-text-muted">{t("loading")}</p>}

        {!loading && !summary && <p className="py-6 text-center text-sm text-text-muted">{t("notFound")}</p>}

        {!loading && summary && (
          <>
            <div className="flex items-center gap-3 rounded-[18px] border border-[#f3e3b5] bg-gradient-to-br from-[#fff8e6] to-white px-3.5 py-3">
              <svg viewBox="0 0 20 20" className="h-[46px] w-[46px] flex-none drop-shadow-[0_3px_5px_rgba(217,154,11,0.35)]" aria-hidden>
                {full ? (
                  <path d={STAR_PATH} fill="var(--color-reward-gold)" stroke="#d99a0b" strokeWidth={0.6} strokeLinejoin="round" />
                ) : (
                  <>
                    <defs>
                      <clipPath id={halfClipId}>
                        <rect x="0" y="0" width="10" height="20" />
                      </clipPath>
                    </defs>
                    <path d={STAR_PATH} fill="#fff4d3" stroke="#d99a0b" strokeWidth={0.6} strokeLinejoin="round" />
                    <path d={STAR_PATH} fill="var(--color-reward-gold)" clipPath={`url(#${halfClipId})`} />
                  </>
                )}
              </svg>
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[15px] font-bold">{full ? t("fullStar") : t("halfStar")}</span>
                  {percent !== null && (
                    <span dir="ltr" className="font-display text-[17px] font-bold text-reward-gold-ink">
                      {percent}%
                    </span>
                  )}
                </div>
                {percent !== null && (
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-[#f1ead7]" aria-hidden>
                    <span
                      className="animate-result-grow absolute inset-y-0 start-0 rounded-full bg-reward-gold"
                      style={
                        {
                          width: `${Math.min(100, percent)}%`,
                          "--from": "0%",
                          "--to": `${Math.min(100, percent)}%`,
                          animationDelay: "0.35s",
                        } as CSSProperties
                      }
                    />
                    <span className="absolute inset-y-0 w-0.5 bg-white/90" style={{ insetInlineStart: `${HALF_STAR_PERCENT}%` }} />
                  </div>
                )}
                <span className="text-[12.5px] text-[#6c6580]">
                  {full ? t("fullStarNote") : percent !== null ? t("halfStarNote", { percent: 100 - percent }) : t("halfStarNoteNoPercent")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className={tile}>
                <svg viewBox="0 0 20 20" className="h-5 w-5 text-brand-purple" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="10" cy="10.5" r="6.5" />
                  <path d="M10 7v3.5l2.3 1.6M8 2.5h4" />
                </svg>
                <span dir="ltr" className="font-display text-[17px] font-bold">
                  {summary.durationSeconds !== null ? formatDurationClock(summary.durationSeconds) : "-"}
                </span>
                <span className="text-xs text-[#8a8399]">{t("time")}</span>
              </div>
              <div className={tile}>
                <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <rect
                      key={i}
                      x={2.5 + i * 4.3}
                      y={12 - i * 3}
                      width={3}
                      height={5 + i * 3}
                      rx={1}
                      fill={summary.difficultyReported !== null && i < summary.difficultyReported ? "var(--color-brand-purple)" : "#e4dfeb"}
                    />
                  ))}
                </svg>
                <span className="font-display text-[17px] font-bold">{difficultyKey ? tWorkout(difficultyKey) : "-"}</span>
                <span className="text-xs text-[#8a8399]">{t("difficultyFelt")}</span>
              </div>
              <div className={tile}>
                <span className="text-[19px] leading-5" aria-hidden>
                  {feelingKey ? FEELING_ICONS[summary.feelingAfter as FeelingCode] : "·"}
                </span>
                <span className="font-display text-[17px] font-bold">
                  {feelingKey ? tWorkout(feelingKey, { gender: gender ?? "male" }) : "-"}
                </span>
                <span className="text-xs text-[#8a8399]">{t("feelingFelt")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-[#f3e3b5] bg-white px-3.5 py-2.5">
              <span aria-hidden className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-reward-gold shadow-[inset_0_-2px_0_#d99a0b]">
                <StarIcon className="h-4 w-4 text-reward-gold-ink" />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-sm font-semibold">{t("pointsTitle")}</span>
                {summary.attempts > 1 && (
                  <span className="text-xs text-[#8a8399]">{t("attempts", { count: summary.attempts })}</span>
                )}
              </span>
              <span dir="ltr" className="font-display text-[26px] font-bold text-reward-gold-ink">
                +{summary.pointsAwarded}
              </span>
            </div>

            <div className="mt-0.5 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={onReplay}
                className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-green-600 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-transform hover:bg-green-700 active:translate-y-[3px]"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15.5 10a5.5 5.5 0 1 1-1.8-4.1M15.5 3.5v3.2h-3.2" />
                </svg>
                {full ? t("replay") : t("replayToFill")}
              </button>
              <p className="text-center text-[12.5px] text-[#6c6580]">{full ? t("replayHintDone") : t("replayHint")}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
