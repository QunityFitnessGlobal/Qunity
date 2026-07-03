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
