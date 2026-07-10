import type { ChildTipSnapshot } from "./types";

export function challengeUnlockRatio(snapshot: ChildTipSnapshot): number {
  if (snapshot.totalChallengesAvailable === 0) {
    return 0;
  }
  return snapshot.unlockedChallengeCount / snapshot.totalChallengesAvailable;
}

// Below this many workouts, a low unlock ratio is expected (challenges take
// time to accumulate) rather than meaningful.
const MIN_WORKOUTS_FOR_UNLOCK_RATE_JUDGEMENT = 5;

// condition_type: low_challenge_unlock_rate
export function lowChallengeUnlockRatio(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  if (snapshot.totalWorkoutsCompleted < MIN_WORKOUTS_FOR_UNLOCK_RATE_JUDGEMENT) {
    return false;
  }
  const threshold = typeof params.maxRatio === "number" ? params.maxRatio : 0.2;
  return challengeUnlockRatio(snapshot) <= threshold;
}

// condition_type: consistent_monthly_activity
export function consistentMonthlyActivity(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const threshold =
    typeof params.minWorkoutsThisMonth === "number" ? params.minWorkoutsThisMonth : 8;
  return snapshot.workoutsThisMonth >= threshold;
}

// condition_type: improvement_between_workouts (card #34 — Prompt 8)
// A drop in reported difficulty or a longer session vs. the immediately
// preceding one, on the (reasonable) assumption that both indicate things
// getting a bit easier/better for the child.
export function improvementBetweenWorkouts(snapshot: ChildTipSnapshot): boolean {
  const difficulty = snapshot.difficultyReportedHistory;
  const duration = snapshot.durationHistory;

  const difficultyImproved =
    difficulty.length >= 2 && difficulty[difficulty.length - 1] < difficulty[difficulty.length - 2];
  const durationImproved =
    duration.length >= 2 && duration[duration.length - 1] > duration[duration.length - 2];

  return difficultyImproved || durationImproved;
}

// condition_type: consecutive_day_streak (cards #35, #44 — dual, share this
// condition_type on purpose). Reuses the same streak-days calculation as
// the streak_3/streak_5 challenge badges (challenge.service.ts).
export function consecutiveDayStreak(snapshot: ChildTipSnapshot, params: Record<string, unknown>): boolean {
  const threshold = typeof params.minStreakDays === "number" ? params.minStreakDays : 3;
  return snapshot.consecutiveStreakDays >= threshold;
}

// condition_type: comeback_after_break (card #38 — Prompt 8)
export function comebackAfterBreak(snapshot: ChildTipSnapshot, params: Record<string, unknown>): boolean {
  const threshold = typeof params.minGapDays === "number" ? params.minGapDays : 4;
  return snapshot.gapBeforeLastWorkoutDays !== null && snapshot.gapBeforeLastWorkoutDays >= threshold;
}

// condition_type: shorter_than_average_workout (card #39 — Prompt 8)
export function shorterThanAverageWorkout(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  const history = snapshot.durationHistory;
  if (history.length < 2) {
    return false;
  }
  const latest = history[history.length - 1];
  const priorAverage = history.slice(0, -1).reduce((sum, d) => sum + d, 0) / (history.length - 1);
  const minRatio = typeof params.maxRatioOfAverage === "number" ? params.maxRatioOfAverage : 0.5;
  return latest < priorAverage * minRatio;
}

// condition_type: feeling_positive_last_session (cards #31, #43 — dual)
const POSITIVE_FEELINGS = new Set(["fun", "fine"]);

export function feelingPositiveLastSession(snapshot: ChildTipSnapshot): boolean {
  return (
    snapshot.lastSessionFeelingAfter !== null && POSITIVE_FEELINGS.has(snapshot.lastSessionFeelingAfter)
  );
}

// condition_type: difficulty_high_and_positive_feeling (card #36 — Prompt 8)
const CHALLENGING_OR_HARDER = 3;

export function difficultyHighAndPositiveFeeling(snapshot: ChildTipSnapshot): boolean {
  return (
    snapshot.lastSessionDifficultyReported !== null &&
    snapshot.lastSessionDifficultyReported >= CHALLENGING_OR_HARDER &&
    feelingPositiveLastSession(snapshot)
  );
}
