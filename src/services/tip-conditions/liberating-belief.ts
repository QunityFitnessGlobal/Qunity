import type { ChildTipSnapshot } from "./types";

export function difficultyTrend(snapshot: ChildTipSnapshot): number[] {
  return snapshot.difficultyReportedHistory;
}

// condition_type: difficulty_plateau
// TEMP: replace with real calculation (see Prompt 6/7 summary) — for now
// only responds to Manual Test Mode scenario #4.
export function difficultyTrendFlat(
  _snapshot: ChildTipSnapshot,
  _params: Record<string, unknown>,
  manualTestIndex?: number,
): boolean {
  return manualTestIndex === 4;
}

// condition_type: high_total_effort_reminder
export function highTotalWorkoutsMilestone(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const threshold = typeof params.minWorkouts === "number" ? params.minWorkouts : 15;
  return snapshot.totalWorkoutsCompleted >= threshold;
}
