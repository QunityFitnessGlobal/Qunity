import type { SupabaseClient } from "@supabase/supabase-js";
import { COLOR_ORDER } from "@/services/progression.service";
import { getJourneyStations } from "@/services/journey.service";
import type { BraceletColor } from "@/lib/types";

// The child's "ההישגים שלי" screen: the five stage powers as a collection
// (a medallion), and three totals — stars, challenges and the longest streak.

export type PowerState = "earned" | "current" | "waiting" | "locked";

export interface PowerSlot {
  color: BraceletColor;
  // earned: an earlier stage's power. current: this stage's, already
  // revealed. waiting: this stage's, revealed at the start of its first
  // workout, which hasn't happened yet. locked: a later stage's.
  state: PowerState;
}

export interface AchievementsData {
  currentColor: BraceletColor;
  slots: PowerSlot[];
  collected: number;
  // One per journey station the child has completed — the stars on the map.
  stars: number;
  // Different challenges achieved: one-time ones earned, plus repeatable
  // ones done at least once.
  challenges: number;
  longestStreak: number;
  workoutsLeft: number;
  pointsLeft: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// The longest run of consecutive calendar days with at least one workout,
// ever — same UTC day rule as the current streak (calculateStreakDays).
export function longestStreakDays(dates: Date[]): number {
  const days = Array.from(new Set(dates.map(utcDay))).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] - days[i - 1] === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

// Earlier stages' powers are collected; the current stage's counts once it
// has been revealed. Shared with the home screen's "2/5" badge.
export function powerSlots(currentColor: BraceletColor, currentRevealed: boolean): PowerSlot[] {
  const currentIndex = COLOR_ORDER.indexOf(currentColor);
  return COLOR_ORDER.map((color, i) => ({
    color,
    state:
      i < currentIndex ? "earned" : i > currentIndex ? "locked" : currentRevealed ? "current" : "waiting",
  }));
}

export function collectedCount(slots: PowerSlot[]): number {
  return slots.filter((slot) => slot.state === "earned" || slot.state === "current").length;
}

interface ChildRow {
  current_color: BraceletColor;
  workouts_completed_in_color: number;
  points_in_color: number;
}

// Accepts either the browser or server Supabase client.
export async function getAchievements(supabase: SupabaseClient, childId: string): Promise<AchievementsData> {
  const [{ data: child }, { data: levels }, { data: unlocked }, { data: challengeDefs }, { data: attempts }, { data: sessions }, journey] =
    await Promise.all([
      supabase
        .from("children")
        .select("current_color, workouts_completed_in_color, points_in_color")
        .eq("id", childId)
        .maybeSingle<ChildRow>(),
      supabase.from("bracelet_levels").select("color, required_workouts, required_points"),
      supabase.from("child_challenges").select("challenge_id").eq("child_id", childId),
      supabase.from("challenges").select("id, challenge_type"),
      supabase.from("challenge_sessions").select("challenge_id").eq("child_id", childId).eq("status", "completed"),
      supabase.from("workout_sessions").select("start_time").eq("child_id", childId).eq("status", "completed"),
      getJourneyStations(supabase, childId),
    ]);

  const currentColor = child?.current_color ?? "white";
  const unlockedIds = new Set((unlocked ?? []).map((row) => row.challenge_id as string));
  const slots = powerSlots(currentColor, unlockedIds.has(`power_${currentColor}`));

  const typeById = new Map((challengeDefs ?? []).map((row) => [row.id as string, row.challenge_type as string]));
  const oneTime = [...unlockedIds].filter((id) => typeById.get(id) === "condition").length;
  const repeatableDone = new Set((attempts ?? []).map((row) => row.challenge_id as string)).size;

  const level = ((levels ?? []) as { color: BraceletColor; required_workouts: number; required_points: number }[]).find(
    (l) => l.color === currentColor,
  );

  return {
    currentColor,
    slots,
    collected: collectedCount(slots),
    stars: journey.completedCount,
    challenges: oneTime + repeatableDone,
    longestStreak: longestStreakDays((sessions ?? []).map((row) => new Date(row.start_time as string))),
    workoutsLeft: Math.max(0, (level?.required_workouts ?? 0) - (child?.workouts_completed_in_color ?? 0)),
    pointsLeft: Math.max(0, (level?.required_points ?? 0) - (child?.points_in_color ?? 0)),
  };
}
