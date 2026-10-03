"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BRACELET_CSS_VAR, LEVEL_UP_THEME } from "@/lib/colors";
import { POWER_ICON } from "@/lib/powers";
import { COLOR_ORDER } from "@/services/progression.service";
import { FlameIcon } from "@/components/child/powerIcons";
import { StarIcon } from "@/components/child/journeyIcons";
import type { AchievementsData, PowerSlot } from "@/services/achievements.service";
import type { BraceletColor, Gender } from "@/lib/types";

interface AchievementsViewProps {
  data: AchievementsData;
  gender: Gender | null;
}

const MEDALLION = 300;
const CENTER = 128;
const SLOT = 48;
const RADIUS = 115;

// Bracelet white vanishes on white, so it's drawn in its outline shade.
function ink(color: BraceletColor): string {
  return color === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[color];
}

function isCollected(slot: PowerSlot): boolean {
  return slot.state === "earned" || slot.state === "current";
}

function delay(seconds: number): CSSProperties {
  return { ["--power-fade-delay" as string]: `${seconds}s` } as CSSProperties;
}

// "ההישגים שלי": the five stage powers set around a medallion — the newest
// collected one in the middle, collected ones in their colors, the current
// one pulsing, the rest "?" — with a caption for whichever is tapped, then
// the collection count, three totals and what's waiting next.
export function AchievementsView({ data, gender }: AchievementsViewProps) {
  const t = useTranslations("achievements");
  const tPowers = useTranslations("powers");
  const tColors = useTranslations("colors");
  const genderForm = gender ?? "male";

  const currentIndex = COLOR_ORDER.indexOf(data.currentColor);
  const collectedSlots = data.slots.filter(isCollected);
  const newest = collectedSlots.at(-1) ?? null;
  const [selected, setSelected] = useState<BraceletColor>(newest?.color ?? data.currentColor);
  const selectedSlot = data.slots.find((s) => s.color === selected) ?? data.slots[currentIndex];
  const CenterIcon = newest ? POWER_ICON[newest.color] : null;
  const centerTheme = LEVEL_UP_THEME[newest?.color ?? data.currentColor];

  const stateLabel = {
    earned: t("stateEarned"),
    current: t("stateCurrent"),
    waiting: t("stateWaiting"),
    locked: t("stateLocked"),
  }[selectedSlot.state];

  const nextColor = COLOR_ORDER[currentIndex + 1] ?? null;
  const currentWaiting = data.slots[currentIndex]?.state === "waiting";

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <header className="flex items-center gap-2.5">
        <Link
          href="/dashboard"
          aria-label={t("back")}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-zinc-200 bg-white text-[#4f4960]"
        >
          <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7.5 5l5 5-5 5" />
          </svg>
        </Link>
        <h1 className="font-display text-[26px] font-bold">{t("title")}</h1>
      </header>

      <div className="relative mx-auto" style={{ width: MEDALLION, height: MEDALLION }}>
        <div className="animate-achieve-spin absolute inset-[35px] rounded-full border-2 border-dashed border-[#e4dfeb]" aria-hidden />
        <div className="absolute" style={{ left: (MEDALLION - CENTER) / 2, top: (MEDALLION - CENTER) / 2, width: CENTER, height: CENTER }}>
          {newest && (
            <div
              className="animate-power-glow-pulse absolute -inset-1.5 rounded-full blur-[14px]"
              style={{ backgroundColor: BRACELET_CSS_VAR[newest.color] }}
              aria-hidden
            />
          )}
          <div
            className="animate-power-badge-pop relative flex h-full w-full items-center justify-center rounded-full shadow-[inset_0_0_0_5px_rgba(255,255,255,0.25)]"
            style={{
              background: newest
                ? `linear-gradient(145deg, ${centerTheme.gradientFrom}, ${centerTheme.gradientTo})`
                : "linear-gradient(160deg, var(--color-box-a), var(--color-box-b))",
            }}
          >
            <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-white">
              {CenterIcon && newest ? (
                <CenterIcon className="h-[46px] w-[46px]" style={{ color: ink(newest.color) }} aria-hidden />
              ) : (
                <span className="animate-mystery-bob inline-block font-display text-[44px] font-bold text-box-ink" aria-hidden>
                  ?
                </span>
              )}
            </div>
          </div>
        </div>

        {data.slots.map((slot, i) => {
          const angle = ((-90 + i * 72) * Math.PI) / 180;
          const Icon = POWER_ICON[slot.color];
          const open = isCollected(slot);
          const isSelected = slot.color === selected;
          const ringColor = slot.color === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[slot.color];
          return (
            <button
              key={slot.color}
              type="button"
              onClick={() => setSelected(slot.color)}
              aria-pressed={isSelected}
              aria-label={open ? tPowers(`${slot.color}.name`) : t("mysteryTitle")}
              className={`absolute flex items-center justify-center rounded-full ${
                slot.state === "current" ? "animate-achieve-pulse" : ""
              }`}
              style={{
                left: Math.round(MEDALLION / 2 + RADIUS * Math.cos(angle) - SLOT / 2),
                top: Math.round(MEDALLION / 2 + RADIUS * Math.sin(angle) - SLOT / 2),
                width: SLOT,
                height: SLOT,
                border: isSelected
                  ? "3px solid var(--color-brand-purple)"
                  : open
                    ? `2px solid ${ringColor}`
                    : "2px solid var(--color-box-edge)",
                background: !open
                  ? "linear-gradient(160deg, var(--color-box-a), var(--color-box-b))"
                  : slot.state === "current" && slot.color !== "white"
                    ? BRACELET_CSS_VAR[slot.color]
                    : "#ffffff",
                boxShadow: open ? "0 3px 8px rgba(52,30,99,0.18)" : "inset 0 -3px 0 var(--color-box-edge)",
              }}
            >
              {open ? (
                <Icon
                  className="h-6 w-6"
                  style={{ color: slot.state === "current" && slot.color !== "white" ? "#ffffff" : ink(slot.color) }}
                  aria-hidden
                />
              ) : (
                <span className="animate-mystery-bob inline-block font-display text-[22px] font-bold text-box-ink" aria-hidden>
                  ?
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div key={selected} className="animate-power-fade-up flex min-h-[78px] flex-col items-center gap-0.5 text-center">
        <span className={`text-[13px] font-semibold ${isCollected(selectedSlot) ? "text-brand-purple" : "text-box-ink"}`}>
          {t("captionStage", { color: tColors(selectedSlot.color), state: stateLabel })}
        </span>
        <span className="font-display text-[22px] font-bold">
          {isCollected(selectedSlot) ? tPowers(`${selectedSlot.color}.name`) : t("mysteryTitle")}
        </span>
        <span className="text-[15px] text-[#4f4960]">
          {isCollected(selectedSlot)
            ? `"${tPowers(`${selectedSlot.color}.quote`, { gender: genderForm })}"`
            : selectedSlot.state === "waiting"
              ? t("waitingLine")
              : t("lockedLine", { color: tColors(selectedSlot.color), gender: genderForm })}
        </span>
      </div>

      <span className="self-center rounded-full bg-brand-purple/[0.08] px-3.5 py-1.5 text-[13px] font-semibold text-[#7d1f72]">
        {t("collection", { count: data.collected, total: COLOR_ORDER.length })}
      </span>

      <div className="animate-power-fade-up mt-1.5 grid grid-cols-3 gap-2" style={delay(0.4)}>
        <Link href="/dashboard/journey" className="flex flex-col items-center gap-0.5 rounded-2xl bg-reward-gold-soft px-1 py-3 text-reward-gold-on">
          <StarIcon className="h-[22px] w-[22px] text-[#d99a0b]" aria-hidden />
          <span className="font-display text-[22px] font-bold tabular-nums">{data.stars}</span>
          <span className="text-xs text-[#5c4200]">{t("stars")}</span>
        </Link>
        <Link href="/dashboard/challenges" className="flex flex-col items-center gap-0.5 rounded-2xl bg-brand-purple/[0.08] px-1 py-3 text-[#5c1553]">
          <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" stroke="var(--color-brand-purple)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 17.5V3M5 3.5h9l-2 3.5 2 3.5H5" />
          </svg>
          <span className="font-display text-[22px] font-bold tabular-nums">{data.challenges}</span>
          <span className="text-xs">{t("challenges")}</span>
        </Link>
        <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-[#fff0e4] px-1 py-3 text-[#7c2d12]">
          <FlameIcon className="h-[22px] w-[22px] text-[#e85d1f]" aria-hidden />
          <span className="font-display text-[22px] font-bold tabular-nums">{data.longestStreak}</span>
          <span className="text-xs">{t("streak")}</span>
        </div>
      </div>

      <div
        className="animate-power-fade-up flex items-center gap-3 rounded-[18px] border border-zinc-200 bg-white px-3.5 py-3"
        style={delay(0.55)}
      >
        {!currentWaiting && !nextColor ? (
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-reward-gold text-reward-gold-on">
            <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 3.5h8V8a4 4 0 0 1-8 0zM6 5H3.5v1.5A2.5 2.5 0 0 0 6 9M14 5h2.5v1.5A2.5 2.5 0 0 1 14 9M10 12v3M7 17h6" />
            </svg>
          </span>
        ) : (
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-2 border-box-edge bg-gradient-to-br from-box-a to-box-b">
            <span className="animate-mystery-bob inline-block font-display text-xl font-bold text-box-ink" aria-hidden>
              ?
            </span>
          </span>
        )}
        <span className="flex flex-col gap-0.5">
          {currentWaiting ? (
            <>
              <span className="text-sm font-semibold">{t("waitingTitle", { color: tColors(data.currentColor) })}</span>
              <span className="text-[13px] text-text-muted">{t("waitingLine")}</span>
            </>
          ) : nextColor ? (
            <>
              <span className="text-sm font-semibold">{t("nextTitle", { color: tColors(nextColor) })}</span>
              <span className="text-[13px] text-text-muted">
                {data.workoutsLeft > 0 && data.pointsLeft > 0
                  ? t("nextBoth", { workouts: data.workoutsLeft, points: data.pointsLeft })
                  : data.workoutsLeft > 0
                    ? t("nextWorkouts", { workouts: data.workoutsLeft })
                    : data.pointsLeft > 0
                      ? t("nextPoints", { points: data.pointsLeft })
                      : t("nextAlmost")}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold">{t("allTitle")}</span>
              <span className="text-[13px] text-text-muted">{t("allLine", { gender: genderForm })}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
