import { getLocale, getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getLinkedChildren } from "@/services/linking.service";
import { getStageWorkouts, getWorkoutsCompletedThisMonth, pickNextWorkout } from "@/services/workout.service";
import { calculateProgressPercent } from "@/services/progression.service";
import { getEncouragementKey } from "@/services/encouragement.service";
import { getChildStatsForParent } from "@/services/parent-stats.service";
import { logShownTips } from "@/services/tips.service";
import { getTodaysTips } from "@/services/today-tips.service";
import { getChildWeek } from "@/services/child-week.service";
import { getCelebration } from "@/services/celebration.service";
import { formatHoursMinutes } from "@/lib/format";
import { resolveGenderedText, resolveLocalizedText } from "@/lib/i18n-content";
import { averageDifficultyLabelKey } from "@/lib/workout-labels";
import { ChildChips } from "@/components/parent/ChildChips";
import { ChildWeekCard } from "@/components/parent/ChildWeekCard";
import { CelebrationCard } from "@/components/parent/CelebrationCard";
import { ParentStatsStrip } from "@/components/parent/ParentStatsStrip";
import { TodayTipsCard } from "@/components/parent/TodayTipsCard";
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
    const t = await getTranslations("parentHome");
    const tDashboard = await getTranslations("dashboard");
    const tWorkout = await getTranslations("workout");
    const locale = await getLocale();
    const { childId } = await searchParams;
    const selectedChildId = childId ?? linkedChildren[0]?.id ?? null;
    const parentGender = profile?.gender ?? null;
    const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "";

    // The stats, the week, the moment to celebrate, today's sentences (and
    // recording which were shown) and the child's gender don't depend on
    // each other, so they're fetched together.
    const [stats, week, celebration, today, childGender] = selectedChildId
      ? await Promise.all([
          getChildStatsForParent(supabase, selectedChildId),
          getChildWeek(supabase, selectedChildId),
          getCelebration(supabase, selectedChildId),
          getTodaysTips(supabase, user.id, selectedChildId).then(async (result) => {
            const shown = result.tips.filter((tip) => !tip.saidToday).map((tip) => tip.ruleId);
            await logShownTips(supabase, user.id, selectedChildId, shown, "auto");
            return result;
          }),
          supabase
            .from("users")
            .select("gender")
            .eq("id", selectedChildId)
            .maybeSingle<{ gender: Gender | null }>()
            .then(({ data }) => data?.gender ?? null),
        ])
      : [null, null, null, null, null];

    const difficultyKey = stats ? averageDifficultyLabelKey(stats.averageDifficultyReported) : null;

    return (
      <div className="flex flex-1 flex-col items-center px-4 pb-12 pt-5">
        <div className="flex w-full max-w-md flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-xl font-bold">
              {firstName ? t("hello", { name: firstName }) : t("helloNoName")}
            </h1>
            {linkedChildren.length > 0 && selectedChildId && (
              <ChildChips items={linkedChildren} selectedId={selectedChildId} />
            )}
          </div>

          {linkedChildren.length === 0 && <p className="text-zinc-600">{tDashboard("noChildDefined")}</p>}

          {stats && week && (
            <ChildWeekCard
              name={stats.nickname}
              week={week}
              color={stats.currentColor}
              workoutsInStage={stats.workoutsCompletedInColor}
              requiredWorkouts={stats.requiredWorkouts}
            />
          )}

          {stats && celebration && (
            <CelebrationCard celebration={celebration} name={stats.nickname} gender={childGender} />
          )}

          {stats && (
            <ParentStatsStrip
              stats={[
                { label: t("stats.points"), value: stats.totalPoints.toLocaleString(locale), tone: "text-reward-gold-ink" },
                { label: t("stats.activeTime"), value: formatHoursMinutes(stats.totalActiveSeconds) },
                { label: t("stats.together"), value: String(stats.parentTogetherCount), tone: "text-[#c0306a]" },
              ]}
              moreStats={[
                { label: t("stats.pointsInStage"), value: stats.pointsInColor.toLocaleString(locale) },
                { label: t("stats.totalWorkouts"), value: String(stats.totalWorkoutsCompleted) },
                { label: t("stats.stopped"), value: String(stats.cancelledWorkoutsCount) },
                { label: t("stats.averageDifficulty"), value: difficultyKey ? tWorkout(difficultyKey) : "-" },
              ]}
              moreLabel={t("stats.more")}
              lessLabel={t("stats.less")}
            />
          )}

          {stats && today && selectedChildId && (
            <TodayTipsCard
              // A fresh card (position, what's been said) for each child.
              key={selectedChildId}
              tips={today.tips.map((tip) => ({
                ruleId: tip.ruleId,
                principle: tip.principle ? resolveLocalizedText(tip.principle, locale) : null,
                quote: resolveGenderedText(tip.shortText, locale, childGender, { parentGender }),
                because: resolveGenderedText(tip.reasonText, locale, childGender, {
                  name: stats.nickname,
                  ...tip.reasonValues,
                }),
                saidToday: tip.saidToday,
              }))}
              momentsThisMonth={today.momentsThisMonth}
              parentId={user.id}
              childId={selectedChildId}
            />
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
    <div className="flex flex-1 flex-col items-center gap-6 pb-12 pt-6">

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
