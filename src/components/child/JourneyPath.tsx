"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { JourneyStation } from "@/components/child/JourneyStation";
import { JourneyLevelMarker } from "@/components/child/JourneyLevelMarker";
import { WorkoutSummaryModal } from "@/components/child/WorkoutSummaryModal";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { BRACELET_ROAD_COLOR } from "@/lib/colors";
import type { BraceletColor, Gender, JourneyStation as JourneyStationData } from "@/lib/types";

export type JourneyRenderItem =
  | { type: "station"; station: JourneyStationData; top: number; left: number }
  | { type: "marker"; beltColor: BraceletColor; top: number; left: number };

const CURRENT_STATION_DOM_ID = "journey-current-station";

// Matches each item's actual rendered circle size (JourneyStation: h-16 for
// "current", h-12 otherwise; JourneyLevelMarker: h-10) so the road's
// endpoints land exactly on each station/marker's visual center, not an
// approximation.
function centerYOffset(item: JourneyRenderItem): number {
  if (item.type === "marker") return 20;
  return item.station.state === "current" ? 32 : 24;
}

function itemBeltColor(item: JourneyRenderItem): BraceletColor {
  return item.type === "station" ? item.station.beltColor : item.beltColor;
}

interface JourneyPathProps {
  childId: string;
  gender: Gender | null;
  items: JourneyRenderItem[];
  contentHeight: number;
  pathWidth: number;
}

// Client-only piece of the journey page: everything here needs interactivity
// (scroll-to-current on mount, tap-to-navigate/tap-to-open-summary) that a
// Server Component can't do. The page itself computes the pure layout data
// (positions, totals, background gradient) server-side and just hands it
// down as props.
export function JourneyPath({ childId, gender, items, contentHeight, pathWidth }: JourneyPathProps) {
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

  // One line segment per pair of consecutive items, colored to the "lower"
  // (earlier/already-passed) endpoint's belt so the road's color changes
  // right at each level-up marker. Endpoints land exactly on each item's
  // visual center (see centerYOffset), so every segment starts and ends
  // precisely at a station or marker.
  const segments = items.slice(0, -1).map((item, i) => {
    const next = items[i + 1];
    return {
      x1: item.left,
      y1: item.top + centerYOffset(item),
      x2: next.left,
      y2: next.top + centerYOffset(next),
      color: BRACELET_ROAD_COLOR[itemBeltColor(next)],
    };
  });

  return (
    <div className="w-full bg-white" style={{ height: contentHeight }}>
      <div className="relative mx-auto h-full" style={{ width: pathWidth }}>
        <svg
          className="absolute left-0 top-0"
          width={pathWidth}
          height={contentHeight}
          viewBox={`0 0 ${pathWidth} ${contentHeight}`}
        >
          {segments.map((segment, index) => (
            <g key={index}>
              <line
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke="#1f1f23"
                strokeWidth={8}
                strokeLinecap="round"
              />
              <line
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke={segment.color}
                strokeWidth={6}
                strokeLinecap="round"
              />
            </g>
          ))}
        </svg>

        {items.map((item, index) => {
          const positionStyle: CSSProperties = {
            top: item.top,
            left: item.left,
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
            gender={gender}
            onClose={() => setOpenSummary(null)}
          />
        )}
      </div>
    </div>
  );
}
