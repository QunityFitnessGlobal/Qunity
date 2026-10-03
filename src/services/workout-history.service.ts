import type { SupabaseClient } from "@supabase/supabase-js";
import { FEELING_CODES, type FeelingCode } from "@/lib/workout-labels";
import { APP_TIME_ZONE } from "@/lib/format";
import type { LocalizedText } from "@/lib/i18n-content";
import type { BraceletColor, Gender } from "@/lib/types";

// The parent's workouts screen: the child's recent workouts grouped by week,
// how they felt over the last two weeks, and one tip read off those same
// workouts. The tip texts and their order live in parent_tip_rules (rows
// whose condition_params.screen is "history", ordered by priority); which
// situations currently apply is decided here, in matchHistoryConditions.

export type HistoryCondition =
  | "history_no_workouts_14_days"
  | "history_no_workouts_7_days"
  | "history_no_workouts_3_days"
  | "history_comeback_after_hard"
  | "history_two_hard_in_a_row"
  | "history_stopped_not_returned"
  | "history_new_difficulty"
  | "history_improvement"
  | "history_trained_together_this_week"
  | "history_mostly_smiles";

export const HISTORY_WINDOW_DAYS = 14;
const RECENT_WORKOUTS_LIMIT = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FULL_COMPLETION = 100;
// "Challenging" and "very hard" on the 1–4 scale.
const HARD_DIFFICULTY = 3;
const SMILE_FEELINGS: FeelingCode[] = ["fun", "fine"];
const HARD_FEELINGS: FeelingCode[] = ["frustrated", "tired", "exhausted"];
const MIN_WORKOUTS_FOR_SMILES = 2;

export interface HistorySession {
  sessionId: string;
  workoutId: string | null;
  startTime: string;
  // Calendar day in the app's time zone, "YYYY-MM-DD".
  dayKey: string;
  // Null for sessions from before completion was tracked — read as finished.
  completionPercent: number | null;
  difficulty: number | null;
  feeling: FeelingCode | null;
  trainedTogether: boolean;
}

function isFinished(session: HistorySession): boolean {
  return session.completionPercent === null || session.completionPercent >= FULL_COMPLETION;
}

function feltHard(session: HistorySession): boolean {
  return session.feeling !== null && HARD_FEELINGS.includes(session.feeling);
}

function wasHard(session: HistorySession): boolean {
  return (
    feltHard(session) ||
    (session.difficulty !== null && session.difficulty >= HARD_DIFFICULTY) ||
    !isFinished(session)
  );
}

// Last workout against the one before it: the first measure that changed
// decides — feeling first, then how much was completed, then how hard it
// felt (easier counts as better). 1 = better, -1 = worse, 0 = no change.
function compareLastTwo(previous: HistorySession, last: HistorySession): number {
  if (previous.feeling !== null && last.feeling !== null && previous.feeling !== last.feeling) {
    // FEELING_CODES runs from best to worst.
    return FEELING_CODES.indexOf(last.feeling) < FEELING_CODES.indexOf(previous.feeling) ? 1 : -1;
  }
  if (
    previous.completionPercent !== null &&
    last.completionPercent !== null &&
    previous.completionPercent !== last.completionPercent
  ) {
    return last.completionPercent > previous.completionPercent ? 1 : -1;
  }
  if (previous.difficulty !== null && last.difficulty !== null && previous.difficulty !== last.difficulty) {
    return last.difficulty < previous.difficulty ? 1 : -1;
  }
  return 0;
}

interface MatchInput {
  // Completed workouts of the last HISTORY_WINDOW_DAYS days, oldest first.
  windowSessions: HistorySession[];
  // The most recent completed workout ever, or null if there never was one.
  lastWorkoutAt: Date | null;
  // dayKey of this week's Sunday.
  thisWeekStartKey: string;
  now: Date;
}

// Every situation that applies right now. Which one is shown is the
// highest-priority matching row in parent_tip_rules.
export function matchHistoryConditions({
  windowSessions: sessions,
  lastWorkoutAt,
  thisWeekStartKey,
  now,
}: MatchInput): Set<HistoryCondition> {
  const matches = new Set<HistoryCondition>();

  if (lastWorkoutAt === null) {
    return matches;
  }

  const daysSinceLast = Math.floor((now.getTime() - lastWorkoutAt.getTime()) / MS_PER_DAY);
  if (daysSinceLast >= 14) {
    matches.add("history_no_workouts_14_days");
  } else if (daysSinceLast >= 7) {
    matches.add("history_no_workouts_7_days");
  } else if (daysSinceLast >= 3) {
    matches.add("history_no_workouts_3_days");
  }

  for (let i = 0; i + 1 < sessions.length; i++) {
    if (wasHard(sessions[i]) && isFinished(sessions[i + 1])) {
      matches.add("history_comeback_after_hard");
    }
    if (feltHard(sessions[i]) && feltHard(sessions[i + 1])) {
      matches.add("history_two_hard_in_a_row");
    }
  }

  const stoppedAndNotReturned = sessions.some(
    (session, i) =>
      !isFinished(session) &&
      !sessions.slice(i + 1).some((later) => later.workoutId === session.workoutId && isFinished(later)),
  );
  if (stoppedAndNotReturned) {
    matches.add("history_stopped_not_returned");
  }

  if (sessions.length >= 2) {
    const change = compareLastTwo(sessions[sessions.length - 2], sessions[sessions.length - 1]);
    if (change > 0) {
      matches.add("history_improvement");
    } else if (change < 0) {
      matches.add("history_new_difficulty");
    }
  }

  if (sessions.some((s) => s.trainedTogether && s.dayKey >= thisWeekStartKey)) {
    matches.add("history_trained_together_this_week");
  }

  const smiles = sessions.filter((s) => s.feeling !== null && SMILE_FEELINGS.includes(s.feeling)).length;
  if (sessions.length >= MIN_WORKOUTS_FOR_SMILES && smiles * 2 >= sessions.length) {
    matches.add("history_mostly_smiles");
  }

  return matches;
}

// "YYYY-MM-DD" of a moment as a calendar day in the app's time zone.
export function toDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftDayKey(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// Sunday of the week the given moment falls in, as a dayKey.
export function weekStartKey(now: Date): string {
  const todayKey = toDayKey(now);
  const [year, month, day] = todayKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shiftDayKey(todayKey, -weekday);
}

export type HistoryGroup = "thisWeek" | "lastWeek" | "earlier";

export interface HistoryWorkoutEntry {
  sessionId: string;
  startTime: string;
  group: HistoryGroup;
  workoutTitle: LocalizedText | null;
  workoutColor: BraceletColor | null;
  orderInColor: number | null;
  durationSeconds: number | null;
  completionPercent: number | null;
  difficulty: number | null;
  feeling: FeelingCode | null;
  trainedTogether: boolean;
  isReplay: boolean;
}

export interface WorkoutHistory {
  childName: string;
  childGender: Gender | null;
  workouts: HistoryWorkoutEntry[];
  // The last two weeks, oldest first — only workouts the child rated.
  feelings: { sessionId: string; startTime: string; feeling: FeelingCode }[];
  tip: LocalizedText | null;
}

interface SessionRow {
  id: string;
  workout_id: string | null;
  start_time: string;
  actual_duration_seconds: number | null;
  completion_percent: number | null;
  is_replay: boolean;
  workouts:
    | { title: LocalizedText; color: BraceletColor | null; order_in_color: number | null }
    | { title: LocalizedText; color: BraceletColor | null; order_in_color: number | null }[]
    | null;
  workout_results: ResultRow[] | null;
}

interface ResultRow {
  session_id: string;
  difficulty_reported: number | string | null;
  feeling_after: string | null;
  parent_trained_together: boolean;
}

interface TipRuleRow {
  condition_type: string;
  tip_text: LocalizedText;
  priority: number;
}

const SESSION_COLUMNS =
  "id, workout_id, start_time, actual_duration_seconds, completion_percent, is_replay, workouts(title, color, order_in_color), workout_results(session_id, difficulty_reported, feeling_after, parent_trained_together)";

function toFeeling(value: string | null): FeelingCode | null {
  return value && (FEELING_CODES as readonly string[]).includes(value) ? (value as FeelingCode) : null;
}

function toDifficulty(value: number | string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function workoutOf(row: SessionRow) {
  return Array.isArray(row.workouts) ? (row.workouts[0] ?? null) : row.workouts;
}

// Accepts either the browser or server Supabase client.
export async function getWorkoutHistory(
  supabase: SupabaseClient,
  childId: string,
  now: Date = new Date(),
): Promise<WorkoutHistory | null> {
  const windowStart = new Date(now.getTime() - HISTORY_WINDOW_DAYS * MS_PER_DAY).toISOString();

  const [{ data: child }, { data: childUser }, { data: recent }, { data: windowRows }, { data: rules }] =
    await Promise.all([
      supabase.from("children").select("nickname").eq("id", childId).single<{ nickname: string }>(),
      supabase.from("users").select("gender").eq("id", childId).maybeSingle<{ gender: Gender | null }>(),
      supabase
        .from("workout_sessions")
        .select(SESSION_COLUMNS)
        .eq("child_id", childId)
        .eq("status", "completed")
        .order("start_time", { ascending: false })
        .limit(RECENT_WORKOUTS_LIMIT),
      supabase
        .from("workout_sessions")
        .select(SESSION_COLUMNS)
        .eq("child_id", childId)
        .eq("status", "completed")
        .gte("start_time", windowStart)
        .order("start_time", { ascending: true }),
      supabase
        .from("parent_tip_rules")
        .select("condition_type, tip_text, priority")
        .eq("condition_params->>screen", "history"),
    ]);

  if (!child) {
    return null;
  }

  const recentRows = (recent ?? []) as SessionRow[];
  const windowSessionRows = (windowRows ?? []) as SessionRow[];
  // Each session's questionnaire answers arrive embedded with it.
  const resultBySession = new Map(
    [...recentRows, ...windowSessionRows].flatMap((s) => (s.workout_results ?? []).map((r) => [r.session_id, r] as const)),
  );

  const toSession = (row: SessionRow): HistorySession => {
    const result = resultBySession.get(row.id);
    return {
      sessionId: row.id,
      workoutId: row.workout_id,
      startTime: row.start_time,
      dayKey: toDayKey(new Date(row.start_time)),
      completionPercent: row.completion_percent,
      difficulty: toDifficulty(result?.difficulty_reported ?? null),
      feeling: toFeeling(result?.feeling_after ?? null),
      trainedTogether: result?.parent_trained_together ?? false,
    };
  };

  const windowSessions = windowSessionRows.map(toSession);
  const thisWeekStart = weekStartKey(now);
  const lastWeekStart = shiftDayKey(thisWeekStart, -7);

  const workouts: HistoryWorkoutEntry[] = recentRows.map((row) => {
    const session = toSession(row);
    const workout = workoutOf(row);
    return {
      sessionId: row.id,
      startTime: row.start_time,
      group:
        session.dayKey >= thisWeekStart ? "thisWeek" : session.dayKey >= lastWeekStart ? "lastWeek" : "earlier",
      workoutTitle: workout?.title ?? null,
      workoutColor: workout?.color ?? null,
      orderInColor: workout?.order_in_color ?? null,
      durationSeconds: row.actual_duration_seconds,
      completionPercent: row.completion_percent,
      difficulty: session.difficulty,
      feeling: session.feeling,
      trainedTogether: session.trainedTogether,
      isReplay: row.is_replay,
    };
  });

  const matches = matchHistoryConditions({
    windowSessions,
    lastWorkoutAt: recentRows[0] ? new Date(recentRows[0].start_time) : null,
    thisWeekStartKey: thisWeekStart,
    now,
  });
  const tipRule = ((rules ?? []) as TipRuleRow[])
    .filter((rule) => matches.has(rule.condition_type as HistoryCondition))
    .sort((a, b) => b.priority - a.priority)[0];

  return {
    childName: child.nickname,
    childGender: childUser?.gender ?? null,
    workouts,
    feelings: windowSessions
      .filter((s): s is HistorySession & { feeling: FeelingCode } => s.feeling !== null)
      .map((s) => ({ sessionId: s.sessionId, startTime: s.startTime, feeling: s.feeling })),
    tip: tipRule?.tip_text ?? null,
  };
}
