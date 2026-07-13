"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { formatDurationClock } from "@/lib/format";
import type { CompletedChallengeEntry, PendingChallengeEntry } from "@/services/challenge.service";

interface ChallengesTabsProps {
  completed: CompletedChallengeEntry[];
  pending: PendingChallengeEntry[];
  testTrigger?: React.ReactNode;
}

type Tab = "done" | "todo";

export function ChallengesTabs({ completed, pending, testTrigger }: ChallengesTabsProps) {
  const t = useTranslations("challengesPage");
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("done");

  return (
    <div className="w-full max-w-sm">
      <div className="mb-4 flex overflow-hidden rounded-md border border-zinc-200">
        <button
          type="button"
          onClick={() => setTab("done")}
          className={`flex-1 py-2 text-sm font-medium ${
            tab === "done" ? "bg-brand-purple/10 text-brand-purple" : "text-text-muted"
          }`}
        >
          {t("doneTab")}
        </button>
        <button
          type="button"
          onClick={() => setTab("todo")}
          className={`flex-1 py-2 text-sm font-medium ${
            tab === "todo" ? "bg-brand-purple/10 text-brand-purple" : "text-text-muted"
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
              className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium">{resolveLocalizedText(entry.title, locale)}</p>
                <p className="text-xs text-text-muted">
                  {entry.completedAt ? new Date(entry.completedAt).toLocaleDateString(locale) : ""}
                  {entry.durationSeconds != null && ` · ${formatDurationClock(entry.durationSeconds)}`}
                </p>
              </div>
              {entry.pointsAwarded != null && (
                <span className="rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700">
                  +{entry.pointsAwarded}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "todo" && (
        <div className="space-y-2">
          {pending.length === 0 && !testTrigger && (
            <p className="text-sm text-text-muted">{t("emptyTodo")}</p>
          )}
          {pending.map((entry) =>
            entry.challengeType === "repeatable_workout" ? (
              <div key={entry.challengeId} className="rounded-md border border-zinc-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{resolveLocalizedText(entry.title, locale)}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {t("completedTimes", { count: entry.completionCount })}
                    </p>
                  </div>
                  <span className="whitespace-nowrap rounded-md bg-brand-purple/10 px-2 py-1 text-xs font-medium text-brand-purple">
                    {t("perCompletion", { points: entry.bonusPoints })}
                  </span>
                </div>
                <Link
                  href={`/challenge/${entry.challengeId}`}
                  className="mt-3 block w-full rounded-md border border-zinc-300 py-2 text-center text-sm font-medium hover:bg-zinc-50"
                >
                  {t("doItNow")}
                </Link>
              </div>
            ) : (
              <div
                key={entry.challengeId}
                className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-3 opacity-70"
              >
                <p className="text-sm font-medium">{resolveLocalizedText(entry.title, locale)}</p>
                <p className="mt-1 text-xs text-text-muted">{t("lockedHint")}</p>
              </div>
            ),
          )}
          {testTrigger}
        </div>
      )}
    </div>
  );
}
