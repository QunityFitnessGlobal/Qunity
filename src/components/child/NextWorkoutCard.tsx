import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { BASE_POINTS } from "@/services/points.service";
import type { NextWorkoutInfo } from "@/services/workout.service";

interface NextWorkoutCardProps {
  nextWorkout: NextWorkoutInfo | null;
}

export async function NextWorkoutCard({ nextWorkout }: NextWorkoutCardProps) {
  const t = await getTranslations("nextWorkout");
  const locale = await getLocale();

  if (!nextWorkout) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-4 text-center shadow-sm">
        <p className="text-text-muted">{t("none")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-center shadow-sm">
      <p className="text-sm font-medium text-text-muted">{t("label", { points: BASE_POINTS })}</p>
      <p className="text-lg font-bold">{resolveLocalizedText(nextWorkout.workout.title, locale)}</p>
      <Link href={`/workout/${nextWorkout.workout.id}`}>
        <Button className="w-full">{t("start")}</Button>
      </Link>
    </div>
  );
}
