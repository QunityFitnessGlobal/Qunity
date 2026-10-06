"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { setParentPin } from "@/services/family-mode.service";
import { PRIMARY_BUTTON } from "@/components/entry/EntryShell";
import { PIN_INPUT } from "@/components/ui/SettingsUI";

// The 4-digit code for getting back from child mode (the popup's title says
// whether it's set or changed — see ParentPinMenuItem).
export function ParentPinForm() {
  const t = useTranslations("familyMode");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const result = await setParentPin(pin);
    if (result.success) {
      setStatus("saved");
      setPin("");
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <label htmlFor="parent-pin" className="sr-only">
        {t("pinLabelSet")}
      </label>
      <input
        id="parent-pin"
        type="password"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        placeholder="••••"
        className={PIN_INPUT}
        required
      />
      <button type="submit" className={PRIMARY_BUTTON} disabled={pin.length !== 4 || status === "saving"}>
        {status === "saving" ? t("saving") : t("savePin")}
      </button>
      {status === "saved" && <p className="text-sm font-semibold text-[#15803d]">{t("pinSaved")}</p>}
      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {t("pinError")}
        </p>
      )}
    </form>
  );
}
