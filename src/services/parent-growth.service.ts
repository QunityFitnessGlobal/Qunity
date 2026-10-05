import type { SupabaseClient } from "@supabase/supabase-js";
import { getTodaysTips } from "@/services/today-tips.service";
import { shiftDayKey, toDayKey } from "@/services/workout-history.service";
import { PRINCIPLE_BADGES } from "@/lib/parent-journey";
import type { LocalizedText } from "@/lib/i18n-content";

// The empowerment screen: the parent's moments so far (for the ring and the
// badges, see lib/parent-journey.ts) and "רגע של העצמה", a sentence to
// practice. The sentence comes from the principle the parent has practiced
// least, so the card nudges toward the badges still closed; it isn't one
// marked in the past two weeks or one on the home screen today, and it stays
// the same all day. "לא מתאים עכשיו" moves to the next one of that principle.

const PRACTICE_PAUSE_DAYS = 14;
const PRACTICE_CHOICES = 6;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PracticeRule {
  id: string;
  principle: string;
  tipText: LocalizedText;
}

interface PickInput {
  rules: PracticeRule[];
  // Moments per principle before today, all children.
  countsBefore: Record<string, number>;
  // dayKeys on which each rule was marked for this child.
  saidDays: Map<string, string[]>;
  // Rules on the home screen today.
  excluded: Set<string>;
  todayKey: string;
}

export interface PracticeChoice {
  principle: string;
  tips: (PracticeRule & { saidToday: boolean })[];
}

function dayNumber(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function rotate<T>(items: T[], by: number): T[] {
  if (items.length === 0) return items;
  const start = by % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

export function pickPractice({ rules, countsBefore, saidDays, excluded, todayKey }: PickInput): PracticeChoice | null {
  const day = dayNumber(todayKey);
  const pauseStart = shiftDayKey(todayKey, -PRACTICE_PAUSE_DAYS);
  // Least practiced first; a tie goes to a different principle each day.
  const order = PRINCIPLE_BADGES.map(({ principle }, i) => ({ principle, i }))
    .sort(
      (a, b) =>
        (countsBefore[a.principle] ?? 0) - (countsBefore[b.principle] ?? 0) ||
        ((a.i - day) % 5 + 5) % 5 - ((b.i - day) % 5 + 5) % 5,
    )
    .map((p) => p.principle);

  for (const principle of order) {
    const own = rules
      .filter((rule) => rule.principle === principle && !excluded.has(rule.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    const saidToday = own.filter((rule) => saidDays.get(rule.id)?.includes(todayKey));
    const fresh = own.filter(
      (rule) =>
        !saidToday.includes(rule) && !(saidDays.get(rule.id) ?? []).some((d) => d >= pauseStart && d < todayKey),
    );
    if (saidToday.length + fresh.length > 0) {
      return {
        principle,
        tips: [
          ...saidToday.map((rule) => ({ ...rule, saidToday: true })),
          ...rotate(fresh, day).map((rule) => ({ ...rule, saidToday: false })),
        ].slice(0, PRACTICE_CHOICES),
      };
    }
  }
  return null;
}

export interface ParentGrowth {
  totalMoments: number;
  // All moments so far per principle, all children.
  countsByPrinciple: Record<string, number>;
  practice: PracticeChoice | null;
}

interface MomentRow {
  child_id: string;
  rule_id: string | null;
  said_at: string;
}

interface RuleRow {
  id: string;
  principle: LocalizedText | null;
  tip_text: LocalizedText;
}

export async function getParentGrowth(
  supabase: SupabaseClient,
  parentId: string,
  childId: string,
  now: Date = new Date(),
): Promise<ParentGrowth> {
  const [{ data: moments }, { data: rules }, today] = await Promise.all([
    supabase.from("parent_tip_moments").select("child_id, rule_id, said_at").eq("parent_id", parentId),
    supabase.from("parent_tip_rules").select("id, principle, tip_text"),
    getTodaysTips(supabase, parentId, childId, now),
  ]);

  const todayKey = toDayKey(now);
  const ruleRows = (rules ?? []) as RuleRow[];
  const principleOf = new Map(ruleRows.map((rule) => [rule.id, rule.principle?.he ?? null]));
  const momentRows = (moments ?? []) as MomentRow[];

  const countsByPrinciple: Record<string, number> = {};
  const countsBefore: Record<string, number> = {};
  const saidDays = new Map<string, string[]>();
  for (const moment of momentRows) {
    const principle = moment.rule_id ? principleOf.get(moment.rule_id) : null;
    const dayKey = toDayKey(new Date(moment.said_at));
    if (principle) {
      countsByPrinciple[principle] = (countsByPrinciple[principle] ?? 0) + 1;
      if (dayKey < todayKey) countsBefore[principle] = (countsBefore[principle] ?? 0) + 1;
    }
    if (moment.rule_id && moment.child_id === childId) {
      saidDays.set(moment.rule_id, [...(saidDays.get(moment.rule_id) ?? []), dayKey]);
    }
  }

  // Any tip with an example sentence to say can be practiced.
  const practiceRules: PracticeRule[] = ruleRows
    .filter((rule) => rule.principle?.he && rule.tip_text?.he?.includes("משפט לדוגמה"))
    .map((rule) => ({ id: rule.id, principle: rule.principle!.he, tipText: rule.tip_text }));

  return {
    totalMoments: momentRows.length,
    countsByPrinciple,
    practice: pickPractice({
      rules: practiceRules,
      countsBefore,
      saidDays,
      excluded: new Set(today.tips.map((tip) => tip.ruleId)),
      todayKey,
    }),
  };
}
