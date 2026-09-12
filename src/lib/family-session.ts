// Caches the parent's own session tokens in sessionStorage for the duration
// of a Child Mode visit, so returning to Parent Mode (after a correct PIN)
// can restore the exact same session instead of requiring a real re-login —
// see src/services/family-mode.service.ts's verifyParentPin. sessionStorage
// (not localStorage) is deliberate: it's cleared when the tab closes, so a
// parent who never explicitly switches back isn't left with a dangling
// restorable session sitting around indefinitely.
const STORAGE_KEY = "qunity_parent_session_cache";

interface CachedParentSession {
  parentId: string;
  accessToken: string;
  refreshToken: string;
}

export function cacheParentSession(session: CachedParentSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage unavailable (private browsing, storage blocked, etc.) —
    // Switch Mode just won't have a fast way back; not fatal.
  }
}

export function getCachedParentSession(): CachedParentSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CachedParentSession) : null;
  } catch {
    return null;
  }
}

export function clearCachedParentSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
