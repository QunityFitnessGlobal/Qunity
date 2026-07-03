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

const BASE_POINTS = 20;
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

export async function awardPoints(
  childId: string,
  sessionId: string | null,
  breakdown: PointsBreakdownItem[],
): Promise<number> {
  const supabase = createClient();
  const total = totalPoints(breakdown);

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
  const { error: incrementError } = await supabase.rpc("increment_child_points", {
    p_child_id: childId,
    p_points: total,
  });

  if (incrementError) {
    throw new Error(incrementError.message);
  }

  return total;
}
