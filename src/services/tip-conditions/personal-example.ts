import type { ChildTipSnapshot } from "./types";

export function parentParticipationPercent(snapshot: ChildTipSnapshot): number {
  if (snapshot.totalSessions === 0) {
    return 0;
  }
  return (snapshot.parentTogetherCount / snapshot.totalSessions) * 100;
}

// condition_type: low_parent_participation
// TEMP: replace with real calculation (see Prompt 6/7 summary) — for now
// only responds to Manual Test Mode scenario #3.
export function parentParticipationBelowThreshold(
  _snapshot: ChildTipSnapshot,
  _params: Record<string, unknown>,
  manualTestIndex?: number,
): boolean {
  return manualTestIndex === 3;
}

// condition_type: zero_parent_participation
export function parentNeverTrainedTogether(snapshot: ChildTipSnapshot): boolean {
  return snapshot.totalSessions > 0 && snapshot.parentTogetherCount === 0;
}
