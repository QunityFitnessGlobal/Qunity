"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { Button } from "@/components/ui/Button";
import { StarIcon } from "@/components/child/journeyIcons";
import type { ChallengeDefinition } from "@/data/challenges.data";

interface ChallengeRevealPopupProps {
  // One-time ("condition") challenges just earned by this workout — see
  // WorkoutRunner's result stage. Revealed one at a time, in order; a power
  // challenge is never included here, since its own reveal already happened
  // on the power screen (see handlePowerContinue).
  challenges: ChallengeDefinition[];
  onDone: () => void;
}

const BURST_COLORS = ["var(--color-brand-purple)", "var(--color-reward-gold)"];

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Never wait longer than an animation's own length plus a margin, so a
// throttled frame clock can't leave the box stuck mid-flip.
function settle(anim: Animation, ms: number) {
  return Promise.race([anim.finished.catch(() => {}), wait(ms + 120)]);
}

// Pops a gold ring plus a handful of purple/gold squares out from `origin`,
// into `container`. Mirrors the reveal used on the mystery-box challenges
// screen, so the two moments feel like the same object.
function burst(container: HTMLDivElement, origin: HTMLElement) {
  const cRect = container.getBoundingClientRect();
  const oRect = origin.getBoundingClientRect();
  const cx = oRect.left - cRect.left + oRect.width / 2;
  const cy = oRect.top - cRect.top + oRect.height / 2;

  const ring = document.createElement("span");
  ring.style.cssText = `position:absolute;left:${cx - 20}px;top:${cy - 20}px;width:40px;height:40px;border-radius:9999px;border:3px solid var(--color-reward-gold);`;
  container.appendChild(ring);
  ring
    .animate([{ transform: "scale(.2)", opacity: 1 }, { transform: "scale(7)", opacity: 0 }], {
      duration: 700,
      easing: "cubic-bezier(.2,.7,.3,1)",
    })
    .addEventListener("finish", () => ring.remove());

  for (let k = 0; k < 18; k++) {
    const p = document.createElement("span");
    const size = k % 3 === 0 ? 12 : 8;
    p.style.cssText = `position:absolute;left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px;border-radius:2px;background:${BURST_COLORS[k % 2]};`;
    container.appendChild(p);
    const angle = (Math.PI * 2 * k) / 18 + Math.random() * 0.4;
    const dist = 60 + Math.random() * 70;
    const dx = Math.cos(angle) * dist * 1.4;
    const dy = Math.sin(angle) * dist * 0.8;
    const rot = `${Math.random() * 540 - 270}deg`;
    p.animate(
      [
        { transform: "translate(0,0) scale(.4) rotate(0)", opacity: 1 },
        { transform: `translate(${dx * 0.8}px, ${dy * 0.8}px) scale(1.1) rotate(${rot})`, opacity: 1, offset: 0.6 },
        { transform: `translate(${dx}px, ${dy + 26}px) scale(.6) rotate(${rot})`, opacity: 0 },
      ],
      { duration: 750 + Math.random() * 250, easing: "cubic-bezier(.15,.8,.3,1)" },
    ).addEventListener("finish", () => p.remove());
  }
}

interface RevealCardProps {
  challenge: ChallengeDefinition;
  indexLabel: string | null;
  onContinue: () => void;
}

// One challenge's own box→card reveal. Keyed by challenge id from the
// parent, so a fresh mount (and a fresh `revealed` state starting at false)
// is what advances to the next queued challenge, rather than resetting state
// imperatively inside an effect.
function RevealCard({ challenge, indexLabel, onContinue }: RevealCardProps) {
  const t = useTranslations("challengeRevealPopup");
  const locale = useLocale();
  // Computed once at mount (not in an effect) so a reduced-motion viewer
  // never runs the animation at all, not even for one frame.
  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [revealed, setRevealed] = useState(reduceMotion);
  const stageRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;

    async function play() {
      await wait(900);
      if (cancelled || !stageRef.current) return;
      const box = stageRef.current.firstElementChild as HTMLElement | null;
      if (!box) return;

      await settle(
        box.animate(
          [
            { transform: "rotate(0) scale(1)" },
            { transform: "rotate(-1.5deg) scale(1.01)" },
            { transform: "rotate(1.5deg) scale(1.01)" },
            { transform: "rotate(-2.5deg) scale(1.02)" },
            { transform: "rotate(2.5deg) scale(1.02)" },
            { transform: "rotate(-3.5deg) scale(1.04)" },
            { transform: "rotate(3.5deg) scale(1.05)" },
            { transform: "rotate(0) scale(1.06)" },
          ],
          { duration: 650, easing: "ease-in" },
        ),
        650,
      );
      if (cancelled) return;
      await settle(
        box.animate([{ transform: "scale(1.06) rotateY(0)" }, { transform: "scale(1.06) rotateY(90deg)" }], {
          duration: 180,
          easing: "ease-in",
          fill: "forwards",
        }),
        180,
      );
      if (cancelled) return;
      setRevealed(true);
    }

    void play();
    return () => {
      cancelled = true;
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !revealed || !stageRef.current || !fxRef.current) return;
    const card = stageRef.current.firstElementChild as HTMLElement | null;
    if (!card) return;
    card.animate(
      [{ transform: "rotateY(-90deg) scale(1.05)" }, { transform: "rotateY(8deg) scale(1.02)", offset: 0.7 }, { transform: "rotateY(0) scale(1)" }],
      { duration: 500, easing: "ease-out" },
    );
    burst(fxRef.current, card);
  }, [reduceMotion, revealed]);

  return (
    <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-xl">
      <p className="text-xs font-semibold tracking-wide text-brand-purple">{t("label")}</p>
      <h2 className="mt-0.5 text-lg font-bold">{revealed ? t("titleRevealed") : t("titleLocked")}</h2>

      <div className="relative mt-4" ref={fxRef}>
        {/* Distinct `key`s below are load-bearing: without them React reuses
            the same DOM node across the two branches, so the box's own
            forwards-filled flip-out animation (from the effect above) stays
            attached underneath the landing animation and resurfaces once
            that one finishes, leaving the card stuck edge-on. */}
        <div ref={stageRef} className="relative" style={{ perspective: 1000 }}>
          {!revealed ? (
            <div
              key="mystery"
              className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-zinc-300/60 bg-gradient-to-br from-zinc-200 to-zinc-300 p-4 text-right shadow-[0_3px_0_theme(colors.zinc.400)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/70 to-transparent animate-mystery-shine"
              />
              <span className="relative flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-200 shadow-[inset_0_-2px_0_theme(colors.zinc.400)]">
                <span className="inline-block animate-mystery-bob font-bold text-zinc-500" style={{ fontSize: 34 }}>
                  ?
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-500">{t("mysteryTitle")}</span>
                <span className="block text-xs text-zinc-400">{t("mysteryHint")}</span>
              </span>
            </div>
          ) : (
            <div key="card" className="relative rounded-2xl border border-zinc-200 bg-white p-4 text-right shadow-md">
              <span className="absolute -top-2 inset-inline-start-3 rounded-full bg-reward-gold-soft px-2.5 py-0.5 text-xs font-bold text-reward-gold-ink shadow-sm">
                {t("achievedBadge")}
              </span>
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-reward-gold-soft text-reward-gold-ink">
                  <StarIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold">{resolveLocalizedText(challenge.title, locale)}</h3>
                  {challenge.description && (
                    <p className="mt-0.5 text-sm text-zinc-600">{resolveLocalizedText(challenge.description, locale)}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-reward-gold-soft px-3 py-2 text-sm font-semibold text-reward-gold-ink">
                {t("pointsAdded", { points: challenge.bonusPoints })}
              </div>
            </div>
          )}
        </div>
      </div>

      {revealed && (
        <div className="mt-4 space-y-2">
          {indexLabel && <p className="text-xs text-zinc-500">{indexLabel}</p>}
          <Button className="w-full" onClick={onContinue}>
            {t("continue")}
          </Button>
        </div>
      )}
    </div>
  );
}

// Popup shown over the workout result screen the moment a "condition"
// challenge is newly earned — the box shakes, flips and bursts open into the
// real challenge card, mirroring the locked mystery boxes on the Challenges
// screen. Once dismissed, that screen just shows the challenge already open,
// with no animation of its own — the reveal only ever happens here.
export function ChallengeRevealPopup({ challenges, onDone }: ChallengeRevealPopupProps) {
  const t = useTranslations("challengeRevealPopup");
  const [index, setIndex] = useState(0);
  const current = challenges[index];
  if (!current) return null;

  function handleContinue() {
    if (index < challenges.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onDone();
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <RevealCard
        key={current.id}
        challenge={current}
        indexLabel={challenges.length > 1 ? t("progress", { current: index + 1, total: challenges.length }) : null}
        onContinue={handleContinue}
      />
    </div>
  );
}
