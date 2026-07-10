import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLinkedChildren } from "@/services/linking.service";
import { getNextWorkout, getWorkoutsCompletedThisMonth } from "@/services/workout.service";
import { calculateProgressPercent } from "@/services/progression.service";
import { getEncouragementKey } from "@/services/encouragement.service";
import { getChildStatsForParent } from "@/services/parent-stats.service";
import { getRelevantTips, getManualMenuTips, logShownTips } from "@/services/tips.service";
import { formatDurationClock } from "@/lib/format";
import { ChildCodeCard } from "@/components/ChildCodeCard";
import { ColorBadge } from "@/components/child/ColorBadge";
import { ProgressBar } from "@/components/child/ProgressBar";
import { NextWorkoutCard } from "@/components/child/NextWorkoutCard";
import { EncouragementBanner } from "@/components/child/EncouragementBanner";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { StatsGrid } from "@/components/parent/StatsGrid";
import { TipsPanel } from "@/components/parent/TipsPanel";
import { WhatsHappeningNowMenu } from "@/components/parent/WhatsHappeningNowMenu";
import type { BraceletColor, Gender, Role } from "@/lib/types";

interface DashboardPageProps {
  searchParams: Promise<{ childId?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, gender")
    .eq("id", user.id)
    .single<{ role: Role; full_name: string; gender: Gender | null }>();

  if (profile?.role !== "child") {
    const t = await getTranslations("dashboard");
    const linkedChildren = await getLinkedChildren(supabase, user.id);
    const { childId } = await searchParams;
    const selectedChildId = childId ?? linkedChildren[0]?.id ?? null;

    const stats = selectedChildId
      ? await getChildStatsForParent(supabase, selectedChildId)
      : null;
    const initialTips = selectedChildId ? await getRelevantTips(supabase, selectedChildId) : [];
    if (selectedChildId && initialTips.length > 0) {
      await logShownTips(
        supabase,
        user.id,
        selectedChildId,
        initialTips.map((tip) => tip.ruleId),
        "auto",
      );
    }
    const { data: childUser } = selectedChildId
      ? await supabase
          .from("users")
          .select("gender")
          .eq("id", selectedChildId)
          .single<{ gender: Gender | null }>()
      : { data: null };
    const childGender = childUser?.gender ?? null;
    const manualMenuTips = selectedChildId ? await getManualMenuTips(supabase) : [];

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
              <ColorBadge color={stats.currentColor} />

              <div className="w-full max-w-md space-y-2 text-center">
                <p className="text-sm text-text-muted">
                  {t("workoutsInColor", {
                    count: stats.workoutsCompletedInColor,
                    total: stats.requiredWorkouts,
                  })}
                </p>
                <ProgressBar percent={stats.progressPercent} color={stats.currentColor} />
              </div>

              <StatsGrid
                stats={[
                  { label: t("stats.totalPoints"), value: String(stats.totalPoints) },
                  { label: t("stats.pointsInColor"), value: String(stats.pointsInColor) },
                  { label: t("stats.totalWorkouts"), value: String(stats.totalWorkoutsCompleted) },
                  {
                    label: t("stats.totalActiveTime"),
                    value: formatDurationClock(stats.totalActiveSeconds),
                  },
                  {
                    label: t("stats.averageDifficulty"),
                    value: stats.averageDifficultyReported?.toString() ?? "-",
                  },
                  {
                    label: t("stats.parentTogetherCount"),
                    value: String(stats.parentTogetherCount),
                  },
                ]}
              />

              <TipsPanel tips={initialTips} childGender={childGender} />

              {selectedChildId && (
                <WhatsHappeningNowMenu
                  tips={manualMenuTips}
                  parentId={user.id}
                  childId={selectedChildId}
                  childGender={childGender}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const t = await getTranslations("dashboard");

  const { data: child } = await supabase
    .from("children")
    .select(
      "child_code, current_color, total_points, points_in_color, workouts_completed_in_color, code_shown_at",
    )
    .eq("id", user.id)
    .single<{
      child_code: string;
      current_color: BraceletColor;
      total_points: number;
      points_in_color: number;
      workouts_completed_in_color: number;
      code_shown_at: string | null;
    }>();

  const currentColor = child?.current_color ?? "white";
  const showCodeInline = child != null && child.code_shown_at === null;

  if (showCodeInline) {
    await supabase
      .from("children")
      .update({ code_shown_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  const { data: level } = await supabase
    .from("bracelet_levels")
    .select("required_points, required_workouts")
    .eq("color", currentColor)
    .single<{ required_points: number; required_workouts: number }>();

  const [nextWorkout, workoutsThisMonth] = await Promise.all([
    getNextWorkout(supabase, user.id),
    getWorkoutsCompletedThisMonth(supabase, user.id),
  ]);

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

      <div className="flex w-full flex-col items-center gap-6 px-4">
        {profile?.full_name && (
          <p className="text-zinc-600">{t("helloExclaim", { name: profile.full_name })}</p>
        )}

        <ColorBadge color={currentColor} />

        <div className="w-full max-w-sm space-y-2 text-center">
          <p className="text-sm text-text-muted">
            {t("workoutsInColorAndPoints", {
              count: workoutsCompletedInColor,
              total: requiredWorkouts,
              points: pointsToNextColor,
            })}
          </p>
          <ProgressBar percent={progressPercent} color={currentColor} />
        </div>

        <p className="text-lg font-bold">
          {t("totalPointsLine", { points: child?.total_points ?? 0 })}
        </p>

        <EncouragementBanner message={encouragementMessage} />

        {showCodeInline && child?.child_code && <ChildCodeCard code={child.child_code} />}

        <NextWorkoutCard nextWorkout={nextWorkout} />
      </div>
    </div>
  );
}
