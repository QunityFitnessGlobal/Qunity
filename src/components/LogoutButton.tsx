"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { logOut } from "@/services/auth";
import { SECONDARY_BUTTON } from "@/components/entry/EntryShell";
import { SettingsIcons } from "@/components/ui/SettingsUI";

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
    <button type="button" onClick={handleClick} disabled={loading} className={`${SECONDARY_BUTTON} text-[#4f4960]`}>
      {SettingsIcons.logout}
      {loading ? t("loading") : t("button")}
    </button>
  );
}
