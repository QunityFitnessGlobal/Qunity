import { createClient } from "@/lib/supabase/client";

export interface WorkoutPointsInput {
  trainedLonger: boolean;
  difficultyReported: number;
  recommendedDifficulty: number;
  parentTrainedTogether: boolean;
  isFirstWorkoutInColor: boolean;
}

export interface PointsBreakdownItem {
  points: number;
  reason: string;
}

export const BASE_POINTS = 20;
const TRAINED_LONGER_BONUS = 5;
const HARDER_THAN_RECOMMENDED_BONUS = 5;
const PARENT_TOGETHER_BONUS = 10;
const FIRST_IN_COLOR_BONUS = 10;

// `reason` is a stable, locale-independent code (not display text) — nothing
// renders points_transactions.reason today, but if a future "points history"
// screen does, it should translate these codes at display time rather than
// storing pre-translated text.
export function calculateWorkoutPoints(input: WorkoutPointsInput): PointsBreakdownItem[] {
  const breakdown: PointsBreakdownItem[] = [{ points: BASE_POINTS, reason: "base_workout" }];

  if (input.trainedLonger) {
    breakdown.push({ points: TRAINED_LONGER_BONUS, reason: "trained_longer" });
  }

  if (input.difficultyReported > input.recommendedDifficulty) {
    breakdown.push({
      points: HARDER_THAN_RECOMMENDED_BONUS,
      reason: "harder_than_recommended",
    });
  }

  if (input.parentTrainedTogether) {
    breakdown.push({ points: PARENT_TOGETHER_BONUS, reason: "parent_together" });
  }

  if (input.isFirstWorkoutInColor) {
    breakdown.push({ points: FIRST_IN_COLOR_BONUS, reason: "first_in_color" });
  }

  return breakdown;
}

export function totalPoints(breakdown: PointsBreakdownItem[]): number {
  return breakdown.reduce((sum, item) => sum + item.points, 0);
}

// A workout finished below this share of its planned time earns no points
// (the child is asked to confirm before stopping that early).
export const COMPLETION_THRESHOLD_PERCENT = 60;

// How much of the planned workout was actually done, as a whole percent
// (rounded down, capped at 100). Nothing planned -> treated as complete.
export function calculateCompletionPercent(actualSeconds: number, plannedSeconds: number): number {
  if (plannedSeconds <= 0) return 100;
  const percent = Math.floor((Math.max(0, actualSeconds) * 100) / plannedSeconds);
  return Math.min(100, percent);
}

export function meetsCompletionThreshold(percent: number): boolean {
  return percent >= COMPLETION_THRESHOLD_PERCENT;
}

// Scales a breakdown to `percent` of its value so that the rows add up to
// exactly round(total * percent / 100). Each row is floored, then the points
// lost to flooring go back to the rows with the largest fractional part —
// naive per-row rounding could drift by a point or two from the total.
// Rows that end up worth 0 are dropped.
export function scaleBreakdown(
  breakdown: PointsBreakdownItem[],
  percent: number,
): PointsBreakdownItem[] {
  const clamped = Math.min(100, Math.max(0, percent));
  const target = Math.round((totalPoints(breakdown) * clamped) / 100);

  const scaled = breakdown.map((item, index) => {
    const exact = (item.points * clamped) / 100;
    return { index, item, floor: Math.floor(exact), fraction: exact - Math.floor(exact) };
  });

  let remaining = target - scaled.reduce((sum, row) => sum + row.floor, 0);
  const byFraction = [...scaled].sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const row of byFraction) {
    if (remaining <= 0) break;
    row.floor += 1;
    remaining -= 1;
  }

  return scaled
    .filter((row) => row.floor > 0)
    .map((row) => ({ points: row.floor, reason: row.item.reason }));
}

export interface AwardPointsOptions {
  // false for repeatable ("type B") challenges — they can be done any
  // number of times, so their points must count toward total_points
  // (lifetime score / leaderboard) but not points_in_color (the belt-
  // progression gate), or they'd inflate the progress bar without any
  // matching real workout progress. Defaults to true for regular workouts
  // and one-time ("type A") challenges.
  countTowardColor?: boolean;
}

export async function awardPoints(
  childId: string,
  sessionId: string | null,
  breakdown: PointsBreakdownItem[],
  options?: AwardPointsOptions,
): Promise<number> {
  const supabase = createClient();
  const total = totalPoints(breakdown);
  const countTowardColor = options?.countTowardColor ?? true;

  const rows = breakdown.map((item) => ({
    child_id: childId,
    session_id: sessionId,
    points: item.points,
    reason: item.reason,
  }));

  const { error: insertError } = await supabase.from("points_transactions").insert(rows);
  if (insertError) {
    throw new Error(insertError.message);
  }

  // Atomic increment via RPC (SET total_points = total_points + $1 in one SQL
  // statement) rather than reading the current value in JS and writing it
  // back — that two-step pattern loses updates under concurrent calls.
  const { error: incrementError } = await supabase.rpc(
    countTowardColor ? "increment_child_points" : "increment_child_total_points_only",
    { p_child_id: childId, p_points: total },
  );

  if (incrementError) {
    throw new Error(incrementError.message);
  }

  return total;
}
