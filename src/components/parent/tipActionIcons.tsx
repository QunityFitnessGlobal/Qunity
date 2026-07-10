// Small inline icons for the tip like/dismiss buttons — same style as
// navIcons.tsx (no icon library dependency), kept separate since they're
// specific to tip cards rather than nav tabs.
import type { SVGProps } from "react";

export function ThumbsUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path
        d="M7 11v9H4a1 1 0 01-1-1v-7a1 1 0 011-1h3zm0 0l4.5-8a2 2 0 013.6 1.4L14 9h5a2 2 0 012 2l-1.6 7.2A2 2 0 0117.5 20H10a3 3 0 01-3-3v-6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
