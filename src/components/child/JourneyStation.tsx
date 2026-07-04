"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { BRACELET_BADGE_CLASSES, BRACELET_CSS_VAR } from "@/lib/colors";
import { LockIcon, PlayIcon, StarIcon } from "@/components/child/journeyIcons";
import type { BraceletColor, JourneyStationState } from "@/lib/types";

interface JourneyStationProps {
  state: JourneyStationState;
  title: string;
  beltColor: BraceletColor;
  localNumber: number;
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
  // Locked stations are solid light gray, not a dimmed/transparent version
  // of the belt color — opacity would let the road SVG underneath show
  // through the circle, which looked broken for the whole "future" stretch
  // of the path. A colored border (rather than a colored fill) still shows
  // which belt a locked station belongs to.
  const isLocked = state === "locked";
  const fillClass = isLocked ? "bg-zinc-300" : BRACELET_BADGE_CLASSES[beltColor];
  const lockedBorderStyle: CSSProperties = isLocked
    ? { borderWidth: 3, borderStyle: "solid", borderColor: BRACELET_CSS_VAR[beltColor] }
    : {};

  return (
    <div id={id} style={style} className="absolute flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        aria-label={title}
        style={lockedBorderStyle}
        className={`relative flex ${circleSize} items-center justify-center rounded-full font-bold text-zinc-800 shadow-sm transition-transform ${fillClass} ${emphasis} ${
          showLockedHint ? "animate-journey-shake" : ""
        }`}
      >
        <span>{localNumber}</span>

        {state === "locked" && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-white">
            <LockIcon className="h-3 w-3" />
          </span>
        )}
        {state === "done" && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-white">
            <StarIcon className="h-3 w-3" />
          </span>
        )}
        {isCurrent && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple text-white">
            <PlayIcon className="h-3 w-3" />
          </span>
        )}
      </button>

      {showLockedHint && (
        <div className="absolute top-full z-10 mt-1 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-white">
          {t("lockedHint")}
        </div>
      )}
    </div>
  );
}
