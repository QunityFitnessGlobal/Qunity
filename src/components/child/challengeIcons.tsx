// Per-challenge icons for the "done" list and the reveal popup — reuses
// FlameIcon/StarIcon/TrendingUpIcon from powerIcons.tsx and adds the two
// missing shapes (parent_power, total_minutes_100) plus a stairs icon for
// repeatable_workout challenges.
import type { SVGProps } from "react";
import { FlameIcon, StarIcon, TrendingUpIcon } from "@/components/child/powerIcons";
import type { ChallengeConditionType, ChallengeType } from "@/data/challenges.data";

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M10 17.5s-6.5-4-6.5-9.2A3.7 3.7 0 0110 6.1a3.7 3.7 0 016.5 2.2c0 5.2-6.5 9.2-6.5 9.2z" />
    </svg>
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6v4.2l2.5 1.7" />
    </svg>
  );
}

export function StairsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 16.5h3.5V13H10V9.5h3.5V6H17" />
    </svg>
  );
}

interface ChallengeIconProps extends SVGProps<SVGSVGElement> {
  conditionType: ChallengeConditionType | null;
  challengeType: ChallengeType;
}

// A repeatable challenge always gets the stairs icon; a condition challenge
// goes by its conditionType, falling back to the generic star (which also
// covers first_workout and the power_* challenges).
export function ChallengeIcon({ conditionType, challengeType, ...props }: ChallengeIconProps) {
  if (challengeType === "repeatable_workout") {
    return <StairsIcon {...props} />;
  }
  switch (conditionType) {
    case "parent_power":
      return <HeartIcon {...props} />;
    case "streak_3":
    case "streak_5":
      return <FlameIcon {...props} />;
    case "total_minutes_100":
      return <ClockIcon {...props} />;
    case "color_finisher":
      return <TrendingUpIcon {...props} />;
    default:
      return <StarIcon {...props} />;
  }
}
