import { Suspense } from "react";
import { BottomTabBar } from "@/components/BottomTabBar";
import { getNewChallengesCount } from "@/services/challenge.service";
import { getProfile, getSupabase, requireUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await getSupabase();

  // The count is only shown to a child; for a parent it simply comes back 0,
  // and asking alongside the profile saves waiting for one before the other.
  const [profile, newChallenges] = await Promise.all([
    getProfile(user.id),
    getNewChallengesCount(supabase, user.id),
  ]);
  const role = profile?.role ?? "parent";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 pb-20">{children}</div>
      <Suspense fallback={null}>
        <BottomTabBar role={role} userId={user.id} initialNewChallenges={role === "child" ? newChallenges : 0} />
      </Suspense>
    </div>
  );
}
