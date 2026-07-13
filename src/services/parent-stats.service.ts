import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateProgressPercent } from "@/services/progression.service";
import { getCompletedChallengeHistory, type CompletedChallengeEntry } from "@/services/challenge.service";
import type { LocalizedText } from "@/lib/i18n-content";
import type { BraceletColor } from "@/lib/types";

export interface RecentWorkoutEntry {
  sessionId: string;
  workoutTitle: LocalizedText | null;
  date: string;
  durationSeconds: number | null;
  difficultyReported: number | null;
}

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
  totalActiveSeconds: number;
  averageDifficultyReported: number | null;
  parentTogetherCount: number;
  progressPercent: number;
  completedChallenges: CompletedChallengeEntry[];
  recentWorkouts: RecentWorkoutEntry[];
}

interface ChildRow {
  nickname: string;
  current_color: BraceletColor;
  total_points: number;
  points_in_color: number;
  workouts_completed_in_color: number;
  total_workouts_completed: number;
}

const RECENT_WORKOUTS_LIMIT = 20;

interface SessionAggregateRow {
  id: string;
  start_time: string;
  actual_duration_seconds: number | null;
  status: string;
}

interface RecentSessionRow {
  id: string;
  start_time: string;
  actual_duration_seconds: number | null;
  workouts: { title: LocalizedText } | { title: LocalizedText }[] | null;
}

interface ResultRow {
  session_id: string;
  difficulty_reported: number | null;
  parent_trained_together: boolean;
}

// Returns null when the workout relation is missing so the UI can supply a
// translated fallback (see RecentWorkoutsList.tsx) instead of this service
// embedding display text.
function workoutTitle(workouts: RecentSessionRow["workouts"]): LocalizedText | null {
  if (!workouts) return null;
  return Array.isArray(workouts) ? (workouts[0]?.title ?? null) : workouts.title;
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
    .select("id, start_time, actual_duration_seconds, status")
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
  const resultsBySession = new Map(resultRows.map((r) => [r.session_id, r]));

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

  // Bounded query for the "recent workouts" list — the DB applies the limit,
  // rather than fetching everything and slicing it in JS.
  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("id, start_time, actual_duration_seconds, workouts(title)")
    .eq("child_id", childId)
    .eq("status", "completed")
    .order("start_time", { ascending: false })
    .limit(RECENT_WORKOUTS_LIMIT);

  const recentWorkouts: RecentWorkoutEntry[] = ((recentSessions ?? []) as RecentSessionRow[]).map(
    (s) => ({
      sessionId: s.id,
      workoutTitle: workoutTitle(s.workouts),
      date: s.start_time,
      durationSeconds: s.actual_duration_seconds,
      difficultyReported: resultsBySession.get(s.id)?.difficulty_reported ?? null,
    }),
  );

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
    recentWorkouts,
  };
}
