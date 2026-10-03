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
  workout_results: ResultRow[] | null;
}

interface ResultRow {
  difficulty_reported: number | null;
  parent_trained_together: boolean;
}

interface LevelRow {
  color: BraceletColor;
  required_points: number;
  required_workouts: number;
}

// Accepts either the browser or server Supabase client (see linking.service.ts).
export async function getChildStatsForParent(
  supabase: SupabaseClient,
  childId: string,
): Promise<ParentChildStats | null> {
  // Everything at once: the stage requirements are tiny, so all of them are
  // read and the child's picked out, and each session's questionnaire answers
  // come embedded with it instead of in a second round trip.
  const [{ data: child }, { data: levels }, { data: allSessions }, completedChallenges] = await Promise.all([
    supabase
      .from("children")
      .select(
        "nickname, current_color, total_points, points_in_color, workouts_completed_in_color, total_workouts_completed",
      )
      .eq("id", childId)
      .maybeSingle<ChildRow>(),
    supabase.from("bracelet_levels").select("color, required_points, required_workouts"),
    // Unbounded, but only fetches the columns aggregates need — used for
    // totals across the child's entire history.
    supabase
      .from("workout_sessions")
      .select(
        "id, start_time, actual_duration_seconds, status, completion_percent, workout_results(difficulty_reported, parent_trained_together)",
      )
      .eq("child_id", childId),
    getCompletedChallengeHistory(supabase, childId),
  ]);

  if (!child) {
    return null;
  }

  const level = ((levels ?? []) as LevelRow[]).find((l) => l.color === child.current_color);
  const allSessionRows = (allSessions ?? []) as SessionAggregateRow[];
  const resultRows = allSessionRows
    .filter((s) => s.status === "completed")
    .flatMap((s) => s.workout_results ?? []);

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
