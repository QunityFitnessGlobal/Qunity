import type { LocalizedText } from "@/lib/i18n-content";

// Mirrors the `challenges` table (supabase/seed.sql). The database is the
// source of truth; this file exists so services/tests can reference challenge
// ids and condition types without a round trip to the DB. title/description
// are {"he": "...", "en": "..."} to match the JSONB columns.

export type ChallengeConditionType =
  | "first_workout"
  | "parent_power"
  | "streak_3"
  | "streak_5"
  | "total_minutes_100"
  | "color_starter"
  | "color_finisher";

export interface ChallengeDefinition {
  id: string;
  title: LocalizedText;
  bonusPoints: number;
  conditionType: ChallengeConditionType;
}

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: "first_workout",
    title: { he: "האימון הראשון", en: "First Workout" },
    bonusPoints: 20,
    conditionType: "first_workout",
  },
  {
    id: "parent_power",
    title: { he: "כוח ההורה", en: "Parent Power" },
    bonusPoints: 10,
    conditionType: "parent_power",
  },
  {
    id: "streak_3",
    title: { he: "רצף של 3 אימונים", en: "3 Workout Streak" },
    bonusPoints: 15,
    conditionType: "streak_3",
  },
  {
    id: "streak_5",
    title: { he: "רצף של 5 אימונים", en: "5 Workout Streak" },
    bonusPoints: 30,
    conditionType: "streak_5",
  },
  {
    id: "minutes_100",
    title: { he: "מועדון 100 הדקות", en: "100 Minutes Club" },
    bonusPoints: 25,
    conditionType: "total_minutes_100",
  },
  {
    id: "color_starter",
    title: { he: "פותח הצבע", en: "Color Starter" },
    bonusPoints: 10,
    conditionType: "color_starter",
  },
  {
    id: "color_finisher",
    title: { he: "מסיים הצבע", en: "Color Finisher" },
    bonusPoints: 50,
    conditionType: "color_finisher",
  },
];
