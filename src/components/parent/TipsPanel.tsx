import { getLocale, getTranslations } from "next-intl/server";
import { TipCard } from "@/components/parent/TipCard";
import type { RelevantTip } from "@/services/tips.service";
import type { Gender } from "@/lib/types";

interface TipsPanelProps {
  tips: RelevantTip[];
  childGender: Gender | null;
}

// Read-only display of the tips getRelevantTips() already selected — the
// old manual-test-mode number field (Prompt 6/7) was removed here since
// every condition function now has a real implementation (see
// tip-conditions/) instead of stubs. Prompt 8's parent-initiated equivalent
// is the "What's happening now" accordion (WhatsHappeningNowMenu.tsx).
export async function TipsPanel({ tips, childGender }: TipsPanelProps) {
  const t = await getTranslations("tips");
  const locale = await getLocale();

  return (
    <div className="w-full max-w-md space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-text-muted">{t("heading")}</h2>

      {tips.length === 0 && <p className="text-sm text-text-muted">{t("empty")}</p>}
      <div className="space-y-2">
        {tips.map((tip) => (
          <TipCard key={tip.ruleId} tip={tip} locale={locale} gender={childGender} />
        ))}
      </div>
    </div>
  );
}
