// The parent's empowerment journey on the empowerment screen: every moment
// a parent marks ("אמרתי!" on the home screen, "ניסיתי את זה" here) counts
// toward their stage, and toward the badge of the tip's principle. Pure, so
// the screen can update the ring and badges the moment one is marked.

// Moments needed for each stage, in order (5, then 8 more, and so on).
export const PARENT_STAGE_SIZES = [5, 8, 12, 16, 20];
// After the last stage the ring keeps filling in rounds of this size.
export const PARENT_ROUND_SIZE = 20;
// Moments of one principle that open its badge.
export const BADGE_THRESHOLD = 3;

export interface ParentStage {
  // 1-based, at most PARENT_STAGE_SIZES.length.
  stage: number;
  // Moments collected toward the next stage (or round), and how many it takes.
  inStage: number;
  stageSize: number;
  // True once every stage is done and the ring counts rounds.
  finalStage: boolean;
}

export function parentStage(totalMoments: number): ParentStage {
  let left = Math.max(0, totalMoments);
  for (let i = 0; i < PARENT_STAGE_SIZES.length; i++) {
    if (left < PARENT_STAGE_SIZES[i]) {
      return { stage: i + 1, inStage: left, stageSize: PARENT_STAGE_SIZES[i], finalStage: false };
    }
    left -= PARENT_STAGE_SIZES[i];
  }
  return {
    stage: PARENT_STAGE_SIZES.length,
    inStage: left % PARENT_ROUND_SIZE,
    stageSize: PARENT_ROUND_SIZE,
    finalStage: true,
  };
}

// The five principles every tip belongs to, as stored in
// parent_tip_rules.principle.he, each with its badge.
export const PRINCIPLE_BADGES = [
  { principle: "מותר להרגיש הכל", badge: "listening" },
  { principle: "פוקוס על הדרך", badge: "encouraging" },
  { principle: "מסגרת מעצימה", badge: "consistent" },
  { principle: "אמונה משחררת", badge: "believing" },
  { principle: "דוגמא אישית והכוונה", badge: "partner" },
] as const;

export type BadgeKey = (typeof PRINCIPLE_BADGES)[number]["badge"];

export interface BadgeState {
  badge: BadgeKey;
  principle: string;
  count: number;
  earned: boolean;
}

// Earned badges first (in the principles' order), then the rest.
export function badgeStates(countsByPrinciple: Record<string, number>): BadgeState[] {
  const states = PRINCIPLE_BADGES.map(({ principle, badge }) => {
    const count = countsByPrinciple[principle] ?? 0;
    return { badge, principle, count, earned: count >= BADGE_THRESHOLD };
  });
  return [...states.filter((s) => s.earned), ...states.filter((s) => !s.earned)];
}
