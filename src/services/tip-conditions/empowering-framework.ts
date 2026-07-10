import type { ChildTipSnapshot } from "./types";

export function daysSinceLastWorkout(snapshot: ChildTipSnapshot): number {
  return snapshot.daysSinceLastWorkout ?? Infinity;
}

// condition_type: no_workout_3_days
export function noWorkoutInDays(snapshot: ChildTipSnapshot, params: Record<string, unknown>): boolean {
  const threshold = typeof params.days === "number" ? params.days : 3;
  return daysSinceLastWorkout(snapshot) >= threshold;
}

// condition_type: no_workout_7_days
export function longNoWorkoutStreak(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const threshold = typeof params.days === "number" ? params.days : 7;
  return daysSinceLastWorkout(snapshot) >= threshold;
}

// condition_type: abandoned_session (card #10 — Prompt 8)
export function hasAbandonedSession(snapshot: ChildTipSnapshot): boolean {
  return snapshot.hasAbandonedSession;
}
