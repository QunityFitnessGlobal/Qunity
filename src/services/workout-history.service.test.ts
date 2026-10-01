import { describe, expect, it } from "vitest";
import {
  matchHistoryConditions,
  toDayKey,
  weekStartKey,
  type HistorySession,
} from "@/services/workout-history.service";

const NOW = new Date("2026-10-01T12:00:00Z"); // a Thursday
const DAY = 24 * 60 * 60 * 1000;

let counter = 0;
function session(daysAgo: number, overrides: Partial<HistorySession> = {}): HistorySession {
  const start = new Date(NOW.getTime() - daysAgo * DAY);
  counter += 1;
  return {
    sessionId: `s${counter}`,
    workoutId: `w${counter}`,
    startTime: start.toISOString(),
    dayKey: toDayKey(start),
    completionPercent: 100,
    difficulty: 2,
    feeling: "fine",
    trainedTogether: false,
    ...overrides,
  };
}

function match(sessions: HistorySession[], lastWorkoutDaysAgo?: number) {
  const last = sessions.at(-1);
  return matchHistoryConditions({
    windowSessions: sessions,
    lastWorkoutAt:
      lastWorkoutDaysAgo !== undefined
        ? new Date(NOW.getTime() - lastWorkoutDaysAgo * DAY)
        : last
          ? new Date(last.startTime)
          : null,
    thisWeekStartKey: weekStartKey(NOW),
    now: NOW,
  });
}

describe("matchHistoryConditions", () => {
  it("matches nothing for a child who never trained", () => {
    expect(match([]).size).toBe(0);
  });

  it("picks exactly one no-workouts band by days since the last workout", () => {
    expect(match([], 2).has("history_no_workouts_3_days")).toBe(false);
    expect(match([], 3).has("history_no_workouts_3_days")).toBe(true);
    expect(match([], 7)).toEqual(new Set(["history_no_workouts_7_days"]));
    expect(match([], 20)).toEqual(new Set(["history_no_workouts_14_days"]));
  });

  it("sees a comeback when a hard workout is followed by a finished one", () => {
    const result = match([session(5, { feeling: "frustrated" }), session(2)]);
    expect(result.has("history_comeback_after_hard")).toBe(true);
  });

  it("counts an unfinished workout as hard for the comeback", () => {
    const result = match([session(5, { completionPercent: 70 }), session(2)]);
    expect(result.has("history_comeback_after_hard")).toBe(true);
  });

  it("sees two hard workouts in a row only from the feeling", () => {
    expect(match([session(4, { feeling: "tired" }), session(1, { feeling: "exhausted" })]).has("history_two_hard_in_a_row")).toBe(true);
    expect(match([session(4, { difficulty: 4 }), session(1, { difficulty: 4 })]).has("history_two_hard_in_a_row")).toBe(false);
  });

  it("sees a stopped workout until the same workout is finished later", () => {
    const stopped = session(6, { workoutId: "w-a", completionPercent: 40 });
    expect(match([stopped, session(1)]).has("history_stopped_not_returned")).toBe(true);
    expect(match([stopped, session(1, { workoutId: "w-a" })]).has("history_stopped_not_returned")).toBe(false);
  });

  it("lets the feeling decide improvement before percent and difficulty", () => {
    const result = match([
      session(4, { feeling: "tired", completionPercent: 100 }),
      session(1, { feeling: "fun", completionPercent: 80 }),
    ]);
    expect(result.has("history_improvement")).toBe(true);
    expect(result.has("history_new_difficulty")).toBe(false);
  });

  it("falls back to percent, then to an easier difficulty", () => {
    expect(match([session(4, { completionPercent: 100 }), session(1, { completionPercent: 70 })]).has("history_new_difficulty")).toBe(true);
    expect(match([session(4, { difficulty: 3 }), session(1, { difficulty: 2 })]).has("history_improvement")).toBe(true);
  });

  it("matches neither improvement nor difficulty when nothing changed", () => {
    const result = match([session(4), session(1)]);
    expect(result.has("history_improvement")).toBe(false);
    expect(result.has("history_new_difficulty")).toBe(false);
  });

  it("sees training together only since this week's Sunday", () => {
    // NOW is Thursday; Sunday was 4 days ago.
    expect(match([session(3, { trainedTogether: true })]).has("history_trained_together_this_week")).toBe(true);
    expect(match([session(6, { trainedTogether: true })]).has("history_trained_together_this_week")).toBe(false);
  });

  it("needs at least two workouts with half or more smiling", () => {
    expect(match([session(1, { feeling: "fun" })]).has("history_mostly_smiles")).toBe(false);
    expect(match([session(4, { feeling: "fun" }), session(1, { feeling: "tired" })]).has("history_mostly_smiles")).toBe(true);
    expect(
      match([session(5, { feeling: "tired" }), session(4, { feeling: "tired" }), session(1, { feeling: "fun" })]).has(
        "history_mostly_smiles",
      ),
    ).toBe(false);
  });
});

describe("weekStartKey", () => {
  it("returns the Sunday of the week in the app's time zone", () => {
    expect(weekStartKey(NOW)).toBe("2026-09-27");
    // Saturday 23:30 UTC is already Sunday in Israel — a new week.
    expect(weekStartKey(new Date("2026-10-03T22:30:00Z"))).toBe("2026-10-04");
  });
});
