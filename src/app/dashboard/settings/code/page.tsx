import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ChildCodeCard } from "@/components/ChildCodeCard";
import type { Role } from "@/lib/types";

export default async function MyCodePage() {
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

  const { data: child } = await supabase
    .from("children")
    .select("child_code")
    .eq("id", user.id)
    .single<{ child_code: string }>();

  const t = await getTranslations("settings");

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{t("myCode")}</h1>
      {child?.child_code && <ChildCodeCard code={child.child_code} />}
    </div>
  );
}
