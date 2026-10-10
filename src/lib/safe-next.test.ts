import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-next";

describe("safeNextPath", () => {
  it("keeps a path inside the app", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/admin/families?status=risk")).toBe("/admin/families?status=risk");
  });

  it("refuses anything that could leave the app or loop", () => {
    for (const bad of [null, "", "admin", "https://evil.com", "//evil.com", "/\\evil.com", "/login", "/login?next=/admin"]) {
      expect(safeNextPath(bad)).toBeNull();
    }
  });
});
