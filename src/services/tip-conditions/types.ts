// A single snapshot of everything the tip condition functions might need,
// built once per getRelevantTips call (see tips.service.ts) so no condition
// function has to query the database itself.
export interface ChildTipSnapshot {
  daysSinceLastWorkout: number | null;
  totalSessions: number;
  parentTogetherCount: number;
  difficultyReportedHistory: number[];
  feelingHistory: string[];
  unlockedChallengeCount: number;
  totalChallengesAvailable: number;
  totalWorkoutsCompleted: number;
  workoutsThisMonth: number;
  // Added for the Prompt 8 tip expansion:
  durationHistory: number[]; // actual_duration_seconds, chronological (oldest first)
  consecutiveStreakDays: number; // same calculation as challenge.service.ts's streak_3/streak_5
  hasAbandonedSession: boolean; // an in_progress session left open well past the workout's expected length
  gapBeforeLastWorkoutDays: number | null; // days between the two most recent completed sessions
  lastSessionDifficultyReported: number | null; // from the single most recent session's own result row (not an independently-filtered array, so it can't drift out of sync with lastSessionFeelingAfter)
  lastSessionFeelingAfter: string | null;
}

// One function per condition_type. Registered in ./index.ts against the
// matching parent_tip_rules.condition_type string. manualTestIndex is only
// used by the temporary Manual Test Mode control on the Parent Dashboard
// (Prompt 6/7) to exercise the pipeline before every condition's real math
// is finished.
export type TipConditionFn = (
  snapshot: ChildTipSnapshot,
  params: Record<string, unknown>,
  manualTestIndex?: number,
) => boolean;
