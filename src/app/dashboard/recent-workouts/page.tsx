import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getLinkedChildren } from "@/services/linking.service";
import { getWorkoutHistory } from "@/services/workout-history.service";
import { WorkoutHistoryView } from "@/components/parent/WorkoutHistoryView";
import { ChildSelector } from "@/components/parent/ChildSelector";

interface RecentWorkoutsPageProps {
  searchParams: Promise<{ childId?: string }>;
}

export default async function RecentWorkoutsPage({ searchParams }: RecentWorkoutsPageProps) {
  const user = await requireUser();
  const supabase = await getSupabase();

  const [profile, linkedChildren, { childId }] = await Promise.all([
    getProfile(user.id),
    getLinkedChildren(supabase, user.id),
    searchParams,
  ]);

  if (profile?.role === "child") {
    redirect("/dashboard");
  }

  const t = await getTranslations("recentWorkoutsPage");
  const tDashboard = await getTranslations("dashboard");

  const selectedChildId = childId ?? linkedChildren[0]?.id ?? null;
  const history = selectedChildId ? await getWorkoutHistory(supabase, selectedChildId) : null;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-8">
      <h1 className="w-full max-w-md font-display text-[26px] font-bold">{t("title")}</h1>

      {linkedChildren.length === 0 && (
        <p className="text-zinc-600">{tDashboard("noChildDefined")}</p>
      )}

      {linkedChildren.length > 0 && selectedChildId && (
        <ChildSelector items={linkedChildren} selectedId={selectedChildId} />
      )}

      {history && <WorkoutHistoryView history={history} />}
    </div>
  );
}
