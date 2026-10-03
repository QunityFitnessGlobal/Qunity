export const MIN_PASSWORD_LENGTH = 6;

// 0 — nothing typed; 1 — too short to use; 2 — long enough; 3 — strong:
// 8+ characters mixing letters with digits or symbols. Only a hint for the
// meter on the new-password screen; Supabase enforces the real minimum.
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length === 0) return 0;
  if (password.length < MIN_PASSWORD_LENGTH) return 1;
  const hasLetter = /\p{L}/u.test(password);
  const hasOther = /[^\p{L}]/u.test(password);
  return password.length >= 8 && hasLetter && hasOther ? 3 : 2;
}
