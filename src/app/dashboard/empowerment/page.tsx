import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getLinkedChildren } from "@/services/linking.service";
import { getManualMenuTips } from "@/services/tips.service";
import { getParentGrowth } from "@/services/parent-growth.service";
import { resolveGenderedText, resolveLocalizedText } from "@/lib/i18n-content";
import { splitExample, splitTipParts } from "@/lib/tip-text";
import { WhatsHappeningNowMenu } from "@/components/parent/WhatsHappeningNowMenu";
import { ChildChips } from "@/components/parent/ChildChips";
import { GrowthJourney, type PracticeTipView } from "@/components/parent/GrowthJourney";
import type { Gender } from "@/lib/types";

interface EmpowermentPageProps {
  searchParams: Promise<{ childId?: string }>;
}

// The empowerment tab: the parent's journey (stage ring and principle
// badges), a sentence to practice, and the "What's happening now" menu.
export default async function EmpowermentPage({ searchParams }: EmpowermentPageProps) {
  const user = await requireUser();
  const supabase = await getSupabase();

  const [profile, linkedChildren, manualMenuTips, { childId }] = await Promise.all([
    getProfile(user.id),
    getLinkedChildren(supabase, user.id),
    getManualMenuTips(supabase),
    searchParams,
  ]);

  if (profile?.role === "child") {
    redirect("/dashboard");
  }

  const t = await getTranslations("parentGrowth");
  const tDashboard = await getTranslations("dashboard");
  const locale = await getLocale();
  const selectedChild = linkedChildren.find((c) => c.id === childId) ?? linkedChildren[0] ?? null;
  const parentGender = profile?.gender ?? null;

  const [growth, childGender] = selectedChild
    ? await Promise.all([
        getParentGrowth(supabase, user.id, selectedChild.id),
        supabase
          .from("users")
          .select("gender")
          .eq("id", selectedChild.id)
          .maybeSingle<{ gender: Gender | null }>()
          .then(({ data }) => data?.gender ?? null),
      ])
    : [null, null];

  // Each sentence to practice: what to do (when the tip says), the sentence
  // and why it works, in this child's and this parent's words.
  const practice: PracticeTipView[] = [];
  for (const tip of growth?.practice?.tips ?? []) {
    const text = resolveGenderedText(tip.tipText, locale, childGender, {
      parentGender,
      name: selectedChild?.nickname,
    });
    const parts = splitTipParts(text);
    const example = parts.find((part) => part.label === "משפט לדוגמה");
    if (!example) continue;
    const { quote, why } = splitExample(example.text);
    practice.push({
      ruleId: tip.id,
      principle: tip.principle,
      principleLabel: resolveLocalizedText({ he: tip.principle }, locale),
      doText: parts.find((part) => part.label === "מה כן לעשות")?.text ?? null,
      quote,
      why,
      saidToday: tip.saidToday,
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-12 pt-5">
      <div className="flex w-full max-w-md flex-col gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[26px] font-bold">{t("title")}</h1>
          {selectedChild && (
            <ChildChips items={linkedChildren} selectedId={selectedChild.id} basePath="/dashboard/empowerment" />
          )}
        </div>

        {linkedChildren.length === 0 && <p className="text-zinc-600">{tDashboard("noChildDefined")}</p>}

        {selectedChild && growth && (
          <GrowthJourney
            // A fresh card (position, what's been tried) for each child.
            key={selectedChild.id}
            totalMoments={growth.totalMoments}
            countsByPrinciple={growth.countsByPrinciple}
            practice={practice}
            parentGender={parentGender}
            parentId={user.id}
            childId={selectedChild.id}
          />
        )}

        {selectedChild && (
          <section className="flex flex-col gap-2 pt-1">
            <h2 className="font-display text-lg font-semibold">{t("menuTitle")}</h2>
            <WhatsHappeningNowMenu
              // Forces a full remount (fresh expandedGroup/selectedTip state)
              // whenever the selected child changes. Without this, Next.js's
              // client-side navigation for a searchParams-only change can reuse
              // the existing WhatsHappeningNowMenu instance instead of
              // remounting it, since it stays in the same position in the tree
              // — leaving stale accordion/tip state on screen.
              key={selectedChild.id}
              tips={manualMenuTips}
              parentId={user.id}
              childId={selectedChild.id}
              childGender={childGender}
              parentGender={parentGender}
            />
          </section>
        )}
      </div>
    </div>
  );
}
