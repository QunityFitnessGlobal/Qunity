import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { STAGE_DOT_CLASS } from "@/components/parent/ChildChips";
import type { ChildWeek } from "@/services/child-week.service";
import type { BraceletColor } from "@/lib/types";

interface ChildWeekCardProps {
  name: string;
  week: ChildWeek;
  color: BraceletColor;
  workoutsInStage: number;
  requiredWorkouts: number;
}

// The white stage's own color is too pale for a bar on a light track.
const STAGE_BAR_COLOR: Record<BraceletColor, string> = {
  white: "#b9b3c6",
  orange: "var(--color-bracelet-orange)",
  green: "var(--color-bracelet-green)",
  blue: "var(--color-bracelet-blue)",
  purple: "var(--color-bracelet-purple)",
};

// "השבוע של…" on the parent home screen: this week's workouts against last
// week's, a dot per day (filled when the child trained, a heart when you
// trained together), and how far along the current stage is.
export async function ChildWeekCard({ name, week, color, workoutsInStage, requiredWorkouts }: ChildWeekCardProps) {
  const t = await getTranslations("parentHome");
  const tColors = await getTranslations("colors");
  const dayLabels = t("weekDays").split(",");

  const count = week.thisWeekCount;
  const headline =
    count === 0
      ? t("weekNone")
      : count > week.lastWeekCount && week.lastWeekCount > 0
        ? t("weekMore", { count, diff: count - week.lastWeekCount })
        : count === week.lastWeekCount
          ? t("weekSame", { count })
          : t("weekPlain", { count });
  const stagePercent = requiredWorkouts > 0 ? Math.min(100, (workoutsInStage / requiredWorkouts) * 100) : 0;

  return (
    <section className="animate-power-fade-up flex flex-col gap-3 rounded-[20px] border border-[#ece6f2] bg-white px-4 py-3.5">
      <span className="text-[13px] font-semibold text-brand-purple">{t("weekTitle", { name })}</span>
      <span className="font-display text-xl font-semibold leading-snug">{headline}</span>

      <div className="grid grid-cols-7 gap-1">
        {week.days.map((day, i) => (
          <div key={day.dayKey} className="flex flex-col items-center gap-1">
            <span
              className={`animate-home-day-pop relative flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 ${
                day.trained ? "bg-brand-purple" : "bg-white"
              } ${day.isFuture ? "border-dashed" : "border-solid"} ${
                day.isToday ? "border-[#221a33]" : day.trained ? "border-brand-purple" : "border-[#e4dfeb]"
              }`}
              style={{ ["--home-delay" as string]: `${(0.3 + i * 0.07).toFixed(2)}s` } as CSSProperties}
            >
              {day.trained && (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4.5 10.5 8.5 14.5 15.5 6" />
                </svg>
              )}
              {day.together && (
                <span
                  className="absolute -left-[5px] -top-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                  role="img"
                  aria-label={t("trainedTogether")}
                >
                  <svg viewBox="0 0 20 20" className="h-[11px] w-[11px]" fill="#e0457b" aria-hidden>
                    <path d="M10 17.5s-6.5-4-6.5-9.2A3.7 3.7 0 0110 6.1a3.7 3.7 0 016.5 2.2c0 5.2-6.5 9.2-6.5 9.2z" />
                  </svg>
                </span>
              )}
            </span>
            <span className={`text-xs ${day.isToday ? "font-bold text-[#221a33]" : "font-medium text-[#6c6580]"}`}>
              {dayLabels[i]}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-[#f1edf5] pt-2.5 text-[13px] text-[#4f4960]">
        <span className={`h-2.5 w-2.5 flex-none rounded-full ${STAGE_DOT_CLASS[color]}`} />
        <span className="flex-none">{t("stage", { color: tColors(color) })}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f1edf5]">
          <div
            className="animate-home-fill h-full rounded-full"
            style={{ width: `${stagePercent}%`, background: STAGE_BAR_COLOR[color] }}
          />
        </div>
        <span dir="ltr" className="flex-none">
          {workoutsInStage}/{requiredWorkouts}
        </span>
      </div>
    </section>
  );
}
