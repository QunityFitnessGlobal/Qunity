"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getRelevantTips, logShownTips, type RelevantTip } from "@/services/tips.service";
import { TipCard } from "@/components/parent/TipCard";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

interface TipsPanelProps {
  parentId: string;
  childId: string;
  initialTips: RelevantTip[];
}

// The numeric field + show button below are a TEMPORARY manual test mode
// (Prompt 6/7, section 3.1): they run the real engine end-to-end (registry
// lookup -> getRelevantTips -> priority selection -> TipCard -> logging to
// parent_tips), but force the outcome to a specific scenario (1-5) since the
// first five condition functions are still stubs. Remove this control once
// every condition function has its real calculation.
export function TipsPanel({ parentId, childId, initialTips }: TipsPanelProps) {
  const t = useTranslations("tips");
  const locale = useLocale();
  const [tips, setTips] = useState(initialTips);
  const [manualIndex, setManualIndex] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleShow() {
    setLoading(true);
    try {
      const supabase = createClient();
      const parsed = Number(manualIndex);
      const manualTestIndex = parsed >= 1 && parsed <= 5 ? parsed : undefined;

      const relevant = await getRelevantTips(supabase, childId, manualTestIndex);
      setTips(relevant);

      await logShownTips(
        supabase,
        parentId,
        childId,
        relevant.map((tip) => tip.ruleId),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-text-muted">{t("heading")}</h2>

      {tips.length === 0 && <p className="text-sm text-text-muted">{t("empty")}</p>}
      <div className="space-y-2">
        {tips.map((tip) => (
          <TipCard key={tip.ruleId} tip={tip} locale={locale} />
        ))}
      </div>

      <div className="space-y-2 border-t border-zinc-100 pt-3">
        <p className="text-xs text-text-muted-light">{t("manualTestHint")}</p>
        <div className="flex items-end gap-2">
          <div className="w-24">
            <TextField
              label={t("manualTestLabel")}
              name="manualTipIndex"
              type="number"
              min={1}
              max={5}
              value={manualIndex}
              onChange={setManualIndex}
            />
          </div>
          <Button disabled={loading} onClick={handleShow}>
            {loading ? t("showing") : t("show")}
          </Button>
        </div>
      </div>
    </div>
  );
}
