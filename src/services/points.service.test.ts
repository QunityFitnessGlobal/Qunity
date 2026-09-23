import { describe, expect, it } from "vitest";
import {
  calculateCompletionPercent,
  calculateWorkoutPoints,
  meetsCompletionThreshold,
  scaleBreakdown,
  totalPoints,
} from "@/services/points.service";

describe("calculateWorkoutPoints", () => {
  it("awards only the base points when no bonuses apply", () => {
    const breakdown = calculateWorkoutPoints({
      trainedLonger: false,
      difficultyReported: 2,
      recommendedDifficulty: 2,
      parentTrainedTogether: false,
      isFirstWorkoutInColor: false,
    });

    expect(breakdown).toEqual([{ points: 20, reason: "base_workout" }]);
    expect(totalPoints(breakdown)).toBe(20);
  });

  it("awards every bonus when all conditions are met", () => {
    const breakdown = calculateWorkoutPoints({
      trainedLonger: true,
      difficultyReported: 4,
      recommendedDifficulty: 2,
      parentTrainedTogether: true,
      isFirstWorkoutInColor: true,
    });

    expect(breakdown).toHaveLength(5);
    expect(totalPoints(breakdown)).toBe(20 + 5 + 5 + 10 + 10);
  });

  it("awards only the bonuses whose conditions are met", () => {
    const breakdown = calculateWorkoutPoints({
      trainedLonger: false,
      difficultyReported: 2,
      recommendedDifficulty: 2,
      parentTrainedTogether: true,
      isFirstWorkoutInColor: false,
    });

    expect(totalPoints(breakdown)).toBe(20 + 10);
    expect(breakdown.map((b) => b.reason)).toEqual(["base_workout", "parent_together"]);
  });

  it("does not award the difficulty bonus when reported difficulty is lower than recommended", () => {
    const breakdown = calculateWorkoutPoints({
      trainedLonger: false,
      difficultyReported: 1,
      recommendedDifficulty: 3,
      parentTrainedTogether: false,
      isFirstWorkoutInColor: false,
    });

    expect(totalPoints(breakdown)).toBe(20);
  });
});

describe("calculateCompletionPercent", () => {
  it("returns the share of planned time done, rounded down", () => {
    expect(calculateCompletionPercent(150, 240)).toBe(62);
    expect(calculateCompletionPercent(239, 240)).toBe(99);
  });

  it("caps at 100 and floors at 0", () => {
    expect(calculateCompletionPercent(300, 240)).toBe(100);
    expect(calculateCompletionPercent(-5, 240)).toBe(0);
  });

  it("treats a workout with nothing planned as complete", () => {
    expect(calculateCompletionPercent(10, 0)).toBe(100);
  });
});

describe("meetsCompletionThreshold", () => {
  it("passes at exactly 60 and above, fails below", () => {
    expect(meetsCompletionThreshold(60)).toBe(true);
    expect(meetsCompletionThreshold(59)).toBe(false);
    expect(meetsCompletionThreshold(100)).toBe(true);
  });
});

describe("scaleBreakdown", () => {
  const breakdown = [
    { points: 20, reason: "base_workout" },
    { points: 5, reason: "trained_longer" },
    { points: 5, reason: "harder_than_recommended" },
    { points: 10, reason: "parent_together" },
    { points: 10, reason: "first_in_color" },
  ];

  it("returns the breakdown unchanged at 100%", () => {
    expect(scaleBreakdown(breakdown, 100)).toEqual(breakdown);
  });

  it("scales the total to exactly the given share (100 points at 70% -> 70)", () => {
    const hundred = [
      { points: 60, reason: "a" },
      { points: 25, reason: "b" },
      { points: 15, reason: "c" },
    ];
    expect(totalPoints(scaleBreakdown(hundred, 70))).toBe(70);
    expect(totalPoints(scaleBreakdown(hundred, 86))).toBe(86);
  });

  it("keeps the rows summing to the rounded total even when rows are fractional", () => {
    // 50 points at 70% = 35, but each row rounded alone would give 36.
    expect(totalPoints(scaleBreakdown(breakdown, 70))).toBe(35);
    expect(totalPoints(scaleBreakdown(breakdown, 61))).toBe(Math.round((50 * 61) / 100));
  });

  it("returns no rows at 0%", () => {
    expect(scaleBreakdown(breakdown, 0)).toEqual([]);
  });
});
