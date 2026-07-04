import { BRACELET_CSS_VAR } from "@/lib/colors";
import { StarIcon } from "@/components/child/journeyIcons";
import type { BraceletColor } from "@/lib/types";
import type { CSSProperties } from "react";

interface JourneyLevelMarkerProps {
  // The belt color being leveled up INTO (i.e. the one right above this
  // marker on the path, since higher global_number renders higher up).
  beltColor: BraceletColor;
  style?: CSSProperties;
}

// A milestone, not a workout — rendered as a plain colored star (no circle
// frame, no caption) so it reads as distinct from the workout stations.
export function JourneyLevelMarker({ beltColor, style }: JourneyLevelMarkerProps) {
  return (
    <div style={style} className="absolute">
      <StarIcon
        className="h-10 w-10 drop-shadow-sm"
        style={{ color: BRACELET_CSS_VAR[beltColor] }}
        stroke="#1f1f23"
        strokeWidth={0.6}
      />
    </div>
  );
}
