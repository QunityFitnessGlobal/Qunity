"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { verifyParentPin } from "@/services/family-mode.service";
import { getCachedParentSession, clearCachedParentSession } from "@/lib/family-session";
import { Button } from "@/components/ui/Button";

// "יציאה למצב הורה" — the child-side counterpart of ChildModeSwitcher. A
// correct PIN restores the parent's own session from what was cached at
// switch time (see family-session.ts); it never issues a brand-new parent
// login, so it only works on the device that actually switched away. If the
// cache is gone (tab closed, storage cleared), falls back to a real login.
export function ReturnToParentButton() {
  const t = useTranslations("familyMode");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function closeModal() {
    setOpen(false);
    setError(null);
    setPin("");
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const cached = getCachedParentSession();
      if (!cached) {
        router.push("/login");
        return;
      }

      const result = await verifyParentPin(cached.parentId, pin);
      if (!result.success) {
        setError(t("wrongPin"));
        return;
      }

      const supabase = createClient();
      const { error: restoreError } = await supabase.auth.setSession({
        access_token: cached.accessToken,
        refresh_token: cached.refreshToken,
      });
      clearCachedParentSession();

      if (restoreError) {
        // The cached parent session is no longer valid (e.g. it was refreshed
        // elsewhere or expired). The PIN was right, so rather than dropping the
        // parent back on the child screen, end the child session and send them
        // to a normal login.
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
      setPin("");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-zinc-500 underline"
      >
        {t("exitToParentMode")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xs space-y-3 rounded-lg bg-white p-5 text-center">
            <p className="text-lg font-bold">🔒 {t("enterPin")}</p>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              autoFocus
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-blue-500 focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button className="flex-1 bg-zinc-700 hover:bg-zinc-800" onClick={closeModal}>
                {t("cancel")}
              </Button>
              <Button
                className="flex-1"
                disabled={pin.length !== 4 || loading}
                onClick={handleSubmit}
              >
                {loading ? t("checking") : t("confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
