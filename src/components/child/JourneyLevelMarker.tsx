"use client";

import { useTranslations } from "next-intl";
import { BRACELET_BADGE_CLASSES } from "@/lib/colors";
import type { BraceletColor } from "@/lib/types";
import type { CSSProperties } from "react";

interface JourneyLevelMarkerProps {
  // The belt color being leveled up INTO (i.e. the one right above this
  // marker on the path, since higher global_number renders higher up).
  beltColor: BraceletColor;
  style?: CSSProperties;
}

// Static badge for now (see prompt: "שלב ראשון: תג/מדליה סטטית, בלי אנימציה
// מיוחדת") — a later pass can add an unlock animation without changing the
// data this depends on. Client component (not async) so it can sit inline
// in the same interactive, client-rendered path list as JourneyStation.
export function JourneyLevelMarker({ beltColor, style }: JourneyLevelMarkerProps) {
  const t = useTranslations("journey");
  const tColors = useTranslations("colors");

  return (
    <div style={style} className="absolute flex flex-col items-center gap-1">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-yellow-500 shadow-md ${BRACELET_BADGE_CLASSES[beltColor]}`}
      >
        <MedalIcon />
      </div>
      <span className="max-w-[5rem] text-center text-xs font-semibold text-text-muted">
        {t("levelMarker", { color: tColors(beltColor) })}
      </span>
    </div>
  );
}

function MedalIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-yellow-600">
      <circle cx="10" cy="12" r="6" />
      <path d="M7 2h2l1.5 4L12 2h2l-2.5 6.5L14 14h-2l-2-4.5-2 4.5H6l2.5-5.5z" />
    </svg>
  );
}
