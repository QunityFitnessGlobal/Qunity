import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getLinkedChildren } from "@/services/linking.service";
import { getStageWorkouts, getWorkoutsCompletedThisMonth, pickNextWorkout } from "@/services/workout.service";
import { calculateProgressPercent } from "@/services/progression.service";
import { getEncouragementKey } from "@/services/encouragement.service";
import { getChildStatsForParent } from "@/services/parent-stats.service";
import { getRelevantTips, logShownTips } from "@/services/tips.service";
import { formatDurationClock } from "@/lib/format";
import { averageDifficultyLabelKey } from "@/lib/workout-labels";
import { MinimalAvatar } from "@/components/child/MinimalAvatar";
import { EnergyMeter } from "@/components/child/EnergyMeter";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { StatsGrid } from "@/components/parent/StatsGrid";
import { TipsPanel } from "@/components/parent/TipsPanel";
import { ChildHomeView } from "@/components/child/ChildHomeView";
import { getChildHomeStats } from "@/services/child-home.service";
import type { BraceletColor, Gender } from "@/lib/types";

interface DashboardPageProps {
  searchParams: Promise<{ childId?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();
  const supabase = await getSupabase();
  // A child's own row and a parent's linked children are asked for alongside
  // the profile — whichever doesn't apply simply comes back empty — so
  // neither waits for the role before starting.
  const [profile, { data: child }, linkedChildren] = await Promise.all([
    getProfile(user.id),
    supabase
      .from("children")
      .select(
        "child_code, current_color, total_points, points_in_color, workouts_completed_in_color, code_shown_at",
      )
      .eq("id", user.id)
      .maybeSingle<{
        child_code: string;
        current_color: BraceletColor;
        total_points: number;
        points_in_color: number;
        workouts_completed_in_color: number;
        code_shown_at: string | null;
      }>(),
    getLinkedChildren(supabase, user.id),
  ]);

  if (profile?.role !== "child") {
    const t = await getTranslations("dashboard");
    const tWorkout = await getTranslations("workout");
    const { childId } = await searchParams;
    const selectedChildId = childId ?? linkedChildren[0]?.id ?? null;

    // The stats, the tips (and recording which were shown) and the child's
    // gender don't depend on each other, so they're fetched together.
    const [stats, initialTips, childGender] = selectedChildId
      ? await Promise.all([
          getChildStatsForParent(supabase, selectedChildId),
          getRelevantTips(supabase, selectedChildId).then(async (tips) => {
            if (tips.length > 0) {
              await logShownTips(supabase, user.id, selectedChildId, tips.map((tip) => tip.ruleId), "auto");
            }
            return tips;
          }),
          supabase
            .from("users")
            .select("gender")
            .eq("id", selectedChildId)
            .maybeSingle<{ gender: Gender | null }>()
            .then(({ data }) => data?.gender ?? null),
        ])
      : [null, [], null];

    return (
      <div className="flex flex-1 flex-col items-center gap-6 pb-12">
        <header className="flex w-full items-center justify-center bg-brand-background py-4">
          <Image
            src="/logo/qunity-logo-transparent.png"
            alt="Qunity"
            width={160}
            height={72}
            priority
          />
        </header>

        <div className="flex w-full flex-col items-center gap-6 px-4">
          <h1 className="text-2xl font-bold">{t("parentTitle")}</h1>
          {profile?.full_name && <p className="text-zinc-600">{t("hello", { name: profile.full_name })}</p>}

          {linkedChildren.length === 0 && (
            <p className="text-zinc-600">{t("noChildDefined")}</p>
          )}

          {linkedChildren.length > 0 && selectedChildId && (
            <ChildSelector items={linkedChildren} selectedId={selectedChildId} />
          )}

          {stats && (
            <>
              <MinimalAvatar color={stats.currentColor} />

              <div className="w-full max-w-md space-y-2 text-center">
                <p className="text-sm text-text-muted">
                  {t("workoutsInColor", {
                    count: stats.workoutsCompletedInColor,
                    total: stats.requiredWorkouts,
                  })}
                </p>
                <EnergyMeter percent={stats.progressPercent} color={stats.currentColor} />
              </div>

              <StatsGrid
                stats={[
                  { label: t("stats.totalPoints"), value: String(stats.totalPoints) },
                  { label: t("stats.pointsInColor"), value: String(stats.pointsInColor) },
                  { label: t("stats.totalWorkouts"), value: String(stats.totalWorkoutsCompleted) },
                  { label: t("stats.cancelledWorkouts"), value: String(stats.cancelledWorkoutsCount) },
                  {
                    label: t("stats.totalActiveTime"),
                    value: formatDurationClock(stats.totalActiveSeconds),
                  },
                  {
                    label: t("stats.averageDifficulty"),
                    value: (() => {
                      const key = averageDifficultyLabelKey(stats.averageDifficultyReported);
                      return key ? tWorkout(key) : "-";
                    })(),
                  },
                  {
                    label: t("stats.parentTogetherCount"),
                    value: String(stats.parentTogetherCount),
                  },
                ]}
              />

              <TipsPanel tips={initialTips} childGender={childGender} />
            </>
          )}
        </div>
      </div>
    );
  }


  const currentColor = child?.current_color ?? "white";
  const showCodeInline = child != null && child.code_shown_at === null;

  // Everything else only needs the child's row, so it all goes out at once.
  const [{ data: level }, stageWorkouts, workoutsThisMonth, homeStats] = await Promise.all([
    supabase
      .from("bracelet_levels")
      .select("required_points, required_workouts")
      .eq("color", currentColor)
      .single<{ required_points: number; required_workouts: number }>(),
    getStageWorkouts(supabase, currentColor),
    getWorkoutsCompletedThisMonth(supabase, user.id),
    getChildHomeStats(supabase, user.id, currentColor),
    showCodeInline
      ? supabase.from("children").update({ code_shown_at: new Date().toISOString() }).eq("id", user.id)
      : null,
  ]);
  const nextWorkout = pickNextWorkout(stageWorkouts, child?.workouts_completed_in_color ?? 0);

  const requiredPoints = level?.required_points ?? 0;
  const requiredWorkouts = level?.required_workouts ?? 0;
  const pointsInColor = child?.points_in_color ?? 0;
  const workoutsCompletedInColor = child?.workouts_completed_in_color ?? 0;
  const pointsToNextColor = Math.max(0, requiredPoints - pointsInColor);
  const progressPercent = calculateProgressPercent(
    pointsInColor,
    requiredPoints,
    workoutsCompletedInColor,
    requiredWorkouts,
  );

  const tEncouragement = await getTranslations("encouragement");
  const encouragementMessage = tEncouragement(getEncouragementKey(workoutsThisMonth), {
    count: workoutsThisMonth,
    gender: profile?.gender ?? "other",
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-6 pb-12">
      <header className="flex w-full items-center justify-center bg-brand-background py-4">
        <Image
          src="/logo/qunity-logo-transparent.png"
          alt="Qunity"
          width={180}
          height={80}
          priority
        />
      </header>

      <div className="flex w-full flex-col items-center px-4">
        <ChildHomeView
          name={profile?.full_name ?? null}
          gender={profile?.gender ?? null}
          color={currentColor}
          totalPoints={child?.total_points ?? 0}
          lastWorkoutPoints={homeStats.lastWorkoutPoints}
          streakDays={homeStats.streakDays}
          encouragement={encouragementMessage}
          workoutsDone={workoutsCompletedInColor}
          requiredWorkouts={requiredWorkouts}
          pointsLeft={pointsToNextColor}
          progressPercent={progressPercent}
          powerRevealed={homeStats.powerRevealed}
          nextWorkout={nextWorkout ? { id: nextWorkout.id, number: workoutsCompletedInColor + 1 } : null}
          childCode={showCodeInline ? (child?.child_code ?? null) : null}
        />
      </div>
    </div>
  );
}
