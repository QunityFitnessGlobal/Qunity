"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { resolveLocalizedText, type LocalizedText } from "@/lib/i18n-content";
import { MysteryBoxContents } from "@/components/child/MysteryBoxContents";
import { ChallengeIcon } from "@/components/child/challengeIcons";
import type { ChallengeConditionType, ChallengeType } from "@/data/challenges.data";

export interface RevealChallenge {
  title: LocalizedText;
  description: LocalizedText | null;
  conditionType: ChallengeConditionType | null;
  challengeType: ChallengeType;
}

interface MysteryRevealProps {
  challenge: RevealChallenge;
  pointsLine: string;
  // How long the box sits still before shaking, so several reveals on one
  // screen can be staggered one after another.
  delayMs: number;
  size?: "sm" | "lg";
  // Skip straight to the open card — for a reveal that already played
  // earlier in this visit and is just being shown again.
  initiallyRevealed?: boolean;
  onRevealed?: () => void;
}

const BURST_COLORS = ["var(--color-brand-purple)", "var(--color-reward-gold)"];
const STAR_CLIP = "polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Never wait longer than an animation's own length plus a margin, so a
// throttled frame clock can't leave the box stuck mid-flip.
function settle(anim: Animation, ms: number) {
  return Promise.race([anim.finished.catch(() => {}), wait(ms + 120)]);
}

// Pops a gold ring plus purple/gold squares and stars out from `origin`,
// into `container`.
function burst(container: HTMLDivElement, origin: HTMLElement) {
  const cRect = container.getBoundingClientRect();
  const oRect = origin.getBoundingClientRect();
  const cx = oRect.left - cRect.left + oRect.width / 2;
  const cy = oRect.top - cRect.top + oRect.height / 2;

  const ring = document.createElement("span");
  ring.style.cssText = `position:absolute;left:${cx - 20}px;top:${cy - 20}px;width:40px;height:40px;border-radius:9999px;border:3px solid var(--color-reward-gold);pointer-events:none;`;
  container.appendChild(ring);
  ring
    .animate([{ transform: "scale(.2)", opacity: 1 }, { transform: "scale(7)", opacity: 0 }], {
      duration: 700,
      easing: "cubic-bezier(.2,.7,.3,1)",
    })
    .addEventListener("finish", () => ring.remove());

  for (let k = 0; k < 18; k++) {
    const p = document.createElement("span");
    const isStar = k % 3 === 0;
    const size = isStar ? 14 : 8;
    const shape = isStar ? `clip-path:${STAR_CLIP};border-radius:0;` : "border-radius:2px;";
    p.style.cssText = `position:absolute;left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px;${shape}background:${BURST_COLORS[k % 2]};pointer-events:none;`;
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

// A locked mystery box that shakes, flips and bursts open into the real
// challenge card. Shared by the workout-result popup (ChallengeRevealPopup)
// and the challenges screen (ChallengesTabs), so both reveals are the same
// object.
export function MysteryReveal({
  challenge,
  pointsLine,
  delayMs,
  size = "lg",
  initiallyRevealed = false,
  onRevealed,
}: MysteryRevealProps) {
  const t = useTranslations("challengeRevealPopup");
  const locale = useLocale();
  // Decided once at mount (not in an effect): a reduced-motion viewer, or a
  // reveal that already played, never runs the animation, not even a frame.
  const [animate] = useState(() => !initiallyRevealed && !prefersReducedMotion());
  const [revealed, setRevealed] = useState(!animate);
  const stageRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const onRevealedRef = useRef(onRevealed);

  useEffect(() => {
    onRevealedRef.current = onRevealed;
  }, [onRevealed]);

  useEffect(() => {
    if (!animate) return;
    let cancelled = false;

    async function play() {
      await wait(delayMs);
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
      onRevealedRef.current?.();
    }

    void play();
    return () => {
      cancelled = true;
    };
  }, [animate, delayMs]);

  useEffect(() => {
    if (!animate || !revealed || !stageRef.current || !fxRef.current) return;
    const card = stageRef.current.firstElementChild as HTMLElement | null;
    if (!card) return;
    card.animate(
      [{ transform: "rotateY(-90deg) scale(1.05)" }, { transform: "rotateY(8deg) scale(1.02)", offset: 0.7 }, { transform: "rotateY(0) scale(1)" }],
      { duration: 500, easing: "ease-out" },
    );
    // A gold ring that fades out from the card's own edge, echoing the burst.
    card.animate([{ boxShadow: "0 0 0 0 var(--color-reward-gold)" }, { boxShadow: "0 0 0 8px transparent" }], {
      duration: 900,
      delay: 250,
    });
    burst(fxRef.current, card);
  }, [animate, revealed]);

  const large = size === "lg";

  return (
    <div className="relative" ref={fxRef}>
      {/* Distinct `key`s below are load-bearing: without them React reuses
          the same DOM node across the two branches, so the box's own
          forwards-filled flip-out animation (from the effect above) stays
          attached underneath the landing animation and resurfaces once
          that one finishes, leaving the card stuck edge-on. */}
      <div ref={stageRef} className="relative" style={{ perspective: 1000 }}>
        {!revealed ? (
          <div
            key="mystery"
            className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border border-box-edge/40 bg-gradient-to-br from-box-a to-box-b text-right shadow-[0_3px_0_var(--color-box-edge)] ${large ? "p-4" : "p-3"}`}
          >
            <MysteryBoxContents size={size} />
          </div>
        ) : (
          <div
            key="card"
            className={`relative rounded-2xl border border-zinc-200 bg-white text-right shadow-md ${large ? "p-4" : "p-3"}`}
          >
            <span
              className={`absolute -top-2 start-3 rounded-full bg-reward-gold px-2.5 py-0.5 text-xs font-bold text-reward-gold-on shadow-sm ${animate ? "animate-reveal-badge-pop" : ""}`}
            >
              {t("achievedBadge")}
            </span>
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-reward-gold-soft text-reward-gold-ink">
                <ChallengeIcon
                  conditionType={challenge.conditionType}
                  challengeType={challenge.challengeType}
                  className="h-6 w-6"
                />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold">{resolveLocalizedText(challenge.title, locale)}</h3>
                {challenge.description && (
                  <p className="mt-0.5 text-sm text-zinc-600">{resolveLocalizedText(challenge.description, locale)}</p>
                )}
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-reward-gold-soft px-3 py-2 text-sm font-semibold text-reward-gold-ink">
              {pointsLine}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
