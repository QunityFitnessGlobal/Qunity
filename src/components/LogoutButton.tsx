"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { logOut } from "@/services/auth";
import { SettingsIcons } from "@/components/ui/SettingsUI";

// The entry screens' secondary button, in the child's skin colors when one is on.
const LOGOUT_BUTTON =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#e4dfeb] bg-skin-surface font-display text-[17px] font-semibold text-skin-ink-2";

export function LogoutButton() {
  const t = useTranslations("logout");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await logOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={LOGOUT_BUTTON}>
      {SettingsIcons.logout}
      {loading ? t("loading") : t("button")}
    </button>
  );
}
