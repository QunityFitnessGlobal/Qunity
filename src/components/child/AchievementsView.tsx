"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BRACELET_CSS_VAR, LEVEL_UP_THEME } from "@/lib/colors";
import { BONUS_POWER_GOLD, BONUS_POWER_ICON, BONUS_POWER_RING, POWER_ICON } from "@/lib/powers";
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
const BONUS_SLOT = 52;
const RADIUS = 115;

// Six places evenly around the ring: the five stages clockwise from the top,
// then the bonus power, right after the last stage — closing the circle.
function ringPlace(index: number, size: number) {
  const angle = ((-90 + index * 60) * Math.PI) / 180;
  return {
    left: Math.round(MEDALLION / 2 + RADIUS * Math.cos(angle) - size / 2),
    top: Math.round(MEDALLION / 2 + RADIUS * Math.sin(angle) - size / 2),
  };
}

// Bracelet white vanishes on white, so it's drawn in its outline shade.
function ink(color: BraceletColor): string {
  return color === "white" ? "var(--skin-stage-white)" : BRACELET_CSS_VAR[color];
}

function isCollected(slot: PowerSlot): boolean {
  return slot.state === "earned" || slot.state === "current";
}

function delay(seconds: number): CSSProperties {
  return { ["--power-fade-delay" as string]: `${seconds}s` } as CSSProperties;
}

// "ההישגים שלי": the five stage powers set around a medallion — the newest
// collected one in the middle, collected ones in their colors, the current
// one pulsing, the rest "?" — and after them the gold bonus power, a secret
// until the last stage is finished; with a caption for whichever is tapped,
// then the collection count, three totals and what's waiting next.
export function AchievementsView({ data, gender }: AchievementsViewProps) {
  const t = useTranslations("achievements");
  const tPowers = useTranslations("powers");
  const tColors = useTranslations("colors");
  const genderForm = gender ?? "male";

  const currentIndex = COLOR_ORDER.indexOf(data.currentColor);
  const collectedSlots = data.slots.filter(isCollected);
  const newest = collectedSlots.at(-1) ?? null;
  const [selected, setSelected] = useState<BraceletColor | "bonus">(
    data.bonusPower ? "bonus" : (newest?.color ?? data.currentColor),
  );
  const bonusSelected = selected === "bonus";
  const selectedSlot = data.slots.find((s) => s.color === selected) ?? data.slots[currentIndex];
  const BonusIcon = BONUS_POWER_ICON;
  const bonusPlace = ringPlace(COLOR_ORDER.length, BONUS_SLOT);
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
  const remainingLine =
    data.workoutsLeft > 0 && data.pointsLeft > 0
      ? t("nextBoth", { workouts: data.workoutsLeft, points: data.pointsLeft })
      : data.workoutsLeft > 0
        ? t("nextWorkouts", { workouts: data.workoutsLeft })
        : data.pointsLeft > 0
          ? t("nextPoints", { points: data.pointsLeft })
          : t("nextAlmost");

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <header className="flex items-center gap-2.5">
        <Link
          href="/dashboard"
          aria-label={t("back")}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-skin-line bg-skin-surface text-skin-ink-2"
        >
          <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7.5 5l5 5-5 5" />
          </svg>
        </Link>
        <h1 className="font-display text-[26px] font-bold">{t("title")}</h1>
      </header>

      <div className="relative mx-auto" style={{ width: MEDALLION, height: MEDALLION }}>
        <div className="animate-achieve-spin absolute inset-[35px] rounded-full border-2 border-dashed border-skin-line" aria-hidden />
        <div className="absolute" style={{ left: (MEDALLION - CENTER) / 2, top: (MEDALLION - CENTER) / 2, width: CENTER, height: CENTER }}>
          {data.bonusPower ? (
            <>
              <div className="animate-power-glow-pulse absolute -inset-1.5 rounded-full bg-reward-gold blur-[14px]" aria-hidden />
              <div
                className="animate-power-badge-pop relative flex h-full w-full items-center justify-center rounded-full p-[7px] shadow-[inset_0_0_0_5px_rgba(255,255,255,0.25)]"
                style={{ background: BONUS_POWER_RING }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-full" style={{ background: BONUS_POWER_GOLD }}>
                  <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-skin-surface">
                    <BonusIcon className="h-[46px] w-[46px] text-[#d99a0b]" aria-hidden />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
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
                <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-skin-surface">
                  {CenterIcon && newest ? (
                    <CenterIcon className="h-[46px] w-[46px]" style={{ color: ink(newest.color) }} aria-hidden />
                  ) : (
                    <span className="animate-mystery-bob inline-block font-display text-[44px] font-bold text-box-ink" aria-hidden>
                      ?
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {data.slots.map((slot, i) => {
          const place = ringPlace(i, SLOT);
          const Icon = POWER_ICON[slot.color];
          const open = isCollected(slot);
          const isSelected = slot.color === selected;
          const ringColor = slot.color === "white" ? "var(--skin-stage-white)" : BRACELET_CSS_VAR[slot.color];
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
                left: place.left,
                top: place.top,
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

        <button
          type="button"
          onClick={() => setSelected("bonus")}
          aria-pressed={bonusSelected}
          aria-label={data.bonusPower ? tPowers("success.name") : t("bonusTitleLocked")}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            left: bonusPlace.left,
            top: bonusPlace.top,
            width: BONUS_SLOT,
            height: BONUS_SLOT,
            border: bonusSelected ? "3px solid var(--color-brand-purple)" : "2px solid #d99a0b",
            background: data.bonusPower ? BONUS_POWER_GOLD : "linear-gradient(160deg, #ffe08a, var(--color-reward-gold))",
            boxShadow: data.bonusPower
              ? "0 4px 10px rgba(217,154,11,0.45)"
              : "inset 0 -3px 0 #d99a0b, 0 0 14px rgba(255,194,51,0.6)",
          }}
        >
          {data.bonusPower ? (
            <BonusIcon className="h-[26px] w-[26px] text-white" aria-hidden />
          ) : (
            <span className="animate-mystery-bob inline-block font-display text-2xl font-bold text-reward-gold-ink" aria-hidden>
              ?
            </span>
          )}
        </button>
        <span
          className="pointer-events-none absolute w-[52px] text-center text-[11px] font-bold text-skin-gold-ink"
          style={{ left: bonusPlace.left + BONUS_SLOT / 2 - 26, top: bonusPlace.top + BONUS_SLOT + 1 }}
          aria-hidden
        >
          {t("bonusLabel")}
        </span>
      </div>

      <div key={selected} className="animate-power-fade-up flex min-h-[78px] flex-col items-center gap-0.5 text-center">
        {bonusSelected ? (
          <>
            <span className="text-[13px] font-semibold text-skin-gold-ink">
              {t(data.bonusPower ? "bonusCaptionEarned" : "bonusCaptionLocked")}
            </span>
            <span className="font-display text-[22px] font-bold">
              {data.bonusPower ? tPowers("success.name") : t("bonusTitleLocked")}
            </span>
            <span className="text-[15px] text-skin-ink-2">
              {data.bonusPower ? `"${tPowers("success.quote")}"` : t("bonusLockedLine", { gender: genderForm })}
            </span>
          </>
        ) : (
          <>
            <span className={`text-[13px] font-semibold ${isCollected(selectedSlot) ? "text-skin-accent-ink" : "text-box-ink"}`}>
              {t("captionStage", { color: tColors(selectedSlot.color), state: stateLabel })}
            </span>
            <span className="font-display text-[22px] font-bold">
              {isCollected(selectedSlot) ? tPowers(`${selectedSlot.color}.name`) : t("mysteryTitle")}
            </span>
            <span className="text-[15px] text-skin-ink-2">
              {isCollected(selectedSlot)
                ? `"${tPowers(`${selectedSlot.color}.quote`, { gender: genderForm })}"`
                : selectedSlot.state === "waiting"
                  ? t("waitingLine")
                  : t("lockedLine", { color: tColors(selectedSlot.color), gender: genderForm })}
            </span>
          </>
        )}
      </div>

      <span className="self-center rounded-full bg-skin-accent/[0.08] px-3.5 py-1.5 text-[13px] font-semibold text-skin-accent-deep">
        {t("collection", { count: data.collected, total: COLOR_ORDER.length })}{" "}
        <span className="text-skin-gold-ink">{t(data.bonusPower ? "bonusCollected" : "bonusSecret")}</span>
      </span>

      <div className="animate-power-fade-up mt-1.5 grid grid-cols-3 gap-2" style={delay(0.4)}>
        <Link href="/dashboard/journey" className="flex flex-col items-center gap-0.5 rounded-2xl bg-reward-gold-soft px-1 py-3 text-reward-gold-on">
          <StarIcon className="h-[22px] w-[22px] text-[#d99a0b]" aria-hidden />
          <span className="font-display text-[22px] font-bold tabular-nums">{data.stars}</span>
          <span className="text-xs text-[#5c4200]">{t("stars")}</span>
        </Link>
        <Link href="/dashboard/challenges" className="flex flex-col items-center gap-0.5 rounded-2xl bg-skin-accent/[0.08] px-1 py-3 text-skin-accent-deep">
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
        className="animate-power-fade-up flex items-center gap-3 rounded-[18px] border border-skin-line bg-skin-surface px-3.5 py-3"
        style={delay(0.55)}
      >
        {!currentWaiting && !nextColor ? (
          data.bonusPower ? (
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ background: BONUS_POWER_GOLD }}>
              <BonusIcon className="h-6 w-6 text-white" aria-hidden />
            </span>
          ) : (
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#ffe08a] to-reward-gold shadow-[inset_0_-3px_0_#d99a0b]">
              <span className="animate-mystery-bob inline-block font-display text-xl font-bold text-reward-gold-ink" aria-hidden>
                ?
              </span>
            </span>
          )
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
              <span className="text-[13px] text-skin-muted">{t("waitingLine")}</span>
            </>
          ) : nextColor ? (
            <>
              <span className="text-sm font-semibold">{t("nextTitle", { color: tColors(nextColor) })}</span>
              <span className="text-[13px] text-skin-muted">{remainingLine}</span>
            </>
          ) : data.bonusPower ? (
            <>
              <span className="text-sm font-semibold">{t("bonusAllTitle")}</span>
              <span className="text-[13px] text-skin-muted">{t("bonusAllLine")}</span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold">{t("bonusNextTitle")}</span>
              <span className="text-[13px] text-skin-muted">{remainingLine}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
