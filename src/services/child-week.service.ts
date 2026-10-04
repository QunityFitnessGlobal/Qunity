import type { SupabaseClient } from "@supabase/supabase-js";
import { shiftDayKey, toDayKey, weekStartKey } from "@/services/workout-history.service";

// "השבוע של…" on the parent home screen: the child's workouts this week
// (Sunday to Saturday, in the app's time zone) day by day, and how many
// there were last week to compare.

export interface WeekDay {
  dayKey: string;
  trained: boolean;
  // Trained together with the parent that day.
  together: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface ChildWeek {
  thisWeekCount: number;
  lastWeekCount: number;
  days: WeekDay[];
}

export interface WeekSession {
  dayKey: string;
  trainedTogether: boolean;
}

export function buildChildWeek(sessions: WeekSession[], now: Date): ChildWeek {
  const todayKey = toDayKey(now);
  const thisWeekStart = weekStartKey(now);
  const lastWeekStart = shiftDayKey(thisWeekStart, -7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayKey = shiftDayKey(thisWeekStart, i);
    const that = sessions.filter((s) => s.dayKey === dayKey);
    return {
      dayKey,
      trained: that.length > 0,
      together: that.some((s) => s.trainedTogether),
      isToday: dayKey === todayKey,
      isFuture: dayKey > todayKey,
    };
  });

  return {
    thisWeekCount: sessions.filter((s) => s.dayKey >= thisWeekStart).length,
    lastWeekCount: sessions.filter((s) => s.dayKey >= lastWeekStart && s.dayKey < thisWeekStart).length,
    days,
  };
}

interface SessionRow {
  start_time: string;
  workout_results: { parent_trained_together: boolean }[] | null;
}

// Accepts either the browser or server Supabase client.
export async function getChildWeek(
  supabase: SupabaseClient,
  childId: string,
  now: Date = new Date(),
): Promise<ChildWeek> {
  // A day's margin on the far side of last Sunday covers the time zone; the
  // day keys decide which week each workout belongs to.
  const [year, month, day] = shiftDayKey(weekStartKey(now), -8).split("-").map(Number);
  const { data } = await supabase
    .from("workout_sessions")
    .select("start_time, workout_results(parent_trained_together)")
    .eq("child_id", childId)
    .eq("status", "completed")
    .gte("start_time", new Date(Date.UTC(year, month - 1, day)).toISOString());

  const sessions = ((data ?? []) as SessionRow[]).map((row) => ({
    dayKey: toDayKey(new Date(row.start_time)),
    trainedTogether: (row.workout_results ?? []).some((r) => r.parent_trained_together),
  }));
  return buildChildWeek(sessions, now);
}
