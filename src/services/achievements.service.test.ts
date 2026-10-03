import { describe, expect, it } from "vitest";
import { collectedCount, longestStreakDays, powerSlots } from "@/services/achievements.service";

const day = (iso: string) => new Date(`${iso}T10:00:00Z`);

describe("longestStreakDays", () => {
  it("is 0 with no workouts", () => {
    expect(longestStreakDays([])).toBe(0);
  });

  it("counts a day once however many workouts it had", () => {
    expect(longestStreakDays([day("2026-09-01"), day("2026-09-01")])).toBe(1);
  });

  it("finds the longest run anywhere, not just the latest", () => {
    const dates = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-10", "2026-09-11"].map(day);
    expect(longestStreakDays(dates)).toBe(4);
  });

  it("doesn't care about the order of the dates", () => {
    const dates = ["2026-09-11", "2026-09-01", "2026-09-10", "2026-09-02"].map(day);
    expect(longestStreakDays(dates)).toBe(2);
  });
});

describe("powerSlots", () => {
  it("collects earlier stages and the current one once revealed", () => {
    const slots = powerSlots("green", true);
    expect(slots.map((s) => s.state)).toEqual(["earned", "earned", "current", "locked", "locked"]);
    expect(collectedCount(slots)).toBe(3);
  });

  it("doesn't count the current power before it's revealed", () => {
    const slots = powerSlots("orange", false);
    expect(slots.map((s) => s.state)).toEqual(["earned", "waiting", "locked", "locked", "locked"]);
    expect(collectedCount(slots)).toBe(1);
  });

  it("starts with nothing collected on the first stage", () => {
    expect(collectedCount(powerSlots("white", false))).toBe(0);
  });
});
