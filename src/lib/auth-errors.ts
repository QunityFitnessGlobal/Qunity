// Supabase auth errors come back as raw English strings (e.g. "Invalid login
// credentials") regardless of UI locale. This maps the common ones to a
// translation key so the caller can show a friendly, localized message
// instead of leaking the raw technical text.
export function matchErrorKey(
  message: string,
  patterns: Array<[RegExp, string]>,
  fallbackKey: string,
): string {
  for (const [pattern, key] of patterns) {
    if (pattern.test(message)) {
      return key;
    }
  }
  return fallbackKey;
}
