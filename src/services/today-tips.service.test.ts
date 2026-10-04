import { describe, expect, it } from "vitest";
import { pickTodaysTips, reasonValuesFor, type ShortTipRule } from "@/services/today-tips.service";
import type { ChildTipSnapshot } from "@/services/tip-conditions";

const rule = (id: string, conditionType: string, priority: number): ShortTipRule => ({
  id,
  conditionType,
  priority,
  principle: null,
  shortText: { he: id },
  reasonText: { he: conditionType },
});

const TODAY = "2026-10-05";

describe("pickTodaysTips", () => {
  it("takes the three most important conditions", () => {
    const matching = [rule("a", "c1", 2), rule("b", "c2", 9), rule("c", "c3", 5), rule("d", "c4", 7)];
    const picked = pickTodaysTips({ matching, saidDays: new Map(), todayKey: TODAY });
    expect(picked.map((p) => p.id)).toEqual(["b", "d", "c"]);
  });

  it("gives tips that share a condition one slot between them", () => {
    const matching = [rule("a", "hard", 7), rule("b", "hard", 7), rule("c", "hard", 7), rule("d", "streak", 5)];
    const picked = pickTodaysTips({ matching, saidDays: new Map(), todayKey: TODAY });
    expect(picked).toHaveLength(2);
    expect(picked.filter((p) => p.conditionType === "hard")).toHaveLength(1);
  });

  it("rotates the shared slot from day to day, and keeps it for the whole day", () => {
    const matching = [rule("a", "hard", 7), rule("b", "hard", 7), rule("c", "hard", 7)];
    const on = (todayKey: string) => pickTodaysTips({ matching, saidDays: new Map(), todayKey })[0].id;
    expect(on("2026-10-05")).toBe(on("2026-10-05"));
    expect(new Set([on("2026-10-05"), on("2026-10-06"), on("2026-10-07")]).size).toBe(3);
  });

  it("keeps a sentence said today, marked as said", () => {
    const matching = [rule("a", "hard", 7), rule("b", "hard", 7)];
    const picked = pickTodaysTips({ matching, saidDays: new Map([["b", [TODAY]]]), todayKey: TODAY });
    expect(picked).toEqual([expect.objectContaining({ id: "b", saidToday: true })]);
  });

  it("doesn't offer a sentence said in the past week, but does after it", () => {
    const matching = [rule("a", "streak", 5)];
    const saidOn = (day: string) => new Map([["a", [day]]]);
    expect(pickTodaysTips({ matching, saidDays: saidOn("2026-09-30"), todayKey: TODAY })).toEqual([]);
    expect(pickTodaysTips({ matching, saidDays: saidOn("2026-09-27"), todayKey: TODAY })).toHaveLength(1);
  });

  it("offers another sentence of the same condition while one rests", () => {
    const matching = [rule("a", "hard", 7), rule("b", "hard", 7)];
    const picked = pickTodaysTips({ matching, saidDays: new Map([["a", ["2026-10-03"]]]), todayKey: TODAY });
    expect(picked.map((p) => [p.id, p.saidToday])).toEqual([["b", false]]);
  });
});

describe("reasonValuesFor", () => {
  const snapshot = {
    consecutiveStreakDays: 4,
    gapBeforeLastWorkoutDays: 6,
    daysSinceLastWorkout: 3,
    workoutsThisMonth: 9,
    totalWorkoutsCompleted: 18,
  } as ChildTipSnapshot;

  it("gives each condition the number its line mentions", () => {
    expect(reasonValuesFor("consecutive_day_streak", snapshot)).toEqual({ days: 4 });
    expect(reasonValuesFor("comeback_after_break", snapshot)).toEqual({ days: 6 });
    expect(reasonValuesFor("no_workout_7_days", snapshot)).toEqual({ days: 3 });
    expect(reasonValuesFor("consistent_monthly_activity", snapshot)).toEqual({ count: 9 });
    expect(reasonValuesFor("high_total_effort_reminder", snapshot)).toEqual({ count: 18 });
    expect(reasonValuesFor("feeling_tired_last_session", snapshot)).toEqual({});
  });
});
