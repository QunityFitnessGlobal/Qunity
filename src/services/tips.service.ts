import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateStreakDays } from "@/services/challenge.service";
import { getCachedChallengeDefinitions, loadTipRules } from "@/services/content-cache";
import { meetsCompletionThreshold } from "@/services/points.service";
import type { ChildTipSnapshot } from "@/services/tip-conditions";
import type { LocalizedText } from "@/lib/i18n-content";

// A tip of the "מה קורה עכשיו?" chat (the menu tips) — see
// getManualMenuTips() below. Its menu fields live in condition_params (see
// the Prompt 8 and guided-chat sections of schema.sql) rather than columns,
// since they're only ever needed together with the row's own text:
// menuGroup/labelHe/labelEn, and for the chat chatLabel (ICU, by the child's
// and parent's gender), keywords and chatQuick.
export interface ManualMenuTip {
  ruleId: string;
  principle: LocalizedText | null;
  tipText: LocalizedText;
  menuGroup: number;
  labelHe: string;
  labelEn: string;
  chatLabel: string | null;
  keywords: string[];
  chatQuick: number | null;
}

interface CompletedSessionRow {
  id: string;
  start_time: string;
  actual_duration_seconds: number | null;
  completion_percent: number | null;
  workout_results: WorkoutResultRow[] | null;
}

interface WorkoutResultRow {
  session_id: string;
  difficulty_reported: number | null;
  feeling_after: string | null;
  parent_trained_together: boolean;
}

interface InProgressSessionRow {
  start_time: string;
  workouts: { recommended_duration_minutes: number | null } | { recommended_duration_minutes: number | null }[] | null;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
// The conditions look at recent behaviour, so only the latest sessions are
// read — the whole history grows without end. Totals come from the child's
// own row (total_workouts_completed).
export const RECENT_SESSIONS = 60;

function recommendedDurationMinutes(workouts: InProgressSessionRow["workouts"]): number | null {
  if (!workouts) return null;
  const row = Array.isArray(workouts) ? workouts[0] : workouts;
  return row?.recommended_duration_minutes ?? null;
}

// Server only (the challenge list comes from the content cache).
export async function buildChildTipSnapshot(
  supabase: SupabaseClient,
  childId: string,
): Promise<ChildTipSnapshot> {
  const [{ data: child }, { data: sessions }, { data: inProgressSessions }, { data: unlocked }, challenges] =
    await Promise.all([
      supabase
        .from("children")
        .select("total_workouts_completed")
        .eq("id", childId)
        .single<{ total_workouts_completed: number }>(),
      supabase
        .from("workout_sessions")
        .select(
          "id, start_time, actual_duration_seconds, completion_percent, workout_results(session_id, difficulty_reported, feeling_after, parent_trained_together)",
        )
        .eq("child_id", childId)
        .eq("status", "completed")
        .order("start_time", { ascending: false })
        .limit(RECENT_SESSIONS),
      supabase
        .from("workout_sessions")
        .select("start_time, workouts(recommended_duration_minutes)")
        .eq("child_id", childId)
        .eq("status", "in_progress"),
      supabase.from("child_challenges").select("challenge_id").eq("child_id", childId),
      getCachedChallengeDefinitions(),
    ]);

  // Newest first from the database; the conditions read them oldest first.
  const sessionRows = ((sessions ?? []) as CompletedSessionRow[]).reverse();
  // Each session's questionnaire answers arrive embedded with it.
  const resultRows = sessionRows.flatMap((s) => s.workout_results ?? []);
  const togetherCount = resultRows.filter((r) => r.parent_trained_together).length;

  // "Never trained together" is about the whole history: looked up only when
  // the recent sessions don't already hold all of it.
  let everTrainedTogether = togetherCount > 0;
  if (!everTrainedTogether && sessionRows.length >= RECENT_SESSIONS) {
    const { data: earlier } = await supabase
      .from("workout_results")
      .select("session_id, workout_sessions!inner(child_id)")
      .eq("parent_trained_together", true)
      .eq("workout_sessions.child_id", childId)
      .limit(1);
    everTrainedTogether = (earlier ?? []).length > 0;
  }
  const resultBySessionId = new Map(resultRows.map((r) => [r.session_id, r]));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const lastSession = sessionRows.length > 0 ? sessionRows[sessionRows.length - 1] : null;
  const secondLastSession = sessionRows.length > 1 ? sessionRows[sessionRows.length - 2] : null;
  const lastResult = lastSession ? (resultBySessionId.get(lastSession.id) ?? null) : null;

  const daysSinceLastWorkout = lastSession
    ? Math.floor((now.getTime() - new Date(lastSession.start_time).getTime()) / MS_PER_DAY)
    : null;

  const gapBeforeLastWorkoutDays =
    lastSession && secondLastSession
      ? Math.floor(
          (new Date(lastSession.start_time).getTime() - new Date(secondLastSession.start_time).getTime()) /
            MS_PER_DAY,
        )
      : null;

  const workoutsThisMonth = sessionRows.filter((s) => new Date(s.start_time) >= startOfMonth).length;

  // A session left "in_progress" for well past a reasonable time is treated
  // as abandoned: twice the workout's recommended duration, capped at an
  // hour so a workout with no recommended duration on file doesn't produce
  // a wildly long or short threshold.
  const abandonedThresholdRows = (inProgressSessions ?? []) as InProgressSessionRow[];
  // A workout the child stopped early (below the points threshold) in the
  // last week reads the same way to a parent: they wanted to quit mid-workout.
  const weekAgoMs = now.getTime() - 7 * MS_PER_DAY;
  const hasRecentlyStoppedEarly = sessionRows.some(
    (s) =>
      s.completion_percent !== null &&
      !meetsCompletionThreshold(s.completion_percent) &&
      new Date(s.start_time).getTime() >= weekAgoMs,
  );
  const hasAbandonedSession = hasRecentlyStoppedEarly || abandonedThresholdRows.some((row) => {
    const minutes = recommendedDurationMinutes(row.workouts) ?? 30;
    const thresholdSeconds = Math.min(minutes * 2 * 60, 3600);
    const elapsedSeconds = (now.getTime() - new Date(row.start_time).getTime()) / 1000;
    return elapsedSeconds > thresholdSeconds;
  });

  return {
    daysSinceLastWorkout,
    totalSessions: sessionRows.length,
    parentTogetherCount: togetherCount,
    everTrainedTogether,
    difficultyReportedHistory: resultRows
      .map((r) => r.difficulty_reported)
      .filter((d): d is number => d !== null),
    feelingHistory: resultRows.map((r) => r.feeling_after).filter((f): f is string => f !== null),
    unlockedChallengeCount: unlocked?.length ?? 0,
    totalChallengesAvailable: challenges.length,
    totalWorkoutsCompleted: child?.total_workouts_completed ?? 0,
    workoutsThisMonth,
    durationHistory: sessionRows
      .map((s) => s.actual_duration_seconds)
      .filter((d): d is number => d !== null),
    consecutiveStreakDays: calculateStreakDays(sessionRows.map((s) => new Date(s.start_time))),
    hasAbandonedSession,
    gapBeforeLastWorkoutDays,
    lastSessionDifficultyReported: lastResult?.difficulty_reported ?? null,
    lastSessionFeelingAfter: lastResult?.feeling_after ?? null,
  };
}

// The parent-initiated "מה קורה עכשיו?" chat (category 3). These rows are
// never auto-evaluated; the parent picks a situation or describes it.
export async function getManualMenuTips(): Promise<ManualMenuTip[]> {
  const rows = (await loadTipRules()).filter((rule) => rule.condition_params?.menuGroup != null);

  return rows
    .map((row) => {
      const params = row.condition_params ?? {};
      const menuGroup = Number(params.menuGroup);
      const labelHe = typeof params.labelHe === "string" ? params.labelHe : "";
      const labelEn = typeof params.labelEn === "string" ? params.labelEn : "";
      if (!Number.isFinite(menuGroup) || !labelHe) {
        return null;
      }
      return {
        ruleId: row.id,
        principle: row.principle,
        tipText: row.tip_text,
        menuGroup,
        labelHe,
        labelEn,
        chatLabel: typeof params.chatLabel === "string" ? params.chatLabel : null,
        keywords: Array.isArray(params.keywords) ? params.keywords.filter((w): w is string => typeof w === "string") : [],
        chatQuick: typeof params.chatQuick === "number" ? params.chatQuick : null,
      };
    })
    .filter((row): row is ManualMenuTip => row !== null);
}
