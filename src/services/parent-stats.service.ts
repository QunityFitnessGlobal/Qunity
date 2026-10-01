import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateProgressPercent } from "@/services/progression.service";
import { meetsCompletionThreshold } from "@/services/points.service";
import { getCompletedChallengeHistory, type CompletedChallengeEntry } from "@/services/challenge.service";
import type { BraceletColor } from "@/lib/types";

export type { CompletedChallengeEntry };

export interface ParentChildStats {
  nickname: string;
  currentColor: BraceletColor;
  totalPoints: number;
  pointsInColor: number;
  requiredPoints: number;
  workoutsCompletedInColor: number;
  requiredWorkouts: number;
  totalWorkoutsCompleted: number;
  // Workouts stopped below the points threshold (repeats included).
  cancelledWorkoutsCount: number;
  totalActiveSeconds: number;
  averageDifficultyReported: number | null;
  parentTogetherCount: number;
  progressPercent: number;
  completedChallenges: CompletedChallengeEntry[];
}

interface ChildRow {
  nickname: string;
  current_color: BraceletColor;
  total_points: number;
  points_in_color: number;
  workouts_completed_in_color: number;
  total_workouts_completed: number;
}

interface SessionAggregateRow {
  id: string;
  start_time: string;
  actual_duration_seconds: number | null;
  status: string;
  completion_percent: number | null;
}

interface ResultRow {
  session_id: string;
  difficulty_reported: number | null;
  parent_trained_together: boolean;
}

// Accepts either the browser or server Supabase client (see linking.service.ts).
export async function getChildStatsForParent(
  supabase: SupabaseClient,
  childId: string,
): Promise<ParentChildStats | null> {
  const { data: child } = await supabase
    .from("children")
    .select(
      "nickname, current_color, total_points, points_in_color, workouts_completed_in_color, total_workouts_completed",
    )
    .eq("id", childId)
    .single<ChildRow>();

  if (!child) {
    return null;
  }

  const { data: level } = await supabase
    .from("bracelet_levels")
    .select("required_points, required_workouts")
    .eq("color", child.current_color)
    .single<{ required_points: number; required_workouts: number }>();

  // Unbounded, but only fetches the columns aggregates need — used for
  // totals across the child's entire history.
  const { data: allSessions } = await supabase
    .from("workout_sessions")
    .select("id, start_time, actual_duration_seconds, status, completion_percent")
    .eq("child_id", childId);

  const allSessionRows = (allSessions ?? []) as SessionAggregateRow[];
  const completedSessionIds = allSessionRows
    .filter((s) => s.status === "completed")
    .map((s) => s.id);

  const { data: results } = completedSessionIds.length
    ? await supabase
        .from("workout_results")
        .select("session_id, difficulty_reported, parent_trained_together")
        .in("session_id", completedSessionIds)
    : { data: [] as ResultRow[] };

  const resultRows = (results ?? []) as ResultRow[];

  const totalActiveSeconds = allSessionRows.reduce(
    (sum, s) => sum + (typeof s.actual_duration_seconds === "number" ? s.actual_duration_seconds : 0),
    0,
  );

  const difficultyValues = resultRows
    .map((r) => r.difficulty_reported)
    .filter((d): d is number => d !== null);
  const averageDifficultyReported =
    difficultyValues.length > 0
      ? Math.round((difficultyValues.reduce((a, b) => a + b, 0) / difficultyValues.length) * 10) / 10
      : null;

  const parentTogetherCount = resultRows.filter((r) => r.parent_trained_together).length;

  const cancelledWorkoutsCount = allSessionRows.filter(
    (s) =>
      s.status === "completed" &&
      s.completion_percent !== null &&
      !meetsCompletionThreshold(s.completion_percent),
  ).length;

  const completedChallenges = await getCompletedChallengeHistory(supabase, childId);

  const requiredPoints = level?.required_points ?? 0;
  const requiredWorkouts = level?.required_workouts ?? 0;

  return {
    nickname: child.nickname,
    currentColor: child.current_color,
    totalPoints: child.total_points,
    pointsInColor: child.points_in_color,
    requiredPoints,
    workoutsCompletedInColor: child.workouts_completed_in_color,
    requiredWorkouts,
    totalWorkoutsCompleted: child.total_workouts_completed,
    cancelledWorkoutsCount,
    totalActiveSeconds,
    averageDifficultyReported,
    parentTogetherCount,
    progressPercent: calculateProgressPercent(
      child.points_in_color,
      requiredPoints,
      child.workouts_completed_in_color,
      requiredWorkouts,
    ),
    completedChallenges,
  };
}
