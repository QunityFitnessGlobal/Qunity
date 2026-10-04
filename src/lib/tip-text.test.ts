import { describe, expect, it } from "vitest";
import { splitExample, splitTipParts } from "@/lib/tip-text";

describe("splitTipParts", () => {
  it("keeps a plain tip whole", () => {
    expect(splitTipParts("כבר 3 ימים שהילד לא התאמן.")).toEqual([{ label: null, text: "כבר 3 ימים שהילד לא התאמן." }]);
  });

  it("splits the four headed parts in order", () => {
    const parts = splitTipParts(
      'מה קורה כאן: הילד חושש. מה לא לעשות: אל תקטינו. מה כן לעשות: הביעו אמונה. משפט לדוגמה: "אני מאמינה בך." (מחזק אמונה.)',
    );
    expect(parts.map((p) => p.label)).toEqual(["מה קורה כאן", "מה לא לעשות", "מה כן לעשות", "משפט לדוגמה"]);
    expect(parts[1].text).toBe("אל תקטינו.");
  });

  it("handles a tip that is only an example sentence", () => {
    expect(splitTipParts('משפט לדוגמה: "יפה שחזרת."')).toEqual([{ label: "משפט לדוגמה", text: '"יפה שחזרת."' }]);
  });
});

describe("splitExample", () => {
  it("separates the sentence from why it works", () => {
    expect(splitExample('"אני מאמינה בך." (מחזק אמונה.)')).toEqual({ quote: "אני מאמינה בך.", why: "מחזק אמונה." });
  });

  it("works without an explanation", () => {
    expect(splitExample('"יפה שחזרת."')).toEqual({ quote: "יפה שחזרת.", why: null });
  });
});
