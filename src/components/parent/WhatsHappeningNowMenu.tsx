"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { logShownTips, type ManualMenuTip } from "@/services/tips.service";
import { resolveGenderedText } from "@/lib/i18n-content";
import type { Gender } from "@/lib/types";

interface WhatsHappeningNowMenuProps {
  tips: ManualMenuTip[];
  parentId: string;
  childId: string;
  childGender: Gender | null;
}

// Category 3 ("What's happening now") — a parent-initiated accordion, as
// opposed to TipsPanel's auto-evaluated category 1/2 tips. Every row here
// has condition_type = 'manual_selection' (see tip-conditions/index.ts) and
// is fetched via getManualMenuTips() rather than getRelevantTips(). Picking
// an item logs to parent_tips with trigger_source = 'manual'.
const GROUP_ORDER = [1, 2, 3, 4, 5] as const;
const GROUP_TITLE_KEYS: Record<(typeof GROUP_ORDER)[number], string> = {
  1: "group1",
  2: "group2",
  3: "group3",
  4: "group4",
  5: "group5",
};

export function WhatsHappeningNowMenu({
  tips,
  parentId,
  childId,
  childGender,
}: WhatsHappeningNowMenuProps) {
  const t = useTranslations("whatsHappeningNow");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [selectedTip, setSelectedTip] = useState<ManualMenuTip | null>(null);
  const [logging, setLogging] = useState(false);

  async function handleSelect(tip: ManualMenuTip) {
    setSelectedTip(tip);
    setLogging(true);
    try {
      const supabase = createClient();
      await logShownTips(supabase, parentId, childId, [tip.ruleId], "manual");
    } finally {
      setLogging(false);
    }
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: tips.filter((tip) => tip.menuGroup === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-semibold text-text-muted"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{t("heading")}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {grouped.map(({ group, items }) => (
            <div key={group} className="rounded-md border border-zinc-100">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-right text-sm font-medium"
                onClick={() => setExpandedGroup((g) => (g === group ? null : group))}
              >
                <span>{t(GROUP_TITLE_KEYS[group as (typeof GROUP_ORDER)[number]])}</span>
                <span>{expandedGroup === group ? "−" : "+"}</span>
              </button>
              {expandedGroup === group && (
                <div className="space-y-1 border-t border-zinc-100 px-3 py-2">
                  {items.map((item) => (
                    <button
                      key={item.ruleId}
                      type="button"
                      className={`block w-full rounded px-2 py-1 text-right text-sm hover:bg-zinc-50 ${
                        selectedTip?.ruleId === item.ruleId ? "bg-brand-purple/10 font-medium" : ""
                      }`}
                      onClick={() => handleSelect(item)}
                    >
                      {locale === "he" ? item.labelHe : item.labelEn}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedTip && (
        <div className="mt-3 rounded-md border border-brand-purple/20 bg-brand-purple/5 p-3">
          {selectedTip.principle && (
            <p className="mb-1 text-xs font-semibold text-brand-purple">{selectedTip.principle}</p>
          )}
          <p className="whitespace-pre-line text-sm text-zinc-700">
            {resolveGenderedText(selectedTip.tipText, locale, childGender)}
          </p>
          {logging && <p className="mt-1 text-xs text-text-muted">{t("saving")}</p>}
        </div>
      )}
    </div>
  );
}
