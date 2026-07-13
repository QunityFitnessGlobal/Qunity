import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLinkedChildren } from "@/services/linking.service";
import { getChildStatsForParent } from "@/services/parent-stats.service";
import { getCompletedChallengeHistory, getPendingChallenges } from "@/services/challenge.service";
import { ChallengesTabs } from "@/components/child/ChallengesTabs";
import { ChallengeTestTrigger } from "@/components/child/ChallengeTestTrigger";
import { ChildSelector } from "@/components/parent/ChildSelector";
import type { Role } from "@/lib/types";

interface ChallengesPageProps {
  searchParams: Promise<{ childId?: string }>;
}

export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
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

  const t = await getTranslations("challengesPage");
  const tDashboard = await getTranslations("dashboard");

  if (profile?.role === "child") {
    const [completed, pending] = await Promise.all([
      getCompletedChallengeHistory(supabase, user.id),
      getPendingChallenges(supabase, user.id),
    ]);

    return (
      <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
        <h1 className="text-2xl font-bold">{t("myTitle")}</h1>
        <ChallengesTabs
          completed={completed}
          pending={pending}
          testTrigger={<ChallengeTestTrigger childId={user.id} />}
        />
      </div>
    );
  }

  const linkedChildren = await getLinkedChildren(supabase, user.id);
  const { childId } = await searchParams;
  const selectedChildId = childId ?? linkedChildren[0]?.id ?? null;

  const [stats, pending] = await Promise.all([
    selectedChildId ? getChildStatsForParent(supabase, selectedChildId) : Promise.resolve(null),
    selectedChildId ? getPendingChallenges(supabase, selectedChildId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("completedTitle")}</h1>

      {linkedChildren.length === 0 && (
        <p className="text-zinc-600">{tDashboard("noChildDefined")}</p>
      )}

      {linkedChildren.length > 0 && selectedChildId && (
        <ChildSelector items={linkedChildren} selectedId={selectedChildId} />
      )}

      {stats && <ChallengesTabs completed={stats.completedChallenges} pending={pending} />}
    </div>
  );
}
