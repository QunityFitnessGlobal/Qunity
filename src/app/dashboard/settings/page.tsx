import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLinkedChildren } from "@/services/linking.service";
import { canUseQaTools } from "@/lib/admin-access";
import { LogoutButton } from "@/components/LogoutButton";
import { WorkoutSoundMenuItem } from "@/components/WorkoutSoundMenuItem";
import { PowerPreviewTester } from "@/components/child/PowerPreviewTester";
import { LevelUpPreviewTester, type StageRequirements } from "@/components/child/LevelUpPreviewTester";
import { QaToolsToggle } from "@/components/child/QaToolsToggle";
import { ReturnToParentButton } from "@/components/child/ReturnToParentButton";
import { ParentPinMenuItem } from "@/components/parent/ParentPinMenuItem";
import { ChildModeSwitcher } from "@/components/parent/ChildModeSwitcher";
import { ChildrenAccordion } from "@/components/parent/ChildrenAccordion";
import { AccordionSection } from "@/components/ui/AccordionSection";
import type { BraceletColor, Role } from "@/lib/types";

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
  // TEMP testing tools are for admins only (and children linked to them).
  const qaAllowed = await canUseQaTools(user, profile?.role);

  const { data: levelRows } = qaAllowed
    ? await supabase.from("bracelet_levels").select("color, required_workouts, required_points")
    : { data: null };
  const stageRequirements: StageRequirements = Object.fromEntries(
    ((levelRows ?? []) as { color: BraceletColor; required_workouts: number; required_points: number }[]).map(
      (row) => [row.color, { workouts: row.required_workouts, points: row.required_points }],
    ),
  );

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

      {isChild && <WorkoutSoundMenuItem />}

      {qaAllowed && <PowerPreviewTester />}
      {qaAllowed && <LevelUpPreviewTester stages={stageRequirements} />}
      {qaAllowed && <QaToolsToggle />}
      {isChild && <ReturnToParentButton />}

      {!isChild && (
        <Suspense fallback={null}>
          <ChildrenAccordion linkedChildren={linkedChildren} />
        </Suspense>
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
