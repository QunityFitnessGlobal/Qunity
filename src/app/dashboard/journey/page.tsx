import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getJourneyStations } from "@/services/journey.service";
import { JourneyPath, type JourneyRenderItem } from "@/components/child/JourneyPath";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import type { BraceletColor, Role } from "@/lib/types";

// Purely presentational layout constants (spacing/amplitude in pixels or
// percent) — not business data, so these are fine to hardcode. Every count
// that actually matters (how many stations, how many per belt) still comes
// from the DB via getJourneyStations().
const STATION_SPACING_PX = 96;
const ZIGZAG_AMPLITUDE_PERCENT = 24;
const GRADIENT_BLEND_PERCENT = 4;

export default async function JourneyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

  const { data: child } = await supabase
    .from("children")
    .select("current_color")
    .eq("id", user.id)
    .single<{ current_color: BraceletColor }>();
  const currentColor = child?.current_color ?? "white";

  const { stations, completedCount, totalCount } = await getJourneyStations(supabase, user.id);
  const t = await getTranslations("journey");
  const tColors = await getTranslations("colors");

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
      items.push({ type: "marker", beltColor: lastBeltColor, top, left: 50 });
      top += STATION_SPACING_PX;
    }
    const left = 50 + ZIGZAG_AMPLITUDE_PERCENT * Math.sin(index * 0.9);
    items.push({ type: "station", station, top, left });
    top += STATION_SPACING_PX;
    lastBeltColor = station.beltColor;
  });

  const contentHeight = Math.max(top, STATION_SPACING_PX);

  // Belt groups in ascending (bottom-to-top) order, derived from the
  // already-sorted stations list itself — no hardcoded belt list or count.
  const beltGroups: { color: BraceletColor; count: number }[] = [];
  for (const station of stations) {
    const lastGroup = beltGroups[beltGroups.length - 1];
    if (lastGroup && lastGroup.color === station.beltColor) {
      lastGroup.count += 1;
    } else {
      beltGroups.push({ color: station.beltColor, count: 1 });
    }
  }

  const gradientStops: string[] = [];
  let cumulativePercent = 0;
  beltGroups.forEach((group, index) => {
    const sharePercent = (group.count / stations.length) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += sharePercent;
    const color = BRACELET_CSS_VAR[group.color];

    gradientStops.push(`${color} ${startPercent}%`);
    const isLast = index === beltGroups.length - 1;
    gradientStops.push(
      `${color} ${isLast ? 100 : Math.min(cumulativePercent + GRADIENT_BLEND_PERCENT, 100)}%`,
    );
  });
  const backgroundImage =
    stations.length > 0 ? `linear-gradient(to top, ${gradientStops.join(", ")})` : "none";

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="sticky top-0 z-10 w-full max-w-sm bg-white/95 px-4 py-3 text-center shadow-sm backdrop-blur">
        <p className="text-sm font-semibold text-text-muted">
          {t("belt", { color: tColors(currentColor) })}
        </p>
        <p className="text-lg font-bold">{t("progress", { done: completedCount, total: totalCount })}</p>
      </div>

      <div className="w-full px-4 py-8">
        {stations.length === 0 ? (
          <p className="text-center text-text-muted">{t("empty")}</p>
        ) : (
          <JourneyPath
            childId={user.id}
            items={items}
            contentHeight={contentHeight}
            backgroundImage={backgroundImage}
          />
        )}
      </div>
    </div>
  );
}
