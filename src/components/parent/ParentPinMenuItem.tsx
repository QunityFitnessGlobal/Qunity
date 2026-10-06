"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ParentPinForm } from "@/components/parent/ParentPinForm";
import { DIALOG_CLOSE, SETTINGS_ROW, SettingsDialog, SettingsIcons, SettingsRowContent } from "@/components/ui/SettingsUI";

interface ParentPinMenuItemProps {
  hasPinSet: boolean;
}

// Settings row for the PIN — opens ParentPinForm in a popup instead of
// showing it inline, matching the other settings rows.
export function ParentPinMenuItem({ hasPinSet }: ParentPinMenuItemProps) {
  const t = useTranslations("familyMode");
  const [open, setOpen] = useState(false);
  const label = hasPinSet ? t("pinLabelChange") : t("pinLabelSet");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={SETTINGS_ROW}>
        <SettingsRowContent icon={SettingsIcons.lock} label={label} />
      </button>

      {open && (
        <SettingsDialog title={label} icon={SettingsIcons.lock}>
          <ParentPinForm />
          <button type="button" onClick={() => setOpen(false)} className={DIALOG_CLOSE}>
            {t("close")}
          </button>
        </SettingsDialog>
      )}
    </>
  );
}
