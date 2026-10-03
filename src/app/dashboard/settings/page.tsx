import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
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
import type { BraceletColor } from "@/lib/types";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await getSupabase();
  const profile = await getProfile(user.id);

  const isChild = profile?.role === "child";
  const t = await getTranslations("settings");
  const tFamily = await getTranslations("familyMode");

  // Independent of each other, so fetched together. The stage table is only
  // used by the TEMP testing tools, and it's tiny, so it's read either way.
  const [{ data: parentRow }, linkedChildren, qaAllowed, { data: levelRows }] = await Promise.all([
    !isChild
      ? supabase.from("parents").select("pin_hash").eq("id", user.id).maybeSingle<{ pin_hash: string | null }>()
      : Promise.resolve({ data: null }),
    !isChild ? getLinkedChildren(supabase, user.id) : Promise.resolve([]),
    // TEMP testing tools are for admins only (and children linked to them).
    canUseQaTools(user, profile?.role),
    supabase.from("bracelet_levels").select("color, required_workouts, required_points"),
  ]);
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
