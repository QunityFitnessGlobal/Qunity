export type EncouragementKey = "zero" | "low" | "mid" | "high";

// Which message bucket applies is business logic (kept here, testable);
// the actual text lives in the "encouragement" message namespace so the
// caller can translate it — see dashboard/page.tsx.
export function getEncouragementKey(workoutsThisMonth: number): EncouragementKey {
  if (workoutsThisMonth === 0) {
    return "zero";
  }
  if (workoutsThisMonth < 4) {
    return "low";
  }
  if (workoutsThisMonth < 10) {
    return "mid";
  }
  return "high";
}
