import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isSupportedLocale } from "./locales";

// No URL-based locale routing (no /en/... prefix) — the current UI stays at
// the same URLs it already had. Locale is resolved from a cookie for now
// (see README for how to test the English UI); a future settings screen can
// write to the same cookie, or this can be extended to read the logged-in
// user's `users.preferred_language` column.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
