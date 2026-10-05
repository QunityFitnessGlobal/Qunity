import { describe, expect, it } from "vitest";
import { pickPractice, type PracticeRule } from "@/services/parent-growth.service";
import { badgeStates, parentStage } from "@/lib/parent-journey";

const TODAY = "2026-10-05";
const FEEL = "מותר להרגיש הכל";
const ROAD = "פוקוס על הדרך";

const rule = (id: string, principle: string): PracticeRule => ({ id, principle, tipText: { he: id } });
const rules = [rule("f1", FEEL), rule("f2", FEEL), rule("f3", FEEL), rule("r1", ROAD), rule("r2", ROAD)];
const pick = (input: Partial<Parameters<typeof pickPractice>[0]>) =>
  pickPractice({ rules, countsBefore: {}, saidDays: new Map(), excluded: new Set(), todayKey: TODAY, ...input });

describe("parentStage", () => {
  it("climbs 5, 8, 12, 16 and 20 moments per stage", () => {
    expect(parentStage(0)).toEqual({ stage: 1, inStage: 0, stageSize: 5, finalStage: false });
    expect(parentStage(4)).toMatchObject({ stage: 1, inStage: 4 });
    expect(parentStage(5)).toMatchObject({ stage: 2, inStage: 0, stageSize: 8 });
    expect(parentStage(13)).toMatchObject({ stage: 3, inStage: 0, stageSize: 12 });
    expect(parentStage(60)).toMatchObject({ stage: 5, inStage: 19, stageSize: 20, finalStage: false });
  });

  it("counts rounds of 20 after the last stage", () => {
    expect(parentStage(61)).toEqual({ stage: 5, inStage: 0, stageSize: 20, finalStage: true });
    expect(parentStage(95)).toMatchObject({ stage: 5, inStage: 14, finalStage: true });
  });
});

describe("badgeStates", () => {
  it("opens a principle's badge at 3 moments and lists earned badges first", () => {
    const states = badgeStates({ [ROAD]: 3, [FEEL]: 2 });
    expect(states[0]).toMatchObject({ badge: "encouraging", earned: true, count: 3 });
    expect(states.find((s) => s.badge === "listening")).toMatchObject({ earned: false, count: 2 });
    expect(states).toHaveLength(5);
  });
});

describe("pickPractice", () => {
  it("practices the principle with the fewest moments", () => {
    expect(pick({ countsBefore: { [FEEL]: 4, [ROAD]: 1 } })?.principle).not.toBe(FEEL);
    const onlyTwo = pick({ rules: rules, countsBefore: { [FEEL]: 0, [ROAD]: 3, "מסגרת מעצימה": 9, "אמונה משחררת": 9, "דוגמא אישית והכוונה": 9 } });
    expect(onlyTwo?.principle).toBe(FEEL);
  });

  it("is the same all day and moves on another day", () => {
    const counts = { [FEEL]: 0, [ROAD]: 5, "מסגרת מעצימה": 5, "אמונה משחררת": 5, "דוגמא אישית והכוונה": 5 };
    const first = (todayKey: string) => pick({ countsBefore: counts, todayKey })?.tips[0].id;
    expect(first(TODAY)).toBe(first(TODAY));
    expect(new Set([first("2026-10-05"), first("2026-10-06"), first("2026-10-07")]).size).toBe(3);
  });

  it("keeps a sentence tried today first, marked, and rests ones from the past two weeks", () => {
    const counts = { [FEEL]: 0, [ROAD]: 5, "מסגרת מעצימה": 5, "אמונה משחררת": 5, "דוגמא אישית והכוונה": 5 };
    const saidDays = new Map([
      ["f2", [TODAY]],
      ["f3", ["2026-09-28"]],
    ]);
    const choice = pick({ countsBefore: counts, saidDays });
    expect(choice?.tips.map((t) => [t.id, t.saidToday])).toEqual([
      ["f2", true],
      ["f1", false],
    ]);
  });

  it("leaves out the home screen's sentences, and falls to the next principle when one has none left", () => {
    const counts = { [FEEL]: 0, [ROAD]: 1, "מסגרת מעצימה": 5, "אמונה משחררת": 5, "דוגמא אישית והכוונה": 5 };
    const choice = pick({ countsBefore: counts, excluded: new Set(["f1", "f2", "f3"]) });
    expect(choice?.principle).toBe(ROAD);
  });

  it("is nothing when there is nothing left to practice", () => {
    expect(pick({ rules: [] })).toBeNull();
  });
});
