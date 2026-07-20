"use client";

import { useState } from "react";
import { resolveGenderedText, resolveLocalizedText } from "@/lib/i18n-content";
import { TipLikeDismissButtons } from "@/components/parent/TipLikeDismissButtons";
import type { RelevantTip } from "@/services/tips.service";
import type { Gender } from "@/lib/types";

interface TipCardProps {
  tip: RelevantTip;
  locale: string;
  gender: Gender | null;
}

const FADE_DURATION_MS = 600;

export function TipCard({ tip, locale, gender }: TipCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);

  if (dismissed) {
    return null;
  }

  function handleLike() {
    setFading(true);
    setTimeout(() => setDismissed(true), FADE_DURATION_MS);
  }

  return (
    <div
      className={`relative rounded-md border border-brand-purple/20 bg-brand-purple/5 p-3 pt-8 transition-opacity duration-[600ms] ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <TipLikeDismissButtons ruleId={tip.ruleId} onLike={handleLike} onDismiss={() => setDismissed(true)} />
      {tip.principle && (
        <p className="mb-1 text-xs font-semibold text-brand-purple">
          {resolveLocalizedText(tip.principle, locale)}
        </p>
      )}
      <p className="text-sm text-zinc-700">{resolveGenderedText(tip.tipText, locale, gender)}</p>
    </div>
  );
}
