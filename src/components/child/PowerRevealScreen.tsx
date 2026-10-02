"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { BRACELET_CSS_VAR, LEVEL_UP_THEME } from "@/lib/colors";
import { POWER_ICON } from "@/lib/powers";
import { COLOR_ORDER } from "@/services/progression.service";
import type { BraceletColor, Gender } from "@/lib/types";

interface PowerRevealScreenProps {
  color: BraceletColor;
  onContinue: () => void;
  // Picks the girl or boy wording; masculine when unknown.
  gender?: Gender | null;
  // The "received power" challenge's bonus; the chip is left out when unknown.
  bonusPoints?: number | null;
}

// A soft light behind the box and the badge, in the stage's own hue.
const GLOW: Record<BraceletColor, string> = {
  white: "#ffffff",
  orange: "#ffb37a",
  green: "#86efac",
  blue: "#93c5fd",
  purple: "#f0abfc",
};

// Bracelet white vanishes on white, so it's drawn in its outline shade.
function powerInk(color: BraceletColor): string {
  return color === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[color];
}

const BURST_COLORS = ["#ffffff", "#ffc233", "#ff8a3d", "#ffffff", "#ffc233"];
// Pieces flying out of the badge as the power appears, evenly around it.
const BURST = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const distance = 110 + (i % 3) * 22;
  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance),
    rot: (i % 2 ? 1 : -1) * (120 + i * 15),
    size: 8 + (i % 3) * 3,
    round: i % 2 === 0,
    color: BURST_COLORS[i % BURST_COLORS.length],
  };
});

function delay(seconds: number): CSSProperties {
  return { ["--power-fade-delay" as string]: `${seconds}s` } as CSSProperties;
}

// The stage's power, discovered at the start of its first workout: a
// mystery box the child taps open, then the power bursts out — its name,
// code and sentence, where it sits in the collection of five, and the
// bonus it brings. Continuing goes straight into the workout's countdown.
export function PowerRevealScreen({ color, onContinue, gender, bonusPoints }: PowerRevealScreenProps) {
  const t = useTranslations("powers");
  const tColors = useTranslations("colors");
  const [opened, setOpened] = useState(false);
  const theme = LEVEL_UP_THEME[color];
  const genderForm = gender ?? "male";
  const Icon = POWER_ICON[color];
  const index = COLOR_ORDER.indexOf(color);
  const glow = GLOW[color];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden text-white"
      style={{ background: `linear-gradient(180deg, ${theme.gradientFrom}, ${theme.gradientTo})` }}
    >
      {!opened ? (
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-3.5 px-6 pb-8 pt-16 text-center">
          <span className="animate-power-fade-up text-sm font-semibold" style={{ color: theme.muted, ...delay(0.1) }}>
            {t("boxEyebrow", { color: tColors(color) })}
          </span>
          <h1 className="animate-power-badge-pop font-display text-[34px] font-bold leading-tight" style={{ animationDelay: "0.2s" }}>
            {t("boxTitle")}
          </h1>
          <p className="animate-power-fade-up max-w-[280px] text-[15px]" style={{ color: theme.muted, ...delay(0.4) }}>
            {t("boxText", { color: tColors(color) })}
          </p>

          <div className="relative mt-6 flex h-[220px] w-[220px] items-center justify-center">
            <span
              className="animate-power-glow-pulse absolute inset-6 rounded-full blur-[30px]"
              style={{ backgroundColor: glow }}
              aria-hidden
            />
            <button
              type="button"
              onClick={() => setOpened(true)}
              aria-label={t("openBox")}
              className="animate-power-badge-pop relative flex h-[158px] w-[158px] items-center justify-center overflow-hidden rounded-[36px] bg-gradient-to-br from-box-a to-box-b shadow-[0_8px_0_var(--color-box-edge),0_18px_36px_rgba(0,0,0,0.3)] transition-transform active:scale-95"
              style={{ animationDelay: "0.5s" }}
            >
              <span className="animate-power-box-wiggle absolute inset-0 flex items-center justify-center">
                <span
                  className="animate-mystery-shine absolute -inset-x-[10%] -inset-y-[20%] bg-[linear-gradient(105deg,transparent_38%,rgba(255,255,255,0.75)_50%,transparent_62%)]"
                  aria-hidden
                />
                <span className="animate-mystery-bob relative inline-block font-display text-[92px] font-bold leading-none text-box-ink" aria-hidden>
                  ?
                </span>
              </span>
            </button>
          </div>

          <span className="animate-power-fade-up mt-4 flex items-center gap-2 text-[15px] font-semibold" style={delay(1)}>
            <svg
              viewBox="0 0 24 24"
              className="animate-power-tap h-[22px] w-[22px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 11V5.5a1.5 1.5 0 013 0V11m0-1.5a1.5 1.5 0 013 0V11m0-.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-1a6 6 0 01-5.2-3L4.5 14a1.5 1.5 0 012.6-1.5L9 15" />
            </svg>
            {t("tapHint", { gender: genderForm })}
          </span>
        </div>
      ) : (
        <>
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-3 px-6 pb-3 pt-14 text-center">
            <div className="relative flex h-[230px] w-[230px] flex-none items-center justify-center">
              <span
                className="animate-power-rays absolute inset-0 rounded-full bg-[repeating-conic-gradient(rgba(255,255,255,0.16)_0deg_9deg,transparent_9deg_30deg)] [mask-image:radial-gradient(circle,#000_28%,transparent_70%)]"
                aria-hidden
              />
              <span
                className="animate-power-glow-pulse absolute inset-10 rounded-full blur-[26px]"
                style={{ backgroundColor: glow }}
                aria-hidden
              />
              <span
                className="animate-result-ringout absolute left-1/2 top-1/2 h-[120px] w-[120px] rounded-full border-4 border-white"
                aria-hidden
              />
              {BURST.map((piece, i) => (
                <span
                  key={i}
                  className="animate-result-burst absolute left-1/2 top-1/2"
                  style={
                    {
                      width: piece.size,
                      height: piece.size,
                      borderRadius: piece.round ? "50%" : 2,
                      backgroundColor: piece.color,
                      ["--dx" as string]: `${piece.dx}px`,
                      ["--dy" as string]: `${piece.dy}px`,
                      ["--rot" as string]: `${piece.rot}deg`,
                    } as CSSProperties
                  }
                  aria-hidden
                />
              ))}
              <div className="animate-power-badge-pop relative flex h-[136px] w-[136px] items-center justify-center rounded-full bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.22),0_14px_30px_rgba(0,0,0,0.28)]">
                <Icon className="h-[78px] w-[78px]" style={{ color: powerInk(color) }} aria-hidden />
              </div>
            </div>

            <span className="animate-power-fade-up text-sm font-semibold" style={{ color: theme.muted, ...delay(0.5) }}>
              {t("discoveredLabel")}
            </span>
            <h1 className="animate-power-badge-pop font-display text-[34px] font-bold leading-tight" style={{ animationDelay: "0.6s" }}>
              {t(`${color}.name`)}
            </h1>
            <span
              dir="ltr"
              className="animate-power-fade-up rounded-full bg-white px-4 py-1 font-display text-sm font-bold tracking-[0.12em]"
              style={{ color: theme.buttonText, ...delay(0.8) }}
            >
              {t(`${color}.code`)}
            </span>

            <div
              className="animate-power-fade-up mt-1 flex w-full flex-col items-center gap-1 rounded-[20px] border border-white/25 bg-white/[0.14] px-4 py-3.5"
              style={delay(1)}
            >
              <span className="text-xs font-semibold" style={{ color: theme.muted }}>
                {t("quoteLabel")}
              </span>
              <span className="font-display text-[21px] font-semibold leading-snug">
                &quot;{t(`${color}.quote`, { gender: genderForm })}&quot;
              </span>
            </div>

            <div className="animate-power-fade-up mt-1 flex flex-col items-center gap-2" style={delay(1.25)}>
              <span className="text-[13px] font-semibold" style={{ color: theme.muted }}>
                {t("collection", { count: index + 1, total: COLOR_ORDER.length })}
              </span>
              <div className="flex gap-2.5">
                {COLOR_ORDER.map((slotColor, i) => {
                  const SlotIcon = POWER_ICON[slotColor];
                  const isNew = i === index;
                  if (i > index) {
                    return (
                      <span
                        key={slotColor}
                        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 border-dashed border-white/40 bg-white/[0.12] font-display text-lg font-bold text-white/70"
                        aria-hidden
                      >
                        ?
                      </span>
                    );
                  }
                  return (
                    <span
                      key={slotColor}
                      className={`flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white ${
                        isNew ? "animate-power-slot-new border-[3px] border-reward-gold" : "border-2 border-white/70"
                      }`}
                      aria-hidden
                    >
                      <SlotIcon className="h-5 w-5" style={{ color: powerInk(slotColor) }} />
                    </span>
                  );
                })}
              </div>
            </div>

            {bonusPoints != null && bonusPoints > 0 && (
              <span
                className="animate-power-badge-pop mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-reward-gold-soft px-3.5 py-1.5 font-display text-sm font-semibold text-reward-gold-ink"
                style={{ animationDelay: "1.5s" }}
              >
                {t.rich("bonus", { points: bonusPoints, num: (chunks) => <bdi dir="ltr">{chunks}</bdi> })}
              </span>
            )}
          </div>

          <div className="animate-power-fade-up mx-auto w-full max-w-sm flex-none px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-2" style={delay(1.6)}>
            <button
              type="button"
              onClick={onContinue}
              className="flex min-h-14 w-full items-center justify-center rounded-[18px] bg-white font-display text-[19px] font-bold transition-transform active:translate-y-[3px]"
              style={{ color: theme.buttonText, boxShadow: `0 4px 0 ${theme.badge}` }}
            >
              {t("start", { gender: genderForm })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
