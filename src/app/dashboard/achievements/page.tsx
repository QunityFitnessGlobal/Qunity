import { redirect } from "next/navigation";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getAchievements } from "@/services/achievements.service";
import { AchievementsView } from "@/components/child/AchievementsView";

// Reached by tapping the avatar on the child's home.
export default async function AchievementsPage() {
  const user = await requireUser();
  const supabase = await getSupabase();

  const [profile, data] = await Promise.all([getProfile(user.id), getAchievements(supabase, user.id)]);

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-8 pt-4">
      <AchievementsView data={data} gender={profile.gender} />
    </div>
  );
}
