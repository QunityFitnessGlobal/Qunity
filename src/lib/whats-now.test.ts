import { describe, expect, it } from "vitest";
import { matchSituation, searchSituations, withChildName, withoutNames, type ChatTip } from "@/lib/whats-now";

const tip = (ruleId: string, group: number, label: string, keywords: string[]): ChatTip => ({
  ruleId,
  group,
  label,
  principle: "",
  principleLabel: "",
  what: null,
  dont: null,
  doText: null,
  quote: "",
  why: null,
  keywords,
  quick: null,
});

const tips = [
  tip("nofun", 1, "\"לא בא לי\"", ["לא בא", "אין לה כוח", "לא רוצה"]),
  tip("cant", 2, "\"אני לא יכולה\"", ["לא יכול", "קשה לה"]),
  tip("cry", 3, "בוכה", ["בוכ", "בכי"]),
  tip("argue", 1, "לא מפסיקה להתווכח", ["לא מפסיקה להתווכח"]),
];

describe("matchSituation", () => {
  it("finds the situation a parent describes", () => {
    expect(matchSituation("היא אומרת שאין לה כוח היום", tips)?.ruleId).toBe("nofun");
    expect(matchSituation("היא בוכה", tips)?.ruleId).toBe("cry");
  });

  it("prefers the longest keyword found", () => {
    expect(matchSituation("היא בוכה ולא מפסיקה", tips)?.ruleId).toBe("cry");
    expect(matchSituation("לא מפסיקה להתווכח איתי", tips)?.ruleId).toBe("argue");
  });

  it("matches nothing for unrelated text", () => {
    expect(matchSituation("מה שלומך", tips)).toBeNull();
  });
});

describe("searchSituations", () => {
  it("narrows by group and by what's typed", () => {
    expect(searchSituations(tips, "", 0)).toHaveLength(4);
    expect(searchSituations(tips, "", 1).map((t) => t.ruleId)).toEqual(["nofun", "argue"]);
    expect(searchSituations(tips, "בוכה", 0).map((t) => t.ruleId)).toEqual(["cry"]);
    expect(searchSituations(tips, "לא רוצה להתאמן", 0).map((t) => t.ruleId)).toEqual(["nofun"]);
    expect(searchSituations(tips, "בוכה", 1)).toEqual([]);
  });
});

describe("withoutNames", () => {
  it("takes the child's and parent's names out", () => {
    expect(withoutNames(" נועה בוכה ודנה לא יודעת מה לעשות ", ["נועה", "דנה"])).toBe(
      "[שם] בוכה ו[שם] לא יודעת מה לעשות",
    );
    expect(withoutNames("היא בוכה", [null, ""])).toBe("היא בוכה");
  });
});

describe("withChildName", () => {
  it("puts the child's name where the tip says הילד/הילדה", () => {
    expect(withChildName("הילדה לא מתנגדת, פשוט לא רוצה להתחיל.", "נועה")).toBe("נועה לא מתנגדת, פשוט לא רוצה להתחיל.");
    expect(withChildName("הילד חסר ביטחון כרגע.", "איתי")).toBe("איתי חסר ביטחון כרגע.");
    expect(withChildName("עבר שבוע בלי אימון.", "נועה")).toBe("עבר שבוע בלי אימון.");
  });
});
