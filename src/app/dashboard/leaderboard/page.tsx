import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard, getPointsActivity } from "@/services/leaderboard.service";
import { LeaderboardView } from "@/components/child/LeaderboardView";
import type { Gender, Role } from "@/lib/types";

// The view shows only the top of the ranking, but the child's own place and
// the gap to whoever is just above them need the full ranking.
const FULL_RANKING_LIMIT = 1000;

export default async function LeaderboardPage() {
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

  const [ranking, activity] = await Promise.all([
    getLeaderboard(supabase, FULL_RANKING_LIMIT),
    getPointsActivity(supabase, user.id),
  ]);

  // Hebrew copy has a feminine form and a masculine one, which is also used
  // whenever no gender is on record.
  return (
    <LeaderboardView
      ranking={ranking}
      userId={user.id}
      weekPoints={activity.weekPoints}
      scoringEvents={activity.scoringEvents}
      gender={profile?.gender ?? "male"}
    />
  );
}
