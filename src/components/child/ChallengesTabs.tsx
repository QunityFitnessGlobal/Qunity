"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { formatDurationClock } from "@/lib/format";
import { POWER_ICON } from "@/lib/powers";
import { StarIcon } from "@/components/child/journeyIcons";
import { MysteryBoxCard } from "@/components/child/MysteryBoxCard";
import { MysteryReveal } from "@/components/child/MysteryReveal";
import { ChallengeIcon } from "@/components/child/challengeIcons";
import type { CompletedChallengeEntry, PendingChallengeEntry } from "@/services/challenge.service";

interface ChallengesTabsProps {
  completed: CompletedChallengeEntry[];
  pending: PendingChallengeEntry[];
  // Only the child's own view can actually start a challenge — a parent
  // viewing a linked child's challenges sees the same lists read-only.
  canPerform?: boolean;
  // The child whose own screen this is — scopes the per-device "last seen"
  // marker, so siblings sharing a tablet don't clear each other's reveals.
  viewerId?: string;
}

type Tab = "done" | "todo";

// Per-device marker of when this child last opened the challenges screen —
// not synced anywhere, just a local convenience. Any one-time challenge
// earned after it gets replayed once as an auto-opening mystery box, and
// counted on the done-tab bubble.
const SEEN_KEY_PREFIX = "qunity:challengesSeenAt:";
// Placeholder for the server render and for "no marker available": nothing
// counts as new. The server always renders with it, so hydration matches.
const NEVER_SEEN = Number.MAX_SAFE_INTEGER;

function subscribeNoop() {
  return () => {};
}

function readSeenAtServer(): number {
  return NEVER_SEEN;
}

// First-ever visit writes "now" as the baseline rather than reporting
// "never", so a child's existing achievements don't all replay at once.
function readSeenAt(key: string): number {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) return Number(stored);
    const now = Date.now();
    window.localStorage.setItem(key, String(now));
    return now;
  } catch {
    return NEVER_SEEN;
  }
}

function earnedSince(completed: CompletedChallengeEntry[], seenAt: number): CompletedChallengeEntry[] {
  return completed
    .filter((entry) => entry.challengeType === "condition" && entry.completedAt && new Date(entry.completedAt).getTime() > seenAt)
    .reverse();
}

export function ChallengesTabs(props: ChallengesTabsProps) {
  const storageKey = props.canPerform && props.viewerId ? `${SEEN_KEY_PREFIX}${props.viewerId}` : null;
  const getSnapshot = useCallback(() => (storageKey ? readSeenAt(storageKey) : NEVER_SEEN), [storageKey]);
  const seenAt = useSyncExternalStore(subscribeNoop, getSnapshot, readSeenAtServer);

  // Remounts exactly once, right after hydration, when the real stored value
  // replaces the server placeholder — the content then freezes that value
  // for the rest of the visit, even after it writes a new marker below.
  return (
    <ChallengesTabsContent
      key={seenAt === NEVER_SEEN ? "placeholder" : "stored"}
      {...props}
      seenAt={seenAt}
      storageKey={storageKey}
    />
  );
}

interface ChallengesTabsContentProps extends ChallengesTabsProps {
  seenAt: number;
  storageKey: string | null;
}

function ChallengesTabsContent({
  completed,
  pending,
  canPerform = false,
  seenAt,
  storageKey,
}: ChallengesTabsContentProps) {
  const t = useTranslations("challengesPage");
  const tPowers = useTranslations("powers");
  const locale = useLocale();
  const [frozenSeenAt] = useState(seenAt);
  const fresh = earnedSince(completed, frozenSeenAt);
  // Something to reveal → land on the to-do tab, where the boxes are.
  const [tab, setTab] = useState<Tab>(() => (earnedSince(completed, seenAt).length > 0 ? "todo" : "done"));
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [bubbleCleared, setBubbleCleared] = useState(false);

  const open = pending.filter((entry) => entry.unlocked);
  const locked = pending.filter((entry) => !entry.unlocked);
  const unseenCount = bubbleCleared ? 0 : fresh.length;

  // Mark this visit as seen right away — the reveal set above is already
  // frozen, so this only affects the next visit (no replay, no bubble).
  useEffect(() => {
    if (!storageKey || frozenSeenAt === NEVER_SEEN) return;
    try {
      window.localStorage.setItem(storageKey, String(Date.now()));
    } catch {
      // Nothing to persist if storage isn't available.
    }
  }, [storageKey, frozenSeenAt]);

  function handleDoneTabClick() {
    setTab("done");
    setBubbleCleared(true);
  }

  function markRevealed(id: string) {
    setRevealedIds((prev) => new Set(prev).add(id));
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
          {pending.length === 0 && fresh.length === 0 && <p className="text-sm text-text-muted">{t("emptyTodo")}</p>}
          {open.map((entry) => {
            return (
              <div key={entry.challengeId} className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
                    <ChallengeIcon conditionType={null} challengeType={entry.challengeType} className="h-5 w-5" />
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

          {/* One-time challenges earned since the last visit: shown as the
              same mystery box and opened automatically, one after another.
              They already live in the done tab too; this is the replay. */}
          {fresh.map((entry, i) => (
            <div key={entry.id} className="pt-2">
              <MysteryReveal
                challenge={entry}
                pointsLine={t("revealedPointsLine", { points: entry.pointsAwarded ?? 0 })}
                delayMs={700 + i * 1600}
                size="sm"
                initiallyRevealed={revealedIds.has(entry.id)}
                onRevealed={() => markRevealed(entry.id)}
              />
            </div>
          ))}

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
