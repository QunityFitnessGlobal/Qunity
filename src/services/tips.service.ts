import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateStreakDays, getChallengeDefinitions } from "@/services/challenge.service";
import { TIP_CONDITION_REGISTRY, type ChildTipSnapshot } from "@/services/tip-conditions";
import type { LocalizedText } from "@/lib/i18n-content";

export interface RelevantTip {
  ruleId: string;
  principle: string | null;
  tipText: LocalizedText;
  priority: number;
}

// A manual_selection row from the "What's happening now" accordion — see
// getManualMenuTips() below. menuGroup/labelHe/labelEn live in
// condition_params (see the Prompt 8 schema.sql seed) rather than new
// columns, since they're only ever needed together with the row's own
// tip_text/principle.
export interface ManualMenuTip {
  ruleId: string;
  principle: string | null;
  tipText: LocalizedText;
  menuGroup: number;
  labelHe: string;
  labelEn: string;
}

type TriggerSource = "auto" | "manual" | "test";

const MAX_RELEVANT_TIPS = 5;

interface CompletedSessionRow {
  id: string;
  start_time: string;
  actual_duration_seconds: number | null;
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

interface TipRuleRow {
  id: string;
  principle: string | null;
  condition_type: string;
  condition_params: Record<string, unknown> | null;
  tip_text: LocalizedText;
  priority: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function recommendedDurationMinutes(workouts: InProgressSessionRow["workouts"]): number | null {
  if (!workouts) return null;
  const row = Array.isArray(workouts) ? workouts[0] : workouts;
  return row?.recommended_duration_minutes ?? null;
}

// Accepts either the browser or server Supabase client (see linking.service.ts).
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
        .select("id, start_time, actual_duration_seconds")
        .eq("child_id", childId)
        .eq("status", "completed")
        .order("start_time", { ascending: true }),
      supabase
        .from("workout_sessions")
        .select("start_time, workouts(recommended_duration_minutes)")
        .eq("child_id", childId)
        .eq("status", "in_progress"),
      supabase.from("child_challenges").select("challenge_id").eq("child_id", childId),
      getChallengeDefinitions(supabase),
    ]);

  const sessionRows = (sessions ?? []) as CompletedSessionRow[];
  const sessionIds = sessionRows.map((s) => s.id);

  const { data: results } = sessionIds.length
    ? await supabase
        .from("workout_results")
        .select("session_id, difficulty_reported, feeling_after, parent_trained_together")
        .in("session_id", sessionIds)
    : { data: [] as WorkoutResultRow[] };

  const resultRows = (results ?? []) as WorkoutResultRow[];
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
  const hasAbandonedSession = abandonedThresholdRows.some((row) => {
    const minutes = recommendedDurationMinutes(row.workouts) ?? 30;
    const thresholdSeconds = Math.min(minutes * 2 * 60, 3600);
    const elapsedSeconds = (now.getTime() - new Date(row.start_time).getTime()) / 1000;
    return elapsedSeconds > thresholdSeconds;
  });

  return {
    daysSinceLastWorkout,
    totalSessions: sessionRows.length,
    parentTogetherCount: resultRows.filter((r) => r.parent_trained_together).length,
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

export async function getRelevantTips(
  supabase: SupabaseClient,
  childId: string,
  manualTestIndex?: number,
): Promise<RelevantTip[]> {
  const snapshot = await buildChildTipSnapshot(supabase, childId);

  const { data: rules } = await supabase
    .from("parent_tip_rules")
    .select("id, principle, condition_type, condition_params, tip_text, priority");

  const ruleRows = (rules ?? []) as TipRuleRow[];

  const matching = ruleRows
    .filter((rule) => {
      const conditionFn = TIP_CONDITION_REGISTRY[rule.condition_type];
      if (!conditionFn) {
        // Also correctly excludes condition_type = 'manual_selection' rows,
        // which have no registry entry on purpose — they're only ever
        // surfaced through getManualMenuTips() below.
        return false;
      }
      return conditionFn(snapshot, rule.condition_params ?? {}, manualTestIndex);
    })
    .sort((a, b) => b.priority - a.priority)
    // Raised from 3: several cards intentionally share a condition_type
    // (e.g. #31/#43, #11/#49/#33) so they're meant to appear together —
    // see tip-conditions/questionnaire-single-session.ts.
    .slice(0, MAX_RELEVANT_TIPS);

  return matching.map((rule) => ({
    ruleId: rule.id,
    principle: rule.principle,
    tipText: rule.tip_text,
    priority: rule.priority,
  }));
}

// The parent-initiated "What's happening now" accordion (category 3).
// These rows are never auto-evaluated; the UI groups them by menuGroup and
// the parent picks one directly.
export async function getManualMenuTips(supabase: SupabaseClient): Promise<ManualMenuTip[]> {
  const { data: rules } = await supabase
    .from("parent_tip_rules")
    .select("id, principle, condition_params, tip_text")
    .not("condition_params->>menuGroup", "is", null);

  const rows = (rules ?? []) as {
    id: string;
    principle: string | null;
    condition_params: Record<string, unknown> | null;
    tip_text: LocalizedText;
  }[];

  return rows
    .map((row) => {
      const params = row.condition_params ?? {};
      const menuGroup = Number(params.menuGroup);
      const labelHe = typeof params.labelHe === "string" ? params.labelHe : "";
      const labelEn = typeof params.labelEn === "string" ? params.labelEn : "";
      if (!Number.isFinite(menuGroup) || !labelHe) {
        return null;
      }
      return { ruleId: row.id, principle: row.principle, tipText: row.tip_text, menuGroup, labelHe, labelEn };
    })
    .filter((row): row is ManualMenuTip => row !== null);
}

export async function logShownTips(
  supabase: SupabaseClient,
  parentId: string,
  childId: string,
  ruleIds: string[],
  triggerSource: TriggerSource,
): Promise<void> {
  if (ruleIds.length === 0) {
    return;
  }

  const rows = ruleIds.map((ruleId) => ({
    parent_id: parentId,
    child_id: childId,
    rule_id: ruleId,
    shown_at: new Date().toISOString(),
    trigger_source: triggerSource,
  }));

  await supabase.from("parent_tips").insert(rows);
}
