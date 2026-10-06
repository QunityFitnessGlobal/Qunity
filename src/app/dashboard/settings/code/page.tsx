import Link from "next/link";
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
    <div className="flex flex-1 flex-col items-center px-4 pb-12 pt-5">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/settings"
            aria-label={t("title")}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[#4f4960]"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5 ltr:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7.5 5l5 5-5 5" />
            </svg>
          </Link>
          <h1 className="font-display text-[26px] font-bold">{t("myCode")}</h1>
        </div>
        {child?.child_code && <ChildCodeCard code={child.child_code} />}
      </div>
    </div>
  );
}
