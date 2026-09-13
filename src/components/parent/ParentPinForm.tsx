"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { setParentPin } from "@/services/family-mode.service";
import { Button } from "@/components/ui/Button";

interface ParentPinFormProps {
  hasPinSet: boolean;
}

export function ParentPinForm({ hasPinSet }: ParentPinFormProps) {
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
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <label className="block text-sm font-medium text-zinc-700">
        {hasPinSet ? t("pinLabelChange") : t("pinLabelSet")}
      </label>
      <input
        type="password"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        placeholder="••••"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-center text-lg tracking-widest focus:border-blue-500 focus:outline-none"
        required
      />
      <Button type="submit" className="w-full" disabled={pin.length !== 4 || status === "saving"}>
        {status === "saving" ? t("saving") : t("savePin")}
      </Button>
      {status === "saved" && <p className="text-sm text-green-600">{t("pinSaved")}</p>}
      {status === "error" && <p className="text-sm text-red-600">{t("pinError")}</p>}
    </form>
  );
}
