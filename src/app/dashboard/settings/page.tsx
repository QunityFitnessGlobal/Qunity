import Link from "next/link";
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
import { PairChildDeviceMenuItem } from "@/components/parent/PairChildDeviceMenuItem";
import { ChildModeSwitcher } from "@/components/parent/ChildModeSwitcher";
import { SETTINGS_ROW, SettingsIcons, SettingsRowContent, SettingsSection } from "@/components/ui/SettingsUI";
import type { BraceletColor } from "@/lib/types";

// Settings, for a parent (their children, the PIN, child mode) or a child
// (their code, the workout sound, back to parent mode): grouped cards of
// rows, each opening its own popup.
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
  const name = profile?.full_name?.trim() ?? "";

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-12 pt-5">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="font-display text-[26px] font-bold">{t("title")}</h1>

        {(name || (!isChild && user.email)) && (
          <section className="flex items-center gap-3 rounded-[20px] border border-[#ece6f2] bg-white px-4 py-3.5">
            <span
              className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-purple font-display text-xl font-bold text-white"
              aria-hidden
            >
              {name ? name[0] : "?"}
            </span>
            <span className="flex min-w-0 flex-col">
              {name && <span className="font-display text-lg font-semibold">{name}</span>}
              {!isChild && user.email && (
                <span dir="ltr" className="truncate text-start text-sm text-[#6c6580]">
                  {user.email}
                </span>
              )}
            </span>
          </section>
        )}

        {!isChild && (
          <SettingsSection title={t("sectionChildren")}>
            <Link href="/add-child-direct" className={SETTINGS_ROW}>
              <SettingsRowContent icon={SettingsIcons.addChild} label={t("addChildDirect")} />
            </Link>
            <PairChildDeviceMenuItem label={t("pairDevice")} linkedChildren={linkedChildren} />
            <Link href="/add-child" className={SETTINGS_ROW}>
              <SettingsRowContent icon={SettingsIcons.link} label={t("alreadyRegisteredLink")} quiet />
            </Link>
          </SettingsSection>
        )}

        {!isChild && (
          <SettingsSection title={t("sectionSecurity")}>
            <ParentPinMenuItem hasPinSet={Boolean(parentRow?.pin_hash)} />
          </SettingsSection>
        )}

        {isChild && (
          <SettingsSection>
            <Link href="/dashboard/settings/code" className={SETTINGS_ROW}>
              <SettingsRowContent icon={SettingsIcons.code} label={t("myCode")} />
            </Link>
            <WorkoutSoundMenuItem />
            <ReturnToParentButton />
          </SettingsSection>
        )}

        {!isChild && (
          <ChildModeSwitcher parentId={user.id} linkedChildren={linkedChildren} label={tFamily("goToChildMode")} />
        )}

        {qaAllowed && (
          <section className="flex flex-col gap-2 [&>*]:max-w-none">
            <h2 className="px-1 text-[13px] font-semibold text-[#6c6580]">{t("qaSection")}</h2>
            <PowerPreviewTester />
            <LevelUpPreviewTester stages={stageRequirements} />
            <QaToolsToggle />
          </section>
        )}

        <LogoutButton />
      </div>
    </div>
  );
}
