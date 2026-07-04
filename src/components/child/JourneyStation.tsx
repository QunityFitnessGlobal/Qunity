"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { BRACELET_BADGE_CLASSES } from "@/lib/colors";
import type { BraceletColor, JourneyStationState } from "@/lib/types";

interface JourneyStationProps {
  state: JourneyStationState;
  title: string;
  beltColor: BraceletColor;
  localNumber: number;
  globalNumber: number;
  // Called for "current" (start the workout) and "done" (open its summary).
  // Never called for "locked" — the component handles that tap itself.
  onOpen?: () => void;
  style?: CSSProperties;
  id?: string;
}

// Purely presentational: takes state/colors/numbers/callbacks and knows
// nothing about journey.service or how state was computed, so it can be
// reused (e.g. a future mini-preview) without pulling in data-fetching code.
export function JourneyStation({
  state,
  title,
  beltColor,
  localNumber,
  globalNumber,
  onOpen,
  style,
  id,
}: JourneyStationProps) {
  const t = useTranslations("journey");
  const [showLockedHint, setShowLockedHint] = useState(false);

  function handleClick() {
    if (state === "locked") {
      setShowLockedHint(true);
      window.setTimeout(() => setShowLockedHint(false), 1800);
      return;
    }
    onOpen?.();
  }

  const isCurrent = state === "current";
  const circleSize = isCurrent ? "h-16 w-16" : "h-12 w-12";
  const emphasis = isCurrent ? "ring-4 ring-brand-purple ring-offset-2" : "";
  const dimmed = state === "locked" ? "opacity-50" : "";

  return (
    <div id={id} style={style} className="absolute flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        aria-label={title}
        className={`relative flex ${circleSize} items-center justify-center rounded-full font-bold text-zinc-800 shadow-sm transition-transform ${BRACELET_BADGE_CLASSES[beltColor]} ${emphasis} ${dimmed} ${
          showLockedHint ? "animate-journey-shake" : ""
        }`}
      >
        <span>{localNumber}</span>

        {state === "locked" && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-white">
            <LockIcon />
          </span>
        )}
        {state === "done" && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-white">
            <StarIcon />
          </span>
        )}
        {isCurrent && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple text-white">
            <PlayIcon />
          </span>
        )}
      </button>

      <span className="text-xs font-medium text-text-muted">{globalNumber}</span>

      {showLockedHint && (
        <div className="absolute top-full z-10 mt-1 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-white">
          {t("lockedHint")}
        </div>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <path d="M5 8V6a5 5 0 0110 0v2h1a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1h1zm2 0h6V6a3 3 0 00-6 0v2z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <path d="M6 4l10 6-10 6V4z" />
    </svg>
  );
}
