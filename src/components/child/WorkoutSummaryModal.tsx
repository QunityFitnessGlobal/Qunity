"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getStationWorkoutSummary, type StationWorkoutSummary } from "@/services/journey.service";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { formatDurationClock } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import type { BraceletColor } from "@/lib/types";

interface WorkoutSummaryModalProps {
  childId: string;
  beltColor: BraceletColor;
  localNumber: number;
  onClose: () => void;
}

// Reuses the RecentWorkoutEntry-shaped data (via journey.service's
// getStationWorkoutSummary) instead of a new query — same underlying
// concept as the parent-facing recent-workouts table, just scoped to one
// session and shown to the child themselves.
export function WorkoutSummaryModal({
  childId,
  beltColor,
  localNumber,
  onClose,
}: WorkoutSummaryModalProps) {
  const t = useTranslations("journey.summary");
  const locale = useLocale();
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

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-3 rounded-lg bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && <p className="text-sm text-text-muted">{t("loading")}</p>}

        {!loading && !summary && <p className="text-sm text-text-muted">{t("notFound")}</p>}

        {!loading && summary && (
          <>
            <h2 className="text-lg font-bold">
              {summary.workoutTitle ? resolveLocalizedText(summary.workoutTitle, locale) : t("unknownWorkout")}
            </h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">{t("date")}</dt>
                <dd>{new Date(summary.date).toLocaleDateString(locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">{t("duration")}</dt>
                <dd>{summary.durationSeconds !== null ? formatDurationClock(summary.durationSeconds) : "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">{t("difficulty")}</dt>
                <dd>{summary.difficultyReported ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">{t("feeling")}</dt>
                <dd>{summary.feelingAfter ? t(`feelingValues.${summary.feelingAfter}`) : "-"}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>{t("points")}</dt>
                <dd>{summary.pointsAwarded}</dd>
              </div>
            </dl>
          </>
        )}

        <Button className="w-full" onClick={onClose}>
          {t("close")}
        </Button>
      </div>
    </div>
  );
}
