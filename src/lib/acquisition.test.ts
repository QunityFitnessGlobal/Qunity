import { describe, expect, it } from "vitest";
import { acquisitionFromLanding, shouldReplaceAcquisition } from "@/lib/acquisition";

describe("acquisition", () => {
  it("reads the utm parameters, lower-cased", () => {
    const a = acquisitionFromLanding(new URL("https://qunity.app/?utm_source=Facebook&utm_medium=paid&utm_campaign=Pilot"), "");
    expect(a).toEqual({ source: "facebook", medium: "paid", campaign: "pilot", referrer: null });
  });

  it("falls back to the referring site, but not our own", () => {
    expect(acquisitionFromLanding(new URL("https://qunity.app/"), "https://l.facebook.com/x").source).toBe("l.facebook.com");
    expect(acquisitionFromLanding(new URL("https://qunity.app/signup"), "https://www.qunity.app/").source).toBe("direct");
  });

  it("lets a real source replace a stored direct visit, never the other way", () => {
    const direct = { source: "direct", medium: null, campaign: null, referrer: null };
    const facebook = { source: "facebook", medium: null, campaign: null, referrer: null };
    expect(shouldReplaceAcquisition(null, direct)).toBe(true);
    expect(shouldReplaceAcquisition(direct, facebook)).toBe(true);
    expect(shouldReplaceAcquisition(facebook, direct)).toBe(false);
    expect(shouldReplaceAcquisition(facebook, { ...facebook, source: "instagram" })).toBe(false);
  });
});
