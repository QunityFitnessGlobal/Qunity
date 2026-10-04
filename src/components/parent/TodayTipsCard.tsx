"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export interface TodayTipView {
  ruleId: string;
  principle: string | null;
  quote: string;
  because: string;
  saidToday: boolean;
}

interface TodayTipsCardProps {
  tips: TodayTipView[];
  momentsThisMonth: number;
  parentId: string;
  childId: string;
}

const ADVANCE_DELAY_MS = 1200;

const ARROW_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-full border border-[#ece6f2] bg-white text-[#4f4960]";

// "משפט להגיד היום" on the parent home screen: today's sentences one at a
// time — the principle, the sentence, and why it shows today. "אמרתי!"
// records an empowerment moment (parent_tip_moments) and, a moment later,
// moves on to the next sentence not yet said; once they're all said the card
// says well done.
export function TodayTipsCard({ tips, momentsThisMonth, parentId, childId }: TodayTipsCardProps) {
  const t = useTranslations("parentHome.tips");
  const count = tips.length;
  const [done, setDone] = useState(() => tips.map((tip) => tip.saidToday));
  const [index, setIndex] = useState(() => Math.max(0, tips.findIndex((tip) => !tip.saidToday)));
  // Bumped on every move so the sentence remounts and slides in again.
  const [turn, setTurn] = useState(0);
  const [moments, setMoments] = useState(momentsThisMonth);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const advance = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(advance.current), []);

  function go(to: number) {
    clearTimeout(advance.current);
    setIndex((to + count) % count);
    setTurn((n) => n + 1);
    setFailed(false);
  }

  async function said() {
    const at = index;
    const nextDone = done.map((d, i) => d || i === at);
    setDone(nextDone);
    setMoments((m) => m + 1);
    setFailed(false);
    setSaving(true);
    const { error } = await createClient()
      .from("parent_tip_moments")
      .insert({ parent_id: parentId, child_id: childId, rule_id: tips[at].ruleId });
    setSaving(false);
    if (error) {
      setDone((prev) => prev.map((d, i) => (i === at ? false : d)));
      setMoments((m) => m - 1);
      setFailed(true);
      return;
    }
    const step = Array.from({ length: count - 1 }, (_, k) => k + 1).find((k) => !nextDone[(at + k) % count]);
    if (step !== undefined) {
      advance.current = setTimeout(() => go(at + step), ADVANCE_DELAY_MS);
    }
  }

  const allDone = count > 0 && done.every(Boolean);
  const tip = tips[index];

  return (
    <section
      className="animate-power-fade-up flex flex-col gap-2.5 rounded-[20px] border border-[#ece6f2] bg-white px-4 py-3.5 shadow-[0_6px_18px_rgba(52,30,99,0.07)]"
      style={{ ["--power-fade-delay" as string]: "0.25s" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-brand-purple">{t("title")}</span>
        {!allDone && count > 1 && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => go(index - 1)} aria-label={t("previous")} className={ARROW_CLASS}>
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 ltr:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M7.5 5l5 5-5 5" />
              </svg>
            </button>
            <span className="min-w-[46px] text-center text-xs text-[#6c6580]">
              {t("position", { index: index + 1, total: count })}
            </span>
            <button type="button" onClick={() => go(index + 1)} aria-label={t("next")} className={ARROW_CLASS}>
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 ltr:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12.5 5l-5 5 5 5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {count === 0 && <p className="text-sm leading-relaxed text-[#6c6580]">{t("empty")}</p>}

      {tip && !allDone && (
        <>
          <div key={turn} className="animate-home-tip-in flex min-h-[120px] flex-col gap-2">
            {tip.principle && (
              <span className="self-start rounded-full bg-brand-purple/[0.08] px-2.5 py-[3px] text-[11px] font-semibold text-[#7d1f72]">
                {tip.principle}
              </span>
            )}
            <span className="font-display text-[22px] font-semibold leading-[1.3]">&quot;{tip.quote}&quot;</span>
            <span className="text-[13px] text-[#6c6580]">{tip.because}</span>
          </div>

          {count > 1 && (
            <div className="flex justify-center gap-1.5">
              {tips.map((other, i) => (
                <button
                  key={other.ruleId}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={t("goTo", { index: i + 1 })}
                  aria-current={i === index ? "true" : undefined}
                  className={`h-2 rounded-full transition-all duration-200 ${i === index ? "w-[22px]" : "w-2"} ${
                    done[i] ? "bg-[#22c55e]" : i === index ? "bg-brand-purple" : "bg-[#e4dfeb]"
                  }`}
                />
              ))}
            </div>
          )}

          {done[index] ? (
            <div className="animate-home-said flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] bg-[#e3f8ea] text-[15px] font-semibold text-[#15803d]">
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4.5 10.5 8.5 14.5 15.5 6" />
              </svg>
              {t("collected", { count: moments })}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={said}
                disabled={saving}
                className="min-h-[46px] flex-1 rounded-[14px] bg-reward-gold font-display text-[17px] font-bold text-reward-gold-on shadow-[0_4px_0_#d99a0b] active:translate-y-[3px] active:shadow-[0_1px_0_#d99a0b]"
              >
                {t("said")}
              </button>
              {count > 1 && (
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  className="min-h-[46px] rounded-[14px] border border-[#ece6f2] bg-white px-3.5 text-sm font-semibold text-[#4f4960]"
                >
                  {t("notNow")}
                </button>
              )}
            </div>
          )}
          {failed && (
            <p role="alert" className="text-center text-xs text-red-600">
              {t("saveFailed")}
            </p>
          )}
        </>
      )}

      {allDone && (
        <div className="animate-home-said flex flex-col items-center gap-2 pb-0.5 pt-1.5 text-center">
          <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#e3f8ea]">
            <svg viewBox="0 0 20 20" className="h-7 w-7" fill="none" stroke="#16a34a" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4.5 10.5 8.5 14.5 15.5 6" />
            </svg>
          </span>
          <span className="font-display text-[19px] font-bold">{t("allDoneTitle")}</span>
          <span className="text-[13px] text-[#6c6580]">{t("allDoneSubtitle", { count: moments })}</span>
          <Link
            href={{ pathname: "/dashboard/empowerment", query: { childId } }}
            className="text-sm font-bold text-brand-purple"
          >
            {t("allDoneLink")}
          </Link>
        </div>
      )}
    </section>
  );
}
