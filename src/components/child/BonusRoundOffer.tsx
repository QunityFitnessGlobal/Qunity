"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExerciseDemo } from "@/components/child/ExerciseDemo";
import { ExerciseImage } from "@/components/child/ExerciseImage";
import { motionFor } from "@/lib/exercise-motion/library";
import { BONUS_ROUND_POINTS } from "@/services/points.service";
import type { Exercise } from "@/lib/types";

interface BonusRoundOfferProps {
  // The workout's exercises (each once): the child picks one for the round.
  exercises: Exercise[];
  rounds: number;
  // How long the round is: one work set of the stage.
  seconds: number;
  onAccept: (exercise: Exercise) => void;
  onDecline: () => void;
}

const STAR_PATH = "M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z";

// When the whole timer ran out: one more set, of an exercise the child
// picks, for +5 — a popup in the middle of the screen over the finished
// timer. The picked tile moves; the others hold their telling moment.
export function BonusRoundOffer({ exercises, rounds, seconds, onAccept, onDecline }: BonusRoundOfferProps) {
  const t = useTranslations("workout.bonus");
  const locale = useLocale();
  const [picked, setPicked] = useState(exercises[0]?.id ?? null);
  const chosen = exercises.find((e) => e.id === picked) ?? exercises[0];
  const nameOf = (e: Exercise) => (locale === "en" ? e.name_en : e.name_he);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#221a33]/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bonus-round-title"
        className="animate-power-badge-pop flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col items-center gap-2.5 overflow-y-auto rounded-[26px] bg-skin-surface px-[18px] pb-3 pt-[22px] text-center shadow-[0_20px_50px_rgba(34,26,51,0.25)]"
      >
        <span className="flex h-[58px] w-[58px] flex-none items-center justify-center rounded-full bg-reward-gold shadow-[inset_0_-3px_0_#d99a0b,0_0_0_6px_var(--color-reward-gold-soft)]">
          <svg viewBox="0 0 20 20" className="h-[30px] w-[30px]" aria-hidden>
            <path d={STAR_PATH} fill="#ffffff" />
          </svg>
        </span>
        <span className="mt-1 text-[13px] font-semibold text-skin-work-label">{t("allSetsDone", { rounds })}</span>
        <h2 id="bonus-round-title" className="font-display text-[26px] font-bold leading-tight">
          {t("offerTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-skin-muted">
          {t.rich("offerText", {
            seconds,
            points: BONUS_ROUND_POINTS,
            b: (chunks) => <b className="text-skin-gold-ink">{chunks}</b>,
            num: (chunks) => <bdi dir="ltr">{chunks}</bdi>,
          })}
        </p>

        <span className="mt-0.5 self-stretch text-start text-[13px] font-semibold text-skin-ink-2">{t("pickLabel")}</span>
        <div className="grid grid-cols-2 gap-2 self-stretch">
          {exercises.map((exercise) => {
            const on = exercise.id === chosen?.id;
            const motion = motionFor(exercise.id);
            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setPicked(exercise.id)}
                aria-pressed={on}
                className={`relative flex flex-col overflow-hidden rounded-[14px] bg-skin-surface text-start ${
                  on
                    ? "border-[2.5px] border-skin-accent shadow-[0_4px_12px_rgba(163,40,148,0.18)]"
                    : "border border-skin-line"
                }`}
              >
                {motion ? (
                  <ExerciseDemo
                    motion={motion}
                    still={!on}
                    showAngle={false}
                    showPrints={false}
                    className="w-full"
                  />
                ) : (
                  <ExerciseImage
                    imageUrl={exercise.image_url}
                    alt=""
                    className="aspect-video w-full"
                    figureClassName="h-8 w-8"
                  />
                )}
                <span className="truncate px-2 pb-[7px] pt-[5px] text-[12.5px] font-semibold">{nameOf(exercise)}</span>
                {on && (
                  <span
                    className="absolute end-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-skin-accent text-white shadow-[0_0_0_2px_var(--skin-surface)]"
                    aria-hidden
                  >
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => chosen && onAccept(chosen)}
          autoFocus
          className="mt-1.5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-green-600 font-display text-[19px] font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-transform hover:bg-green-700 active:translate-y-[3px]"
        >
          {t("accept")}
          <span dir="ltr" className="rounded-full bg-white/20 px-2.5 py-px text-sm">
            +{BONUS_ROUND_POINTS}
          </span>
        </button>
        <button type="button" onClick={onDecline} className="min-h-11 px-4 text-sm font-semibold text-skin-muted">
          {t("decline")}
        </button>
      </div>
    </div>
  );
}
