import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChallengeRunner } from "@/components/child/ChallengeRunner";
import type { Gender, Role } from "@/lib/types";
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
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, gender")
    .eq("id", user.id)
    .single<{ role: Role; gender: Gender | null }>();

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, title, description, bonus_points, challenge_type")
    .eq("id", id)
    .single<ChallengeRow>();

  if (!challenge || challenge.challenge_type !== "repeatable_workout") {
    notFound();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <ChallengeRunner
        childId={user.id}
        challengeId={challenge.id}
        title={challenge.title}
        description={challenge.description}
        bonusPoints={challenge.bonus_points}
        gender={profile?.gender ?? null}
      />
    </div>
  );
}
