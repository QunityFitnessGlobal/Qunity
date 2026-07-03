import { getLocale, getTranslations } from "next-intl/server";
import { formatDurationClock } from "@/lib/format";
import { resolveLocalizedText } from "@/lib/i18n-content";
import type { RecentWorkoutEntry } from "@/services/parent-stats.service";

interface RecentWorkoutsListProps {
  workouts: RecentWorkoutEntry[];
}

export async function RecentWorkoutsList({ workouts }: RecentWorkoutsListProps) {
  const t = await getTranslations("recentWorkouts");
  const locale = await getLocale();

  if (workouts.length === 0) {
    return <p className="text-sm text-text-muted">{t("empty")}</p>;
  }

  return (
    <div className="w-full max-w-md overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-3 py-2 text-right font-medium text-text-muted">{t("date")}</th>
            <th className="px-3 py-2 text-right font-medium text-text-muted">{t("workout")}</th>
            <th className="px-3 py-2 text-right font-medium text-text-muted">{t("duration")}</th>
            <th className="px-3 py-2 text-right font-medium text-text-muted">{t("difficulty")}</th>
          </tr>
        </thead>
        <tbody>
          {workouts.map((workout) => (
            <tr key={workout.sessionId} className="border-t border-zinc-100">
              <td className="px-3 py-2">{new Date(workout.date).toLocaleDateString(locale)}</td>
              <td className="px-3 py-2">
                {workout.workoutTitle ? resolveLocalizedText(workout.workoutTitle, locale) : t("unknownWorkout")}
              </td>
              <td className="px-3 py-2">
                {workout.durationSeconds !== null ? formatDurationClock(workout.durationSeconds) : "-"}
              </td>
              <td className="px-3 py-2">{workout.difficultyReported ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
