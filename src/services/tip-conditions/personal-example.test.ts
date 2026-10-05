import { describe, expect, it } from "vitest";
import { parentNeverTrainedTogether, parentParticipationBelowThreshold } from "@/services/tip-conditions/personal-example";
import type { ChildTipSnapshot } from "@/services/tip-conditions/types";

const snapshot = (over: Partial<ChildTipSnapshot>) => ({ totalSessions: 10, parentTogetherCount: 0, everTrainedTogether: false, ...over }) as ChildTipSnapshot;

describe("parentNeverTrainedTogether", () => {
  it("looks at the whole history, not only the recent sessions", () => {
    expect(parentNeverTrainedTogether(snapshot({}))).toBe(true);
    // Trained together long ago: none in the recent sessions, but not "never".
    expect(parentNeverTrainedTogether(snapshot({ everTrainedTogether: true }))).toBe(false);
    expect(parentNeverTrainedTogether(snapshot({ totalSessions: 0 }))).toBe(false);
  });
});

describe("parentParticipationBelowThreshold", () => {
  it("measures the recent sessions", () => {
    expect(parentParticipationBelowThreshold(snapshot({ parentTogetherCount: 0, everTrainedTogether: true }), {})).toBe(true);
    expect(parentParticipationBelowThreshold(snapshot({ parentTogetherCount: 2 }), {})).toBe(false);
  });
});
