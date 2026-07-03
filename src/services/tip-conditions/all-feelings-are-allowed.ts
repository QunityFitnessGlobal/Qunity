import type { ChildTipSnapshot } from "./types";

export function latestDifficultyReported(snapshot: ChildTipSnapshot): number | null {
  const history = snapshot.difficultyReportedHistory;
  return history.length > 0 ? history[history.length - 1] : null;
}

// condition_type: high_difficulty_reported
// TEMP: replace with real calculation (see Prompt 6/7 summary) — for now
// only responds to Manual Test Mode scenario #2.
export function highDifficultyReported(
  _snapshot: ChildTipSnapshot,
  _params: Record<string, unknown>,
  manualTestIndex?: number,
): boolean {
  return manualTestIndex === 2;
}

// condition_type: negative_feeling_streak
export function negativeFeelingStreak(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const requiredStreak = typeof params.streak === "number" ? params.streak : 3;
  const history = snapshot.feelingHistory;

  if (history.length < requiredStreak) {
    return false;
  }

  // "hard" is the stable code stored in workout_results.feeling_after
  // (see WorkoutRunner.tsx) — not translated display text.
  return history.slice(-requiredStreak).every((feeling) => feeling === "hard");
}
