import type { ChildTipSnapshot, TipConditionFn } from "./types";
import { noWorkoutInDays, longNoWorkoutStreak, hasAbandonedSession } from "./empowering-framework";
import {
  highDifficultyReported,
  negativeFeelingStreak,
  feelingFrustratedLastSession,
  feelingTiredLastSession,
  feelingExhaustedLastSession,
} from "./all-feelings-are-allowed";
import {
  parentParticipationBelowThreshold,
  parentNeverTrainedTogether,
  weeklySummaryDue,
} from "./personal-example";
import {
  difficultyTrendFlat,
  highTotalWorkoutsMilestone,
  twoConsecutiveHardDifficulty,
  difficultyHighLastSession,
  difficultyVeryHardLastSession,
} from "./liberating-belief";
import {
  lowChallengeUnlockRatio,
  consistentMonthlyActivity,
  improvementBetweenWorkouts,
  consecutiveDayStreak,
  comebackAfterBreak,
  shorterThanAverageWorkout,
  feelingPositiveLastSession,
  difficultyHighAndPositiveFeeling,
} from "./focus-on-the-journey";

export type { ChildTipSnapshot, TipConditionFn };

// Maps parent_tip_rules.condition_type -> the function that evaluates it.
// Several condition_types are intentionally referenced by more than one
// parent_tip_rules row (e.g. difficulty_high_last_session by cards #11/#49/
// #33) so those cards are evaluated identically and surface together — see
// tips.service.ts's MAX_RELEVANT_TIPS.
//
// condition_type = 'manual_selection' (the category-3 "What's happening
// now" accordion) has no entry here on purpose: those rows are never
// auto-evaluated, only surfaced via getManualMenuTips().
//
// To add a new scenario: add a row to parent_tip_rules (supabase/schema.sql),
// write its function in one of the files in this folder (or a new file),
// and add one line here. Nothing else in the app needs to change.
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
  // Added for the Prompt 8 tip expansion:
  abandoned_session: hasAbandonedSession,
  two_consecutive_hard_difficulty: twoConsecutiveHardDifficulty,
  improvement_between_workouts: improvementBetweenWorkouts,
  consecutive_day_streak: consecutiveDayStreak,
  comeback_after_break: comebackAfterBreak,
  shorter_than_average_workout: shorterThanAverageWorkout,
  weekly_summary: weeklySummaryDue,
  difficulty_high_last_session: difficultyHighLastSession,
  difficulty_very_hard_last_session: difficultyVeryHardLastSession,
  feeling_frustrated_last_session: feelingFrustratedLastSession,
  feeling_positive_last_session: feelingPositiveLastSession,
  difficulty_high_and_positive_feeling: difficultyHighAndPositiveFeeling,
  feeling_tired_last_session: feelingTiredLastSession,
  feeling_exhausted_last_session: feelingExhaustedLastSession,
};
