import type { CSSProperties } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BRACELET_CSS_VAR, LEVEL_UP_THEME } from "@/lib/colors";
import { POWER_ICON } from "@/lib/powers";
import { COLOR_ORDER } from "@/services/progression.service";
import { BASE_POINTS } from "@/services/points.service";
import { EnergyMeter } from "@/components/child/EnergyMeter";
import { PointsCounter } from "@/components/child/PointsCounter";
import { ChildCodeCard } from "@/components/ChildCodeCard";
import { FlameIcon } from "@/components/child/powerIcons";
import { LockIcon } from "@/components/child/journeyIcons";
import type { BraceletColor, Gender } from "@/lib/types";

interface ChildHomeViewProps {
  name: string | null;
  gender: Gender | null;
  color: BraceletColor;
  totalPoints: number;
  lastWorkoutPoints: number;
  streakDays: number;
  encouragement: string;
  workoutsDone: number;
  requiredWorkouts: number;
  pointsLeft: number;
  progressPercent: number;
  powerRevealed: boolean;
  nextWorkout: { id: string; number: number } | null;
  // Shown inline only the first time the child opens the app.
  childCode: string | null;
}

// Bracelet white vanishes on white, so it's drawn in its outline shade.
function stageColor(color: BraceletColor): string {
  return color === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[color];
}

// A streak only reads as one from two days on.
const MIN_STREAK_SHOWN = 2;

// The child's home: who they are and their power, the points pile, how far
// along the current stage they are, and the one next thing to do.
export async function ChildHomeView({
  name,
  gender,
  color,
  totalPoints,
  lastWorkoutPoints,
  streakDays,
  encouragement,
  workoutsDone,
  requiredWorkouts,
  pointsLeft,
  progressPercent,
  powerRevealed,
  nextWorkout,
  childCode,
}: ChildHomeViewProps) {
  const t = await getTranslations("home");
  const tColors = await getTranslations("colors");
  const tPowers = await getTranslations("powers");
  const tNext = await getTranslations("nextWorkout");

  const PowerIcon = POWER_ICON[color];
  const theme = LEVEL_UP_THEME[color];
  const nextColor = COLOR_ORDER[COLOR_ORDER.indexOf(color) + 1] ?? null;
  const workoutsLeft = Math.max(0, requiredWorkouts - workoutsDone);
  const target = nextColor ? t("targetNextStage", { color: tColors(nextColor) }) : t("targetFinishStage");
  const remaining =
    workoutsLeft > 0 && pointsLeft > 0
      ? t("remainingBoth", { workouts: workoutsLeft, points: pointsLeft, target })
      : workoutsLeft > 0
        ? t("remainingWorkouts", { workouts: workoutsLeft, target })
        : pointsLeft > 0
          ? t("remainingPoints", { points: pointsLeft, target })
          : null;

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-[26px] font-bold">{name ? t("greeting", { name }) : null}</h1>
        {streakDays >= MIN_STREAK_SHOWN && (
          <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-[#fff0e4] px-3 py-1.5 text-sm font-semibold text-[#b9530f]">
            <FlameIcon className="animate-home-flicker h-[18px] w-[18px]" aria-hidden />
            {t("streak", { count: streakDays })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3.5">
        <div className="relative h-24 w-24 flex-none">
          <div
            className="animate-power-glow-pulse absolute inset-0 rounded-full blur-md"
            style={{ backgroundColor: stageColor(color) }}
          />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full border-[5px] bg-zinc-100 font-display text-4xl font-semibold text-zinc-600"
            style={{ borderColor: stageColor(color) }}
          >
            {name?.trim().charAt(0)}
          </div>
          {powerRevealed && (
            <div className="animate-power-badge-pop absolute -end-1 -top-1 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white shadow-md">
              <PowerIcon className="h-5 w-5" style={{ color: stageColor(color) }} />
            </div>
          )}
        </div>
        <div
          className="animate-power-fade-up relative flex-1 rounded-2xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-relaxed shadow-[0_4px_14px_rgba(52,30,99,0.07)]"
          style={{ ["--power-fade-delay" as string]: "0.4s" } as CSSProperties}
        >
          <span
            aria-hidden
            className="absolute -right-[7px] top-[38px] h-3 w-3 rotate-45 border-r border-t border-zinc-200 bg-white"
          />
          <span className="relative">{encouragement}</span>
        </div>
      </div>

      <PointsCounter
        total={totalPoints}
        lastWorkoutPoints={lastWorkoutPoints}
        label={t("myPoints")}
        lastWorkoutLabel={t("lastWorkout")}
      />

      <section className="flex flex-col gap-2.5 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">{t("stageTitle", { color: tColors(color) })}</span>
          <span className="text-text-muted">{t("stageWorkouts", { done: workoutsDone, total: requiredWorkouts })}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex-1">
            <EnergyMeter percent={progressPercent} color={color} />
          </div>
          {nextColor && (
            <span
              role="img"
              aria-label={t("nextStage", { color: tColors(nextColor) })}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full border-[3px] bg-white"
              style={{ borderColor: BRACELET_CSS_VAR[nextColor] }}
            >
              <LockIcon className="h-3.5 w-3.5 text-zinc-600" />
            </span>
          )}
        </div>
        {remaining && <span className="text-[13px] text-text-muted">{remaining}</span>}
      </section>

      {powerRevealed && (
        <section
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-white"
          style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})` }}
        >
          <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-white">
            <PowerIcon className="h-6 w-6" style={{ color: theme.gradientFrom }} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold tracking-wide" style={{ color: theme.muted }}>
              {t("powerLabel", { code: tPowers(`${color}.code`) })}
            </span>
            <span className="font-display text-lg font-semibold">
              &quot;{tPowers(`${color}.quote`, { gender: gender ?? "male" })}&quot;
            </span>
          </span>
        </section>
      )}

      {childCode && <ChildCodeCard code={childCode} />}

      {nextWorkout ? (
        <section className="flex flex-col gap-3 rounded-[20px] border border-zinc-200 bg-white px-4 py-3.5 shadow-[0_6px_18px_rgba(52,30,99,0.08)]">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-brand-purple/10 px-2.5 py-1 text-[13px] font-semibold text-brand-purple">
              {t("nextMission")}
            </span>
            <span className="rounded-full bg-reward-gold-soft px-2.5 py-1 font-display text-[13px] font-semibold text-reward-gold-ink">
              {t.rich("missionPoints", {
                points: BASE_POINTS,
                num: (chunks) => <bdi dir="ltr">{chunks}</bdi>,
              })}
            </span>
          </div>
          <span className="font-display text-xl font-semibold">
            {t("missionTitle", { number: nextWorkout.number, color: tColors(color) })}
          </span>
          <Link
            href={`/workout/${nextWorkout.id}`}
            className="animate-go-pulse flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-600 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-[transform,box-shadow] hover:bg-green-700 active:translate-y-[3px]"
          >
            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
              <path d="M14 4 4 10l10 6V4z" />
            </svg>
            {t("go")}
          </Link>
        </section>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
          <p className="text-text-muted">{tNext("none")}</p>
        </div>
      )}
    </div>
  );
}
