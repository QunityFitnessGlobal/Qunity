import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  calculateCompletionPercent,
  calculateWorkoutPoints,
  awardPoints,
  meetsCompletionThreshold,
  scaleBreakdown,
} from "@/services/points.service";
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

export interface StartWorkoutSessionOptions {
  // Position within the workout's color (the journey map's local number).
  stationNumber: number;
  // A repeat of an already-passed station: never advances color progress.
  isReplay: boolean;
}

export async function startWorkoutSession(
  childId: string,
  workoutId: string,
  options: StartWorkoutSessionOptions,
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      child_id: childId,
      workout_id: workoutId,
      status: "in_progress",
      start_time: new Date().toISOString(),
      station_number: options.stationNumber,
      is_replay: options.isReplay,
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
  // Share of the planned time actually done (0-100) and whether this was a
  // repeat of an already-passed station; the result screen explains the
  // points with these.
  completionPercent: number;
  isReplay: boolean;
  didLevelUp: boolean;
  newColor?: BraceletColor;
  newChallenges: ChallengeDefinition[];
  unlockedChallenge: ChallengeDefinition | null;
}

// The best "paid" completion a station has had so far: sessions that passed
// the threshold count at their percent, sessions below it count as 0 (they
// earned nothing), and sessions from before completion_percent existed count
// as 100. A replay only earns points for what it adds on top of this.
async function getPaidBestPercent(
  supabase: ReturnType<typeof createClient>,
  childId: string,
  beltColor: BraceletColor,
  stationNumber: number,
  excludeSessionId: string,
): Promise<number> {
  const { data } = await supabase
    .from("workout_sessions")
    .select("completion_percent, workouts!inner(color)")
    .eq("child_id", childId)
    .eq("status", "completed")
    .eq("station_number", stationNumber)
    .eq("workouts.color", beltColor)
    .neq("id", excludeSessionId);

  return ((data ?? []) as { completion_percent: number | null }[]).reduce((best, row) => {
    const percent = row.completion_percent ?? 100;
    return Math.max(best, meetsCompletionThreshold(percent) ? percent : 0);
  }, 0);
}

export async function completeWorkout(params: {
  childId: string;
  sessionId: string;
  beltColor: BraceletColor;
  stationNumber: number;
  isReplay: boolean;
  recommendedDifficulty: number;
  recommendedDurationMinutes: number;
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  answers: WorkoutQuestionnaireAnswers;
}): Promise<CompleteWorkoutResult> {
  const {
    childId,
    sessionId,
    beltColor,
    stationNumber,
    isReplay,
    recommendedDifficulty,
    recommendedDurationMinutes,
    plannedDurationSeconds,
    actualDurationSeconds,
    answers,
  } = params;
  const supabase = createClient();

  const actualDurationMinutes = Math.round(actualDurationSeconds / 60);
  // Derived from the timer rather than asked, so it can't be misreported.
  const trainedLonger = actualDurationMinutes > recommendedDurationMinutes;
  const completionPercent = calculateCompletionPercent(actualDurationSeconds, plannedDurationSeconds);
  const passedThreshold = meetsCompletionThreshold(completionPercent);

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

  // Below the threshold the workout still counts as completed (and advances
  // the color) — it just pays no points; the questionnaire is asked either way.
  const { error: statusError } = await supabase
    .from("workout_sessions")
    .update({ status: "completed", completion_percent: completionPercent })
    .eq("id", sessionId);
  if (statusError) {
    throw new Error(statusError.message);
  }

  let isFirstWorkoutInColor = false;
  if (isReplay) {
    // A repeat is a real workout for the parent's totals, but never moves the
    // color's progress counter.
    const { error: incrementError } = await supabase.rpc("increment_child_total_workouts_only", {
      p_child_id: childId,
    });
    if (incrementError) {
      throw new Error(incrementError.message);
    }
  } else {
    const { data: childBefore } = await supabase
      .from("children")
      .select("workouts_completed_in_color")
      .eq("id", childId)
      .single<{ workouts_completed_in_color: number }>();

    isFirstWorkoutInColor = (childBefore?.workouts_completed_in_color ?? 0) === 0;

    // Atomic increment via RPC — see points.service.ts for why this can't be a
    // JS read-then-write.
    const { error: incrementError } = await supabase.rpc("increment_child_workout_counts", {
      p_child_id: childId,
    });
    if (incrementError) {
      throw new Error(incrementError.message);
    }
  }

  const breakdown = calculateWorkoutPoints({
    trainedLonger,
    difficultyReported: answers.difficultyReported,
    recommendedDifficulty,
    parentTrainedTogether: answers.parentTrainedTogether,
    isFirstWorkoutInColor,
  });

  // Regular workout: the completion percent of the full value. Replay: only
  // the part above what the station has already paid out, so repeating an
  // already-full station is free practice.
  let payablePercent = passedThreshold ? completionPercent : 0;
  if (isReplay && payablePercent > 0) {
    const paidBest = await getPaidBestPercent(supabase, childId, beltColor, stationNumber, sessionId);
    payablePercent = Math.max(0, payablePercent - paidBest);
  }
  const scaledBreakdown = scaleBreakdown(breakdown, payablePercent);
  const pointsAwarded =
    scaledBreakdown.length > 0
      ? await awardPoints(childId, sessionId, scaledBreakdown, { countTowardColor: !isReplay })
      : 0;

  if (isReplay) {
    const newChallenges = await checkAndAwardChallenges(childId, {
      sessionId,
      parentTrainedTogether: answers.parentTrainedTogether,
      didLevelUpThisSession: false,
    });
    return {
      pointsAwarded,
      completionPercent,
      isReplay,
      didLevelUp: false,
      newChallenges,
      unlockedChallenge: null,
    };
  }

  // Progression must be checked before challenges: the "color_finisher"
  // challenge depends on knowing whether this session triggered a level-up.
  const progression = await checkColorProgression(childId);

  const newChallenges = await checkAndAwardChallenges(childId, {
    sessionId,
    parentTrainedTogether: answers.parentTrainedTogether,
    didLevelUpThisSession: progression.didLevelUp,
  });

  // Repeatable ("type B") challenge tied to the color just finished — separate
  // from checkAndAwardChallenges above since it unlocks rather than completes.
  const unlockedChallenge = progression.completedColor
    ? await unlockColorChallenge(supabase, childId, progression.completedColor)
    : null;

  return {
    pointsAwarded,
    completionPercent,
    isReplay,
    didLevelUp: progression.didLevelUp,
    newColor: progression.newColor,
    newChallenges,
    unlockedChallenge,
  };
}
