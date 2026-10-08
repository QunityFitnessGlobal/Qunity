"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { drawFrame, stillMoment, type ExerciseMotion } from "@/lib/exercise-motion/engine";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const TONES = {
  work: { wall: "#f4f0f8", floor: "#e9e2f1", edge: "#d9cfe6", mat: "#d8c9ea" },
  rest: { wall: "#eef3ff", floor: "#e1e9fb", edge: "#cddbf6", mat: "#c9d8f7" },
};

// Footprint / handprint seen from above, toes or fingers up (a left one;
// the right one is mirrored).
const FOOT = (
  <>
    <path d="M0.5 -11 C3.5 -11 5 -7.5 5 -3 C5 2 3.5 5 3.5 8 C3.5 10.5 2 12 0 12 C-2 12 -3.5 10.5 -3.5 8 C-3.5 5 -5 2 -4.5 -3 C-4.2 -7.5 -2.5 -11 0.5 -11 Z" />
    <circle cx="2.4" cy="-13.8" r="1.9" />
    <circle cx="-0.8" cy="-14.6" r="1.3" />
    <circle cx="-3" cy="-13.7" r="1.1" />
    <circle cx="-4.6" cy="-12" r="0.95" />
  </>
);
const HAND = (
  <>
    <path d="M-4.6 -1 C-4.6 -4 4.6 -4 4.6 -1 L4.6 7 C4.6 10 -4.6 10 -4.6 7 Z" />
    <ellipse cx="-3.4" cy="-6.4" rx="1.2" ry="2.9" />
    <ellipse cx="-1.1" cy="-7.4" rx="1.2" ry="3.2" />
    <ellipse cx="1.2" cy="-7.2" rx="1.2" ry="3.1" />
    <ellipse cx="3.4" cy="-6" rx="1.1" ry="2.6" />
    <ellipse cx="6.1" cy="2" rx="1.3" ry="2.8" transform="rotate(-35 6.1 2)" />
  </>
);

interface ExerciseDemoProps {
  motion: ExerciseMotion;
  // A 16:9 looping demo, or a still square thumbnail.
  variant?: "video" | "thumb";
  angle?: "main" | "alt";
  tone?: "work" | "rest";
  // Paused demos hold the moment they reached.
  playing?: boolean;
  // Corner labels on the video: the camera angle, and where the feet or
  // hands go.
  showAngle?: boolean;
  showPrints?: boolean;
  // Moves the angle label down (e.g. below a progress bar on top).
  angleBelowTop?: boolean;
  className?: string;
}

// An exercise shown by a looping figure (instead of a photo): the figure's
// motion comes from the exercise-motion library. Remount it (a new `key`) to
// start the loop from the top.
export function ExerciseDemo({
  motion,
  variant = "video",
  angle = "main",
  tone = "work",
  playing = true,
  showAngle = true,
  showPrints = true,
  angleBelowTop = false,
  className = "",
}: ExerciseDemoProps) {
  const t = useTranslations("workout.motion");
  const reduced = useReducedMotion();
  const [ms, setMs] = useState(0);
  const animate = variant === "video" && playing && !reduced;

  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    let last = performance.now();
    let pending = 0;
    const tick = (now: number) => {
      pending += now - last;
      last = now;
      // About 30 frames a second is plenty for this figure.
      if (pending >= 32) {
        const step = pending;
        pending = 0;
        setMs((m) => m + step);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  const still = variant === "thumb" || reduced;
  const f = drawFrame(motion, { ms: still ? stillMoment(motion) : ms, angle, variant: variant === "thumb" ? "thumb" : "video" });
  const colors = TONES[tone];

  return (
    <span
      className={`relative block overflow-hidden ${variant === "video" ? "aspect-video" : ""} ${className}`}
      style={{ background: colors.wall }}
    >
      <svg
        viewBox={variant === "video" ? "0 0 320 180" : "0 0 100 100"}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <g transform={f.transform}>
          <rect x={-300} y={-300} width={920} height={472} fill={colors.wall} />
          <rect x={-300} y={172} width={920} height={300} fill={colors.floor} />
          <rect x={-300} y={171} width={920} height={1.5} fill={colors.edge} />
          {f.mat && <rect x={50} y={167} width={200} height={5} rx={2.5} fill={colors.mat} />}
          {f.shadow && <ellipse cx={f.shadow.cx} cy={173} rx={f.shadow.rx} ry={4} fill="#221a33" opacity={0.1} />}
          {f.layers.map((l, i) => (
            <path
              key={i}
              d={l.d}
              fill={l.fill}
              stroke={l.stroke}
              strokeWidth={l.width}
              opacity={l.opacity}
              strokeDasharray={l.dash === "none" ? undefined : l.dash}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      </svg>

      {variant === "video" && showAngle && (
        <span
          className={`absolute start-2.5 ${angleBelowTop ? "top-5" : "top-2.5"} inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#4f4960]`}
        >
          <CameraIcon />
          {t(`angle.${f.angle}`)}
        </span>
      )}

      {variant === "video" && showPrints && f.prints && (
        <span className="absolute bottom-2 end-2 flex flex-col items-center gap-px rounded-xl bg-white/90 px-2 pb-1 pt-1.5 shadow-[0_1px_3px_rgba(34,26,51,0.1)]">
          <svg width="52" height="32" viewBox="0 0 52 32" fill="#a32894" aria-hidden>
            <g transform={f.prints.a}>{f.prints.kind === "feet" ? FOOT : HAND}</g>
            <g transform={f.prints.b}>
              <g transform="scale(-1 1)">{f.prints.kind === "feet" ? FOOT : HAND}</g>
            </g>
          </svg>
          <span className="whitespace-nowrap text-[10px] font-semibold leading-tight text-[#4f4960]">
            {t(`prints.${f.prints.label}`)}
          </span>
        </span>
      )}
    </span>
  );
}

export function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="5.5" width="12" height="9.5" rx="2" />
      <path d="M14 9l4-2.5v7.5L14 11.5" />
    </svg>
  );
}
