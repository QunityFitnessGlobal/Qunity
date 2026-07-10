// Shared between the end-of-workout questionnaire (WorkoutRunner) and every
// screen that displays a past session's answers (WorkoutSummaryModal,
// RecentWorkoutsList), so the ordinal<->word and code<->label mappings only
// live in one place.

// difficulty_reported: 1-4 ordinal (קליל/בינוני/מאתגר/קשה מאוד). The
// existing recommended_difficulty bonus comparison (points.service.ts) just
// compares these ordinals, so it keeps working unchanged.
export const DIFFICULTY_VALUES = [1, 2, 3, 4] as const;
export type DifficultyValue = (typeof DIFFICULTY_VALUES)[number];
export const DIFFICULTY_LABEL_KEYS: Record<DifficultyValue, string> = {
  1: "difficultyLight",
  2: "difficultyMedium",
  3: "difficultyChallenging",
  4: "difficultyVeryHard",
};

export function difficultyLabelKey(value: number | null | undefined): string | null {
  if (value == null || !DIFFICULTY_VALUES.includes(value as DifficultyValue)) {
    return null;
  }
  return DIFFICULTY_LABEL_KEYS[value as DifficultyValue];
}

// For an *average* (e.g. StatsGrid's "average difficulty reported" — a mean
// across many sessions, so it's rarely a whole number): round to the
// nearest ordinal and clamp into the valid 1-4 range before mapping to a
// word, rather than displaying the raw float.
export function averageDifficultyLabelKey(average: number | null | undefined): string | null {
  if (average == null) {
    return null;
  }
  const rounded = Math.min(4, Math.max(1, Math.round(average))) as DifficultyValue;
  return DIFFICULTY_LABEL_KEYS[rounded];
}

// Stable, locale-independent codes stored in workout_results.feeling_after
// (see tip-conditions/all-feelings-are-allowed.ts, which matches against
// these same codes). Only the displayed label/icon is translated/gendered.
export const FEELING_CODES = ["fun", "fine", "frustrated", "tired", "exhausted"] as const;
export type FeelingCode = (typeof FEELING_CODES)[number];
export const FEELING_LABEL_KEYS: Record<FeelingCode, string> = {
  fun: "feelingFun",
  fine: "feelingFine",
  frustrated: "feelingFrustrated",
  tired: "feelingTired",
  exhausted: "feelingExhausted",
};
export const FEELING_ICONS: Record<FeelingCode, string> = {
  fun: "😄",
  fine: "🙂",
  frustrated: "😤",
  tired: "😔",
  exhausted: "😢",
};

export function feelingLabelKey(code: string | null | undefined): string | null {
  if (!code || !(FEELING_CODES as readonly string[]).includes(code)) {
    return null;
  }
  return FEELING_LABEL_KEYS[code as FeelingCode];
}
