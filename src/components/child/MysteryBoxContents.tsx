"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

interface MysteryBoxContentsProps {
  // "sm" for the compact list row (MysteryBoxCard), "lg" for the hero
  // reveal-popup box, which needs a bigger tile and question mark.
  size?: "sm" | "lg";
}

const STAR_CLIP = "polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)";

// The decorative innards shared by every "locked" mystery box across the
// app (MysteryBoxCard's list rows and ChallengeRevealPopup's pre-reveal
// stage), so the dotted texture, sparkle timing and "+??" tease stay in
// sync wherever a locked challenge shows up.
export function MysteryBoxContents({ size = "sm" }: MysteryBoxContentsProps) {
  const t = useTranslations("challengesPage");
  const large = size === "lg";

  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{ backgroundImage: "radial-gradient(var(--color-box-tile-a) 1px, transparent 1.4px)", backgroundSize: "12px 12px" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/60 to-transparent animate-mystery-shine"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-2 end-[22%] h-2.5 w-2.5 bg-white/70 animate-mystery-twinkle"
        style={{ clipPath: STAR_CLIP, "--twinkle-delay": "0s" } as CSSProperties}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 end-2 h-2 w-2 bg-white/70 animate-mystery-twinkle"
        style={{ clipPath: STAR_CLIP, "--twinkle-delay": "1.3s" } as CSSProperties}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-3 start-[22%] h-2 w-2 bg-white/70 animate-mystery-twinkle"
        style={{ clipPath: STAR_CLIP, "--twinkle-delay": "2.1s" } as CSSProperties}
      />
      <span
        className={`relative flex flex-none items-center justify-center rounded-xl bg-gradient-to-br from-box-tile-a to-box-tile-b shadow-[inset_0_-3px_0_var(--color-box-edge),inset_0_2px_0_rgba(255,255,255,0.6)] ${large ? "h-14 w-14" : "h-12 w-12"}`}
      >
        <span className="inline-block animate-mystery-bob font-bold text-box-ink" style={{ fontSize: large ? 34 : 28 }}>
          ?
        </span>
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-sm font-semibold text-box-ink">{t("mysteryTitle")}</span>
        <span className="block text-xs text-box-ink/80">{t("mysteryHint")}</span>
      </span>
      <span className="relative flex-none self-start rounded-full bg-box-tile-a px-2.5 py-1 font-display text-xs font-semibold text-box-ink/85">
        +??
      </span>
    </>
  );
}
