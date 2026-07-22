// Icons for the 5 belt-color "powers" (PowerRevealScreen) — reuses
// PlayIcon/StarIcon from journeyIcons.tsx (white/green) and adds the
// remaining 3, in the same no-dependency inline-SVG style.
import type { SVGProps } from "react";

export { PlayIcon, StarIcon } from "@/components/child/journeyIcons";

export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M10 1c1 3-3 4-3 8a3 3 0 006 0c0-1.5-.8-2.6-1.5-3.5.3 1 .2 2-.5 2.5a2 2 0 01-2-3.5C9.5 3.5 9 2 10 1zm-5 9a5 5 0 0010 0c0-1-.3-2-.8-3 .5 3-1.2 5-4.2 5s-4.7-2-4.2-5c-.5 1-.8 2-.8 3z" />
    </svg>
  );
}

export function TrendingUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <rect x="3" y="12" width="3" height="5" rx="0.5" />
      <rect x="8.5" y="8" width="3" height="9" rx="0.5" />
      <rect x="14" y="4" width="3" height="13" rx="0.5" />
    </svg>
  );
}

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M10 1c0 4 1.5 6.5 5.5 7.5-4 1-5.5 3.5-5.5 7.5-0-4-1.5-6.5-5.5-7.5C8.5 7.5 10 5 10 1z" />
      <circle cx="16.5" cy="4" r="1.2" />
    </svg>
  );
}
