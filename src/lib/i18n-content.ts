import { DEFAULT_LOCALE } from "@/i18n/locales";

// Shape of the JSONB columns for team-authored content (workouts/challenges
// titles+descriptions, parent_tip_rules.tip_text): {"he": "...", "en": "..."}.
// Falls back to "he" (the original content before this became multi-lingual)
// if the requested locale key is missing.
export type LocalizedText = Record<string, string>;

export function resolveLocalizedText(value: LocalizedText | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }
  return value[locale] ?? value[DEFAULT_LOCALE] ?? Object.values(value)[0] ?? "";
}
