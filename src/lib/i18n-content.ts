import { IntlMessageFormat } from "intl-messageformat";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import type { Gender } from "@/lib/types";

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

// Same as resolveLocalizedText, but also evaluates ICU `{gender, select,
// male {...} female {...} other {...}}` syntax, for content (currently just
// parent_tip_rules.tip_text) written with grammatically correct Hebrew
// phrasing per gender instead of a slash-form ("הילד/ה"). Plain strings
// without gender syntax pass through IntlMessageFormat unchanged, so this
// is safe to use even for content that hasn't been converted yet.
export function resolveGenderedText(
  value: LocalizedText | null | undefined,
  locale: string,
  gender: Gender | null,
): string {
  const raw = resolveLocalizedText(value, locale);
  if (!raw.includes("{gender")) {
    return raw;
  }
  try {
    const formatter = new IntlMessageFormat(raw, locale);
    return String(formatter.format({ gender: gender ?? "other" }));
  } catch {
    return raw;
  }
}
