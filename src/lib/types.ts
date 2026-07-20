import type { LocalizedText } from "@/lib/i18n-content";

export type Role = "parent" | "child";

export type Gender = "male" | "female";

export type BraceletColor = "white" | "orange" | "green" | "blue" | "purple";

export type WorkoutSessionStatus = "in_progress" | "completed" | "abandoned";

export interface User {
  id: string;
  full_name: string;
  role: Role;
  gender: Gender | null;
  preferred_language: string;
  created_at: string;
}

export interface Parent {
  id: string;
  created_at: string;
}

export interface Child {
  id: string;
  nickname: string;
  child_code: string;
  child_code_used: boolean;
  current_color: BraceletColor;
  total_points: number;
  points_in_color: number;
  workouts_completed_in_color: number;
  total_workouts_completed: number;
  code_shown_at: string | null;
  created_at: string;
}

export interface ParentChildLink {
  id: string;
  parent_id: string;
  child_id: string;
  created_at: string;
}

export interface BraceletLevel {
  color: BraceletColor;
  order_index: number;
  required_workouts: number;
  required_points: number;
  interval_rounds: number | null;
  interval_work_seconds: number | null;
  interval_rest_seconds: number | null;
}

export interface Workout {
  id: string;
  title: LocalizedText;
  description: LocalizedText | null;
  recommended_duration_minutes: number | null;
  recommended_difficulty: number | null;
  color: BraceletColor | null;
  order_in_color: number | null;
  exercise_code: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  pattern_en: string | null;
  pattern_he: string | null;
  name_he: string;
  name_en: string;
  description_he: string | null;
  difficulty_tip_he: string | null;
  image_url: string | null;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  slot_number: number;
  exercise_id: string;
}

export type JourneyStationState = "locked" | "current" | "done";

export interface JourneyStation {
  workoutId: string;
  title: LocalizedText;
  beltColor: BraceletColor;
  localNumber: number;
  globalNumber: number;
  state: JourneyStationState;
}

export interface WorkoutSession {
  id: string;
  child_id: string;
  workout_id: string | null;
  status: WorkoutSessionStatus;
  start_time: string;
  end_time: string | null;
  actual_duration_seconds: number | null;
  created_at: string;
}

export interface WorkoutResult {
  id: string;
  session_id: string;
  activity_reported: string | null;
  duration_reported_minutes: number | null;
  difficulty_reported: number | null;
  trained_longer: boolean;
  parent_trained_together: boolean;
  feeling_after: string | null;
  created_at: string;
}

export interface PointsTransaction {
  id: string;
  child_id: string;
  session_id: string | null;
  points: number;
  reason: string | null;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: LocalizedText;
  description: LocalizedText | null;
  bonus_points: number;
  condition_type: string | null;
  created_at: string;
}

export interface ChildChallenge {
  id: string;
  child_id: string;
  challenge_id: string;
  completed_at: string | null;
}

export interface ParentTipRule {
  id: string;
  principle: LocalizedText | null;
  condition_type: string | null;
  condition_params: Record<string, unknown>;
  tip_text: LocalizedText;
  priority: number;
  created_at: string;
}

export interface ParentTip {
  id: string;
  parent_id: string;
  child_id: string;
  rule_id: string | null;
  shown_at: string;
}
