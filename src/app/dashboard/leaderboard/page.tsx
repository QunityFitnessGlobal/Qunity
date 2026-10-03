import { redirect } from "next/navigation";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getLeaderboard, getPointsActivity } from "@/services/leaderboard.service";
import { LeaderboardView } from "@/components/child/LeaderboardView";

// The view shows only the top of the ranking, but the child's own place and
// the gap to whoever is just above them need the full ranking.
const FULL_RANKING_LIMIT = 1000;

export default async function LeaderboardPage() {
  const user = await requireUser();
  const supabase = await getSupabase();

  const [profile, ranking, activity] = await Promise.all([
    getProfile(user.id),
    getLeaderboard(supabase, FULL_RANKING_LIMIT),
    getPointsActivity(supabase, user.id),
  ]);

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

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
