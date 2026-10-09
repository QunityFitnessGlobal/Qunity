import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { ChallengeRunner } from "@/components/child/ChallengeRunner";
import type { BraceletColor } from "@/lib/types";
import type { LocalizedText } from "@/lib/i18n-content";

interface ChallengePageProps {
  params: Promise<{ id: string }>;
}

interface ChallengeRow {
  id: string;
  title: LocalizedText;
  description: LocalizedText | null;
  bonus_points: number;
  challenge_type: string;
  unlock_color: BraceletColor | null;
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await getSupabase();

  const [profile, { data: challenge }, { data: attempts }] = await Promise.all([
    getProfile(user.id),
    supabase
      .from("challenges")
      .select("id, title, description, bonus_points, challenge_type, unlock_color")
      .eq("id", id)
      .maybeSingle<ChallengeRow>(),
    supabase
      .from("challenge_sessions")
      .select("points_awarded")
      .eq("child_id", user.id)
      .eq("challenge_id", id)
      .eq("status", "completed"),
  ]);

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

  if (!challenge || challenge.challenge_type !== "repeatable_workout") {
    notFound();
  }

  // A quicker finish pays less (it probably wasn't all the stairs), so the
  // child's best is the most points from one run, not the fastest time.
  const points = ((attempts ?? []) as { points_awarded: number | null }[])
    .map((a) => a.points_awarded)
    .filter((p): p is number => p !== null);
  const tColors = await getTranslations("colors");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <ChallengeRunner
        childId={user.id}
        challengeId={challenge.id}
        title={challenge.title}
        description={challenge.description}
        bonusPoints={challenge.bonus_points}
        color={challenge.unlock_color}
        colorLabel={challenge.unlock_color ? tColors(challenge.unlock_color) : null}
        bestPoints={points.length > 0 ? Math.max(...points) : null}
        timesDone={attempts?.length ?? 0}
        gender={profile?.gender ?? null}
      />
    </div>
  );
}
