import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getChallengeDefinitions } from "@/services/challenge.service";
import type { LocalizedText } from "@/lib/i18n-content";

// SERVER-ONLY (uses the admin client). The team's content — tips and
// challenges — is the same for everyone and changes rarely, yet every
// parent screen reads it, several times. It's kept in Next's data cache
// for ten minutes, so an edit in the database shows within that time
// (sooner with revalidateTag on the tag). Read with the admin client
// because a cache can't use the visitor's cookies; it's public content.

const TEN_MINUTES = 600;

export interface TipRuleRecord {
  id: string;
  principle: LocalizedText | null;
  condition_type: string;
  condition_params: Record<string, unknown> | null;
  tip_text: LocalizedText;
  short_text: LocalizedText | null;
  reason_text: LocalizedText | null;
  priority: number;
}

export const getTipRules = unstable_cache(
  async (): Promise<TipRuleRecord[]> => {
    const { data, error } = await createAdminClient()
      .from("parent_tip_rules")
      .select("id, principle, condition_type, condition_params, tip_text, short_text, reason_text, priority");
    if (error) throw error;
    return (data ?? []) as TipRuleRecord[];
  },
  ["parent-tip-rules"],
  { revalidate: TEN_MINUTES, tags: ["parent-tip-rules"] },
);

// A failed read isn't cached (it throws), so the next visit tries again;
// meanwhile the screen shows without tips rather than failing.
export async function loadTipRules(): Promise<TipRuleRecord[]> {
  try {
    return await getTipRules();
  } catch {
    return [];
  }
}

export const getCachedChallengeDefinitions = unstable_cache(
  async () => getChallengeDefinitions(createAdminClient()),
  ["challenge-definitions"],
  { revalidate: TEN_MINUTES, tags: ["challenges"] },
);
