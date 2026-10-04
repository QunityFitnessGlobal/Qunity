// Small inline icons for BottomTabBar — no icon library dependency, kept
// together here since they're only ever used as a set for the nav tabs.
// Drawn on the mockup's 20-unit grid with a 1.8 stroke (SettingsIcon keeps
// its original drawing).
import type { SVGProps } from "react";

const LINE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" {...LINE} {...props}>
      <path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" {...LINE} {...props}>
      <path d="M6 3.5h8V8a4 4 0 0 1-8 0zM6 5H3.5v1.5A2.5 2.5 0 0 0 6 9M14 5h2.5v1.5A2.5 2.5 0 0 1 14 9M10 12v3M7 17h6" />
    </svg>
  );
}

export function StarOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" {...LINE} {...props}>
      <path d="M10 2.8l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5L2.8 8l5-.6z" />
    </svg>
  );
}

export function FlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" {...LINE} {...props}>
      <path d="M5 17.5V3M5 3.5h9l-2 3.5 2 3.5H5" />
    </svg>
  );
}

export function DumbbellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" {...LINE} {...props}>
      <path d="M3 8v4M5.5 6.5v7M14.5 6.5v7M17 8v4M5.5 10h9" />
    </svg>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" {...LINE} {...props}>
      <path d="M10 16.5s-6-3.7-6-8.2A3.3 3.3 0 0 1 10 6a3.3 3.3 0 0 1 6 2.3c0 4.5-6 8.2-6 8.2z" />
    </svg>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13a7.4 7.4 0 000-2l2-1.6-2-3.4-2.4.7a7.4 7.4 0 00-1.7-1L14.8 3H9.2l-.5 2.7a7.4 7.4 0 00-1.7 1l-2.4-.7-2 3.4L4.6 11a7.4 7.4 0 000 2l-2 1.6 2 3.4 2.4-.7a7.4 7.4 0 001.7 1l.5 2.7h5.6l.5-2.7a7.4 7.4 0 001.7-1l2.4.7 2-3.4z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
