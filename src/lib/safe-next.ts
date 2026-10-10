// Where to go after signing in (?next=…): only a path inside the app, so
// the parameter can't send anyone to another site ("//evil.com", "/\evil").
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value === "/login" || value.startsWith("/login?")) return null;
  return value;
}
