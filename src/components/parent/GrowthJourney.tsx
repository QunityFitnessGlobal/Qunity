"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { recordMoment } from "@/services/moments.service";
import { badgeStates, parentStage, type BadgeKey } from "@/lib/parent-journey";
import type { Gender } from "@/lib/types";

export interface PracticeTipView {
  ruleId: string;
  // The principle as stored (parent_tip_rules.principle.he), for the badges.
  principle: string;
  principleLabel: string;
  doText: string | null;
  quote: string;
  why: string | null;
  saidToday: boolean;
}

interface GrowthJourneyProps {
  totalMoments: number;
  countsByPrinciple: Record<string, number>;
  // Tips already marked today, and adding (or, when saving fails, taking
  // back) a moment; they live with EmpowermentView so the chat's count too.
  triedToday: string[];
  onCount: (principle: string, by: number, ruleId: string) => void;
  practice: PracticeTipView[];
  parentGender: Gender | null;
  parentId: string;
  childId: string;
}

const BADGE_ICON: Record<BadgeKey, string> = {
  listening: "M7 13.5c0 1.8 1.3 3 2.8 3 1.6 0 2.4-1.2 2.9-2.4.5-1.3 2.3-2.3 2.3-5A5 5 0 0 0 5 9M8 9a2 2 0 1 1 4 .2",
  encouraging: "M10 16.5s-6-3.7-6-8.2A3.3 3.3 0 0 1 10 6a3.3 3.3 0 0 1 6 2.3c0 4.5-6 8.2-6 8.2z",
  consistent: "M5 17.5V3M5 3.5h9l-2 3.5 2 3.5H5",
  believing: "M10 2.8l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5L2.8 8l5-.6z",
  partner:
    "M7.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM13.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 16.5c.4-2.9 2.2-4.8 4.5-4.8s4.1 1.9 4.5 4.8M12.5 12.2c2.3-.3 4.2 1.3 4.5 4.3",
};

const RING = 2 * Math.PI * 34;

// The empowerment screen's top: the parent's journey (a ring toward the
// next stage and a badge per principle) and "רגע של העצמה", a sentence to
// practice. "ניסיתי את זה" records a moment (parent_tip_moments) and the
// ring and badges move with it right away.
export function GrowthJourney({
  totalMoments,
  countsByPrinciple,
  triedToday,
  onCount,
  practice,
  parentGender,
  parentId,
  childId,
}: GrowthJourneyProps) {
  const t = useTranslations("parentGrowth");
  const [index, setIndex] = useState(0);
  // Bumped on every move so the sentence slides in again.
  const [turn, setTurn] = useState(0);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const gender = parentGender ?? "other";
  const stage = parentStage(totalMoments);
  const left = stage.stageSize - stage.inStage;
  const badges = badgeStates(countsByPrinciple);
  const tip = practice[index];

  async function tried() {
    const current = practice[index];
    if (triedToday.includes(current.ruleId)) return;
    onCount(current.principle, 1, current.ruleId);
    setFailed(false);
    setSaving(true);
    const saved = await recordMoment(createClient(), parentId, childId, current.ruleId);
    setSaving(false);
    if (!saved) {
      onCount(current.principle, -1, current.ruleId);
      setFailed(true);
    }
  }

  function notNow() {
    setIndex((i) => (i + 1) % practice.length);
    setTurn((n) => n + 1);
    setFailed(false);
  }

  return (
    <>
      <section className="animate-power-fade-up flex flex-col gap-3.5 rounded-[22px] bg-[linear-gradient(145deg,#a32894,#6e1a64)] p-4 text-white shadow-[0_10px_24px_rgba(110,26,100,0.28)]">
        <div className="flex items-center gap-3.5">
          <div
            className="relative h-[84px] w-[84px] flex-none"
            role="img"
            aria-label={t("ringLabel", { done: stage.inStage, size: stage.stageSize })}
          >
            <svg viewBox="0 0 84 84" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
              <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={9} />
              <circle
                cx="42"
                cy="42"
                r="34"
                fill="none"
                stroke="var(--color-reward-gold)"
                strokeWidth={9}
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - stage.inStage / stage.stageSize)}
                style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.2, 0.8, 0.3, 1)" }}
              />
            </svg>
            <span dir="ltr" className="absolute inset-0 flex items-center justify-center font-display text-[22px] font-bold">
              {stage.inStage}/{stage.stageSize}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold tracking-[0.03em] text-[#f6dff2]">{t("journeyLabel")}</span>
            <span className="font-display text-[21px] font-bold">
              {t("stageTitle", { name: t(`stageNames.${stage.stage}`, { parentGender: gender }), stage: stage.stage })}
            </span>
            <span className="text-[13px] text-[#f6dff2]">
              {stage.finalStage ? t("toNextRound", { count: left }) : t("toNext", { count: left })}
            </span>
          </div>
        </div>

        <ul className="flex gap-2">
          {badges.map((badge, i) => {
            const name = t(`badges.${badge.badge}`, { parentGender: gender });
            return (
              <li
                key={badge.badge}
                className="flex flex-1 flex-col items-center gap-1"
                aria-label={badge.earned ? t("badges.earnedLabel", { name }) : t("badges.lockedLabel")}
              >
                {badge.earned ? (
                  <span
                    className="animate-home-day-pop flex h-11 w-11 items-center justify-center rounded-[14px] bg-white"
                    style={{ ["--home-delay" as string]: `${(0.4 + i * 0.1).toFixed(1)}s` } as CSSProperties}
                  >
                    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" stroke="#a32894" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={BADGE_ICON[badge.badge]} />
                    </svg>
                  </span>
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[linear-gradient(160deg,#dcd9e5,#c7c3d3)] shadow-[inset_0_-3px_0_#aaa5b9]">
                    <span className="animate-mystery-bob inline-block font-display text-[22px] font-bold text-[#7d778e]" aria-hidden>
                      ?
                    </span>
                  </span>
                )}
                <span className="text-[11px] text-[#f6dff2]" aria-hidden>
                  {badge.earned ? name : t("badges.locked")}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {tip && (
        <section
          className="animate-power-fade-up flex flex-col gap-2.5 rounded-[20px] border border-[#ece6f2] bg-white px-4 py-3.5 shadow-[0_6px_18px_rgba(52,30,99,0.07)]"
          style={{ ["--power-fade-delay" as string]: "0.15s" } as CSSProperties}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-brand-purple">{t("practice.title")}</span>
            <span className="rounded-full bg-brand-purple/[0.08] px-2.5 py-[3px] text-xs font-semibold text-[#7d1f72]">
              {tip.principleLabel}
            </span>
          </div>
          <div key={turn} className="animate-home-tip-in flex flex-col gap-2.5">
            {tip.doText && <p className="text-base leading-normal">{tip.doText}</p>}
            <p className="rounded-xl bg-[#faf3f9] px-3 py-2.5 font-display text-[17px] font-semibold leading-snug text-[#5c1f54]">
              &quot;{tip.quote}&quot;
            </p>
            {tip.why && <p className="text-[13px] leading-relaxed text-[#6c6580]">{tip.why}</p>}
          </div>
          {triedToday.includes(tip.ruleId) ? (
            <div className="animate-home-said flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] bg-reward-gold-soft text-[15px] font-semibold text-[#5c4200]">
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="#d99a0b" aria-hidden>
                <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
              </svg>
              {t("practice.collected")}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={tried}
                disabled={saving}
                className="min-h-[46px] flex-1 rounded-[14px] bg-brand-purple font-display text-base font-semibold text-white shadow-[0_4px_0_#5c1553] active:translate-y-[3px] active:shadow-[0_1px_0_#5c1553]"
              >
                {t("practice.tried")}
              </button>
              {practice.length > 1 && (
                <button
                  type="button"
                  onClick={notNow}
                  className="min-h-[46px] rounded-[14px] border border-[#ece6f2] bg-white px-3.5 text-sm text-[#4f4960]"
                >
                  {t("practice.notNow")}
                </button>
              )}
            </div>
          )}
          {failed && (
            <p role="alert" className="text-center text-xs text-red-600">
              {t("practice.saveFailed")}
            </p>
          )}
        </section>
      )}
    </>
  );
}
