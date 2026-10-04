import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getLinkedChildren } from "@/services/linking.service";
import { getManualMenuTips } from "@/services/tips.service";
import { WhatsHappeningNowMenu } from "@/components/parent/WhatsHappeningNowMenu";
import { ChildSelector } from "@/components/parent/ChildSelector";
import type { Gender } from "@/lib/types";

interface EmpowermentPageProps {
  searchParams: Promise<{ childId?: string }>;
}

// Category 3 ("What's happening now") gets its own bottom-nav tab
// ("העצמה") rather than sitting inline under TipsPanel on the dashboard
// home — same page-per-tab pattern as recent-workouts/challenges/settings.
export default async function EmpowermentPage({ searchParams }: EmpowermentPageProps) {
  const user = await requireUser();
  const supabase = await getSupabase();

  const [profile, linkedChildren, manualMenuTips, { childId }] = await Promise.all([
    getProfile(user.id),
    getLinkedChildren(supabase, user.id),
    getManualMenuTips(supabase),
    searchParams,
  ]);

  if (profile?.role === "child") {
    redirect("/dashboard");
  }

  const t = await getTranslations("whatsHappeningNow");
  const tDashboard = await getTranslations("dashboard");
  const selectedChildId = childId ?? linkedChildren[0]?.id ?? null;

  const { data: childUser } = selectedChildId
    ? await supabase
        .from("users")
        .select("gender")
        .eq("id", selectedChildId)
        .maybeSingle<{ gender: Gender | null }>()
    : { data: null };
  const childGender = childUser?.gender ?? null;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("heading")}</h1>

      {linkedChildren.length === 0 && <p className="text-zinc-600">{tDashboard("noChildDefined")}</p>}

      {linkedChildren.length > 0 && selectedChildId && (
        <ChildSelector items={linkedChildren} selectedId={selectedChildId} />
      )}

      {selectedChildId && (
        <WhatsHappeningNowMenu
          // Forces a full remount (fresh expandedGroup/selectedTip state)
          // whenever the selected child changes. Without this, Next.js's
          // client-side navigation for a searchParams-only change can reuse
          // the existing WhatsHappeningNowMenu instance instead of
          // remounting it, since it stays in the same position in the tree
          // — leaving stale accordion/tip state on screen.
          key={selectedChildId}
          tips={manualMenuTips}
          parentId={user.id}
          childId={selectedChildId}
          childGender={childGender}
          parentGender={profile?.gender ?? null}
        />
      )}
    </div>
  );
}
