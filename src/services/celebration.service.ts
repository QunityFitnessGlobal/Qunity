import type { SupabaseClient } from "@supabase/supabase-js";
import { COLOR_ORDER } from "@/services/progression.service";
import { loadTipRules } from "@/services/content-cache";
import { shiftDayKey, toDayKey } from "@/services/workout-history.service";
import type { LocalizedText } from "@/lib/i18n-content";
import type { BraceletColor } from "@/lib/types";

// "רגע לחגוג" on the parent home screen: the most important happy event of
// the child's last three days, with an idea to celebrate it together. The
// texts live in parent_tip_rules (condition_params.screen = 'celebrate',
// condition_type = 'celebrate_<kind>'; short_text is the title, tip_text the
// idea); which event it is, is worked out here from the child's workouts
// and challenges. No event, no card.

export type CelebrationKind = "stage_up" | "power" | "first_workout" | "first_together" | "challenge" | "streak";

// Most important first.
const KIND_ORDER: CelebrationKind[] = ["stage_up", "power", "first_workout", "first_together", "challenge", "streak"];
export const CELEBRATION_WINDOW_DAYS = 3;
const STREAK_MILESTONES = [10, 7, 5, 3];
// Enough history to see a 10-day streak that peaked three days ago.
const LOOKBACK_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CelebrationEvent {
  kind: CelebrationKind;
  dayKey: string;
  challengeId?: string;
  days?: number;
}

export interface CelebrationSession {
  dayKey: string;
  color: BraceletColor | null;
  isReplay: boolean;
}

interface FindInput {
  sessions: CelebrationSession[];
  // Challenges the child unlocked, with the day they did.
  unlocked: { challengeId: string; dayKey: string }[];
  currentColor: BraceletColor;
  todayKey: string;
}

function latest(dayKeys: string[]): string | null {
  return dayKeys.length > 0 ? dayKeys.reduce((a, b) => (a > b ? a : b)) : null;
}

// Every event of the window, in no particular order.
export function findCelebrations({ sessions, unlocked, currentColor, todayKey }: FindInput): CelebrationEvent[] {
  const windowStart = shiftDayKey(todayKey, -CELEBRATION_WINDOW_DAYS);
  const inWindow = (dayKey: string | null): dayKey is string =>
    dayKey !== null && dayKey >= windowStart && dayKey <= todayKey;
  const events: CelebrationEvent[] = [];

  // Moving up happens on the last workout of the stage before.
  const stageIndex = COLOR_ORDER.indexOf(currentColor);
  if (stageIndex > 0) {
    const previous = COLOR_ORDER[stageIndex - 1];
    const finishedOn = latest(sessions.filter((s) => s.color === previous && !s.isReplay).map((s) => s.dayKey));
    if (inWindow(finishedOn)) events.push({ kind: "stage_up", dayKey: finishedOn });
  }

  const unlockedOn = (id: string) => unlocked.find((u) => u.challengeId === id)?.dayKey ?? null;
  const powerOn = unlockedOn(`power_${currentColor}`);
  if (inWindow(powerOn)) events.push({ kind: "power", dayKey: powerOn });
  const firstOn = unlockedOn("first_workout");
  if (inWindow(firstOn)) events.push({ kind: "first_workout", dayKey: firstOn });
  const togetherOn = unlockedOn("parent_power");
  if (inWindow(togetherOn)) events.push({ kind: "first_together", dayKey: togetherOn });

  const challenge = unlocked
    .filter((u) => (u.challengeId.startsWith("stairs_") || u.challengeId === "minutes_100") && inWindow(u.dayKey))
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey))[0];
  if (challenge) events.push({ kind: "challenge", dayKey: challenge.dayKey, challengeId: challenge.challengeId });

  // A streak still going (trained today or yesterday) that reached a
  // milestone inside the window — the biggest one it reached there.
  const days = [...new Set(sessions.map((s) => s.dayKey))].sort().reverse();
  if (days.length > 0 && days[0] >= shiftDayKey(todayKey, -1)) {
    let run = 1;
    while (run < days.length && days[run] === shiftDayKey(days[0], -run)) run++;
    const start = shiftDayKey(days[0], -(run - 1));
    for (const milestone of STREAK_MILESTONES) {
      const reachedOn = shiftDayKey(start, milestone - 1);
      if (run >= milestone && inWindow(reachedOn)) {
        events.push({ kind: "streak", dayKey: reachedOn, days: milestone });
        break;
      }
    }
  }

  return events;
}

export function pickCelebration(events: CelebrationEvent[]): CelebrationEvent | null {
  return (
    [...events].sort(
      (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || b.dayKey.localeCompare(a.dayKey),
    )[0] ?? null
  );
}

export interface Celebration {
  kind: CelebrationKind;
  // 0 = today, 1 = yesterday, and so on.
  daysAgo: number;
  title: LocalizedText;
  idea: LocalizedText;
  currentColor: BraceletColor;
  challengeTitle: LocalizedText | null;
  streakDays: number | null;
}

interface SessionRow {
  start_time: string;
  is_replay: boolean;
  workouts: { color: BraceletColor | null } | { color: BraceletColor | null }[] | null;
}

function colorOf(row: SessionRow): BraceletColor | null {
  const workout = Array.isArray(row.workouts) ? row.workouts[0] : row.workouts;
  return workout?.color ?? null;
}

// Accepts either the browser or server Supabase client.
export async function getCelebration(
  supabase: SupabaseClient,
  childId: string,
  now: Date = new Date(),
): Promise<Celebration | null> {
  const since = new Date(now.getTime() - LOOKBACK_DAYS * MS_PER_DAY).toISOString();
  const [{ data: child }, { data: sessions }, { data: unlocked }, rules] = await Promise.all([
    supabase.from("children").select("current_color").eq("id", childId).maybeSingle<{ current_color: BraceletColor }>(),
    supabase
      .from("workout_sessions")
      .select("start_time, is_replay, workouts(color)")
      .eq("child_id", childId)
      .eq("status", "completed")
      .gte("start_time", since),
    supabase.from("child_challenges").select("challenge_id, completed_at").eq("child_id", childId).gte("completed_at", since),
    loadTipRules(),
  ]);

  const currentColor = child?.current_color ?? "white";
  const todayKey = toDayKey(now);
  const event = pickCelebration(
    findCelebrations({
      sessions: ((sessions ?? []) as SessionRow[]).map((row) => ({
        dayKey: toDayKey(new Date(row.start_time)),
        color: colorOf(row),
        isReplay: row.is_replay,
      })),
      unlocked: ((unlocked ?? []) as { challenge_id: string; completed_at: string | null }[])
        .filter((row) => row.completed_at !== null)
        .map((row) => ({ challengeId: row.challenge_id, dayKey: toDayKey(new Date(row.completed_at!)) })),
      currentColor,
      todayKey,
    }),
  );
  const text = event
    ? rules.find((row) => row.condition_params?.screen === "celebrate" && row.condition_type === `celebrate_${event.kind}`)
    : null;
  if (!event || !text?.short_text) {
    return null;
  }

  const { data: challenge } = event.challengeId
    ? await supabase.from("challenges").select("title").eq("id", event.challengeId).maybeSingle<{ title: LocalizedText }>()
    : { data: null };

  const [y1, m1, d1] = todayKey.split("-").map(Number);
  const [y2, m2, d2] = event.dayKey.split("-").map(Number);
  return {
    kind: event.kind,
    daysAgo: Math.round((Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / MS_PER_DAY),
    title: text.short_text,
    idea: text.tip_text,
    currentColor,
    challengeTitle: challenge?.title ?? null,
    streakDays: event.days ?? null,
  };
}
