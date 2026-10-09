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

interface AttemptRow {
  station_number: number | null;
  completion_percent: number | null;
  workouts: { color: BraceletColor | null } | { color: BraceletColor | null }[] | null;
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
  const [{ data: levels }, { data: workouts }, { data: child }, { data: attempts }] = await Promise.all([
    supabase.from("bracelet_levels").select("color, order_index").order("order_index", { ascending: true }),
    supabase.from("workouts").select("id, title, color, order_in_color"),
    supabase
      .from("children")
      .select("current_color, workouts_completed_in_color")
      .eq("id", childId)
      .single<ChildProgressRow>(),
    supabase
      .from("workout_sessions")
      .select("station_number, completion_percent, workouts!inner(color)")
      .eq("child_id", childId)
      .eq("status", "completed")
      .not("station_number", "is", null),
  ]);

  // Per station (color + number): the best completion percent across every
  // attempt (replays included). Sessions from before completion_percent
  // existed count as a full 100 (the original "completed = done" behavior).
  // A "done" station below 100 gets a half star; a "current" station that
  // already has an attempt on record (necessarily below the 60% pass mark,
  // or it would already be "done") also gets a half star, to show the child
  // they've tried this one and haven't finished it yet.
  const bestPercentByStation = new Map<string, number>();
  for (const row of (attempts ?? []) as unknown as AttemptRow[]) {
    const color = Array.isArray(row.workouts) ? row.workouts[0]?.color : row.workouts?.color;
    if (!color || row.station_number == null) continue;
    const key = `${color}:${row.station_number}`;
    const percent = row.completion_percent ?? 100;
    bestPercentByStation.set(key, Math.max(bestPercentByStation.get(key) ?? 0, percent));
  }

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

    const bestPercent = bestPercentByStation.get(`${beltColor}:${localNumber}`);
    const partial =
      state === "done"
        ? (bestPercent ?? 100) < 100
        : state === "current"
          ? bestPercent !== undefined
          : false;

    return {
      workoutId: workout.id,
      title: workout.title,
      beltColor,
      localNumber,
      globalNumber: index + 1,
      state,
      partial,
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
  // How many times the station was done (the first time and every repeat).
  attempts: number;
  // Best completion across the attempts at this station; null when the
  // station only has sessions from before completion was tracked.
  bestCompletionPercent: number | null;
}

interface StationSessionRow {
  id: string;
  start_time: string;
  actual_duration_seconds: number | null;
  is_replay: boolean;
  completion_percent: number | null;
  workouts: { title: LocalizedText } | { title: LocalizedText }[] | null;
}

function workoutTitle(workouts: StationSessionRow["workouts"]): LocalizedText | null {
  if (!workouts) return null;
  return Array.isArray(workouts) ? (workouts[0]?.title ?? null) : workouts.title;
}

// Reuses the same (title, date, duration, difficulty) shape as
// RecentWorkoutEntry (parent-stats.service.ts) rather than inventing a new
// one, since this is the same underlying concept from the child own view.
//
// A station is identified by (belt color, station number), recorded on each
// session when it starts. The date/duration/difficulty shown are from the
// first, regular attempt; points add up every attempt at the station
// (replays included), and the completion is the best of them.
export async function getStationWorkoutSummary(
  supabase: SupabaseClient,
  childId: string,
  beltColor: BraceletColor,
  localNumber: number,
): Promise<StationWorkoutSummary | null> {
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, start_time, actual_duration_seconds, is_replay, completion_percent, workouts!inner(title, color)")
    .eq("child_id", childId)
    .eq("status", "completed")
    .eq("station_number", localNumber)
    .eq("workouts.color", beltColor)
    .order("start_time", { ascending: true });

  const sessionRows = (sessions ?? []) as StationSessionRow[];
  const target = sessionRows.find((row) => !row.is_replay) ?? sessionRows[0];
  if (!target) {
    return null;
  }

  const [{ data: result }, { data: pointsRows }] = await Promise.all([
    supabase
      .from("workout_results")
      .select("difficulty_reported, feeling_after")
      .eq("session_id", target.id)
      .maybeSingle<{ difficulty_reported: number | null; feeling_after: string | null }>(),
    supabase
      .from("points_transactions")
      .select("points")
      .in("session_id", sessionRows.map((row) => row.id)),
  ]);

  const pointsAwarded = ((pointsRows ?? []) as { points: number }[]).reduce(
    (sum, row) => sum + row.points,
    0,
  );

  const percents = sessionRows
    .map((row) => row.completion_percent)
    .filter((percent): percent is number => percent !== null);

  return {
    workoutTitle: workoutTitle(target.workouts),
    date: target.start_time,
    durationSeconds: target.actual_duration_seconds,
    difficultyReported: result?.difficulty_reported ?? null,
    feelingAfter: result?.feeling_after ?? null,
    pointsAwarded,
    attempts: sessionRows.length,
    bestCompletionPercent: percents.length > 0 ? Math.max(...percents) : null,
  };
}
