import { createClient } from "@/lib/supabase/client";
import type { BraceletColor } from "@/lib/types";

const COLOR_ORDER: BraceletColor[] = ["white", "orange", "green", "blue", "purple"];

export interface ChildProgressionState {
  currentColor: BraceletColor;
  pointsInColor: number;
  workoutsCompletedInColor: number;
}

export interface BraceletLevelRequirement {
  requiredWorkouts: number;
  requiredPoints: number;
}

export interface ProgressionResult {
  didLevelUp: boolean;
  nextColor: BraceletColor | null;
}

// Pure decision logic, kept separate from the DB read/write below so it can
// be unit tested without a Supabase client.
export function evaluateProgression(
  state: ChildProgressionState,
  requirement: BraceletLevelRequirement,
): ProgressionResult {
  const meetsWorkouts = state.workoutsCompletedInColor >= requirement.requiredWorkouts;
  const meetsPoints = state.pointsInColor >= requirement.requiredPoints;

  if (!meetsWorkouts || !meetsPoints) {
    return { didLevelUp: false, nextColor: null };
  }

  const nextColor = COLOR_ORDER[COLOR_ORDER.indexOf(state.currentColor) + 1] ?? null;

  return { didLevelUp: nextColor !== null, nextColor };
}

// Dashboard progress bar: since leveling up requires BOTH enough workouts AND
// enough points (see evaluateProgression), showing whichever of the two is
// further along would overstate progress. We average the two percentages
// instead — a simple approach that stays honest about the slower-moving
// requirement.
export function calculateProgressPercent(
  pointsInColor: number,
  requiredPoints: number,
  workoutsCompletedInColor: number,
  requiredWorkouts: number,
): number {
  const pointsPercent = requiredPoints > 0 ? Math.min(1, pointsInColor / requiredPoints) : 1;
  const workoutsPercent =
    requiredWorkouts > 0 ? Math.min(1, workoutsCompletedInColor / requiredWorkouts) : 1;

  return Math.round(((pointsPercent + workoutsPercent) / 2) * 100);
}

interface ChildRow {
  current_color: BraceletColor;
  points_in_color: number;
  workouts_completed_in_color: number;
}

interface BraceletLevelRow {
  required_workouts: number;
  required_points: number;
}

// On level-up we reset points_in_color and workouts_completed_in_color to 0
// rather than carrying over any surplus into the new color — simplest rule
// for the MVP, see the Prompt 3/7 summary for the rationale.
export async function checkColorProgression(
  childId: string,
): Promise<{ didLevelUp: boolean; newColor?: BraceletColor }> {
  const supabase = createClient();

  const { data: child } = await supabase
    .from("children")
    .select("current_color, points_in_color, workouts_completed_in_color")
    .eq("id", childId)
    .single<ChildRow>();

  if (!child) {
    return { didLevelUp: false };
  }

  const { data: level } = await supabase
    .from("bracelet_levels")
    .select("required_workouts, required_points")
    .eq("color", child.current_color)
    .single<BraceletLevelRow>();

  if (!level) {
    return { didLevelUp: false };
  }

  const result = evaluateProgression(
    {
      currentColor: child.current_color,
      pointsInColor: child.points_in_color,
      workoutsCompletedInColor: child.workouts_completed_in_color,
    },
    { requiredWorkouts: level.required_workouts, requiredPoints: level.required_points },
  );

  if (result.didLevelUp && result.nextColor) {
    // Guarded by the same thresholds (and current_color) in the WHERE clause
    // so Postgres only applies the update if they still hold at write time —
    // this re-checks against the live row rather than the JS-read snapshot
    // above, protecting against a concurrent request already having applied
    // this same level-up.
    const { data: updated } = await supabase
      .from("children")
      .update({
        current_color: result.nextColor,
        points_in_color: 0,
        workouts_completed_in_color: 0,
      })
      .eq("id", childId)
      .eq("current_color", child.current_color)
      .gte("points_in_color", level.required_points)
      .gte("workouts_completed_in_color", level.required_workouts)
      .select("id");

    if (!updated || updated.length === 0) {
      return { didLevelUp: false };
    }
  }

  return { didLevelUp: result.didLevelUp, newColor: result.nextColor ?? undefined };
}
