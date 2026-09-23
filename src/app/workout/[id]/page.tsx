import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkoutExercises } from "@/services/workout.service";
import { WorkoutRunner } from "@/components/WorkoutRunner";
import type { BraceletColor, Gender, Role, Workout } from "@/lib/types";

interface WorkoutPageProps {
  params: Promise<{ id: string }>;
  // ?replay=<station number> repeats an already-passed station from the map.
  searchParams: Promise<{ replay?: string }>;
}

export default async function WorkoutPage({ params, searchParams }: WorkoutPageProps) {
  const { id } = await params;
  const { replay } = await searchParams;
  const replayParam = Number(replay);
  const requestedReplay = Number.isInteger(replayParam) && replayParam >= 1 ? replayParam : null;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, gender")
    .eq("id", user.id)
    .single<{ role: Role; gender: Gender | null }>();

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

  const { data: workout } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", id)
    .single<Workout>();

  if (!workout) {
    notFound();
  }

  const { data: child } = await supabase
    .from("children")
    .select("current_color, workouts_completed_in_color")
    .eq("id", user.id)
    .single<{ current_color: BraceletColor; workouts_completed_in_color: number }>();

  const { data: level } = await supabase
    .from("bracelet_levels")
    .select("required_workouts")
    .eq("color", child?.current_color ?? "white")
    .single<{ required_workouts: number }>();

  // Interval structure (rounds/work/rest) belongs to the workout's own belt,
  // not necessarily the child's current one — kept separate from `level`
  // above in case those ever diverge.
  const { data: interval } = await supabase
    .from("bracelet_levels")
    .select("interval_rounds, interval_work_seconds, interval_rest_seconds")
    .eq("color", workout.color ?? child?.current_color ?? "white")
    .single<{
      interval_rounds: number | null;
      interval_work_seconds: number | null;
      interval_rest_seconds: number | null;
    }>();

  const workoutColor = workout.color ?? child?.current_color ?? "white";

  // A replay is only allowed for stations the journey shows as done: any
  // station of an earlier color, or one already completed in the current color.
  let replayStation: number | null = null;
  if (requestedReplay !== null) {
    const { data: levels } = await supabase.from("bracelet_levels").select("color, order_index");
    const orderByColor = new Map(
      ((levels ?? []) as { color: BraceletColor; order_index: number }[]).map((l) => [l.color, l.order_index]),
    );
    const workoutOrder = orderByColor.get(workoutColor) ?? 0;
    const currentOrder = orderByColor.get(child?.current_color ?? "white") ?? 0;
    const isDone =
      workoutOrder < currentOrder ||
      (workoutOrder === currentOrder && requestedReplay <= (child?.workouts_completed_in_color ?? 0));
    if (!isDone) {
      redirect("/dashboard/journey");
    }
    replayStation = requestedReplay;
  }

  // A power is only revealed once: the reveal unlocks its "received power"
  // challenge, so an existing row means it was already shown.
  const { data: powerRow } = await supabase
    .from("child_challenges")
    .select("challenge_id")
    .eq("child_id", user.id)
    .eq("challenge_id", `power_${workoutColor}`)
    .maybeSingle();
  const showPowerReveal =
    replayStation === null && (child?.workouts_completed_in_color ?? 0) === 0 && !powerRow;

  const exercises = await getWorkoutExercises(supabase, workout.id);
  const tColors = await getTranslations("colors");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <WorkoutRunner
        childId={user.id}
        workout={workout}
        workoutIndex={replayStation ?? (child?.workouts_completed_in_color ?? 0) + 1}
        replayStation={replayStation}
        showPowerReveal={showPowerReveal}
        requiredWorkouts={level?.required_workouts ?? 0}
        color={workoutColor}
        colorLabel={tColors(workoutColor)}
        intervalRounds={interval?.interval_rounds ?? null}
        intervalWorkSeconds={interval?.interval_work_seconds ?? null}
        intervalRestSeconds={interval?.interval_rest_seconds ?? null}
        gender={profile?.gender ?? null}
        exercises={exercises}
      />
    </div>
  );
}
