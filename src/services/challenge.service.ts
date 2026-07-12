import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { awardPoints } from "@/services/points.service";
import type { ChallengeDefinition, ChallengeConditionType } from "@/data/challenges.data";
import type { LocalizedText } from "@/lib/i18n-content";

export interface ChallengeSessionContext {
  sessionId: string;
  parentTrainedTogether: boolean;
  isFirstWorkoutInColor: boolean;
  didLevelUpThisSession: boolean;
}

interface CompletedSessionRow {
  start_time: string;
  actual_duration_seconds: number | null;
}

interface ChallengeRow {
  id: string;
  title: LocalizedText;
  bonus_points: number;
  condition_type: string;
}

// The `challenges` table is the source of truth for content/points (title,
// description, bonus_points — see the "MULTI-LANGUAGE CONTENT" migration in
// schema.sql); condition-checking logic still lives in code (isConditionMet
// below), the same split as parent_tip_rules/tip-conditions. Accepts either
// the browser or server Supabase client.
export async function getChallengeDefinitions(supabase: SupabaseClient): Promise<ChallengeDefinition[]> {
  const { data } = await supabase.from("challenges").select("id, title, bonus_points, condition_type");

  return ((data ?? []) as ChallengeRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    bonusPoints: row.bonus_points,
    conditionType: row.condition_type as ChallengeConditionType,
  }));
}

// Length of the current run of consecutive calendar days (most recent day
// first) that contain at least one completed session.
export function calculateStreakDays(sessionDates: Date[]): number {
  if (sessionDates.length === 0) {
    return 0;
  }

  const distinctDays = Array.from(
    new Set(sessionDates.map((d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))),
  ).sort((a, b) => b - a);

  let streak = 1;
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 1; i < distinctDays.length; i++) {
    if (distinctDays[i - 1] - distinctDays[i] === dayMs) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function isConditionMet(
  challenge: ChallengeDefinition,
  data: {
    totalCompletedSessions: number;
    totalMinutes: number;
    streakDays: number;
    context: ChallengeSessionContext;
  },
): boolean {
  switch (challenge.conditionType) {
    case "first_workout":
      return data.totalCompletedSessions === 1;
    case "parent_power":
      return data.context.parentTrainedTogether;
    case "streak_3":
      return data.streakDays >= 3;
    case "streak_5":
      return data.streakDays >= 5;
    case "total_minutes_100":
      return data.totalMinutes >= 100;
    case "color_starter":
      return data.context.isFirstWorkoutInColor;
    case "color_finisher":
      return data.context.didLevelUpThisSession;
    default:
      return false;
  }
}

export async function checkAndAwardChallenges(
  childId: string,
  context: ChallengeSessionContext,
): Promise<ChallengeDefinition[]> {
  const supabase = createClient();

  const [{ data: unlockedRows }, { data: sessionRows }, challenges] = await Promise.all([
    supabase.from("child_challenges").select("challenge_id").eq("child_id", childId),
    supabase
      .from("workout_sessions")
      .select("start_time, actual_duration_seconds")
      .eq("child_id", childId)
      .eq("status", "completed"),
    getChallengeDefinitions(supabase),
  ]);

  const unlockedIds = new Set((unlockedRows ?? []).map((row) => row.challenge_id as string));
  const sessions = (sessionRows ?? []) as CompletedSessionRow[];

  const totalCompletedSessions = sessions.length;
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.actual_duration_seconds ?? 0), 0);
  const totalMinutes = totalSeconds / 60;
  const streakDays = calculateStreakDays(sessions.map((s) => new Date(s.start_time)));

  const newlyUnlocked: ChallengeDefinition[] = [];

  for (const challenge of challenges) {
    if (unlockedIds.has(challenge.id)) {
      continue;
    }

    if (!isConditionMet(challenge, { totalCompletedSessions, totalMinutes, streakDays, context })) {
      continue;
    }

    const { error: insertError } = await supabase
      .from("child_challenges")
      .insert({ child_id: childId, challenge_id: challenge.id, completed_at: new Date().toISOString() });

    if (insertError) {
      // Another concurrent check already unlocked it (unique constraint) — skip.
      continue;
    }

    await awardPoints(childId, context.sessionId, [
      { points: challenge.bonusPoints, reason: `challenge_${challenge.id}` },
    ]);

    newlyUnlocked.push(challenge);
  }

  return newlyUnlocked;
}
