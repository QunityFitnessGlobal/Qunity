"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { JourneyStation } from "@/components/child/JourneyStation";
import { JourneyLevelMarker } from "@/components/child/JourneyLevelMarker";
import { WorkoutSummaryModal } from "@/components/child/WorkoutSummaryModal";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import type { BraceletColor, JourneyStation as JourneyStationData } from "@/lib/types";

export type JourneyRenderItem =
  | { type: "station"; station: JourneyStationData; top: number; left: number }
  | { type: "marker"; beltColor: BraceletColor; top: number; left: number };

const CURRENT_STATION_DOM_ID = "journey-current-station";
// Rough vertical offset from an item's top-left anchor to its visual
// center, for drawing the road through station/marker centers rather than
// their corners. Approximate on purpose — this is a decorative line, not a
// hitbox.
const CENTER_Y_OFFSET_PX = 30;

function itemBeltColor(item: JourneyRenderItem): BraceletColor {
  return item.type === "station" ? item.station.beltColor : item.beltColor;
}

interface JourneyPathProps {
  childId: string;
  items: JourneyRenderItem[];
  contentHeight: number;
  backgroundImage: string;
  pathWidth: number;
}

// Client-only piece of the journey page: everything here needs interactivity
// (scroll-to-current on mount, tap-to-navigate/tap-to-open-summary) that a
// Server Component can't do. The page itself computes the pure layout data
// (positions, totals, background gradient) server-side and just hands it
// down as props.
export function JourneyPath({
  childId,
  items,
  contentHeight,
  backgroundImage,
  pathWidth,
}: JourneyPathProps) {
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
  // right at each level-up marker.
  const segments = items.slice(0, -1).map((item, i) => {
    const next = items[i + 1];
    return {
      x1: item.left,
      y1: item.top + CENTER_Y_OFFSET_PX,
      x2: next.left,
      y2: next.top + CENTER_Y_OFFSET_PX,
      color: BRACELET_CSS_VAR[itemBeltColor(next)],
    };
  });

  return (
    <div
      className="w-full"
      style={{ height: contentHeight, backgroundImage, backgroundRepeat: "no-repeat", backgroundSize: "100% 100%" }}
    >
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
                strokeWidth={14}
                strokeLinecap="round"
              />
              <line
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke={segment.color}
                strokeWidth={9}
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
            onClose={() => setOpenSummary(null)}
          />
        )}
      </div>
    </div>
  );
}
