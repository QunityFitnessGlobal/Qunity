"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { JourneyStation } from "@/components/child/JourneyStation";
import {
  JourneyLevelMarker,
  STAGE_GATE_HEIGHT,
  type StageGateState,
} from "@/components/child/JourneyLevelMarker";
import { WorkoutSummaryModal } from "@/components/child/WorkoutSummaryModal";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import { POWER_ICON } from "@/lib/powers";
import type { BraceletColor, Gender, JourneyStation as JourneyStationData } from "@/lib/types";

export type JourneyRenderItem =
  | { type: "station"; station: JourneyStationData; top: number; left: number }
  | { type: "marker"; beltColor: BraceletColor; gate: StageGateState; top: number; left: number };

const CURRENT_STATION_DOM_ID = "journey-current-station";

// Matches each item's actual rendered size (JourneyStation: h-16 for
// "current", h-12 otherwise; a gate: STAGE_GATE_HEIGHT) so the road's
// points land exactly on each station/gate's visual center.
function centerYOffset(item: JourneyRenderItem): number {
  if (item.type === "marker") return STAGE_GATE_HEIGHT / 2;
  return item.station.state === "current" ? 32 : 24;
}

// Bracelet white is nearly invisible on the white page, so anything drawn in
// the stage's color uses the dark outline shade for white instead.
function visibleStageColor(color: BraceletColor): string {
  return color === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[color];
}

// The "you are here" marker sits beside the current workout (on whichever
// side has more room), not above it, so it never covers the next workout.
const MARKER_OFFSET_X = 72;
const MARKER_AVATAR_CENTER_Y = 44;

interface JourneyPathProps {
  childId: string;
  gender: Gender | null;
  // First letter of the child's name, shown in the "you are here" marker.
  childInitial: string | null;
  items: JourneyRenderItem[];
  contentHeight: number;
  pathWidth: number;
}

// Client-only piece of the journey page: everything here needs interactivity
// (scroll-to-current on mount, tap-to-navigate/tap-to-open-summary) that a
// Server Component can't do. The page itself computes the pure layout data
// (positions, totals, background gradient) server-side and just hands it
// down as props.
export function JourneyPath({ childId, gender, childInitial, items, contentHeight, pathWidth }: JourneyPathProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("journey");
  const [openSummary, setOpenSummary] = useState<{
    beltColor: BraceletColor;
    localNumber: number;
    workoutId: string;
    partial: boolean;
  } | null>(null);

  useEffect(() => {
    document
      .getElementById(CURRENT_STATION_DOM_ID)
      ?.scrollIntoView({ behavior: "auto", block: "center" });
  }, []);

  // Items run top (future) to bottom (past); each point is an item's visual
  // center (see centerYOffset), so the road passes exactly through them.
  const points = items.map((item) => `${item.left.toFixed(1)},${item.top + centerYOffset(item)}`);
  const currentIndex = items.findIndex((item) => item.type === "station" && item.station.state === "current");
  const current = currentIndex >= 0 ? items[currentIndex] : null;
  // The stretch already travelled — everything from the current workout
  // down (or the whole road once nothing is left), listed bottom-up so it
  // draws itself in toward where the child stands now.
  const travelled = points.slice(currentIndex >= 0 ? currentIndex : 0).reverse();
  const currentStageColor = current && current.type === "station" ? current.station.beltColor : null;
  const markerOnLeft = current ? current.left >= pathWidth / 2 : false;

  return (
    <div className="w-full bg-white" style={{ height: contentHeight }}>
      <div className="relative mx-auto h-full" style={{ width: pathWidth }}>
        <svg
          className="absolute left-0 top-0"
          width={pathWidth}
          height={contentHeight}
          viewBox={`0 0 ${pathWidth} ${contentHeight}`}
          aria-hidden
        >
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeDasharray="6 9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {travelled.length > 1 && (
            <>
              <polyline
                points={travelled.join(" ")}
                fill="none"
                stroke="var(--color-reward-gold)"
                strokeOpacity={0.35}
                strokeWidth={16}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={travelled.join(" ")}
                pathLength={1}
                fill="none"
                stroke="var(--color-reward-gold)"
                strokeWidth={7}
                strokeDasharray="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-journey-draw"
              />
            </>
          )}
        </svg>

        {items.map((item, index) => {
          const positionStyle: CSSProperties = {
            top: item.top,
            left: item.left,
            transform: "translateX(-50%)",
          };

          if (item.type === "marker") {
            return (
              <JourneyLevelMarker
                key={`marker-${index}`}
                beltColor={item.beltColor}
                gate={item.gate}
                style={positionStyle}
              />
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
              partial={station.partial}
              style={positionStyle}
              onOpen={() => {
                if (station.state === "current") {
                  router.push(`/workout/${station.workoutId}`);
                } else if (station.state === "done") {
                  setOpenSummary({
                    beltColor: station.beltColor,
                    localNumber: station.localNumber,
                    workoutId: station.workoutId,
                    partial: station.partial,
                  });
                }
              }}
            />
          );
        })}

        {current && currentStageColor && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-[1]"
            style={{
              top: current.top + 32 - MARKER_AVATAR_CENTER_Y,
              left: current.left + (markerOnLeft ? -MARKER_OFFSET_X : MARKER_OFFSET_X),
              transform: "translateX(-50%)",
            }}
          >
            <div className="flex flex-col items-center gap-1 animate-journey-bob">
              <span className="whitespace-nowrap rounded-full bg-brand-purple px-2.5 py-0.5 text-xs font-bold text-white">
                {t("youAreHere", { gender: gender ?? "male" })}
              </span>
              <span
                className="relative flex h-10 w-10 items-center justify-center rounded-full border-[3px] bg-white font-display text-lg font-semibold text-zinc-700 shadow-md"
                style={{ borderColor: visibleStageColor(currentStageColor) }}
              >
                {childInitial ??
                  (() => {
                    const PowerIcon = POWER_ICON[currentStageColor];
                    return <PowerIcon className="h-5 w-5" style={{ color: visibleStageColor(currentStageColor) }} />;
                  })()}
                <span
                  className="absolute top-1/2 h-0 w-0 -translate-y-1/2 border-y-[7px] border-y-transparent"
                  style={
                    markerOnLeft
                      ? { right: -11, borderLeft: `9px solid ${visibleStageColor(currentStageColor)}` }
                      : { left: -11, borderRight: `9px solid ${visibleStageColor(currentStageColor)}` }
                  }
                />
              </span>
            </div>
          </div>
        )}

        {openSummary && (
          <WorkoutSummaryModal
            childId={childId}
            beltColor={openSummary.beltColor}
            localNumber={openSummary.localNumber}
            partial={openSummary.partial}
            gender={gender}
            onReplay={() =>
              router.push(`/workout/${openSummary.workoutId}?replay=${openSummary.localNumber}`)
            }
            onClose={() => setOpenSummary(null)}
          />
        )}
      </div>
    </div>
  );
}
