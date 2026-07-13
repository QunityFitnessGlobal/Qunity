import type { LocalizedText } from "@/lib/i18n-content";
import type { BraceletColor } from "@/lib/types";

// Mirrors the `challenges` table (supabase/seed.sql) for reference — like
// tips.data.ts, this is NOT used at runtime. The challenges table is the
// source of truth for title/description/bonus_points (see
// challenge.service.ts's getChallengeDefinitions); only the condition-check
// logic (isConditionMet in challenge.service.ts) lives in code, keyed by
// condition_type. This file exists so the id <-> condition_type mapping is
// easy to read without opening the SQL seed file, and so ChallengeDefinition/
// ChallengeConditionType have somewhere to live as shared types.
//
// Two kinds of challenges (challengeType) — see the "ADDED FOR REPEATABLE
// CHALLENGES" section in schema.sql for the full rationale:
//   'condition'          — auto-detected from cumulative activity, one-time.
//   'repeatable_workout' — unlocks when a child finishes unlockColor, then
//                          can be performed any number of times.

export type ChallengeConditionType =
  | "first_workout"
  | "parent_power"
  | "streak_3"
  | "streak_5"
  | "total_minutes_100"
  | "color_starter"
  | "color_finisher";

export type ChallengeType = "condition" | "repeatable_workout";

export interface ChallengeDefinition {
  id: string;
  title: LocalizedText;
  description: LocalizedText | null;
  bonusPoints: number;
  conditionType: ChallengeConditionType | null;
  challengeType: ChallengeType;
  unlockColor: BraceletColor | null;
}

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: "first_workout",
    title: { he: "האימון הראשון", en: "First Workout" },
    description: { he: "השלמת את האימון הראשון שלך.", en: "You completed your first workout." },
    bonusPoints: 20,
    conditionType: "first_workout",
    challengeType: "condition",
    unlockColor: null,
  },
  {
    id: "parent_power",
    title: { he: "כוח ההורה", en: "Parent Power" },
    description: {
      he: "התאמנת יחד עם ההורה שלך.",
      en: "You worked out together with your parent.",
    },
    bonusPoints: 10,
    conditionType: "parent_power",
    challengeType: "condition",
    unlockColor: null,
  },
  {
    id: "streak_3",
    title: { he: "רצף של 3 אימונים", en: "3 Workout Streak" },
    description: { he: "התאמנת 3 ימים ברצף.", en: "You worked out 3 days in a row." },
    bonusPoints: 15,
    conditionType: "streak_3",
    challengeType: "condition",
    unlockColor: null,
  },
  {
    id: "streak_5",
    title: { he: "רצף של 5 אימונים", en: "5 Workout Streak" },
    description: { he: "התאמנת 5 ימים ברצף.", en: "You worked out 5 days in a row." },
    bonusPoints: 30,
    conditionType: "streak_5",
    challengeType: "condition",
    unlockColor: null,
  },
  {
    id: "minutes_100",
    title: { he: "מועדון 100 הדקות", en: "100 Minutes Club" },
    description: {
      he: "צברת 100 דקות אימון במצטבר.",
      en: "You accumulated 100 minutes of exercise.",
    },
    bonusPoints: 25,
    conditionType: "total_minutes_100",
    challengeType: "condition",
    unlockColor: null,
  },
  {
    id: "color_starter",
    title: { he: "פותח הצבע", en: "Color Starter" },
    description: {
      he: "השלמת את האימון הראשון בצבע חדש.",
      en: "You completed your first workout in a new color.",
    },
    bonusPoints: 10,
    conditionType: "color_starter",
    challengeType: "condition",
    unlockColor: null,
  },
  {
    id: "color_finisher",
    title: { he: "מסיים הצבע", en: "Color Finisher" },
    description: {
      he: "עמדת בכל הדרישות ועלית לצבע הבא.",
      en: "You met every requirement and leveled up to the next color.",
    },
    bonusPoints: 50,
    conditionType: "color_finisher",
    challengeType: "condition",
    unlockColor: null,
  },
  {
    id: "stairs_white",
    title: { he: "100 מדרגות", en: "100 stairs" },
    description: {
      he: "עלה 100 מדרגות ברצף, בקצב שנוח לך.",
      en: "Climb 100 stairs in a row, at your own pace.",
    },
    bonusPoints: 15,
    conditionType: null,
    challengeType: "repeatable_workout",
    unlockColor: "white",
  },
  {
    id: "stairs_orange",
    title: { he: "200 מדרגות", en: "200 stairs" },
    description: {
      he: "עלה 200 מדרגות ברצף, בקצב שנוח לך.",
      en: "Climb 200 stairs in a row, at your own pace.",
    },
    bonusPoints: 20,
    conditionType: null,
    challengeType: "repeatable_workout",
    unlockColor: "orange",
  },
  {
    id: "stairs_green",
    title: { he: "300 מדרגות", en: "300 stairs" },
    description: {
      he: "עלה 300 מדרגות ברצף, בקצב שנוח לך.",
      en: "Climb 300 stairs in a row, at your own pace.",
    },
    bonusPoints: 25,
    conditionType: null,
    challengeType: "repeatable_workout",
    unlockColor: "green",
  },
  {
    id: "stairs_blue",
    title: { he: "400 מדרגות", en: "400 stairs" },
    description: {
      he: "עלה 400 מדרגות ברצף, בקצב שנוח לך.",
      en: "Climb 400 stairs in a row, at your own pace.",
    },
    bonusPoints: 30,
    conditionType: null,
    challengeType: "repeatable_workout",
    unlockColor: "blue",
  },
  {
    id: "stairs_purple",
    title: { he: "500 מדרגות", en: "500 stairs" },
    description: {
      he: "עלה 500 מדרגות ברצף, בקצב שנוח לך.",
      en: "Climb 500 stairs in a row, at your own pace.",
    },
    bonusPoints: 35,
    conditionType: null,
    challengeType: "repeatable_workout",
    unlockColor: "purple",
  },
];
