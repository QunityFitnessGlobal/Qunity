import { describe, expect, it } from "vitest";
import { buildChildWeek } from "@/services/child-week.service";

// Thursday 8 October 2026, midday in Israel.
const NOW = new Date("2026-10-08T09:00:00Z");

describe("buildChildWeek", () => {
  it("lays out Sunday to Saturday with today and the days still ahead", () => {
    const week = buildChildWeek([], NOW);
    expect(week.days.map((d) => d.dayKey)).toEqual([
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
    ]);
    expect(week.days.map((d) => d.isToday)).toEqual([false, false, false, false, true, false, false]);
    expect(week.days.map((d) => d.isFuture)).toEqual([false, false, false, false, false, true, true]);
  });

  it("marks the days trained, and trained together", () => {
    const week = buildChildWeek(
      [
        { dayKey: "2026-10-04", trainedTogether: true },
        { dayKey: "2026-10-06", trainedTogether: false },
        { dayKey: "2026-10-06", trainedTogether: false },
      ],
      NOW,
    );
    expect(week.days.map((d) => d.trained)).toEqual([true, false, true, false, false, false, false]);
    expect(week.days.map((d) => d.together)).toEqual([true, false, false, false, false, false, false]);
  });

  it("counts this week's workouts against last week's", () => {
    const week = buildChildWeek(
      [
        { dayKey: "2026-09-27", trainedTogether: false },
        { dayKey: "2026-10-03", trainedTogether: false },
        { dayKey: "2026-10-04", trainedTogether: false },
        { dayKey: "2026-10-06", trainedTogether: false },
        { dayKey: "2026-10-07", trainedTogether: false },
        // Two weeks ago: neither week.
        { dayKey: "2026-09-26", trainedTogether: false },
      ],
      NOW,
    );
    expect(week.thisWeekCount).toBe(3);
    expect(week.lastWeekCount).toBe(2);
  });
});
