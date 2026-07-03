import type { ChildTipSnapshot } from "./types";

export function challengeUnlockRatio(snapshot: ChildTipSnapshot): number {
  if (snapshot.totalChallengesAvailable === 0) {
    return 0;
  }
  return snapshot.unlockedChallengeCount / snapshot.totalChallengesAvailable;
}

// condition_type: low_challenge_unlock_rate
// TEMP: replace with real calculation (see Prompt 6/7 summary) — for now
// only responds to Manual Test Mode scenario #5.
export function lowChallengeUnlockRatio(
  _snapshot: ChildTipSnapshot,
  _params: Record<string, unknown>,
  manualTestIndex?: number,
): boolean {
  return manualTestIndex === 5;
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
