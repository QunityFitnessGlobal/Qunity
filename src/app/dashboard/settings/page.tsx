import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLinkedChildren } from "@/services/linking.service";
import { LogoutButton } from "@/components/LogoutButton";
import { PowerPreviewTester } from "@/components/child/PowerPreviewTester";
import { ReturnToParentButton } from "@/components/child/ReturnToParentButton";
import { ParentPinMenuItem } from "@/components/parent/ParentPinMenuItem";
import { ChildModeSwitcher } from "@/components/parent/ChildModeSwitcher";
import { PairChildDeviceMenuItem } from "@/components/parent/PairChildDeviceMenuItem";
import { AccordionSection } from "@/components/ui/AccordionSection";
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
  const tFamily = await getTranslations("familyMode");

  const { data: parentRow } = !isChild
    ? await supabase.from("parents").select("pin_hash").eq("id", user.id).single<{ pin_hash: string | null }>()
    : { data: null };
  const linkedChildren = !isChild ? await getLinkedChildren(supabase, user.id) : [];

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {isChild && (
        <div className="w-full max-w-sm space-y-2">
          <Link
            href="/dashboard/settings/code"
            className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-right shadow-sm transition-colors hover:bg-zinc-50"
          >
            {t("myCode")}
          </Link>
        </div>
      )}

      {isChild && <PowerPreviewTester />}
      {isChild && <ReturnToParentButton />}

      {!isChild && (
        <AccordionSection title={t("sectionChildren")}>
          <Link
            href="/add-child-direct"
            className="block px-4 py-3 text-right text-sm text-zinc-700 hover:bg-zinc-50"
          >
            {t("addChildDirect")}
          </Link>
          <PairChildDeviceMenuItem label={t("pairDevice")} linkedChildren={linkedChildren} />
          <Link
            href="/add-child"
            className="block px-4 py-3 text-right text-xs text-zinc-400 hover:bg-zinc-50"
          >
            {t("alreadyRegisteredLink")}
          </Link>
        </AccordionSection>
      )}

      {!isChild && (
        <AccordionSection title={t("sectionSecurity")}>
          <ParentPinMenuItem hasPinSet={Boolean(parentRow?.pin_hash)} />
        </AccordionSection>
      )}

      {!isChild && (
        <ChildModeSwitcher
          parentId={user.id}
          linkedChildren={linkedChildren}
          label={tFamily("goToChildMode")}
        />
      )}

      <LogoutButton />
    </div>
  );
}
