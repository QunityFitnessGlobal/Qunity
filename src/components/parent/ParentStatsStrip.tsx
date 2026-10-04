"use client";

import { useState } from "react";

export interface ParentStat {
  label: string;
  value: string;
  // Tailwind text color class for the number.
  tone?: string;
}

interface ParentStatsStripProps {
  stats: ParentStat[];
  moreStats: ParentStat[];
  moreLabel: string;
  lessLabel: string;
}

// Three numbers at a glance on the parent home screen; "כל הנתונים" opens
// the rest underneath.
export function ParentStatsStrip({ stats, moreStats, moreLabel, lessLabel }: ParentStatsStripProps) {
  const [open, setOpen] = useState(false);
  const shown = open ? [...stats, ...moreStats] : stats;

  return (
    <section className="animate-power-fade-up flex flex-col gap-2" style={{ ["--power-fade-delay" as string]: "0.15s" }}>
      <div className="grid grid-cols-3 gap-2">
        {shown.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-0.5 rounded-2xl border border-[#ece6f2] bg-white px-2 py-2.5"
          >
            <span dir="ltr" className={`font-display text-xl font-bold ${stat.tone ?? "text-[#221a33]"}`}>
              {stat.value}
            </span>
            <span className="text-center text-xs text-[#6c6580]">{stat.label}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex min-h-10 items-center gap-1 self-center text-sm font-semibold text-brand-purple"
      >
        {open ? lessLabel : moreLabel}
        <svg
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
    </section>
  );
}
