// Pure constants only — no "next/headers" or other server-only imports here,
// since this is also imported from lib/i18n-content.ts, which client
// components (e.g. TipCard.tsx) depend on. Keep it that way.
export const SUPPORTED_LOCALES = ["he", "en"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "he";

export function isSupportedLocale(value: string | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}
