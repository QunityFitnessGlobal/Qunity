import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getAvailableSkins, getEquippedSkin } from "@/services/skin.service";
import { resolveLocalizedText } from "@/lib/i18n-content";
import { SkinPicker } from "@/components/child/SkinPicker";

// "הסקין שלי": the child picks how their screens look. Every skin is free
// for now; the store will later add ones bought with points.
export default async function SkinPage() {
  const user = await requireUser();
  const supabase = await getSupabase();

  const [profile, active, skins, { data: child }] = await Promise.all([
    getProfile(user.id),
    getEquippedSkin(supabase, user.id),
    getAvailableSkins(supabase, user.id),
    supabase.from("children").select("total_points").eq("id", user.id).maybeSingle<{ total_points: number }>(),
  ]);

  if (profile?.role !== "child") {
    redirect("/dashboard");
  }

  const t = await getTranslations("skins");
  const locale = await getLocale();

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-12 pt-5">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              aria-label={t("back")}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-skin-line bg-skin-surface text-skin-ink-2"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5 ltr:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M7.5 5l5 5-5 5" />
              </svg>
            </Link>
            <h1 className="font-display text-[26px] font-bold">{t("title")}</h1>
          </div>
          <p className="text-[13.5px] text-skin-muted">{t("subtitle")}</p>
        </div>

        {skins.length === 0 ? (
          <p className="rounded-2xl border border-skin-line bg-skin-surface p-4 text-center text-skin-muted">{t("empty")}</p>
        ) : (
          <SkinPicker
            skins={skins.map((skin) => ({
              itemId: skin.itemId,
              key: skin.key,
              name: resolveLocalizedText(skin.title, locale),
              description: resolveLocalizedText(skin.description, locale),
            }))}
            active={active}
            childName={profile.full_name?.trim().split(/\s+/)[0] ?? ""}
            points={child?.total_points ?? 0}
          />
        )}
      </div>
    </div>
  );
}
