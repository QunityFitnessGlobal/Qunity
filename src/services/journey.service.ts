import type { SupabaseClient } from "@supabase/supabase-js";
import type { BraceletColor, JourneyStation } from "@/lib/types";
import type { LocalizedText } from "@/lib/i18n-content";

interface BraceletLevelRow {
  color: BraceletColor;
  order_index: number;
}

interface WorkoutRow {
  id: string;
  title: JourneyStation["title"];
  color: BraceletColor | null;
  order_in_color: number | null;
}

interface ChildProgressRow {
  current_color: BraceletColor;
  workouts_completed_in_color: number;
}

export interface JourneyOverview {
  stations: JourneyStation[];
  completedCount: number;
  totalCount: number;
}

// Accepts either the browser or server Supabase client (see linking.service.ts).
//
// Station count and numbering are derived entirely from the DB at request
// time (bracelet_levels for belt order, workouts for per-belt content) —
// nothing here assumes a fixed number of belts or workouts per belt. This
// stays correct if content is re-imported via scripts/import-workouts.mjs
// with a different number of rows per color.
//
// `state` is derived ordinally (by local_number vs. workouts_completed_in_color)
// rather than by matching specific workout_id history. This is deliberate:
// today workouts repeat cyclically within a color (see getNextWorkout in
// workout.service.ts) because there are fewer workout rows than
// required_workouts, so a given workout_id can't uniquely identify "which"
// station was completed. Ordinal position stays correct both now and after
// the workout content is imported 1:1 with required_workouts.
export async function getJourneyStations(
  supabase: SupabaseClient,
  childId: string,
): Promise<JourneyOverview> {
  const [{ data: levels }, { data: workouts }, { data: child }] = await Promise.all([
    supabase.from("bracelet_levels").select("color, order_index").order("order_index", { ascending: true }),
    supabase.from("workouts").select("id, title, color, order_in_color"),
    supabase
      .from("children")
      .select("current_color, workouts_completed_in_color")
      .eq("id", childId)
      .single<ChildProgressRow>(),
  ]);

  const levelRows = (levels ?? []) as BraceletLevelRow[];
  const workoutRows = (workouts ?? []) as WorkoutRow[];

  if (!child || levelRows.length === 0 || workoutRows.length === 0) {
    return { stations: [], completedCount: 0, totalCount: 0 };
  }

  const beltOrderByColor = new Map(levelRows.map((level) => [level.color, level.order_index]));
  const currentBeltOrder = beltOrderByColor.get(child.current_color) ?? 0;

  // Sort by belt order first, then by position within the belt, so
  // global_number can just be the row's position in this sorted list.
  const sorted = [...workoutRows].sort((a, b) => {
    const beltDiff = (beltOrderByColor.get(a.color as BraceletColor) ?? 0) -
      (beltOrderByColor.get(b.color as BraceletColor) ?? 0);
    if (beltDiff !== 0) return beltDiff;
    return (a.order_in_color ?? 0) - (b.order_in_color ?? 0);
  });

  const localNumberByColor = new Map<BraceletColor, number>();
  const stations: JourneyStation[] = sorted.map((workout, index) => {
    const beltColor = (workout.color ?? "white") as BraceletColor;
    const localNumber = (localNumberByColor.get(beltColor) ?? 0) + 1;
    localNumberByColor.set(beltColor, localNumber);

    const beltOrder = beltOrderByColor.get(beltColor) ?? 0;
    const state: JourneyStation["state"] =
      beltOrder < currentBeltOrder || (beltOrder === currentBeltOrder && localNumber <= child.workouts_completed_in_color)
        ? "done"
        : beltOrder === currentBeltOrder && localNumber === child.workouts_completed_in_color + 1
          ? "current"
          : "locked";

    return {
      workoutId: workout.id,
      title: workout.title,
      beltColor,
      localNumber,
      globalNumber: index + 1,
      state,
    };
  });

  return {
    stations,
    completedCount: stations.filter((station) => station.state === "done").length,
    totalCount: stations.length,
  };
}

export interface StationWorkoutSummary {
  workoutTitle: LocalizedText | null;
  date: string;
  durationSeconds: number | null;
  difficultyReported: number | null;
  feelingAfter: string | null;
  pointsAwarded: number;
}

interface StationSessionRow {
  id: string;
  start_time: string;
  actual_duration_seconds: number | null;
  workouts: { title: LocalizedText } | { title: LocalizedText }[] | null;
}

function workoutTitle(workouts: StationSessionRow["workouts"]): LocalizedText | null {
  if (!workouts) return null;
  return Array.isArray(workouts) ? (workouts[0]?.title ?? null) : workouts.title;
}

// Reuses the same (title, date, duration, difficulty) shape as
// RecentWorkoutEntry (parent-stats.service.ts) rather than inventing a new
// one, since this is the same underlying concept from the child's own view.
//
// A "done" station identifies a specific past session the same way its
// state was derived: by ordinal position (the Nth completed session whose
// workout belongs to this belt color), not by workout_id — see the note on
// getJourneyStations above.
export async function getStationWorkoutSummary(
  supabase: SupabaseClient,
  childId: string,
  beltColor: BraceletColor,
  localNumber: number,
): Promise<StationWorkoutSummary | null> {
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, start_time, actual_duration_seconds, workouts!inner(title, color)")
    .eq("child_id", childId)
    .eq("status", "completed")
    .eq("workouts.color", beltColor)
    .order("start_time", { ascending: true });

  const sessionRows = (sessions ?? []) as StationSessionRow[];
  const target = sessionRows[localNumber - 1];
  if (!target) {
    return null;
  }

  const [{ data: result }, { data: pointsRows }] = await Promise.all([
    supabase
      .from("workout_results")
      .select("difficulty_reported, feeling_after")
      .eq("session_id", target.id)
      .maybeSingle<{ difficulty_reported: number | null; feeling_after: string | null }>(),
    supabase.from("points_transactions").select("points").eq("session_id", target.id),
  ]);

  const pointsAwarded = ((pointsRows ?? []) as { points: number }[]).reduce(
    (sum, row) => sum + row.points,
    0,
  );

  return {
    workoutTitle: workoutTitle(target.workouts),
    date: target.start_time,
    durationSeconds: target.actual_duration_seconds,
    difficultyReported: result?.difficulty_reported ?? null,
    feelingAfter: result?.feeling_after ?? null,
    pointsAwarded,
  };
}
