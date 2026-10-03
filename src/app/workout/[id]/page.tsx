import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getWorkoutExercises } from "@/services/workout.service";
import { WorkoutRunner } from "@/components/WorkoutRunner";
import { canUseQaTools } from "@/lib/admin-access";
import type { BraceletColor, Workout } from "@/lib/types";

interface WorkoutPageProps {
  params: Promise<{ id: string }>;
  // ?replay=<station number> explicitly repeats an already-passed station
  // from the map. A repeat of the child's own current (unfinished) station is
  // detected automatically instead — see naturalStationNumber below.
  searchParams: Promise<{ replay?: string }>;
}

interface LevelRow {
  color: BraceletColor;
  order_index: number;
  required_workouts: number;
  interval_rounds: number | null;
  interval_work_seconds: number | null;
  interval_rest_seconds: number | null;
}

export default async function WorkoutPage({ params, searchParams }: WorkoutPageProps) {
  const { id } = await params;
  const { replay } = await searchParams;
  const replayParam = Number(replay);
  const requestedReplay = Number.isInteger(replayParam) && replayParam >= 1 ? replayParam : null;
  const user = await requireUser();
  const supabase = await getSupabase();

  // Step 1 — everything that only needs the ids. The stage table is tiny, so
  // all of it is read once and used for the child's stage, the workout's
  // interval timer and the stage order below.
  const [profile, { data: workout }, { data: child }, { data: levelRows }, exercises] = await Promise.all([
    getProfile(user.id),
    supabase.from("workouts").select("*").eq("id", id).maybeSingle<Workout>(),
    supabase
      .from("children")
      .select("current_color, workouts_completed_in_color")
      .eq("id", user.id)
      .maybeSingle<{ current_color: BraceletColor; workouts_completed_in_color: number }>(),
    supabase
      .from("bracelet_levels")
      .select("color, order_index, required_workouts, interval_rounds, interval_work_seconds, interval_rest_seconds"),
    getWorkoutExercises(supabase, id),
  ]);

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

  if (!workout) {
    notFound();
  }

  const levels = (levelRows ?? []) as LevelRow[];
  const levelOf = (color: BraceletColor) => levels.find((l) => l.color === color);
  const currentColor = child?.current_color ?? "white";
  const level = levelOf(currentColor);
  // Interval structure (rounds/work/rest) belongs to the workout's own belt,
  // not necessarily the child's current one.
  const workoutColor = workout.color ?? currentColor;
  const interval = levelOf(workoutColor);
  const naturalStationNumber = (child?.workouts_completed_in_color ?? 0) + 1;

  // A repeat is either explicitly requested (?replay=<station>, tapping an
  // already-passed station on the map) or detected automatically: the
  // child's natural "current" station already has a completed attempt on
  // record, meaning it fell short of 60% last time and this is another go at
  // it (see completeWorkout's increment logic) — no explicit param needed for
  // that case, since "Next workout" naturally lands back on the same station
  // until it's passed.
  if (requestedReplay !== null) {
    // Explicitly requested: only allowed for a station the journey shows as
    // done — any station of an earlier color, or one already passed in the
    // current color.
    const workoutOrder = levelOf(workoutColor)?.order_index ?? 0;
    const currentOrder = levelOf(currentColor)?.order_index ?? 0;
    const isDone =
      workoutOrder < currentOrder ||
      (workoutOrder === currentOrder && requestedReplay <= (child?.workouts_completed_in_color ?? 0));
    if (!isDone) {
      redirect("/dashboard/journey");
    }
  }

  // Step 2 — what needs the workout's stage: whether this station was tried
  // before, whether its power was already revealed (the reveal unlocks its
  // "received power" challenge, so an existing row means it was shown), the
  // power's bonus, and the testing tools.
  const [{ count: earlierAttempts }, { data: powerRow }, { data: powerChallenge }, qaToolsAllowed] =
    await Promise.all([
      requestedReplay === null
        ? supabase
            .from("workout_sessions")
            .select("id, workouts!inner(color)", { count: "exact", head: true })
            .eq("child_id", user.id)
            .eq("status", "completed")
            .eq("station_number", naturalStationNumber)
            .eq("workouts.color", workoutColor)
        : Promise.resolve({ count: null }),
      supabase
        .from("child_challenges")
        .select("challenge_id")
        .eq("child_id", user.id)
        .eq("challenge_id", `power_${workoutColor}`)
        .maybeSingle(),
      naturalStationNumber === 1
        ? supabase
            .from("challenges")
            .select("bonus_points")
            .eq("id", `power_${workoutColor}`)
            .maybeSingle<{ bonus_points: number }>()
        : Promise.resolve({ data: null }),
      canUseQaTools(user, profile.role),
    ]);

  const replayStation = requestedReplay ?? (earlierAttempts ? naturalStationNumber : null);
  const showPowerReveal = replayStation === null && naturalStationNumber === 1 && !powerRow;

  const tColors = await getTranslations("colors");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <WorkoutRunner
        childId={user.id}
        workout={workout}
        workoutIndex={replayStation ?? naturalStationNumber}
        replayStation={replayStation}
        showPowerReveal={showPowerReveal}
        powerBonusPoints={showPowerReveal ? (powerChallenge?.bonus_points ?? null) : null}
        requiredWorkouts={level?.required_workouts ?? 0}
        color={workoutColor}
        colorLabel={tColors(workoutColor)}
        intervalRounds={interval?.interval_rounds ?? null}
        intervalWorkSeconds={interval?.interval_work_seconds ?? null}
        intervalRestSeconds={interval?.interval_rest_seconds ?? null}
        gender={profile?.gender ?? null}
        exercises={exercises}
        qaToolsAllowed={qaToolsAllowed}
      />
    </div>
  );
}
