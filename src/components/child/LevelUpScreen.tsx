"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { BRACELET_CSS_VAR, LEVEL_UP_THEME } from "@/lib/colors";
import type { BraceletColor } from "@/lib/types";

interface LevelUpScreenProps {
  // The stage just finished and the one just entered.
  fromColor: BraceletColor;
  toColor: BraceletColor;
  // What the finished stage added up to.
  workouts: number;
  points: number;
  onContinue: () => void;
}

const RING_RADIUS = 84;
const RING_CIRCUMFERENCE = 528;

// Fixed rather than random so the confetti falls the same way every time.
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  width: 7 + (i % 3) * 2,
  height: 12 + (i % 4) * 2,
  colorIndex: i % 5,
  style: {
    "--spin": `${(i % 2 ? 1 : -1) * (240 + i * 20)}deg`,
    "--dur": `${(2.6 + (i % 5) * 0.35).toFixed(2)}s`,
    "--delay": `${((i % 9) * 0.28).toFixed(2)}s`,
  } as CSSProperties,
}));

// The moment a child finishes a stage and enters the next one: shown over
// the workout result screen once its stage bar has filled. The new stage's
// power is only teased here — it's revealed by PowerRevealScreen at the start
// of the first workout of that stage.
export function LevelUpScreen({ fromColor, toColor, workouts, points, onContinue }: LevelUpScreenProps) {
  const t = useTranslations("levelUp");
  const tColors = useTranslations("colors");
  const theme = LEVEL_UP_THEME[toColor];
  const confettiColors = ["#ffffff", "var(--color-reward-gold)", BRACELET_CSS_VAR[fromColor], "var(--color-reward-gold-soft)", theme.muted];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
      className="fixed inset-0 z-50 flex flex-col items-center overflow-hidden text-white"
      style={{ background: `linear-gradient(180deg, ${theme.gradientFrom}, ${theme.gradientTo})` }}
    >
      {CONFETTI.map((piece, i) => (
        <span
          key={i}
          aria-hidden
          className="animate-levelup-fall pointer-events-none absolute top-0 rounded-sm"
          style={{
            ...piece.style,
            left: piece.left,
            width: piece.width,
            height: piece.height,
            backgroundColor: confettiColors[piece.colorIndex],
          }}
        />
      ))}

      <div className="relative z-[1] flex w-full max-w-sm flex-1 flex-col items-center gap-3.5 px-6 pb-4 pt-14">
        <p
          className="animate-power-fade-up text-sm font-semibold"
          style={{ color: theme.muted, ["--power-fade-delay" as string]: "0.1s" } as CSSProperties}
        >
          {t("completed", { color: tColors(fromColor) })}
        </p>
        <h1
          id="level-up-title"
          className="animate-power-badge-pop text-center font-display text-4xl font-bold leading-tight"
          style={{ animationDelay: "0.2s" }}
        >
          {t("title", { color: tColors(toColor) })}
        </h1>

        <div className="relative mt-1.5 h-[210px] w-[210px]">
          <span
            aria-hidden
            className="animate-power-glow-pulse absolute inset-5 rounded-full bg-white blur-2xl"
          />
          <svg
            width="210"
            height="210"
            viewBox="0 0 210 210"
            className="absolute inset-0 -rotate-90"
            aria-hidden
          >
            <circle cx="105" cy="105" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={16} />
            <circle
              cx="105"
              cy="105"
              r={RING_RADIUS}
              fill="none"
              stroke={BRACELET_CSS_VAR[fromColor]}
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              className="animate-levelup-unsweep"
            />
            <circle
              cx="105"
              cy="105"
              r={RING_RADIUS}
              fill="none"
              stroke="#ffffff"
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              className="animate-levelup-sweep"
            />
          </svg>
          <div
            className="animate-power-badge-pop absolute inset-[34px] flex flex-col items-center justify-center rounded-full shadow-[inset_0_0_0_4px_rgba(255,255,255,0.25)]"
            style={{ backgroundColor: theme.badge, animationDelay: "1.6s" }}
          >
            <span className="text-[13px]" style={{ color: theme.muted }}>
              {t("ringLabel")}
            </span>
            <span className="font-display text-[34px] font-bold">{tColors(toColor)}</span>
          </div>
        </div>

        <div
          className="animate-power-fade-up flex flex-wrap justify-center gap-2"
          style={{ ["--power-fade-delay" as string]: "2s" } as CSSProperties}
        >
          <span className="rounded-full bg-white/[0.18] px-3 py-1.5 text-sm font-semibold">{t("workouts", { count: workouts })}</span>
          <span className="rounded-full bg-white/[0.18] px-3 py-1.5 text-sm font-semibold">{t("points", { points })}</span>
        </div>

        <div
          className="animate-power-fade-up flex w-full items-center gap-3 rounded-2xl border border-white/25 bg-white/[0.14] p-3"
          style={{ ["--power-fade-delay" as string]: "2.2s" } as CSSProperties}
        >
          <span className="relative flex h-[52px] w-[52px] flex-none items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-br from-box-a to-box-b shadow-[0_3px_0_var(--color-box-edge)]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/70 to-transparent animate-mystery-shine"
            />
            <span className="relative inline-block font-display text-[30px] font-bold text-box-ink animate-mystery-bob">?</span>
          </span>
          <span className="flex flex-col gap-0.5 text-right">
            <span className="font-display text-[17px] font-semibold">{t("teaserTitle")}</span>
            <span className="text-[13px]" style={{ color: theme.muted }}>
              {t("teaserHint", { color: tColors(toColor) })}
            </span>
          </span>
        </div>
      </div>

      <div className="relative z-[1] w-full max-w-sm px-6 pb-6 pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="animate-power-fade-up block min-h-14 w-full rounded-2xl bg-white font-display text-[19px] font-bold shadow-[0_4px_0_rgba(0,0,0,0.28)] transition-[transform,box-shadow] active:translate-y-[3px] active:shadow-[0_1px_0_rgba(0,0,0,0.28)]"
          style={{ color: theme.buttonText, ["--power-fade-delay" as string]: "2.4s" } as CSSProperties}
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
