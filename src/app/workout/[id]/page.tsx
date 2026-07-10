import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WorkoutRunner } from "@/components/WorkoutRunner";
import type { BraceletColor, Gender, Role, Workout } from "@/lib/types";

interface WorkoutPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { id } = await params;
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

  const tColors = await getTranslations("colors");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <WorkoutRunner
        childId={user.id}
        workout={workout}
        workoutIndex={(child?.workouts_completed_in_color ?? 0) + 1}
        requiredWorkouts={level?.required_workouts ?? 0}
        colorLabel={tColors(workout.color ?? child?.current_color ?? "white")}
        intervalRounds={interval?.interval_rounds ?? null}
        intervalWorkSeconds={interval?.interval_work_seconds ?? null}
        intervalRestSeconds={interval?.interval_rest_seconds ?? null}
        gender={profile?.gender ?? null}
      />
    </div>
  );
}
