import { describe, expect, it } from "vitest";
import { passwordStrength } from "@/lib/password";

describe("passwordStrength", () => {
  it("is 0 when nothing is typed", () => {
    expect(passwordStrength("")).toBe(0);
  });

  it("is 1 below the minimum length", () => {
    expect(passwordStrength("ab12")).toBe(1);
  });

  it("is 2 once long enough", () => {
    expect(passwordStrength("abcdef")).toBe(2);
    expect(passwordStrength("abcdefgh")).toBe(2);
  });

  it("is 3 for 8+ characters mixing letters with digits or symbols", () => {
    expect(passwordStrength("Kayak-26")).toBe(3);
    expect(passwordStrength("קיאק2026")).toBe(3);
  });
});
