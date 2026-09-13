"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ParentPinForm } from "@/components/parent/ParentPinForm";

interface ParentPinMenuItemProps {
  hasPinSet: boolean;
}

// Settings menu row for the PIN — opens ParentPinForm in a popup instead of
// showing it inline, matching the other pairing menu items.
export function ParentPinMenuItem({ hasPinSet }: ParentPinMenuItemProps) {
  const t = useTranslations("familyMode");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full px-4 py-3 text-right text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {hasPinSet ? t("pinLabelChange") : t("pinLabelSet")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xs space-y-3 rounded-lg bg-white p-5">
            <ParentPinForm hasPinSet={hasPinSet} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="block w-full text-center text-sm text-zinc-500 underline"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
