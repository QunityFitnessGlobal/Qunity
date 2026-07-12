"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { logShownTips, type ManualMenuTip } from "@/services/tips.service";
import { resolveGenderedText } from "@/lib/i18n-content";
import { TipLikeDismissButtons } from "@/components/parent/TipLikeDismissButtons";
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

const FADE_DURATION_MS = 600;

// The ChildSelector switch does a full Next.js navigation (childId lives in
// the URL), which remounts this component and would otherwise silently wipe
// the tip the parent was just reading. The tip content itself isn't
// child-specific (category 3 is the same 34 generic items for every child),
// so sessionStorage — keyed by ruleId, resolved back against the `tips`
// prop on mount — is enough to survive that remount without any URL/query
// plumbing.
const SELECTED_TIP_STORAGE_KEY = "qunity:empowerment-selected-tip";

export function WhatsHappeningNowMenu({
  tips,
  parentId,
  childId,
  childGender,
}: WhatsHappeningNowMenuProps) {
  const t = useTranslations("whatsHappeningNow");
  const locale = useLocale();
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [selectedTip, setSelectedTip] = useState<ManualMenuTip | null>(null);
  const [logging, setLogging] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const storedRuleId = sessionStorage.getItem(SELECTED_TIP_STORAGE_KEY);
    if (!storedRuleId) return;
    const restored = tips.find((tip) => tip.ruleId === storedRuleId);
    if (restored) {
      // Deliberate one-time restoration from sessionStorage on mount, not a
      // React-state sync — must run in an effect since sessionStorage isn't
      // available during SSR, and running it in a lazy useState initializer
      // instead would produce a client/server hydration mismatch (server
      // always renders null, since it has no sessionStorage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTip(restored);
    }
    // Only restore once, on mount — tips content is static so this doesn't
    // need to re-run when the tips prop reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(tip: ManualMenuTip) {
    setSelectedTip(tip);
    setFading(false);
    sessionStorage.setItem(SELECTED_TIP_STORAGE_KEY, tip.ruleId);
    setLogging(true);
    try {
      const supabase = createClient();
      await logShownTips(supabase, parentId, childId, [tip.ruleId], "manual");
    } finally {
      setLogging(false);
    }
  }

  function dismissSelectedTip() {
    setSelectedTip(null);
    sessionStorage.removeItem(SELECTED_TIP_STORAGE_KEY);
  }

  function handleLike() {
    setFading(true);
    setTimeout(dismissSelectedTip, FADE_DURATION_MS);
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: tips.filter((tip) => tip.menuGroup === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="w-full max-w-md space-y-2">
      {grouped.map(({ group, items }) => (
        <div key={group} className="rounded-md border border-zinc-200 bg-white">
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

      {selectedTip && (
        <div
          className={`relative mt-3 rounded-md border border-brand-purple/20 bg-brand-purple/5 p-3 pt-8 transition-opacity duration-[600ms] ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          <TipLikeDismissButtons
            ruleId={selectedTip.ruleId}
            onLike={handleLike}
            onDismiss={dismissSelectedTip}
          />
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
