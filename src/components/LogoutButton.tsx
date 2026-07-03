"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { logOut } from "@/services/auth";
import { Button } from "@/components/ui/Button";

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
    <Button onClick={handleClick} disabled={loading} className="bg-zinc-700 hover:bg-zinc-800">
      {loading ? t("loading") : t("button")}
    </Button>
  );
}
