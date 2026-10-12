import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSkinKey, type SkinKey } from "@/lib/skins";
import type { LocalizedText } from "@/lib/i18n-content";

export interface SkinOption {
  itemId: string;
  key: SkinKey;
  title: LocalizedText;
  description: LocalizedText | null;
}

// The skin the child has on (child_equipped, slot "skin"). Anything missing
// or unknown — no choice yet, a parent, the tables not created yet — is the
// regular look. Cached per request, so a layout and its page ask once.
export const getEquippedSkin = cache(async (supabase: SupabaseClient, childId: string): Promise<SkinKey> => {
  const { data, error } = await supabase
    .from("child_equipped")
    .select("store_items(key)")
    .eq("child_id", childId)
    .eq("slot", "skin")
    .maybeSingle<{ store_items: { key: string } | null }>();
  const key = error ? null : data?.store_items?.key;
  return isSkinKey(key) ? key : "qunity";
});

// The skins the child can put on, in the store's order: the free ones and
// the ones they own (the store will add the second kind). Only keys the app
// knows how to draw are offered.
export async function getAvailableSkins(supabase: SupabaseClient, childId: string): Promise<SkinOption[]> {
  const [{ data: items, error }, { data: owned }] = await Promise.all([
    supabase
      .from("store_items")
      .select("id, key, title, description, is_free")
      .eq("kind", "skin")
      .eq("active", true)
      .order("sort_order"),
    supabase.from("child_items").select("item_id").eq("child_id", childId),
  ]);
  if (error || !items) return [];
  const ownedIds = new Set(((owned ?? []) as { item_id: string }[]).map((row) => row.item_id));
  type Row = { id: string; key: string; title: LocalizedText; description: LocalizedText | null; is_free: boolean };
  return (items as Row[])
    .filter((item) => item.is_free || ownedIds.has(item.id))
    .flatMap((item) =>
      isSkinKey(item.key) ? [{ itemId: item.id, key: item.key, title: item.title, description: item.description }] : [],
    );
}
