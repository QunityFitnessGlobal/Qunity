import { describe, expect, it } from "vitest";
import { channelOf } from "@/lib/acquisition";
import {
  activityView,
  challengesView,
  familiesView,
  familyStatus,
  funnelView,
  parentsView,
  plainTipText,
  progressView,
  qualityView,
  type AdminDataset,
  type AdminFilters,
} from "@/lib/admin/metrics";

const NOW = new Date("2026-10-10T12:00:00Z");
const daysAgo = (n: number, hour = 9) => new Date(NOW.getTime() - n * 86_400_000 + (hour - 12) * 3_600_000).toISOString();

// Three families: Michal (facebook, two kids, active), Ron (whatsapp, one kid
// who never trained) and a test family (an admin's own).
function dataset(): AdminDataset {
  return {
    now: NOW,
    users: [
      { id: "p1", email: "michal@example.com", createdAt: daysAgo(9), lastSignInAt: daysAgo(1), source: "facebook" },
      { id: "p2", email: "ron@example.com", createdAt: daysAgo(3), lastSignInAt: daysAgo(3), source: "WhatsApp" },
      { id: "p3", email: "admin@example.com", createdAt: daysAgo(20), lastSignInAt: daysAgo(0), source: null },
      { id: "c1", email: null, createdAt: daysAgo(9), lastSignInAt: daysAgo(0), source: null },
      { id: "c2", email: null, createdAt: daysAgo(8), lastSignInAt: daysAgo(2), source: null },
      { id: "c3", email: null, createdAt: daysAgo(3), lastSignInAt: null, source: null },
      { id: "c4", email: null, createdAt: daysAgo(20), lastSignInAt: daysAgo(0), source: null },
    ],
    profiles: [
      { id: "p1", fullName: "מיכל כהן" },
      { id: "p2", fullName: "רון" },
      { id: "p3", fullName: "מנהל" },
    ],
    parents: [
      { id: "p1", createdAt: daysAgo(9) },
      { id: "p2", createdAt: daysAgo(3) },
      { id: "p3", createdAt: daysAgo(20) },
    ],
    children: [
      { id: "c1", nickname: "נועה", currentColor: "orange", pointsInColor: 40, workoutsCompletedInColor: 1, totalPoints: 330, createdAt: daysAgo(9) },
      { id: "c2", nickname: "איתי", currentColor: "white", pointsInColor: 250, workoutsCompletedInColor: 10, totalPoints: 250, createdAt: daysAgo(8) },
      { id: "c3", nickname: "עומר", currentColor: "white", pointsInColor: 0, workoutsCompletedInColor: 0, totalPoints: 0, createdAt: daysAgo(3) },
      { id: "c4", nickname: "בדיקה", currentColor: "white", pointsInColor: 0, workoutsCompletedInColor: 0, totalPoints: 0, createdAt: daysAgo(20) },
    ],
    links: [
      { parentId: "p1", childId: "c1" },
      { parentId: "p1", childId: "c2" },
      { parentId: "p2", childId: "c3" },
      { parentId: "p3", childId: "c4" },
    ],
    levels: [
      { color: "white", orderIndex: 1, requiredWorkouts: 10, requiredPoints: 300 },
      { color: "orange", orderIndex: 2, requiredWorkouts: 14, requiredPoints: 420 },
    ],
    workouts: [
      { id: "w1", color: "white", orderInColor: 1, title: "הכיסא והקיר" },
      { id: "w2", color: "orange", orderInColor: 1, title: "ההקפצות והגיבור" },
    ],
    sessions: [
      // Noa: white on days 8 and 6, then orange on day 2.
      { id: "s1", childId: "c1", workoutId: "w1", status: "completed", startTime: daysAgo(8), seconds: 240, completionPercent: 100 },
      { id: "s2", childId: "c1", workoutId: "w1", status: "completed", startTime: daysAgo(6), seconds: 200, completionPercent: 83 },
      { id: "s3", childId: "c1", workoutId: "w2", status: "completed", startTime: daysAgo(2), seconds: 480, completionPercent: 100 },
      // Itai: one white workout and one he left.
      { id: "s4", childId: "c2", workoutId: "w1", status: "completed", startTime: daysAgo(1), seconds: 100, completionPercent: 41 },
      { id: "s5", childId: "c2", workoutId: "w1", status: "in_progress", startTime: daysAgo(1), seconds: null, completionPercent: null },
      // The test child.
      { id: "s6", childId: "c4", workoutId: "w1", status: "completed", startTime: daysAgo(1), seconds: 240, completionPercent: 100 },
    ],
    results: [
      { sessionId: "s1", difficulty: 1, feeling: "fun", parentTogether: true },
      { sessionId: "s2", difficulty: 2, feeling: "tired", parentTogether: false },
      { sessionId: "s3", difficulty: 3, feeling: "fun", parentTogether: true },
      { sessionId: "s4", difficulty: 2, feeling: "exhausted", parentTogether: false },
    ],
    challenges: [
      { id: "first_workout", title: "האימון הראשון", bonusPoints: 20, conditionType: "first_workout", challengeType: "condition", unlockColor: null, minSeconds: null },
      { id: "power_orange", title: "קבלת כוח ההתמדה", bonusPoints: 10, conditionType: "power_orange", challengeType: "condition", unlockColor: null, minSeconds: null },
      { id: "stairs_white", title: "100 מדרגות", bonusPoints: 15, conditionType: null, challengeType: "repeatable_workout", unlockColor: "white", minSeconds: 20 },
    ],
    childChallenges: [
      { childId: "c1", challengeId: "first_workout", completedAt: daysAgo(8) },
      { childId: "c1", challengeId: "power_orange", completedAt: daysAgo(2) },
      { childId: "c1", challengeId: "stairs_white", completedAt: daysAgo(2) },
      { childId: "c2", challengeId: "first_workout", completedAt: daysAgo(1) },
    ],
    challengeSessions: [
      { childId: "c1", challengeId: "stairs_white", status: "completed", startTime: daysAgo(1), seconds: 14, points: 0 },
      { childId: "c1", challengeId: "stairs_white", status: "completed", startTime: daysAgo(0), seconds: 100, points: 15 },
    ],
    tips: [
      { likeCount: 5, text: "ראיתי שלא ויתרת, זה כוח רצון." },
      { likeCount: 0, text: "לא נבחר" },
    ],
    questions: [
      { text: "אפשר שני אימונים ביום?", matched: false, rejected: false, createdAt: daysAgo(2) },
      { text: "אפשר  שני אימונים ביום? ", matched: false, rejected: false, createdAt: daysAgo(1) },
      { text: "הילד בוכה", matched: true, rejected: true, createdAt: daysAgo(1) },
      { text: "איך מתחילים?", matched: true, rejected: false, createdAt: daysAgo(1) },
    ],
    visits: [
      { createdAt: daysAgo(9), source: "facebook" },
      { createdAt: daysAgo(9), source: "m.facebook.com" },
      { createdAt: daysAgo(3), source: "whatsapp" },
      { createdAt: daysAgo(40), source: "facebook" },
    ],
    testEmails: ["admin@example.com"],
    pilotStart: null,
  };
}

const F30: AdminFilters = { range: "30", source: "all", includeTests: false };

describe("admin dashboard metrics", () => {
  it("groups raw sources into channels", () => {
    expect(channelOf("m.facebook.com")).toBe("facebook");
    expect(channelOf("WhatsApp")).toBe("whatsapp");
    expect(channelOf(null)).toBe("direct");
    expect(channelOf("newsletter")).toBe("other");
  });

  it("builds the family funnel without test families", () => {
    const v = funnelView(dataset(), F30);
    expect(v.steps.map((s) => s.value)).toEqual([2, 2, 1, 1, 1]);
    expect(v.visits).toBe(3);
    expect(v.childNeverEntered).toBe(1);
    expect(v.noChild).toBe(0);
    const facebook = v.channels.find((c) => c.channel === "facebook")!;
    expect(facebook).toMatchObject({ visits: 2, signups: 1, firstWorkout: 1, conversion: 50 });
  });

  it("filters by channel and can include test families", () => {
    expect(funnelView(dataset(), { ...F30, source: "whatsapp" }).steps[0].value).toBe(1);
    expect(funnelView(dataset(), { ...F30, includeTests: true }).steps[0].value).toBe(3);
  });

  it("counts activity in the period and against the one before", () => {
    const v = activityView(dataset(), { ...F30, range: "7" });
    expect(v.kpis[1]).toMatchObject({ label: "ילדים שהתאמנו", value: "2" });
    expect(v.kpis[2].value).toBe("3");
    expect(v.daily).toHaveLength(14);
    expect(v.daily.reduce((n, d) => n + d.value, 0)).toBe(4);
    expect(v.perKid[0].value + v.perKid[1].value).toBe(2);
  });

  it("splits how workouts ended per stage", () => {
    const v = qualityView(dataset(), F30);
    const white = v.stages.find((s) => s.color === "white")!;
    // s1 100%, s2 83%, s4 41%, s5 left unfinished.
    expect(white.total).toBe(4);
    expect(white.parts).toEqual([25, 25, 25, 25]);
    expect(v.tired.find((t) => t.color === "white")!.value).toBe(67);
    expect(v.problems[0]).toMatchObject({ title: "הכיסא והקיר", starts: 4, abandonPct: 25, level: "critical" });
  });

  it("finds stage spans and children stuck on points", () => {
    const v = progressView(dataset(), F30);
    expect(v.kidsInProgram).toBe(2);
    expect(v.daysPerStage.find((s) => s.color === "white")!.avg).toBe(3);
    expect(v.stuck).toEqual([{ name: "איתי", color: "white", workouts: "10/10", points: "250/300", missing: 50, extra: 0 }]);
  });

  it("counts challenges and the stair runs' points", () => {
    const v = challengesView(dataset(), F30);
    expect(v.once.find((c) => c.title === "האימון הראשון")!.pct).toBe(100);
    expect(v.stairs[0]).toMatchObject({ unlocked: 1, runs: 2, zeroPct: 50, avgPoints: 7.5 });
    expect(v.histogram!.zero).toBe(1);
    expect(v.histogram!.buckets.at(-1)).toEqual({ label: "15", value: 1 });
  });

  it("groups the parents' unanswered questions", () => {
    const v = parentsView(dataset(), F30);
    expect(v.questions).toBe(4);
    expect(v.matchedPct).toBe(50);
    expect(v.open[0]).toMatchObject({ count: 2, status: "none" });
    expect(v.open[1]).toMatchObject({ text: "הילד בוכה", status: "wrong" });
    expect(v.topTips).toEqual([{ text: "ראיתי שלא ויתרת, זה כוח רצון.", likes: 5 }]);
  });

  it("lists families with their status and a timeline", () => {
    const v = familiesView(dataset(), F30, "all", "p1");
    expect(v.counts).toMatchObject({ all: 2, active: 1, new: 1 });
    expect(v.rows[0]).toMatchObject({ parentName: "מיכל", workouts: 4, status: "active", ago: "אתמול" });
    expect(v.rows[1]).toMatchObject({ parentName: "רון", status: "new", ago: "הילד לא נכנס" });
    expect(v.selected!.timeline[0].text).toContain("איתי");
    expect(v.selected!.timeline.some((e) => e.text === "נועה · שלב חדש: כתום")).toBe(true);
    expect(familiesView(dataset(), F30, "new", null).rows.map((r) => r.parentName)).toEqual(["רון"]);
  });

  it("sorts a family by days since the last workout", () => {
    expect(familyStatus(null, NOW)).toBe("new");
    expect(familyStatus(daysAgo(6), NOW)).toBe("active");
    expect(familyStatus(daysAgo(10), NOW)).toBe("risk");
    expect(familyStatus(daysAgo(20), NOW)).toBe("inactive");
  });

  it("keeps the gender-neutral branch of a tip", () => {
    expect(plainTipText("{gender, select, female {את ממשיכה} other {אתה ממשיך}}")).toBe("אתה ממשיך");
    expect(plainTipText("טקסט רגיל")).toBe("טקסט רגיל");
  });
});
