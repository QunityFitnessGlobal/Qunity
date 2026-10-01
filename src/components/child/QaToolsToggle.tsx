"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { readQaTools, subscribeQaTools, writeQaTools } from "@/lib/qa-tools";

function serverSnapshot() {
  return false;
}

// TEMP — turns the workout testing shortcuts on for this device only (see
// lib/qa-tools.ts). Remove together with them.
export function QaToolsToggle() {
  const t = useTranslations("settings");
  const enabled = useSyncExternalStore(subscribeQaTools, readQaTools, serverSnapshot);

  return (
    <label className="flex w-full max-w-sm cursor-pointer items-start gap-3 rounded-md border border-dashed border-zinc-300 p-3">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => writeQaTools(e.target.checked)}
        className="mt-0.5 h-5 w-5 flex-none accent-brand-purple"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{t("qaTools.label")}</span>
        <span className="text-xs text-text-muted">{t("qaTools.hint")}</span>
      </span>
    </label>
  );
}
