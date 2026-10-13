import { describe, expect, it } from "vitest";
import { calculateProgressPercent, evaluateProgression, finishedLastStage } from "@/services/progression.service";

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

describe("finishedLastStage", () => {
  const PURPLE_LEVEL = { requiredWorkouts: 26, requiredPoints: 520 };

  it("is true once the last stage's workouts and points are both met", () => {
    expect(
      finishedLastStage({ currentColor: "purple", pointsInColor: 520, workoutsCompletedInColor: 26 }, PURPLE_LEVEL),
    ).toBe(true);
  });

  it("waits for both requirements", () => {
    expect(
      finishedLastStage({ currentColor: "purple", pointsInColor: 519, workoutsCompletedInColor: 26 }, PURPLE_LEVEL),
    ).toBe(false);
    expect(
      finishedLastStage({ currentColor: "purple", pointsInColor: 600, workoutsCompletedInColor: 25 }, PURPLE_LEVEL),
    ).toBe(false);
  });

  it("is never true before the last stage, whatever the numbers", () => {
    expect(
      finishedLastStage({ currentColor: "blue", pointsInColor: 999, workoutsCompletedInColor: 99 }, PURPLE_LEVEL),
    ).toBe(false);
  });
});

describe("calculateProgressPercent", () => {
  it("takes the slower-moving requirement, not the average", () => {
    // 100% of workouts done but only 60% of points — the level-up is still
    // blocked by points, so the bar must read 60, not the 80 an average gives.
    expect(calculateProgressPercent(120, 200, 10, 10)).toBe(60);
  });

  it("is symmetric: a points-heavy, workout-light child also reads the lower one", () => {
    expect(calculateProgressPercent(200, 200, 3, 10)).toBe(30);
  });

  it("reads 100 only once both requirements are actually met", () => {
    expect(calculateProgressPercent(200, 200, 10, 10)).toBe(100);
  });
});
