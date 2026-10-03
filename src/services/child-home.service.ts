import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateStreakDays } from "@/services/challenge.service";
import type { BraceletColor } from "@/lib/types";

export interface ChildHomeStats {
  // Consecutive days with a workout, counted only while it's still going —
  // the last workout was today or yesterday. 0 once it has lapsed.
  streakDays: number;
  // Everything the most recent workout earned, its challenge bonuses
  // included (they're recorded against the same session).
  lastWorkoutPoints: number;
  // The current stage's power is revealed at the start of its first
  // workout; until then the home screen doesn't show it.
  powerRevealed: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export async function getChildHomeStats(
  supabase: SupabaseClient,
  childId: string,
  currentColor: BraceletColor,
): Promise<ChildHomeStats> {
  // All three at once: the last workout's points come embedded with it,
  // rather than waiting for its id before asking for them.
  const [{ data: sessions }, { data: lastSession }, { data: powerRow }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("start_time")
      .eq("child_id", childId)
      .eq("status", "completed")
      .order("start_time", { ascending: false }),
    supabase
      .from("workout_sessions")
      .select("id, points_transactions(points)")
      .eq("child_id", childId)
      .eq("status", "completed")
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; points_transactions: { points: number }[] | null }>(),
    supabase
      .from("child_challenges")
      .select("challenge_id")
      .eq("child_id", childId)
      .eq("challenge_id", `power_${currentColor}`)
      .maybeSingle(),
  ]);

  const rows = (sessions ?? []) as { start_time: string }[];
  const dates = rows.map((row) => new Date(row.start_time));
  const lastDay = dates.length > 0 ? utcDay(dates[0]) : null;
  // Same day rule (UTC calendar days) as the streak challenges use.
  const stillGoing = lastDay !== null && utcDay(new Date()) - lastDay <= DAY_MS;
  const streakDays = stillGoing ? calculateStreakDays(dates) : 0;

  const lastWorkoutPoints = (lastSession?.points_transactions ?? []).reduce(
    (sum, row) => sum + (row.points ?? 0),
    0,
  );

  return { streakDays, lastWorkoutPoints, powerRevealed: Boolean(powerRow) };
}
