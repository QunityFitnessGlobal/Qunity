import type { ChildTipSnapshot, TipConditionFn } from "./types";
import { noWorkoutInDays, longNoWorkoutStreak } from "./empowering-framework";
import { highDifficultyReported, negativeFeelingStreak } from "./all-feelings-are-allowed";
import {
  parentParticipationBelowThreshold,
  parentNeverTrainedTogether,
} from "./personal-example";
import { difficultyTrendFlat, highTotalWorkoutsMilestone } from "./liberating-belief";
import { lowChallengeUnlockRatio, consistentMonthlyActivity } from "./focus-on-the-journey";

export type { ChildTipSnapshot, TipConditionFn };

// Maps parent_tip_rules.condition_type -> the function that evaluates it.
//
// To add scenario #16 (or any future one): add a row to parent_tip_rules
// (supabase/seed.sql) with a new condition_type, write its function in one
// of the files in this folder (or a new file), and add one line here.
// Nothing else in the app needs to change.
export const TIP_CONDITION_REGISTRY: Record<string, TipConditionFn> = {
  no_workout_3_days: noWorkoutInDays,
  no_workout_7_days: longNoWorkoutStreak,
  high_difficulty_reported: highDifficultyReported,
  negative_feeling_streak: negativeFeelingStreak,
  low_parent_participation: parentParticipationBelowThreshold,
  zero_parent_participation: parentNeverTrainedTogether,
  difficulty_plateau: difficultyTrendFlat,
  high_total_effort_reminder: highTotalWorkoutsMilestone,
  low_challenge_unlock_rate: lowChallengeUnlockRatio,
  consistent_monthly_activity: consistentMonthlyActivity,
};
