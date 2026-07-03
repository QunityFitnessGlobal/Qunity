import type { SupabaseClient } from "@supabase/supabase-js";
import { CHALLENGES } from "@/data/challenges.data";
import { TIP_CONDITION_REGISTRY, type ChildTipSnapshot } from "@/services/tip-conditions";
import type { LocalizedText } from "@/lib/i18n-content";

export interface RelevantTip {
  ruleId: string;
  principle: string | null;
  tipText: LocalizedText;
  priority: number;
}

interface CompletedSessionRow {
  id: string;
  start_time: string;
}

interface WorkoutResultRow {
  difficulty_reported: number | null;
  feeling_after: string | null;
  parent_trained_together: boolean;
}

interface TipRuleRow {
  id: string;
  principle: string | null;
  condition_type: string;
  condition_params: Record<string, unknown> | null;
  tip_text: LocalizedText;
  priority: number;
}

// Accepts either the browser or server Supabase client (see linking.service.ts).
export async function buildChildTipSnapshot(
  supabase: SupabaseClient,
  childId: string,
): Promise<ChildTipSnapshot> {
  const { data: child } = await supabase
    .from("children")
    .select("total_workouts_completed")
    .eq("id", childId)
    .single<{ total_workouts_completed: number }>();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, start_time")
    .eq("child_id", childId)
    .eq("status", "completed")
    .order("start_time", { ascending: true });

  const sessionRows = (sessions ?? []) as CompletedSessionRow[];
  const sessionIds = sessionRows.map((s) => s.id);

  const { data: results } = sessionIds.length
    ? await supabase
        .from("workout_results")
        .select("difficulty_reported, feeling_after, parent_trained_together")
        .in("session_id", sessionIds)
    : { data: [] as WorkoutResultRow[] };

  const resultRows = (results ?? []) as WorkoutResultRow[];

  const { data: unlocked } = await supabase
    .from("child_challenges")
    .select("challenge_id")
    .eq("child_id", childId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const lastSession = sessionRows.length > 0 ? sessionRows[sessionRows.length - 1] : null;
  const daysSinceLastWorkout = lastSession
    ? Math.floor(
        (now.getTime() - new Date(lastSession.start_time).getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  const workoutsThisMonth = sessionRows.filter(
    (s) => new Date(s.start_time) >= startOfMonth,
  ).length;

  return {
    daysSinceLastWorkout,
    totalSessions: sessionRows.length,
    parentTogetherCount: resultRows.filter((r) => r.parent_trained_together).length,
    difficultyReportedHistory: resultRows
      .map((r) => r.difficulty_reported)
      .filter((d): d is number => d !== null),
    feelingHistory: resultRows
      .map((r) => r.feeling_after)
      .filter((f): f is string => f !== null),
    unlockedChallengeCount: unlocked?.length ?? 0,
    totalChallengesAvailable: CHALLENGES.length,
    totalWorkoutsCompleted: child?.total_workouts_completed ?? 0,
    workoutsThisMonth,
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
        return false;
      }
      return conditionFn(snapshot, rule.condition_params ?? {}, manualTestIndex);
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  return matching.map((rule) => ({
    ruleId: rule.id,
    principle: rule.principle,
    tipText: rule.tip_text,
    priority: rule.priority,
  }));
}

export async function logShownTips(
  supabase: SupabaseClient,
  parentId: string,
  childId: string,
  ruleIds: string[],
): Promise<void> {
  if (ruleIds.length === 0) {
    return;
  }

  const rows = ruleIds.map((ruleId) => ({
    parent_id: parentId,
    child_id: childId,
    rule_id: ruleId,
    shown_at: new Date().toISOString(),
  }));

  await supabase.from("parent_tips").insert(rows);
}
