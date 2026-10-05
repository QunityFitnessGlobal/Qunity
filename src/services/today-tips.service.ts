import type { SupabaseClient } from "@supabase/supabase-js";
import { buildChildTipSnapshot } from "@/services/tips.service";
import { TIP_CONDITION_REGISTRY, type ChildTipSnapshot } from "@/services/tip-conditions";
import { loadTipRules } from "@/services/content-cache";
import { shiftDayKey, toDayKey } from "@/services/workout-history.service";
import type { LocalizedText } from "@/lib/i18n-content";

// "משפט להגיד היום" on the parent home screen: up to three short sentences a
// day, each with a "כי…" line saying why it shows. They come from the
// auto-evaluated tips that have a short version (parent_tip_rules.short_text
// and reason_text). When "אמרתי!" is tapped a row is added to
// parent_tip_moments: the sentence stays marked as done for the rest of the
// day and isn't offered again for a week.

export const TIPS_PER_DAY = 3;
const SAID_PAUSE_DAYS = 7;
// Covers both this month's count and the week of said sentences.
const MOMENTS_LOOKBACK_DAYS = 35;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface TodayTip {
  ruleId: string;
  principle: LocalizedText | null;
  shortText: LocalizedText;
  reasonText: LocalizedText;
  // Numbers for the "כי…" line: {days} and {count}.
  reasonValues: Record<string, number>;
  saidToday: boolean;
}

export interface TodayTips {
  tips: TodayTip[];
  // This parent's moments this month, across all their children.
  momentsThisMonth: number;
}

export interface ShortTipRule {
  id: string;
  conditionType: string;
  priority: number;
  principle: LocalizedText | null;
  shortText: LocalizedText;
  reasonText: LocalizedText;
}

interface PickInput {
  // Rules whose condition currently applies.
  matching: ShortTipRule[];
  // dayKeys on which this parent said each rule for this child, recent ones.
  saidDays: Map<string, string[]>;
  todayKey: string;
}

function dayNumber(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

// Which sentences show today, in order. Tips that share a condition share
// their "כי…" line, so each condition gets one slot: the sentence said today
// if there is one, otherwise one not said in the past week, rotating day by
// day. The most important conditions come first. The same data gives the
// same answer all day, so the order doesn't jump around between visits.
export function pickTodaysTips({ matching, saidDays, todayKey }: PickInput): (ShortTipRule & { saidToday: boolean })[] {
  const pauseStart = shiftDayKey(todayKey, -SAID_PAUSE_DAYS);
  const byCondition = new Map<string, ShortTipRule[]>();
  for (const rule of matching) {
    byCondition.set(rule.conditionType, [...(byCondition.get(rule.conditionType) ?? []), rule]);
  }

  const picked: (ShortTipRule & { saidToday: boolean })[] = [];
  for (const rules of byCondition.values()) {
    const sorted = [...rules].sort((a, b) => a.id.localeCompare(b.id));
    const saidToday = sorted.find((rule) => saidDays.get(rule.id)?.includes(todayKey));
    if (saidToday) {
      picked.push({ ...saidToday, saidToday: true });
      continue;
    }
    const fresh = sorted.filter(
      (rule) => !(saidDays.get(rule.id) ?? []).some((day) => day >= pauseStart && day < todayKey),
    );
    if (fresh.length > 0) {
      picked.push({ ...fresh[dayNumber(todayKey) % fresh.length], saidToday: false });
    }
  }

  return picked
    .sort((a, b) => b.priority - a.priority || a.conditionType.localeCompare(b.conditionType))
    .slice(0, TIPS_PER_DAY);
}

// The number a condition's "כי…" line mentions, if any.
export function reasonValuesFor(conditionType: string, snapshot: ChildTipSnapshot): Record<string, number> {
  switch (conditionType) {
    case "consecutive_day_streak":
      return { days: snapshot.consecutiveStreakDays };
    case "comeback_after_break":
      return { days: snapshot.gapBeforeLastWorkoutDays ?? 0 };
    case "no_workout_3_days":
    case "no_workout_7_days":
      return { days: snapshot.daysSinceLastWorkout ?? 0 };
    case "consistent_monthly_activity":
      return { count: snapshot.workoutsThisMonth };
    case "high_total_effort_reminder":
      return { count: snapshot.totalWorkoutsCompleted };
    default:
      return {};
  }
}

interface MomentRow {
  child_id: string;
  rule_id: string | null;
  said_at: string;
}

export async function getTodaysTips(
  supabase: SupabaseClient,
  parentId: string,
  childId: string,
  now: Date = new Date(),
): Promise<TodayTips> {
  const [snapshot, rules, { data: moments }] = await Promise.all([
    buildChildTipSnapshot(supabase, childId),
    loadTipRules(),
    supabase
      .from("parent_tip_moments")
      .select("child_id, rule_id, said_at")
      .eq("parent_id", parentId)
      .gte("said_at", new Date(now.getTime() - MOMENTS_LOOKBACK_DAYS * MS_PER_DAY).toISOString()),
  ]);

  const todayKey = toDayKey(now);
  const monthPrefix = todayKey.slice(0, 7);
  const momentRows = (moments ?? []) as MomentRow[];

  const saidDays = new Map<string, string[]>();
  for (const moment of momentRows) {
    if (moment.child_id !== childId || !moment.rule_id) continue;
    saidDays.set(moment.rule_id, [...(saidDays.get(moment.rule_id) ?? []), toDayKey(new Date(moment.said_at))]);
  }

  const matching: ShortTipRule[] = rules
    .filter((rule) => rule.short_text && rule.reason_text)
    .filter((rule) => TIP_CONDITION_REGISTRY[rule.condition_type]?.(snapshot, rule.condition_params ?? {}))
    .map((rule) => ({
      id: rule.id,
      conditionType: rule.condition_type,
      priority: rule.priority,
      principle: rule.principle,
      shortText: rule.short_text!,
      reasonText: rule.reason_text!,
    }));

  return {
    tips: pickTodaysTips({ matching, saidDays, todayKey }).map((rule) => ({
      ruleId: rule.id,
      principle: rule.principle,
      shortText: rule.shortText,
      reasonText: rule.reasonText,
      reasonValues: reasonValuesFor(rule.conditionType, snapshot),
      saidToday: rule.saidToday,
    })),
    momentsThisMonth: momentRows.filter((m) => toDayKey(new Date(m.said_at)).startsWith(monthPrefix)).length,
  };
}
