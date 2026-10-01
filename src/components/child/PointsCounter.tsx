"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/components/child/MysteryReveal";

interface PointsCounterProps {
  total: number;
  lastWorkoutPoints: number;
  label: string;
  lastWorkoutLabel: string;
}

// The home screen's points card: the total counts up through what the last
// workout added, so the child sees that workout land on the pile.
export function PointsCounter({ total, lastWorkoutPoints, label, lastWorkoutLabel }: PointsCounterProps) {
  const start = Math.max(0, total - lastWorkoutPoints);
  // Decided once (not in an effect): a reduced-motion viewer, or nothing to
  // add, shows the final total straight away.
  const [animate] = useState(() => lastWorkoutPoints > 0 && !prefersReducedMotion());
  const [shown, setShown] = useState(animate ? start : total);

  useEffect(() => {
    if (!animate) return;
    let current = start;
    let tick: ReturnType<typeof setInterval> | undefined;
    const step = Math.max(1, Math.ceil((total - start) / 35));
    const delay = setTimeout(() => {
      tick = setInterval(() => {
        current = Math.min(total, current + step);
        setShown(current);
        if (current >= total && tick) clearInterval(tick);
      }, 34);
    }, 700);
    return () => {
      clearTimeout(delay);
      if (tick) clearInterval(tick);
    };
  }, [animate, start, total]);

  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex flex-col">
        <span className="text-[13px] text-text-muted">{label}</span>
        <span dir="ltr" className="text-right font-display text-[32px] font-bold tabular-nums">
          {shown.toLocaleString("en-US")}
        </span>
      </div>
      {lastWorkoutPoints > 0 && (
        <div
          className="animate-power-fade-up flex flex-col items-center gap-0.5"
          style={{ ["--power-fade-delay" as string]: "0.5s" } as CSSProperties}
        >
          <span
            dir="ltr"
            className="rounded-full bg-reward-gold px-3 py-1 font-display text-base font-bold text-reward-gold-on"
          >
            +{lastWorkoutPoints}
          </span>
          <span className="text-xs text-text-muted">{lastWorkoutLabel}</span>
        </div>
      )}
    </div>
  );
}
