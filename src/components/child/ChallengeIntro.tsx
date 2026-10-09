"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { StairsIcon } from "@/components/child/challengeIcons";
import { ReadyCountdownOverlay, type CountdownStep } from "@/components/child/ReadyCountdown";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import type { BraceletColor, Gender } from "@/lib/types";

interface ChallengeIntroProps {
  title: string;
  description: string | null;
  // The most a single run pays.
  bonusPoints: number;
  color: BraceletColor | null;
  colorLabel: string | null;
  // Most points from one run so far.
  bestPoints: number | null;
  timesDone: number;
  gender: Gender | null;
  error: string | null;
  countdown: CountdownStep | null;
  onReady: () => void;
}

// Bracelet white vanishes on white, so it's drawn in its outline shade.
function stageInk(color: BraceletColor | null): string {
  if (!color) return "var(--color-brand-purple)";
  return color === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[color];
}

// Before a challenge: which stage it belongs to, what to do, the most it
// pays each time, and the child's best so far — then the same "I'm ready"
// and 3-2-1 as a workout.
export function ChallengeIntro({
  title,
  description,
  bonusPoints,
  color,
  colorLabel,
  bestPoints,
  timesDone,
  gender,
  error,
  countdown,
  onReady,
}: ChallengeIntroProps) {
  const t = useTranslations("challengeRunner");
  const tWorkout = useTranslations("workout");
  const genderForm = gender ?? "male";
  const ink = stageInk(color);

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-y-auto bg-[#faf8fc]">
      <header className="flex-none bg-white px-4 pb-3.5 pt-5 shadow-[0_1px_0_#ece6f2]">
        <div className="mx-auto flex max-w-sm flex-col gap-2">
          <span className="text-[13px] font-semibold" style={{ color: ink }}>
            {colorLabel ? t("eyebrow", { color: colorLabel }) : t("eyebrowPlain")}
          </span>
          <h1 className="font-display text-[26px] font-bold leading-tight">{title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-reward-gold-soft px-2.5 py-1 font-display text-[13px] font-semibold text-reward-gold-ink">
              {t.rich("upToPoints", { points: bonusPoints, num: (chunks) => <bdi dir="ltr">{chunks}</bdi> })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1edf5] px-2.5 py-1 text-[13px] font-medium">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15.5 8A6 6 0 004.6 6.5M4.5 3v3.5H8M4.5 12a6 6 0 0010.9 1.5M15.5 17v-3.5H12" />
              </svg>
              {t("repeatable")}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-3 px-4 py-4">
        <section
          className="animate-power-fade-up flex items-center gap-3.5 rounded-[20px] border border-zinc-200 bg-white px-4 py-4"
          style={{ ["--power-fade-delay" as string]: "0.1s" } as CSSProperties}
        >
          <span className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-reward-gold-soft">
            <StairsIcon className="h-9 w-9 text-reward-gold-ink" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-semibold text-text-muted">{t("missionLabel")}</span>
            {description && <span className="font-display text-[17px] font-semibold leading-snug">{description}</span>}
          </span>
        </section>

        {timesDone > 0 && bestPoints !== null ? (
          <div
            className="animate-power-fade-up grid grid-cols-2 gap-2.5"
            style={{ ["--power-fade-delay" as string]: "0.2s" } as CSSProperties}
          >
            <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-reward-gold-soft px-3 py-3">
              <span className="text-[12px] font-semibold text-reward-gold-ink">{t("bestLabel")}</span>
              <span className="font-display text-xl font-bold text-reward-gold-on">{t("bestPoints", { points: bestPoints })}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-brand-purple/[0.08] px-3 py-3">
              <span className="text-[12px] font-semibold text-brand-purple">{t("timesLabel")}</span>
              <span className="font-display text-xl font-bold text-[#5c1553]">{t("times", { count: timesDone })}</span>
            </div>
          </div>
        ) : (
          <p
            className="animate-power-fade-up rounded-2xl bg-brand-purple/[0.07] px-3.5 py-3 text-center text-sm font-semibold text-[#5c1f54]"
            style={{ ["--power-fade-delay" as string]: "0.2s" } as CSSProperties}
          >
            {t("firstTime")}
          </p>
        )}

        <div
          className="animate-power-fade-up flex items-start gap-2.5 rounded-2xl bg-brand-purple/[0.07] px-3 py-2.5 text-[13px] text-[#5c1f54]"
          style={{ ["--power-fade-delay" as string]: "0.3s" } as CSSProperties}
        >
          <svg viewBox="0 0 20 20" className="mt-px h-[18px] w-[18px] flex-none fill-brand-purple" aria-hidden>
            <path d="M10 1c0 4 1.5 6.5 5.5 7.5-4 1-5.5 3.5-5.5 7.5 0-4-1.5-6.5-5.5-7.5C8.5 7.5 10 5 10 1z" />
          </svg>
          <span>
            <b>{tWorkout("tip")}:</b> {t("tip")}
          </span>
        </div>
      </main>

      <footer className="sticky bottom-0 flex-none bg-gradient-to-t from-[#faf8fc] from-70% to-transparent px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3">
        <div className="mx-auto max-w-sm space-y-2">
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={onReady}
            disabled={countdown !== null}
            className="animate-go-pulse block min-h-14 w-full rounded-[18px] bg-green-600 font-display text-xl font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-transform hover:bg-green-700 active:translate-y-[3px]"
          >
            {tWorkout("ready", { gender: genderForm })}
          </button>
        </div>
      </footer>

      <ReadyCountdownOverlay step={countdown} />
    </div>
  );
}
