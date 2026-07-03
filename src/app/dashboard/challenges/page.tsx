import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLinkedChildren } from "@/services/linking.service";
import { getChildStatsForParent } from "@/services/parent-stats.service";
import { ChallengeList } from "@/components/child/ChallengeList";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { CHALLENGES } from "@/data/challenges.data";
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
    const { data: unlockedRows } = await supabase
      .from("child_challenges")
      .select("challenge_id, completed_at")
      .eq("child_id", user.id)
      .order("completed_at", { ascending: false });

    const challenges = (unlockedRows ?? []).map((row) => {
      const challengeId = row.challenge_id as string;
      return {
        id: challengeId,
        title: CHALLENGES.find((c) => c.id === challengeId)?.title ?? {
          he: challengeId,
          en: challengeId,
        },
        completedAt: row.completed_at as string | null,
      };
    });

    return (
      <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
        <h1 className="text-2xl font-bold">{t("myTitle")}</h1>
        <ChallengeList challenges={challenges} />
      </div>
    );
  }

  const linkedChildren = await getLinkedChildren(supabase, user.id);
  const { childId } = await searchParams;
  const selectedChildId = childId ?? linkedChildren[0]?.id ?? null;
  const stats = selectedChildId ? await getChildStatsForParent(supabase, selectedChildId) : null;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("completedTitle")}</h1>

      {linkedChildren.length === 0 && (
        <p className="text-zinc-600">{tDashboard("noChildDefined")}</p>
      )}

      {linkedChildren.length > 0 && selectedChildId && (
        <ChildSelector items={linkedChildren} selectedId={selectedChildId} />
      )}

      {stats && <ChallengeList challenges={stats.completedChallenges} />}
    </div>
  );
}
