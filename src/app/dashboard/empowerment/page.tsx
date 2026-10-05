import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getProfile, getSupabase, requireUser } from "@/lib/session";
import { getLinkedChildren } from "@/services/linking.service";
import { getManualMenuTips } from "@/services/tips.service";
import { getParentGrowth } from "@/services/parent-growth.service";
import { resolveGenderedText, resolveLocalizedText } from "@/lib/i18n-content";
import { splitExample, splitTipParts } from "@/lib/tip-text";
import { withChildName, type ChatTip } from "@/lib/whats-now";
import { ChildDropdown } from "@/components/parent/ChildDropdown";
import { EmpowermentView } from "@/components/parent/EmpowermentView";
import type { PracticeTipView } from "@/components/parent/GrowthJourney";
import type { Gender } from "@/lib/types";

interface EmpowermentPageProps {
  searchParams: Promise<{ childId?: string }>;
}

// The empowerment tab: the parent's journey (stage ring and principle
// badges), a sentence to practice, and the "מה קורה עכשיו?" chat.
export default async function EmpowermentPage({ searchParams }: EmpowermentPageProps) {
  const user = await requireUser();
  const supabase = await getSupabase();

  const [profile, linkedChildren, manualMenuTips, { childId }] = await Promise.all([
    getProfile(user.id),
    getLinkedChildren(supabase, user.id),
    getManualMenuTips(),
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

  // The chat's situations, each in this child's and this parent's words.
  const childName = selectedChild?.nickname ?? "";
  const chatTips: ChatTip[] = manualMenuTips.flatMap((tip) => {
    const parts = splitTipParts(
      resolveGenderedText(tip.tipText, locale, childGender, { parentGender, name: childName }),
    );
    const part = (label: string) => parts.find((p) => p.label === label)?.text ?? null;
    const example = part("משפט לדוגמה");
    if (!example) return [];
    const { quote, why } = splitExample(example);
    const what = part("מה קורה כאן");
    return [
      {
        ruleId: tip.ruleId,
        group: tip.menuGroup,
        label: resolveGenderedText({ he: tip.chatLabel ?? tip.labelHe, en: tip.labelEn || tip.labelHe }, locale, childGender, {
          parentGender,
        }),
        principle: tip.principle?.he ?? "",
        principleLabel: tip.principle ? resolveLocalizedText(tip.principle, locale) : "",
        what: what ? withChildName(what, childName) : null,
        dont: part("מה לא לעשות"),
        doText: part("מה כן לעשות"),
        quote,
        why,
        keywords: tip.keywords,
        quick: tip.chatQuick,
      },
    ];
  });

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-12 pt-5">
      <div className="flex w-full max-w-md flex-col gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[26px] font-bold">{t("title")}</h1>
          {selectedChild && (
            <ChildDropdown items={linkedChildren} selectedId={selectedChild.id} basePath="/dashboard/empowerment" />
          )}
        </div>

        {linkedChildren.length === 0 && <p className="text-zinc-600">{tDashboard("noChildDefined")}</p>}

        {selectedChild && growth && (
          <EmpowermentView
            // Fresh state (the card, the chat) for each child.
            key={selectedChild.id}
            totalMoments={growth.totalMoments}
            countsByPrinciple={growth.countsByPrinciple}
            practice={practice}
            chatTips={chatTips}
            triedToday={growth.triedToday}
            privateNames={[
              ...linkedChildren.map((child) => child.nickname),
              ...(profile?.full_name ?? "").split(/\s+/),
            ]}
            childName={childName}
            childGender={childGender}
            parentName={profile?.full_name?.trim().split(/\s+/)[0] || null}
            parentGender={parentGender}
            parentId={user.id}
            childId={selectedChild.id}
          />
        )}
      </div>
    </div>
  );
}
