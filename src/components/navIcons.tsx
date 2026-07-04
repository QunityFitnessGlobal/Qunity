// Small inline icons for BottomTabBar — no icon library dependency, kept
// together here since they're only ever used as a set for the nav tabs.
import type { SVGProps } from "react";

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M3 11l9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M7 4h10v4a5 5 0 01-10 0V4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 5H4a3 3 0 003 3M17 5h3a3 3 0 01-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v3m-3 4h6m-3 0v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M5 3v18" strokeLinecap="round" />
      <path d="M5 4h13l-3 4 3 4H5" strokeLinecap="round" strokeLinejoin="round" />
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

export function DumbbellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M6 8v8M18 8v8" strokeLinecap="round" />
      <path d="M2 10v4M22 10v4" strokeLinecap="round" />
      <path d="M6 12h12" strokeLinecap="round" />
    </svg>
  );
}
