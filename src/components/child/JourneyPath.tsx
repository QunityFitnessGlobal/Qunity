"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { JourneyStation } from "@/components/child/JourneyStation";
import { JourneyLevelMarker } from "@/components/child/JourneyLevelMarker";
import { WorkoutSummaryModal } from "@/components/child/WorkoutSummaryModal";
import { resolveLocalizedText } from "@/lib/i18n-content";
import type { BraceletColor, JourneyStation as JourneyStationData } from "@/lib/types";

export type JourneyRenderItem =
  | { type: "station"; station: JourneyStationData; top: number; left: number }
  | { type: "marker"; beltColor: BraceletColor; top: number; left: number };

const CURRENT_STATION_DOM_ID = "journey-current-station";

interface JourneyPathProps {
  childId: string;
  items: JourneyRenderItem[];
  contentHeight: number;
  backgroundImage: string;
}

// Client-only piece of the journey page: everything here needs interactivity
// (scroll-to-current on mount, tap-to-navigate/tap-to-open-summary) that a
// Server Component can't do. The page itself computes the pure layout data
// (positions, totals, background gradient) server-side and just hands it
// down as props.
export function JourneyPath({ childId, items, contentHeight, backgroundImage }: JourneyPathProps) {
  const router = useRouter();
  const locale = useLocale();
  const [openSummary, setOpenSummary] = useState<{
    beltColor: BraceletColor;
    localNumber: number;
  } | null>(null);

  useEffect(() => {
    document
      .getElementById(CURRENT_STATION_DOM_ID)
      ?.scrollIntoView({ behavior: "auto", block: "center" });
  }, []);

  return (
    <div
      className="relative mx-auto w-full max-w-xs"
      style={{ height: contentHeight, backgroundImage, backgroundRepeat: "no-repeat", backgroundSize: "100% 100%" }}
    >
      {items.map((item, index) => {
        const positionStyle: CSSProperties = {
          top: item.top,
          left: `${item.left}%`,
          transform: "translateX(-50%)",
        };

        if (item.type === "marker") {
          return (
            <JourneyLevelMarker key={`marker-${index}`} beltColor={item.beltColor} style={positionStyle} />
          );
        }

        const { station } = item;

        return (
          <JourneyStation
            key={station.workoutId}
            id={station.state === "current" ? CURRENT_STATION_DOM_ID : undefined}
            state={station.state}
            title={resolveLocalizedText(station.title, locale)}
            beltColor={station.beltColor}
            localNumber={station.localNumber}
            globalNumber={station.globalNumber}
            style={positionStyle}
            onOpen={() => {
              if (station.state === "current") {
                router.push(`/workout/${station.workoutId}`);
              } else if (station.state === "done") {
                setOpenSummary({ beltColor: station.beltColor, localNumber: station.localNumber });
              }
            }}
          />
        );
      })}

      {openSummary && (
        <WorkoutSummaryModal
          childId={childId}
          beltColor={openSummary.beltColor}
          localNumber={openSummary.localNumber}
          onClose={() => setOpenSummary(null)}
        />
      )}
    </div>
  );
}
