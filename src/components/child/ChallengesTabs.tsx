"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { formatDurationClock } from "@/lib/format";
import { POWER_ICON } from "@/lib/powers";
import { StarIcon } from "@/components/child/journeyIcons";
import { MysteryBoxCard } from "@/components/child/MysteryBoxCard";
import { getChallengeIcon } from "@/components/child/challengeIcons";
import type { CompletedChallengeEntry, PendingChallengeEntry } from "@/services/challenge.service";

interface ChallengesTabsProps {
  completed: CompletedChallengeEntry[];
  pending: PendingChallengeEntry[];
  // Only the child's own view can actually start a challenge — a parent
  // viewing a linked child's challenges sees the same lists read-only.
  canPerform?: boolean;
}

type Tab = "done" | "todo";

// Per-device "unseen achievement" marker for the done-tab bubble — not
// synced anywhere, just a local convenience since a child normally uses
// their own device.
const SEEN_KEY = "qunity:completedChallengesSeenAt";
// Sentinel meaning "nothing is unseen yet" — used both for the very first
// visit (no stored value) and for the server render, so the initial client
// read and the server-rendered HTML agree and hydration never mismatches;
// useSyncExternalStore then reconciles to the real stored value right after.
const NEVER_SEEN = Number.MAX_SAFE_INTEGER;

function subscribeNoop() {
  return () => {};
}

function readSeenAt(): number {
  try {
    const stored = window.localStorage.getItem(SEEN_KEY);
    return stored ? Number(stored) : NEVER_SEEN;
  } catch {
    return NEVER_SEEN;
  }
}

function readSeenAtServer(): number {
  return NEVER_SEEN;
}

export function ChallengesTabs({ completed, pending, canPerform = false }: ChallengesTabsProps) {
  const t = useTranslations("challengesPage");
  const tPowers = useTranslations("powers");
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("done");
  const seenAt = useSyncExternalStore(subscribeNoop, readSeenAt, readSeenAtServer);
  // Overrides the computed count to 0 the moment the child taps the tab,
  // without waiting for a reload to re-read localStorage.
  const [clearedThisSession, setClearedThisSession] = useState(false);

  const open = pending.filter((entry) => entry.unlocked);
  const locked = pending.filter((entry) => !entry.unlocked);

  const unseenCount =
    canPerform && !clearedThisSession
      ? completed.filter((entry) => entry.completedAt && new Date(entry.completedAt).getTime() > seenAt).length
      : 0;

  // First-ever visit: establish "now" as the baseline so existing
  // completions don't all light up as unseen. A plain localStorage write,
  // no state update, so it can't trigger a render loop.
  useEffect(() => {
    if (!canPerform) return;
    try {
      if (window.localStorage.getItem(SEEN_KEY) === null) {
        window.localStorage.setItem(SEEN_KEY, String(Date.now()));
      }
    } catch {
      // Nothing to persist if storage isn't available.
    }
  }, [canPerform]);

  function handleDoneTabClick() {
    setTab("done");
    if (!canPerform || unseenCount === 0) return;
    setClearedThisSession(true);
    try {
      window.localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      // Ignore — nothing to clear if it couldn't be read in the first place.
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-4 flex gap-1 rounded-2xl border border-zinc-200 p-1">
        <button
          type="button"
          onClick={handleDoneTabClick}
          className={`relative flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
            tab === "done" ? "bg-brand-purple/10 font-semibold text-brand-purple" : "text-text-muted"
          }`}
        >
          {t("doneTab")}
          {unseenCount > 0 && (
            <span
              dir="ltr"
              className="absolute -top-1.5 start-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-reward-gold px-1 font-display text-[11px] font-bold text-reward-gold-on"
            >
              +{unseenCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("todo")}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
            tab === "todo" ? "bg-brand-purple/10 font-semibold text-brand-purple" : "text-text-muted"
          }`}
        >
          {t("todoTab")}
        </button>
      </div>

      {tab === "done" && (
        <div className="space-y-2">
          {completed.length === 0 && <p className="text-sm text-text-muted">{t("emptyDone")}</p>}
          {completed.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3.5 py-3"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-reward-gold-soft text-reward-gold-ink">
                <StarIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-medium">
                  {resolveLocalizedText(entry.title, locale)}
                </p>
                <p className="text-xs text-text-muted tabular-nums">
                  {entry.completedAt ? new Date(entry.completedAt).toLocaleDateString(locale) : ""}
                  {entry.durationSeconds != null && ` · ${formatDurationClock(entry.durationSeconds)}`}
                </p>
              </div>
              {entry.pointsAwarded != null && (
                <span
                  dir="ltr"
                  className="flex-none rounded-full bg-reward-gold-soft px-2.5 py-1 font-display text-sm font-semibold text-reward-gold-ink tabular-nums"
                >
                  +{entry.pointsAwarded}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "todo" && (
        <div className="space-y-2">
          {pending.length === 0 && <p className="text-sm text-text-muted">{t("emptyTodo")}</p>}
          {open.map((entry) => {
            const EntryIcon = getChallengeIcon(null, entry.challengeType);
            return (
              <div key={entry.challengeId} className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
                    <EntryIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-[15px] font-semibold">
                          {resolveLocalizedText(entry.title, locale)}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {t("completedTimes", { count: entry.completionCount })}
                        </p>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-brand-purple/10 px-2.5 py-1 font-display text-xs font-semibold text-brand-purple">
                        {t("perCompletion", { points: entry.bonusPoints })}
                      </span>
                    </div>
                    {entry.unlockColor && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
                        {(() => {
                          const PowerIcon = POWER_ICON[entry.unlockColor];
                          return <PowerIcon className="h-3.5 w-3.5" />;
                        })()}
                        <span>{t("unlockedByPower", { power: tPowers(`${entry.unlockColor}.name`) })}</span>
                      </div>
                    )}
                  </div>
                </div>
                {canPerform && (
                  <Link
                    href={`/challenge/${entry.challengeId}`}
                    className="mt-3 block w-full rounded-xl bg-green-600 py-2.5 text-center text-sm font-semibold text-white shadow-[0_3px_0_theme(colors.green.800)] transition-[transform,box-shadow] hover:bg-green-700 active:translate-y-[2px] active:shadow-[0_1px_0_theme(colors.green.800)]"
                  >
                    {entry.completionCount > 0 ? t("doItAgain") : t("doItNow")}
                  </Link>
                )}
              </div>
            );
          })}

          {locked.length > 0 && (
            <>
              <p className="pt-1 text-xs font-medium text-text-muted">
                {t("lockedGroup", { count: locked.length })}
              </p>
              {locked.map((entry) => (
                <MysteryBoxCard key={entry.challengeId} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
