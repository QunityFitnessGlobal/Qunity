import type { LocalizedText } from "@/lib/i18n-content";

// Mirrors the `challenges` table (supabase/seed.sql) for reference — like
// tips.data.ts, this is NOT used at runtime. The challenges table is the
// source of truth for title/description/bonus_points (see
// challenge.service.ts's getChallengeDefinitions); only the condition-check
// logic (isConditionMet in challenge.service.ts) lives in code, keyed by
// condition_type. This file exists so the id <-> condition_type mapping is
// easy to read without opening the SQL seed file, and so ChallengeDefinition/
// ChallengeConditionType have somewhere to live as shared types.

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
