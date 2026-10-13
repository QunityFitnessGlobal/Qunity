"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BonusPowerScreen } from "@/components/child/BonusPowerScreen";

// TEMP — display-only preview of power 6 ("כוח ההצלחה"), the celebration
// shown when the purple stage is finished, without finishing it. Like
// PowerPreviewTester, it never writes anything.
export function BonusPowerPreviewTester() {
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="w-full max-w-sm rounded-md border border-dashed border-zinc-300 p-3">
        <p className="mb-2 text-xs text-text-muted">{t("bonusPowerPreview.label")}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-md border border-zinc-300 py-1 text-sm hover:bg-zinc-50"
        >
          {t("bonusPowerPreview.button")}
        </button>
      </div>

      {open && <BonusPowerScreen bonusPoints={50} onContinue={() => setOpen(false)} />}
    </>
  );
}
