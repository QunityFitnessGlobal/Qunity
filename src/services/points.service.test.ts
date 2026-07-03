import { describe, expect, it } from "vitest";
import { calculateWorkoutPoints, totalPoints } from "@/services/points.service";

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
