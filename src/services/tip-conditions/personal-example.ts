import type { ChildTipSnapshot } from "./types";

export function parentParticipationPercent(snapshot: ChildTipSnapshot): number {
  if (snapshot.totalSessions === 0) {
    return 0;
  }
  return (snapshot.parentTogetherCount / snapshot.totalSessions) * 100;
}

// Below this many sessions, a low percentage is just noise (e.g. 0/1 = 0%
// looks identical to a real pattern) — wait for a real sample before judging.
const MIN_SESSIONS_FOR_PARTICIPATION_JUDGEMENT = 3;

// condition_type: low_parent_participation
export function parentParticipationBelowThreshold(
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
): boolean {
  if (snapshot.totalSessions < MIN_SESSIONS_FOR_PARTICIPATION_JUDGEMENT) {
    return false;
  }
  const threshold = typeof params.maxPercent === "number" ? params.maxPercent : 10;
  return parentParticipationPercent(snapshot) < threshold;
}

// condition_type: zero_parent_participation
export function parentNeverTrainedTogether(snapshot: ChildTipSnapshot): boolean {
  return snapshot.totalSessions > 0 && snapshot.parentTogetherCount === 0;
}

// condition_type: weekly_summary (card #50 — Prompt 8)
// Stateless periodic gate: fires once a week (Friday, the natural
// end-of-week checkpoint here) when the child has actually worked out that
// day, rather than tracking "was this already shown this week" as state.
export function weeklySummaryDue(snapshot: ChildTipSnapshot): boolean {
  const FRIDAY = 5;
  return snapshot.daysSinceLastWorkout === 0 && new Date().getDay() === FRIDAY;
}
