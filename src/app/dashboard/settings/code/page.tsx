import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { ChildCodeCard } from "@/components/ChildCodeCard";

export default async function MyCodePage() {
  const user = await requireUser();
  const supabase = await getSupabase();

  const [profile, { data: child }] = await Promise.all([
    getProfile(user.id),
    supabase.from("children").select("child_code").eq("id", user.id).maybeSingle<{ child_code: string }>(),
  ]);

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

  const t = await getTranslations("settings");

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("myCode")}</h1>
      {child?.child_code && <ChildCodeCard code={child.child_code} />}
    </div>
  );
}
