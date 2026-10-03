import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getJourneyStations } from "@/services/journey.service";
import { COLOR_ORDER } from "@/services/progression.service";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import { JourneyPath, type JourneyRenderItem } from "@/components/child/JourneyPath";
import type { BraceletColor } from "@/lib/types";

// Purely presentational layout constants — not business data, so these are
// fine to hardcode. Every count that actually matters (how many stations,
// how many per belt) still comes from the DB via getJourneyStations().
// Pixel-based (not percent) so the road SVG's stroke widths render at a
// consistent, undistorted thickness — see JourneyPath.tsx.
const PATH_WIDTH_PX = 280;
const STATION_SPACING_PX = 96;
const ZIGZAG_AMPLITUDE_PX = 70;

export default async function JourneyPage() {
  const user = await requireUser();
  const supabase = await getSupabase();

  // The child's row and the stations don't need the role, so they're fetched
  // alongside the profile rather than after it.
  const [profile, { data: child }, { stations }] = await Promise.all([
    getProfile(user.id),
    supabase
      .from("children")
      .select("current_color")
      .eq("id", user.id)
      .maybeSingle<{ current_color: BraceletColor }>(),
    getJourneyStations(supabase, user.id),
  ]);

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }
  const currentColor = child?.current_color ?? "white";

  const t = await getTranslations("journey");
  const tColors = await getTranslations("colors");
  const tPowers = await getTranslations("powers");

  // Progress shown in the header is scoped to the current stage only (e.g.
  // "workout 1 of 10" for white), not the full 90-workout total.
  const currentStation = stations.find((s) => s.state === "current");
  const stageColor = currentStation?.beltColor ?? currentColor;
  const currentBeltStations = stations
    .filter((s) => s.beltColor === stageColor)
    .sort((a, b) => a.localNumber - b.localNumber);
  const beltProgress = currentStation?.localNumber ?? currentBeltStations.length;
  const beltTotal = currentBeltStations.length;
  const nextStageColor = COLOR_ORDER[COLOR_ORDER.indexOf(stageColor) + 1] ?? null;
  // Bracelet white would vanish on the white header; use its dark outline.
  const stageFill = stageColor === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[stageColor];

  // A stage's power is revealed when its first workout starts, so its gate
  // counts as open once that workout is done.
  const powerRevealed = (color: BraceletColor) =>
    stations.some((s) => s.beltColor === color && s.localNumber === 1 && s.state === "done");

  // Rendered top-to-bottom = descending global_number, so the highest
  // (future) stations sit at the top of the page (scrollY≈0) and the
  // earliest (past) ones are at the bottom — see the prompt's requirement
  // that scrolling up reveals what's ahead.
  const descending = [...stations].reverse();

  const items: JourneyRenderItem[] = [];
  let top = 0;
  let lastBeltColor: BraceletColor | null = null;

  descending.forEach((station, index) => {
    if (lastBeltColor !== null && station.beltColor !== lastBeltColor) {
      items.push({
        type: "marker",
        beltColor: lastBeltColor,
        gate: powerRevealed(lastBeltColor) ? "open" : "locked",
        top,
        left: PATH_WIDTH_PX / 2,
      });
      top += STATION_SPACING_PX;
    }
    const left = PATH_WIDTH_PX / 2 + ZIGZAG_AMPLITUDE_PX * Math.sin(index * 0.9);
    items.push({ type: "station", station, top, left });
    top += STATION_SPACING_PX;
    lastBeltColor = station.beltColor;
  });

  // The closed gate nearest the child (lowest on the page) is the one they're
  // heading for: it gets the live mystery-box treatment.
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item.type === "marker" && item.gate === "locked") {
      items[i] = { ...item, gate: "next" };
      break;
    }
  }

  const contentHeight = Math.max(top, STATION_SPACING_PX);

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="sticky top-0 z-10 w-full max-w-sm bg-white/95 px-4 pb-3 pt-3.5 shadow-sm backdrop-blur">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-lg font-bold">
            {t("stageTitle", { color: tColors(stageColor), power: tPowers(`${stageColor}.name`) })}
          </h1>
          <p className="shrink-0 text-sm text-text-muted">
            {t("workoutProgress", { done: beltProgress, total: beltTotal })}
          </p>
        </div>
        {beltTotal > 0 && (
          <div className="mt-2.5 flex items-center gap-1">
            {currentBeltStations.map((s) => (
              <span
                key={s.workoutId}
                aria-hidden
                className={`h-2 flex-1 rounded-full ${s.state === "locked" ? "bg-zinc-200" : ""} ${
                  s.state === "current" ? "animate-journey-seg-pulse" : ""
                }`}
                style={s.state === "locked" ? undefined : { backgroundColor: stageFill }}
              />
            ))}
            {nextStageColor && (
              <span
                role="img"
                aria-label={t("nextStage", { color: tColors(nextStageColor) })}
                className="h-[18px] w-[18px] flex-none rounded-full border-[3px] bg-white"
                style={{ borderColor: BRACELET_CSS_VAR[nextStageColor] }}
              />
            )}
          </div>
        )}
      </div>

      {stations.length === 0 ? (
        <p className="py-8 text-center text-text-muted">{t("empty")}</p>
      ) : (
        <JourneyPath
          childId={user.id}
          gender={profile?.gender ?? null}
          childInitial={profile?.full_name?.trim().charAt(0) || null}
          items={items}
          contentHeight={contentHeight}
          pathWidth={PATH_WIDTH_PX}
        />
      )}
    </div>
  );
}
