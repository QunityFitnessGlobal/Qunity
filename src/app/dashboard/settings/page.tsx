import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import type { Role } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();

  const isChild = profile?.role === "child";
  const t = await getTranslations("settings");

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="w-full max-w-sm space-y-2">
        {isChild ? (
          <Link
            href="/dashboard/settings/code"
            className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-right shadow-sm transition-colors hover:bg-zinc-50"
          >
            {t("myCode")}
          </Link>
        ) : (
          <Link
            href="/add-child"
            className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-right shadow-sm transition-colors hover:bg-zinc-50"
          >
            {t("addChild")}
          </Link>
        )}
      </div>

      <LogoutButton />
    </div>
  );
}
