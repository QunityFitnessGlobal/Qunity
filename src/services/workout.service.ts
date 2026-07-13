import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { calculateWorkoutPoints, awardPoints } from "@/services/points.service";
import { checkColorProgression } from "@/services/progression.service";
import { checkAndAwardChallenges, unlockColorChallenge } from "@/services/challenge.service";
import type { ChallengeDefinition } from "@/data/challenges.data";
import type { BraceletColor, Exercise, Workout } from "@/lib/types";

export interface NextWorkoutInfo {
  workout: Workout;
  workoutIndex: number;
  requiredWorkouts: number;
  currentColor: BraceletColor;
}

interface ChildProgressRow {
  current_color: BraceletColor;
  workouts_completed_in_color: number;
}

// Accepts either the browser or server Supabase client (see linking.service.ts).
export async function getNextWorkout(
  supabase: SupabaseClient,
  childId: string,
): Promise<NextWorkoutInfo | null> {
  const { data: child } = await supabase
    .from("children")
    .select("current_color, workouts_completed_in_color")
    .eq("id", childId)
    .single<ChildProgressRow>();

  if (!child) {
    return null;
  }

  const { data: level } = await supabase
    .from("bracelet_levels")
    .select("required_workouts")
    .eq("color", child.current_color)
    .single<{ required_workouts: number }>();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("color", child.current_color)
    .order("order_in_color", { ascending: true });

  if (!workouts || workouts.length === 0) {
    return null;
  }

  // Only a handful of sample workouts exist per color while required_workouts
  // is much larger, so the same workouts repeat in order until the child has
  // completed enough of them to level up.
  const workout = workouts[child.workouts_completed_in_color % workouts.length] as Workout;

  return {
    workout,
    workoutIndex: child.workouts_completed_in_color + 1,
    requiredWorkouts: level?.required_workouts ?? 0,
    currentColor: child.current_color,
  };
}

export interface WorkoutExerciseEntry {
  slotNumber: number;
  exercise: Exercise;
}

interface WorkoutExerciseRow {
  slot_number: number;
  exercises: Exercise | Exercise[] | null;
}

// Accepts either the browser or server Supabase client (see linking.service.ts).
export async function getWorkoutExercises(
  supabase: SupabaseClient,
  workoutId: string,
): Promise<WorkoutExerciseEntry[]> {
  const { data } = await supabase
    .from("workout_exercises")
    .select("slot_number, exercises(*)")
    .eq("workout_id", workoutId)
    .order("slot_number", { ascending: true });

  const rows = (data ?? []) as WorkoutExerciseRow[];

  return rows
    .map((row) => ({
      slotNumber: row.slot_number,
      exercise: Array.isArray(row.exercises) ? row.exercises[0] : row.exercises,
    }))
    .filter((row): row is WorkoutExerciseEntry => row.exercise != null);
}

// Accepts either the browser or server Supabase client (see linking.service.ts).
export async function getWorkoutsCompletedThisMonth(
  supabase: SupabaseClient,
  childId: string,
): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .eq("status", "completed")
    .gte("start_time", startOfMonth);

  return count ?? 0;
}

export async function startWorkoutSession(childId: string, workoutId: string): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      child_id: childId,
      workout_id: workoutId,
      status: "in_progress",
      start_time: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to start workout session");
  }

  return data.id;
}

export async function finishWorkoutSession(
  sessionId: string,
  actualDurationSeconds: number,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("workout_sessions")
    .update({
      end_time: new Date().toISOString(),
      actual_duration_seconds: actualDurationSeconds,
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}

export interface WorkoutQuestionnaireAnswers {
  activityReported: string;
  difficultyReported: number;
  parentTrainedTogether: boolean;
  feelingAfter: string;
}

export interface CompleteWorkoutResult {
  pointsAwarded: number;
  didLevelUp: boolean;
  newColor?: BraceletColor;
  newChallenges: ChallengeDefinition[];
  unlockedChallenge: ChallengeDefinition | null;
}

export async function completeWorkout(params: {
  childId: string;
  sessionId: string;
  recommendedDifficulty: number;
  recommendedDurationMinutes: number;
  actualDurationSeconds: number;
  answers: WorkoutQuestionnaireAnswers;
}): Promise<CompleteWorkoutResult> {
  const {
    childId,
    sessionId,
    recommendedDifficulty,
    recommendedDurationMinutes,
    actualDurationSeconds,
    answers,
  } = params;
  const supabase = createClient();

  const actualDurationMinutes = Math.round(actualDurationSeconds / 60);
  // Derived from the timer rather than asked, so it can't be misreported.
  const trainedLonger = actualDurationMinutes > recommendedDurationMinutes;

  const { error: resultError } = await supabase.from("workout_results").insert({
    session_id: sessionId,
    activity_reported: answers.activityReported,
    duration_reported_minutes: actualDurationMinutes,
    difficulty_reported: answers.difficultyReported,
    trained_longer: trainedLonger,
    parent_trained_together: answers.parentTrainedTogether,
    feeling_after: answers.feelingAfter,
  });
  if (resultError) {
    throw new Error(resultError.message);
  }

  const { error: statusError } = await supabase
    .from("workout_sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);
  if (statusError) {
    throw new Error(statusError.message);
  }

  const { data: childBefore } = await supabase
    .from("children")
    .select("workouts_completed_in_color")
    .eq("id", childId)
    .single<{ workouts_completed_in_color: number }>();

  const isFirstWorkoutInColor = (childBefore?.workouts_completed_in_color ?? 0) === 0;

  // Atomic increment via RPC — see points.service.ts for why this can't be a
  // JS read-then-write.
  const { error: incrementError } = await supabase.rpc("increment_child_workout_counts", {
    p_child_id: childId,
  });
  if (incrementError) {
    throw new Error(incrementError.message);
  }

  const breakdown = calculateWorkoutPoints({
    trainedLonger,
    difficultyReported: answers.difficultyReported,
    recommendedDifficulty,
    parentTrainedTogether: answers.parentTrainedTogether,
    isFirstWorkoutInColor,
  });
  const pointsAwarded = await awardPoints(childId, sessionId, breakdown);

  // Progression must be checked before challenges: the "color_finisher"
  // challenge depends on knowing whether this session triggered a level-up.
  const progression = await checkColorProgression(childId);

  const newChallenges = await checkAndAwardChallenges(childId, {
    sessionId,
    parentTrainedTogether: answers.parentTrainedTogether,
    isFirstWorkoutInColor,
    didLevelUpThisSession: progression.didLevelUp,
  });

  // Repeatable ("type B") challenge tied to the color just finished — separate
  // from checkAndAwardChallenges above since it unlocks rather than completes.
  const unlockedChallenge = progression.completedColor
    ? await unlockColorChallenge(supabase, childId, progression.completedColor)
    : null;

  return {
    pointsAwarded,
    didLevelUp: progression.didLevelUp,
    newColor: progression.newColor,
    newChallenges,
    unlockedChallenge,
  };
}
