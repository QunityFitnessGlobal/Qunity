import type { SupabaseClient } from "@supabase/supabase-js";

// An empowerment moment: the parent marked that they said or tried a tip's
// sentence ("אמרתי!" on the home screen, "ניסיתי את זה" on the empowerment
// screen and in its chat). Returns whether it was saved.
export async function recordMoment(
  supabase: SupabaseClient,
  parentId: string,
  childId: string,
  ruleId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("parent_tip_moments")
    .insert({ parent_id: parentId, child_id: childId, rule_id: ruleId });
  return !error;
}

// What a parent typed in the "מה קורה עכשיו?" chat, names already taken
// out (see lib/whats-now.ts's withoutNames) and nothing tying it to who
// wrote it. Best effort: a failure doesn't concern the parent.
export async function recordChatQuestion(
  supabase: SupabaseClient,
  text: string,
  matchedRuleId: string | null,
): Promise<void> {
  await supabase.from("parent_chat_questions").insert({ text: text.slice(0, 500), matched_rule_id: matchedRuleId });
}
