import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLinkedChildren } from "@/services/linking.service";
import { getManualMenuTips } from "@/services/tips.service";
import { WhatsHappeningNowMenu } from "@/components/parent/WhatsHappeningNowMenu";
import { ChildSelector } from "@/components/parent/ChildSelector";
import type { Gender, Role } from "@/lib/types";

interface EmpowermentPageProps {
  searchParams: Promise<{ childId?: string }>;
}

// Category 3 ("What's happening now") gets its own bottom-nav tab
// ("העצמה") rather than sitting inline under TipsPanel on the dashboard
// home — same page-per-tab pattern as recent-workouts/challenges/settings.
export default async function EmpowermentPage({ searchParams }: EmpowermentPageProps) {
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

  if (profile?.role === "child") {
    redirect("/dashboard");
  }

  const t = await getTranslations("whatsHappeningNow");
  const tDashboard = await getTranslations("dashboard");

  const linkedChildren = await getLinkedChildren(supabase, user.id);
  const { childId } = await searchParams;
  const selectedChildId = childId ?? linkedChildren[0]?.id ?? null;

  const { data: childUser } = selectedChildId
    ? await supabase
        .from("users")
        .select("gender")
        .eq("id", selectedChildId)
        .single<{ gender: Gender | null }>()
    : { data: null };
  const childGender = childUser?.gender ?? null;

  const manualMenuTips = await getManualMenuTips(supabase);

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("heading")}</h1>

      {linkedChildren.length === 0 && <p className="text-zinc-600">{tDashboard("noChildDefined")}</p>}

      {linkedChildren.length > 0 && selectedChildId && (
        <ChildSelector items={linkedChildren} selectedId={selectedChildId} />
      )}

      {selectedChildId && (
        <WhatsHappeningNowMenu
          tips={manualMenuTips}
          parentId={user.id}
          childId={selectedChildId}
          childGender={childGender}
        />
      )}
    </div>
  );
}
