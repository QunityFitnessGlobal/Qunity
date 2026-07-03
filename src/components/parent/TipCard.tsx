import { resolveLocalizedText } from "@/lib/i18n-content";
import type { RelevantTip } from "@/services/tips.service";

interface TipCardProps {
  tip: RelevantTip;
  locale: string;
}

export function TipCard({ tip, locale }: TipCardProps) {
  return (
    <div className="rounded-md border border-brand-purple/20 bg-brand-purple/5 p-3">
      {tip.principle && (
        <p className="mb-1 text-xs font-semibold text-brand-purple">{tip.principle}</p>
      )}
      <p className="text-sm text-zinc-700">{resolveLocalizedText(tip.tipText, locale)}</p>
    </div>
  );
}
