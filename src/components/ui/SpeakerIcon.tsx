import type { SVGProps } from "react";

// Same no-dependency inline-SVG convention as journeyIcons.tsx / navIcons.tsx;
// the sound waves are strokes rather than fills, since a filled arc is far
// more path data than it's worth.
export function SpeakerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M3 8v4h3l4 3.5v-11L6 8H3z" />
      <path
        d="M12.5 7.5a3.5 3.5 0 010 5M14.5 5.5a6.5 6.5 0 010 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
