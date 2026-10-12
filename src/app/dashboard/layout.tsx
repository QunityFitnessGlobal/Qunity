import { Suspense } from "react";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SkinRoot } from "@/components/child/SkinRoot";
import { getNewChallengesCount } from "@/services/challenge.service";
import { getEquippedSkin } from "@/services/skin.service";
import { getProfile, getSupabase, requireUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await getSupabase();

  // The count and the skin are only for a child; for a parent they simply
  // come back 0 and the regular look, and asking alongside the profile
  // saves waiting for one before the other.
  const [profile, newChallenges, skin] = await Promise.all([
    getProfile(user.id),
    getNewChallengesCount(supabase, user.id),
    getEquippedSkin(supabase, user.id),
  ]);
  const role = profile?.role ?? "parent";

  return (
    <SkinRoot skin={role === "child" ? skin : "qunity"} className="flex flex-1 flex-col">
      <div className="flex-1 pb-20">{children}</div>
      <Suspense fallback={null}>
        <BottomTabBar role={role} userId={user.id} initialNewChallenges={role === "child" ? newChallenges : 0} />
      </Suspense>
    </SkinRoot>
  );
}
