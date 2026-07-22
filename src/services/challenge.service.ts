import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { awardPoints } from "@/services/points.service";
import type { ChallengeDefinition, ChallengeConditionType, ChallengeType } from "@/data/challenges.data";
import type { LocalizedText } from "@/lib/i18n-content";
import type { BraceletColor } from "@/lib/types";

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
  description: LocalizedText | null;
  bonus_points: number;
  condition_type: string | null;
  challenge_type: ChallengeType;
  unlock_color: BraceletColor | null;
}

function mapChallengeRow(row: ChallengeRow): ChallengeDefinition {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    bonusPoints: row.bonus_points,
    conditionType: row.condition_type as ChallengeConditionType | null,
    challengeType: row.challenge_type,
    unlockColor: row.unlock_color,
  };
}

// The `challenges` table is the source of truth for content/points (title,
// description, bonus_points, challenge_type, unlock_color); condition-check
// logic still lives in code (isConditionMet below), the same split as
// parent_tip_rules/tip-conditions. Accepts either the browser or server
// Supabase client.
export async function getChallengeDefinitions(supabase: SupabaseClient): Promise<ChallengeDefinition[]> {
  const { data } = await supabase
    .from("challenges")
    .select("id, title, description, bonus_points, condition_type, challenge_type, unlock_color");

  return ((data ?? []) as ChallengeRow[]).map(mapChallengeRow);
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
    if (challenge.challengeType !== "condition") {
      continue;
    }

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

// Called alongside checkAndAwardChallenges right after a level-up — looks
// for a 'repeatable_workout' challenge tied to the color the child just
// FINISHED (not the new one), and unlocks it (child_challenges row) if one
// exists and isn't already unlocked. Returns the challenge only when newly
// unlocked, so the caller knows whether to show the "new challenge" prompt.
export async function unlockColorChallenge(
  supabase: SupabaseClient,
  childId: string,
  finishedColor: BraceletColor,
): Promise<ChallengeDefinition | null> {
  const { data } = await supabase
    .from("challenges")
    .select("id, title, description, bonus_points, condition_type, challenge_type, unlock_color")
    .eq("challenge_type", "repeatable_workout")
    .eq("unlock_color", finishedColor)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const challenge = mapChallengeRow(data as ChallengeRow);

  const { error } = await supabase
    .from("child_challenges")
    .insert({ child_id: childId, challenge_id: challenge.id, completed_at: new Date().toISOString() });

  if (error) {
    // Already unlocked (unique constraint) — nothing new to report.
    return null;
  }

  return challenge;
}

export interface CompletedChallengeEntry {
  id: string;
  challengeId: string;
  title: LocalizedText;
  completedAt: string | null;
  pointsAwarded: number | null;
  durationSeconds: number | null;
}

interface ChallengeSessionRow {
  id: string;
  challenge_id: string;
  points_awarded: number | null;
  actual_duration_seconds: number | null;
  end_time: string | null;
}

// Full completion history for the Challenges "completed" tab: one-time
// 'condition' unlocks (from child_challenges) plus every individual
// 'repeatable_workout' attempt (from challenge_sessions), newest first.
export async function getCompletedChallengeHistory(
  supabase: SupabaseClient,
  childId: string,
): Promise<CompletedChallengeEntry[]> {
  const [challenges, { data: unlockedRows }, { data: sessionRows }] = await Promise.all([
    getChallengeDefinitions(supabase),
    supabase.from("child_challenges").select("challenge_id, completed_at").eq("child_id", childId),
    supabase
      .from("challenge_sessions")
      .select("id, challenge_id, points_awarded, actual_duration_seconds, end_time")
      .eq("child_id", childId)
      .eq("status", "completed"),
  ]);

  const byId = new Map(challenges.map((c) => [c.id, c]));

  const conditionEntries: CompletedChallengeEntry[] = (unlockedRows ?? [])
    .filter((row) => byId.get(row.challenge_id as string)?.challengeType === "condition")
    .map((row) => {
      const challengeId = row.challenge_id as string;
      const def = byId.get(challengeId);
      return {
        id: `unlock_${challengeId}`,
        challengeId,
        title: def?.title ?? { he: challengeId, en: challengeId },
        completedAt: row.completed_at as string | null,
        pointsAwarded: def?.bonusPoints ?? null,
        durationSeconds: null,
      };
    });

  const repeatableEntries: CompletedChallengeEntry[] = ((sessionRows ?? []) as ChallengeSessionRow[]).map(
    (row) => {
      const def = byId.get(row.challenge_id);
      return {
        id: row.id,
        challengeId: row.challenge_id,
        title: def?.title ?? { he: row.challenge_id, en: row.challenge_id },
        completedAt: row.end_time,
        pointsAwarded: row.points_awarded,
        durationSeconds: row.actual_duration_seconds,
      };
    },
  );

  return [...conditionEntries, ...repeatableEntries].sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });
}

export interface PendingChallengeEntry {
  challengeId: string;
  title: LocalizedText;
  description: LocalizedText | null;
  bonusPoints: number;
  challengeType: ChallengeType;
  completionCount: number;
  unlockColor: BraceletColor | null;
}

// Challenges "to do" tab: unlocked 'repeatable_workout' challenges (can be
// started again any time) plus 'condition' challenges not yet achieved
// (shown read-only, as a preview of what's still to unlock).
export async function getPendingChallenges(
  supabase: SupabaseClient,
  childId: string,
): Promise<PendingChallengeEntry[]> {
  const [challenges, { data: unlockedRows }, { data: sessionRows }] = await Promise.all([
    getChallengeDefinitions(supabase),
    supabase.from("child_challenges").select("challenge_id").eq("child_id", childId),
    supabase.from("challenge_sessions").select("challenge_id").eq("child_id", childId).eq("status", "completed"),
  ]);

  const unlockedIds = new Set((unlockedRows ?? []).map((row) => row.challenge_id as string));
  const completionCounts = new Map<string, number>();
  for (const row of sessionRows ?? []) {
    const id = row.challenge_id as string;
    completionCounts.set(id, (completionCounts.get(id) ?? 0) + 1);
  }

  const unlockedRepeatable = challenges.filter(
    (c) => c.challengeType === "repeatable_workout" && unlockedIds.has(c.id),
  );
  const notYetDoneCondition = challenges.filter(
    (c) => c.challengeType === "condition" && !unlockedIds.has(c.id),
  );

  return [...unlockedRepeatable, ...notYetDoneCondition].map((c) => ({
    challengeId: c.id,
    title: c.title,
    description: c.description,
    bonusPoints: c.bonusPoints,
    challengeType: c.challengeType,
    completionCount: completionCounts.get(c.id) ?? 0,
    unlockColor: c.unlockColor,
  }));
}

export interface CompleteChallengeAnswers {
  difficultyReported: number;
  parentTrainedTogether: boolean;
  feelingAfter: string;
}

// Awards bonus_points every time, unlike checkAndAwardChallenges — a
// 'repeatable_workout' challenge can be performed any number of times.
export async function completeChallenge(
  childId: string,
  challengeId: string,
  actualDurationSeconds: number,
  answers: CompleteChallengeAnswers,
): Promise<{ pointsAwarded: number }> {
  const supabase = createClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("bonus_points")
    .eq("id", challengeId)
    .single<{ bonus_points: number }>();

  const pointsAwarded = challenge?.bonus_points ?? 0;
  const now = new Date();

  const { data: session, error: insertError } = await supabase
    .from("challenge_sessions")
    .insert({
      child_id: childId,
      challenge_id: challengeId,
      status: "completed",
      start_time: new Date(now.getTime() - actualDurationSeconds * 1000).toISOString(),
      end_time: now.toISOString(),
      actual_duration_seconds: actualDurationSeconds,
      difficulty_reported: answers.difficultyReported,
      feeling_after: answers.feelingAfter,
      parent_trained_together: answers.parentTrainedTogether,
      points_awarded: pointsAwarded,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  await awardPoints(
    childId,
    null,
    [{ points: pointsAwarded, reason: `challenge_workout_${challengeId}` }],
    { countTowardColor: false },
  );

  return { pointsAwarded };
}
