import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLeaderboard } from "@/services/leaderboard.service";
import { ColorBadge } from "@/components/child/ColorBadge";
import type { Role } from "@/lib/types";

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
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

  const t = await getTranslations("leaderboard");
  const entries = await getLeaderboard(supabase);

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">{t("empty")}</p>
      ) : (
        <ol className="w-full max-w-sm space-y-2">
          {entries.map((entry, index) => {
            const isYou = entry.id === user.id;
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 rounded-lg border p-3 shadow-sm ${
                  isYou
                    ? "border-brand-purple bg-brand-purple/5"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <span className="w-6 text-center text-sm font-semibold text-text-muted">
                  {index + 1}
                </span>
                <ColorBadge color={entry.currentColor} size="sm" />
                <span className="flex-1 text-sm font-medium">
                  {entry.nickname} {isYou && t("you")}
                </span>
                <span className="text-sm font-bold text-brand-purple">
                  {t("points", { points: entry.totalPoints })}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
