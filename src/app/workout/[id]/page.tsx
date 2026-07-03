import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { WorkoutRunner } from "@/components/WorkoutRunner";
import type { BraceletColor, Role, Workout } from "@/lib/types";

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
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();

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

  const tColors = await getTranslations("colors");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <WorkoutRunner
        childId={user.id}
        workout={workout}
        workoutIndex={(child?.workouts_completed_in_color ?? 0) + 1}
        requiredWorkouts={level?.required_workouts ?? 0}
        colorLabel={tColors(workout.color ?? child?.current_color ?? "white")}
      />
    </div>
  );
}
