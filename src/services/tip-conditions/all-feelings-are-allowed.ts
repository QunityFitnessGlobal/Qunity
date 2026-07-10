import type { ChildTipSnapshot } from "./types";

export function latestDifficultyReported(snapshot: ChildTipSnapshot): number | null {
  return snapshot.lastSessionDifficultyReported;
}

// condition_type: high_difficulty_reported
// difficulty_reported is now on a 1-4 ordinal scale (see WorkoutRunner.tsx:
// קליל=1, בינוני=2, מאתגר=3, קשה מאוד=4), not the old 1-5 numeric scale.
// The existing seed row's params ({"minDifficulty": 4}) still reads
// correctly under the new scale (4 = קשה מאוד, still the top value).
export function highDifficultyReported(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const threshold = typeof params.minDifficulty === "number" ? params.minDifficulty : 4;
  const latest = latestDifficultyReported(snapshot);
  return latest !== null && latest >= threshold;
}

// condition_type: negative_feeling_streak
// feeling_after is now one of 5 stable codes (fun/fine/frustrated/tired/
// exhausted — WorkoutRunner.tsx), not the old 3 (great/ok/hard). Per the
// updated intent: 3 sessions in a row where the child *didn't* feel good,
// checked per-session rather than requiring the exact same code each time.
const NEGATIVE_FEELINGS = new Set(["frustrated", "tired", "exhausted"]);

export function negativeFeelingStreak(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const requiredStreak = typeof params.streak === "number" ? params.streak : 3;
  const history = snapshot.feelingHistory;

  if (history.length < requiredStreak) {
    return false;
  }

  return history.slice(-requiredStreak).every((feeling) => NEGATIVE_FEELINGS.has(feeling));
}

// condition_type: feeling_frustrated_last_session (card #23 — Prompt 8)
export function feelingFrustratedLastSession(snapshot: ChildTipSnapshot): boolean {
  return snapshot.lastSessionFeelingAfter === "frustrated";
}

// condition_type: feeling_tired_last_session (card #51 — Prompt 8, new card)
export function feelingTiredLastSession(snapshot: ChildTipSnapshot): boolean {
  return snapshot.lastSessionFeelingAfter === "tired";
}

// condition_type: feeling_exhausted_last_session (card #52 — Prompt 8, new card)
export function feelingExhaustedLastSession(snapshot: ChildTipSnapshot): boolean {
  return snapshot.lastSessionFeelingAfter === "exhausted";
}
