import type { ChildTipSnapshot } from "./types";

export function difficultyTrend(snapshot: ChildTipSnapshot): number[] {
  return snapshot.difficultyReportedHistory;
}

// condition_type: difficulty_plateau
// "Flat" = the last `lookback` reports are all the identical value. The 1-4
// scale (vs. the old 1-5) makes a true plateau somewhat more likely to
// occur by chance, but that's an acceptable trade-off for the simplicity
// of the check.
export function difficultyTrendFlat(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const lookback = typeof params.lookback === "number" ? params.lookback : 5;
  const history = difficultyTrend(snapshot);
  if (history.length < lookback) {
    return false;
  }
  const recent = history.slice(-lookback);
  return new Set(recent).size === 1;
}

// condition_type: high_total_effort_reminder
export function highTotalWorkoutsMilestone(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const threshold = typeof params.minWorkouts === "number" ? params.minWorkouts : 15;
  return snapshot.totalWorkoutsCompleted >= threshold;
}

// difficulty_reported: 1=קליל, 2=בינוני, 3=מאתגר, 4=קשה מאוד (WorkoutRunner.tsx)
const CHALLENGING_OR_HARDER = 3;
const VERY_HARD = 4;

// condition_type: two_consecutive_hard_difficulty (card #17 — Prompt 8)
export function twoConsecutiveHardDifficulty(snapshot: ChildTipSnapshot): boolean {
  const history = snapshot.difficultyReportedHistory;
  if (history.length < 2) {
    return false;
  }
  return history.slice(-2).every((d) => d >= CHALLENGING_OR_HARDER);
}

// condition_type: difficulty_high_last_session (cards #11, #49, #33 — dual/
// triple, share this condition_type on purpose so they appear together)
export function difficultyHighLastSession(snapshot: ChildTipSnapshot): boolean {
  return (
    snapshot.lastSessionDifficultyReported !== null &&
    snapshot.lastSessionDifficultyReported >= CHALLENGING_OR_HARDER
  );
}

// condition_type: difficulty_very_hard_last_session (cards #19, #37 — dual)
export function difficultyVeryHardLastSession(snapshot: ChildTipSnapshot): boolean {
  return snapshot.lastSessionDifficultyReported === VERY_HARD;
}
