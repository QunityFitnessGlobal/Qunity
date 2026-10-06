import { getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getLinkedChildren } from "@/services/linking.service";
import { getChildStatsForParent } from "@/services/parent-stats.service";
import { getCompletedChallengeHistory, getPendingChallenges } from "@/services/challenge.service";
import { ChallengesTabs } from "@/components/child/ChallengesTabs";
import { ChildDropdown } from "@/components/parent/ChildDropdown";

interface ChallengesPageProps {
  searchParams: Promise<{ childId?: string }>;
}

export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  const user = await requireUser();
  const supabase = await getSupabase();
  // A parent's linked children are asked for alongside the profile; for a
  // child the list simply comes back empty.
  const [profile, linkedChildren] = await Promise.all([
    getProfile(user.id),
    getLinkedChildren(supabase, user.id),
  ]);

  const t = await getTranslations("challengesPage");
  const tDashboard = await getTranslations("dashboard");

  if (profile?.role === "child") {
    const [completed, pending] = await Promise.all([
      getCompletedChallengeHistory(supabase, user.id),
      getPendingChallenges(supabase, user.id),
    ]);

    return (
      <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
        <h1 className="font-display text-2xl font-bold">{t("myTitle")}</h1>
        <ChallengesTabs completed={completed} pending={pending} canPerform viewerId={user.id} />
      </div>
    );
  }

  const { childId } = await searchParams;
  const selectedChildId = childId ?? linkedChildren[0]?.id ?? null;

  const [stats, pending] = await Promise.all([
    selectedChildId ? getChildStatsForParent(supabase, selectedChildId) : Promise.resolve(null),
    selectedChildId ? getPendingChallenges(supabase, selectedChildId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-12 pt-5">
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <div className="flex w-full items-center justify-between gap-3">
          <h1 className="font-display text-[26px] font-bold">{t("completedTitle")}</h1>
          {linkedChildren.length > 0 && selectedChildId && (
            <ChildDropdown items={linkedChildren} selectedId={selectedChildId} basePath="/dashboard/challenges" />
          )}
        </div>

        {linkedChildren.length === 0 && <p className="text-zinc-600">{tDashboard("noChildDefined")}</p>}

        {stats && <ChallengesTabs completed={stats.completedChallenges} pending={pending} />}
      </div>
    </div>
  );
}
