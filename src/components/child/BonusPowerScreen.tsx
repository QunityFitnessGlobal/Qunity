"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import { BONUS_POWER_GOLD, BONUS_POWER_ICON, BONUS_POWER_RING, POWER_ICON } from "@/lib/powers";
import { COLOR_ORDER } from "@/services/progression.service";
import type { BraceletColor, Gender } from "@/lib/types";

interface BonusPowerScreenProps {
  onContinue: () => void;
  // Picks the girl or boy wording; masculine when unknown.
  gender?: Gender | null;
  // The bonus power's points; the chip is left out when unknown.
  bonusPoints?: number | null;
}

// A night-purple sky lit gold around the medallion: the journey's end.
const BACKGROUND =
  "radial-gradient(circle at 50% 30%, rgba(255,194,51,0.28), rgba(255,194,51,0) 55%), linear-gradient(180deg, #4a1772 0%, #2a0e4d 55%, #170a2e 100%)";
const MUTED = "#f3dcff";
const GOLD_TEXT = "#ffe08a";

// Bracelet white vanishes on white, so it's drawn in its outline shade.
function powerInk(color: BraceletColor): string {
  return color === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[color];
}

// Fixed rather than random so the confetti falls the same way every time
// (as on LevelUpScreen), in the five stage colors and gold.
const CONFETTI_COLORS = [
  "var(--color-reward-gold)",
  "var(--color-bracelet-orange)",
  "var(--color-bracelet-green)",
  "var(--color-bracelet-blue)",
  "#f0abfc",
  "#ffffff",
];
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  width: 7 + (i % 3) * 2,
  height: 12 + (i % 4) * 2,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  style: {
    "--spin": `${(i % 2 ? 1 : -1) * (240 + i * 20)}deg`,
    "--dur": `${(2.8 + (i % 5) * 0.4).toFixed(2)}s`,
    "--delay": `${((i % 9) * 0.3).toFixed(2)}s`,
  } as CSSProperties,
}));

// Pieces flying out of the medallion as the power appears, evenly around it.
const BURST = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const distance = 118 + (i % 3) * 22;
  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance),
    rot: (i % 2 ? 1 : -1) * (120 + i * 15),
    size: 8 + (i % 3) * 3,
    round: i % 2 === 0,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  };
});

function delay(seconds: number): CSSProperties {
  return { ["--power-fade-delay" as string]: `${seconds}s` } as CSSProperties;
}

// The end of the journey: finishing the last stage reveals the bonus power,
// "כוח ההצלחה". Like a stage power's reveal (PowerRevealScreen) — a box the
// child taps open, then the power bursts out with its name, code, sentence
// and place in the collection — but in gold, with confetti, and the five
// stages checked off on the way in.
export function BonusPowerScreen({ onContinue, gender, bonusPoints }: BonusPowerScreenProps) {
  const t = useTranslations("powers");
  const [opened, setOpened] = useState(false);
  const genderForm = gender ?? "male";
  const Icon = BONUS_POWER_ICON;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bonus-power-title"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden text-white"
      style={{ background: BACKGROUND }}
    >
      {CONFETTI.map((piece, i) => (
        <span
          key={i}
          aria-hidden
          className="animate-levelup-fall pointer-events-none absolute top-0 rounded-sm"
          style={{ ...piece.style, left: piece.left, width: piece.width, height: piece.height, backgroundColor: piece.color }}
        />
      ))}

      {!opened ? (
        <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-3.5 px-6 pb-8 pt-14 text-center">
          <div className="flex gap-2" role="img" aria-label={t("bonusPower.stagesDone")}>
            {COLOR_ORDER.map((color, i) => (
              <span
                key={color}
                className="animate-power-badge-pop flex h-[26px] w-[26px] items-center justify-center rounded-full"
                style={{
                  backgroundColor: BRACELET_CSS_VAR[color],
                  color: color === "white" ? "var(--color-bracelet-white-outline)" : "#ffffff",
                  boxShadow: color === "white" ? "inset 0 0 0 2px var(--color-bracelet-white-outline)" : undefined,
                  animationDelay: `${0.2 + i * 0.12}s`,
                }}
                aria-hidden
              >
                <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                </svg>
              </span>
            ))}
          </div>
          <span className="animate-power-fade-up text-sm font-semibold" style={{ color: MUTED, ...delay(0.3) }}>
            {t("bonusPower.eyebrow")}
          </span>
          <h1
            id="bonus-power-title"
            className="animate-power-badge-pop font-display text-[34px] font-bold leading-tight"
            style={{ animationDelay: "0.4s" }}
          >
            {t("bonusPower.boxTitle")}
          </h1>
          <p className="animate-power-fade-up max-w-[280px] text-[15px]" style={{ color: MUTED, ...delay(0.6) }}>
            {t("bonusPower.boxText")}
          </p>

          <div className="relative mt-4 flex h-[220px] w-[220px] items-center justify-center">
            <span
              className="animate-power-glow-pulse absolute inset-6 rounded-full bg-reward-gold blur-[32px]"
              aria-hidden
            />
            <button
              type="button"
              onClick={() => setOpened(true)}
              aria-label={t("openBox")}
              className="animate-power-badge-pop relative flex h-[158px] w-[158px] items-center justify-center overflow-hidden rounded-[36px] bg-gradient-to-br from-[#ffe08a] via-reward-gold to-[#f0a91a] shadow-[0_8px_0_#c98a06,0_18px_36px_rgba(0,0,0,0.35)] transition-transform active:scale-95"
              style={{ animationDelay: "0.7s" }}
            >
              <span className="animate-power-box-wiggle absolute inset-0 flex items-center justify-center">
                <span
                  className="animate-mystery-shine absolute -inset-x-[10%] -inset-y-[20%] bg-[linear-gradient(105deg,transparent_38%,rgba(255,255,255,0.8)_50%,transparent_62%)]"
                  aria-hidden
                />
                {/* A purple ribbon tied across the box. */}
                <span
                  className="absolute inset-0 bg-[linear-gradient(90deg,transparent_44%,rgba(163,40,148,0.9)_44%_56%,transparent_56%),linear-gradient(0deg,transparent_44%,rgba(163,40,148,0.9)_44%_56%,transparent_56%)]"
                  aria-hidden
                />
                <span
                  className="animate-mystery-bob relative flex h-[74px] w-[74px] items-center justify-center rounded-full bg-reward-gold-soft font-display text-[50px] font-bold text-reward-gold-ink shadow-[0_0_0_4px_var(--color-brand-purple)]"
                  aria-hidden
                >
                  ?
                </span>
              </span>
            </button>
          </div>

          <span className="animate-power-fade-up mt-4 flex items-center gap-2 text-[15px] font-semibold" style={delay(1.1)}>
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
          <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-2.5 px-6 pb-2 pt-10 text-center">
            <div className="relative flex h-[236px] w-[236px] flex-none items-center justify-center">
              <span
                className="animate-power-rays absolute inset-0 rounded-full bg-[repeating-conic-gradient(rgba(255,214,102,0.24)_0deg_9deg,transparent_9deg_30deg)] [mask-image:radial-gradient(circle,#000_30%,transparent_70%)]"
                aria-hidden
              />
              <span className="animate-power-glow-pulse absolute inset-11 rounded-full bg-reward-gold blur-[28px]" aria-hidden />
              <span
                className="animate-result-ringout absolute left-1/2 top-1/2 h-[130px] w-[130px] rounded-full border-4 border-[#ffe08a]"
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
              <div
                className="animate-power-badge-pop relative h-[152px] w-[152px] rounded-full p-[9px] shadow-[0_0_0_6px_rgba(255,255,255,0.16),0_14px_30px_rgba(0,0,0,0.4)]"
                style={{ background: BONUS_POWER_RING }}
              >
                <div
                  className="flex h-full w-full items-center justify-center rounded-full shadow-[inset_0_-4px_0_rgba(0,0,0,0.12)]"
                  style={{ background: BONUS_POWER_GOLD }}
                >
                  <div className="flex h-[90px] w-[90px] items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_3px_#f3e3b5]">
                    <Icon className="h-[54px] w-[54px] text-[#d99a0b]" aria-hidden />
                  </div>
                </div>
              </div>
            </div>

            <span className="animate-power-fade-up text-sm font-semibold" style={{ color: GOLD_TEXT, ...delay(0.5) }}>
              {t("bonusPower.discoveredLabel")}
            </span>
            <h1
              id="bonus-power-title"
              className="animate-power-badge-pop font-display text-[36px] font-bold leading-tight"
              style={{ animationDelay: "0.6s" }}
            >
              {t("success.name")}
            </h1>
            <span
              dir="ltr"
              className="animate-power-fade-up rounded-full bg-gradient-to-br from-[#ffe08a] to-reward-gold px-4 py-1 font-display text-[15px] font-bold tracking-[0.12em] text-reward-gold-on shadow-[inset_0_-2px_0_#d99a0b]"
              style={delay(0.8)}
            >
              {t("success.code")}
            </span>

            <div
              className="animate-power-fade-up mt-0.5 flex w-full flex-col items-center gap-1 rounded-[20px] border border-[#ffe08a]/45 bg-white/10 px-4 py-3.5"
              style={delay(1)}
            >
              <span className="text-xs font-semibold" style={{ color: MUTED }}>
                {t("quoteLabel")}
              </span>
              <span className="font-display text-[23px] font-semibold leading-snug">&quot;{t("success.quote")}&quot;</span>
            </div>

            <div className="animate-power-fade-up mt-0.5 flex flex-col items-center gap-2" style={delay(1.25)}>
              <span className="text-[13px] font-semibold" style={{ color: MUTED }}>
                {t("bonusPower.collection", { count: COLOR_ORDER.length, total: COLOR_ORDER.length })}
              </span>
              <div className="flex items-center gap-2">
                {COLOR_ORDER.map((color) => {
                  const SlotIcon = POWER_ICON[color];
                  return (
                    <span
                      key={color}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-white"
                      aria-hidden
                    >
                      <SlotIcon className="h-[19px] w-[19px]" style={{ color: powerInk(color) }} />
                    </span>
                  );
                })}
                <span className="w-1.5" aria-hidden />
                <span
                  className="animate-power-slot-new flex h-[50px] w-[50px] items-center justify-center rounded-full border-[3px] border-white"
                  style={{ background: BONUS_POWER_GOLD }}
                  aria-hidden
                >
                  <Icon className="h-6 w-6 text-white" />
                </span>
              </div>
            </div>

            {bonusPoints != null && bonusPoints > 0 && (
              <span
                className="animate-power-badge-pop mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-reward-gold-soft px-3.5 py-1.5 font-display text-sm font-semibold text-reward-gold-ink"
                style={{ animationDelay: "1.6s" }}
              >
                {t.rich("bonusPower.bonus", { points: bonusPoints, num: (chunks) => <bdi dir="ltr">{chunks}</bdi> })}
              </span>
            )}
          </div>

          <div
            className="animate-power-fade-up relative mx-auto w-full max-w-sm flex-none px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-2"
            style={delay(1.8)}
          >
            <button
              type="button"
              onClick={onContinue}
              autoFocus
              className="flex min-h-14 w-full items-center justify-center rounded-[18px] bg-white font-display text-[19px] font-bold text-[#4a1772] shadow-[0_4px_0_var(--color-reward-gold)] transition-transform active:translate-y-[3px]"
            >
              {t("bonusPower.continue")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
