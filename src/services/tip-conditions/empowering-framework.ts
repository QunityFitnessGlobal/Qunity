import type { ChildTipSnapshot } from "./types";

export function daysSinceLastWorkout(snapshot: ChildTipSnapshot): number {
  return snapshot.daysSinceLastWorkout ?? Infinity;
}

// condition_type: no_workout_3_days
// TEMP: replace with real calculation (see Prompt 6/7 summary) — for now
// only responds to Manual Test Mode scenario #1.
export function noWorkoutInDays(
  _snapshot: ChildTipSnapshot,
  _params: Record<string, unknown>,
  manualTestIndex?: number,
): boolean {
  return manualTestIndex === 1;
}

// condition_type: no_workout_7_days
export function longNoWorkoutStreak(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const threshold = typeof params.days === "number" ? params.days : 7;
  return daysSinceLastWorkout(snapshot) >= threshold;
}
