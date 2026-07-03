import { describe, expect, it } from "vitest";
import { evaluateProgression } from "@/services/progression.service";

const WHITE_LEVEL = { requiredWorkouts: 10, requiredPoints: 200 };

describe("evaluateProgression", () => {
  it("does not level up when neither workouts nor points are enough", () => {
    const result = evaluateProgression(
      { currentColor: "white", pointsInColor: 50, workoutsCompletedInColor: 3 },
      WHITE_LEVEL,
    );

    expect(result).toEqual({ didLevelUp: false, nextColor: null });
  });

  it("does not level up when only points are enough", () => {
    const result = evaluateProgression(
      { currentColor: "white", pointsInColor: 250, workoutsCompletedInColor: 3 },
      WHITE_LEVEL,
    );

    expect(result.didLevelUp).toBe(false);
  });

  it("does not level up when only workouts are enough", () => {
    const result = evaluateProgression(
      { currentColor: "white", pointsInColor: 50, workoutsCompletedInColor: 12 },
      WHITE_LEVEL,
    );

    expect(result.didLevelUp).toBe(false);
  });

  it("levels up to the next color when both requirements are met", () => {
    const result = evaluateProgression(
      { currentColor: "white", pointsInColor: 250, workoutsCompletedInColor: 12 },
      WHITE_LEVEL,
    );

    expect(result).toEqual({ didLevelUp: true, nextColor: "orange" });
  });

  it("does not level up past the last color even if requirements are met", () => {
    const result = evaluateProgression(
      { currentColor: "purple", pointsInColor: 600, workoutsCompletedInColor: 30 },
      { requiredWorkouts: 26, requiredPoints: 520 },
    );

    expect(result).toEqual({ didLevelUp: false, nextColor: null });
  });
});
