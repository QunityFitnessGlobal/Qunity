import { describe, expect, it } from "vitest";
import { findCelebrations, pickCelebration, type CelebrationSession } from "@/services/celebration.service";
import { shiftDayKey } from "@/services/workout-history.service";

const TODAY = "2026-10-08";

const workout = (dayKey: string, color: CelebrationSession["color"] = "orange", isReplay = false): CelebrationSession => ({
  dayKey,
  color,
  isReplay,
});

const find = (input: Partial<Parameters<typeof findCelebrations>[0]>) =>
  findCelebrations({ sessions: [], unlocked: [], currentColor: "orange", todayKey: TODAY, ...input });

describe("findCelebrations", () => {
  it("finds moving up on the last workout of the stage before", () => {
    const events = find({ sessions: [workout("2026-10-01", "white"), workout("2026-10-06", "white")] });
    expect(events).toContainEqual({ kind: "stage_up", dayKey: "2026-10-06" });
  });

  it("ignores moving up that happened before the last three days, and replays of the old stage", () => {
    expect(find({ sessions: [workout("2026-10-04", "white")] }).map((e) => e.kind)).not.toContain("stage_up");
    const replayed = find({ sessions: [workout("2026-10-01", "white"), workout("2026-10-07", "white", true)] });
    expect(replayed.map((e) => e.kind)).not.toContain("stage_up");
  });

  it("has nothing to move up from in the first stage", () => {
    expect(find({ currentColor: "white", sessions: [workout("2026-10-07", "white")] }).map((e) => e.kind)).not.toContain(
      "stage_up",
    );
  });

  it("reads the stage's power, the first workout and the first workout together from the challenges", () => {
    const events = find({
      unlocked: [
        { challengeId: "power_orange", dayKey: "2026-10-07" },
        { challengeId: "first_workout", dayKey: "2026-10-06" },
        { challengeId: "parent_power", dayKey: "2026-10-05" },
        // Another stage's power, long ago.
        { challengeId: "power_white", dayKey: "2026-09-01" },
      ],
    });
    expect(events.map((e) => e.kind).sort()).toEqual(["first_together", "first_workout", "power"]);
  });

  it("takes the latest stairs or minutes challenge", () => {
    const events = find({
      unlocked: [
        { challengeId: "stairs_white", dayKey: "2026-10-05" },
        { challengeId: "minutes_100", dayKey: "2026-10-07" },
        { challengeId: "streak_3", dayKey: "2026-10-07" },
      ],
    });
    expect(events).toEqual([{ kind: "challenge", dayKey: "2026-10-07", challengeId: "minutes_100" }]);
  });

  it("celebrates the biggest streak milestone reached in the window", () => {
    const days = ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"].map((d) => workout(d));
    expect(find({ sessions: days })).toContainEqual({ kind: "streak", dayKey: "2026-10-08", days: 5 });
  });

  it("doesn't celebrate a streak that has stopped, or a milestone from long ago", () => {
    const stopped = ["2026-10-03", "2026-10-04", "2026-10-05"].map((d) => workout(d));
    expect(find({ sessions: stopped }).map((e) => e.kind)).not.toContain("streak");
    // A 15-day streak up to today passed 10 days five days ago.
    const long = Array.from({ length: 15 }, (_, i) => workout(shiftDayKey(TODAY, -i)));
    expect(find({ sessions: long }).map((e) => e.kind)).not.toContain("streak");
  });
});

describe("pickCelebration", () => {
  it("shows the most important event, then the most recent", () => {
    expect(
      pickCelebration([
        { kind: "streak", dayKey: "2026-10-08", days: 3 },
        { kind: "power", dayKey: "2026-10-06" },
        { kind: "stage_up", dayKey: "2026-10-05" },
      ])?.kind,
    ).toBe("stage_up");
    expect(
      pickCelebration([
        { kind: "challenge", dayKey: "2026-10-05", challengeId: "a" },
        { kind: "challenge", dayKey: "2026-10-07", challengeId: "b" },
      ])?.challengeId,
    ).toBe("b");
  });

  it("is nothing when nothing happened", () => {
    expect(pickCelebration([])).toBeNull();
  });
});
