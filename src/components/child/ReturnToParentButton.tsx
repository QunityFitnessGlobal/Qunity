"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { verifyParentPin } from "@/services/family-mode.service";
import { getCachedParentSession, clearCachedParentSession } from "@/lib/family-session";
import { DIALOG_CLOSE, SETTINGS_ROW, SettingsDialog, SettingsIcons, SettingsRowContent } from "@/components/ui/SettingsUI";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

// "יציאה למצב הורה" — the child-side counterpart of ChildModeSwitcher. A
// correct PIN restores the parent's own session from what was cached at
// switch time (see family-session.ts); it never issues a brand-new parent
// login, so it only works on the device that actually switched away. If the
// cache is gone (tab closed, storage cleared), falls back to a real login.
export function ReturnToParentButton() {
  const t = useTranslations("familyMode");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={SETTINGS_ROW}>
        <SettingsRowContent icon={SettingsIcons.lock} label={t("exitToParentMode")} />
      </button>

      {open && <ParentPinDialog onClose={() => setOpen(false)} />}
    </>
  );
}

// The code is typed on a big keypad into hidden boxes, like the pairing code
// (see app/pair/page.tsx), and checked as soon as the last digit is in.
function ParentPinDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("familyMode");
  const tPair = useTranslations("pair");
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Bumped on every wrong code so the boxes shake again.
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);

  function press(key: string) {
    if (loading) return;
    setError(null);
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!/^\d$/.test(key) || pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) submit(next);
  }

  async function submit(code: string) {
    setLoading(true);
    try {
      const cached = getCachedParentSession();
      if (!cached) {
        router.push("/login");
        return;
      }

      const result = await verifyParentPin(cached.parentId, code);
      if (!result.success) {
        setError(t("wrongPin"));
        setAttempt((n) => n + 1);
        setPin("");
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
    }
  }

  // A physical keyboard types into the boxes as well.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <SettingsDialog title={t("returnTitle")} icon={SettingsIcons.lock}>
      <p className="-mt-1 text-sm text-[#6c6580]">{t("returnDescription")}</p>

      <div
        key={attempt}
        dir="ltr"
        role="group"
        aria-label={t("enterPin")}
        className={`mx-auto mt-1 flex gap-2.5 ${error ? "animate-entry-shake" : ""}`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => {
          const filled = i < pin.length;
          return (
            <span
              key={`${i}-${filled}`}
              className={`flex h-14 w-12 items-center justify-center rounded-[14px] border-2 ${
                error
                  ? "border-[#f5a3a8] bg-[#fff5f5]"
                  : filled
                    ? "animate-power-badge-pop border-brand-purple bg-brand-purple/[0.06]"
                    : i === pin.length
                      ? "border-reward-gold bg-[#faf8fc]"
                      : "border-[#e4dfeb] bg-[#faf8fc]"
              }`}
            >
              {filled && <span className="h-3.5 w-3.5 rounded-full bg-brand-purple" />}
            </span>
          );
        })}
      </div>
      <span
        className={`min-h-[18px] text-[13px] ${error ? "font-semibold text-red-600" : "text-[#8a8399]"}`}
        role={error ? "alert" : undefined}
        aria-live="polite"
      >
        {error ?? (loading ? t("checking") : tPair("digitsLeft", { count: PIN_LENGTH - pin.length }))}
      </span>

      <div dir="ltr" className="mx-auto grid grid-cols-3 gap-2.5">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={`blank-${i}`} />
          ) : (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              disabled={loading}
              aria-label={key === "del" ? tPair("delete") : key}
              className="h-[54px] w-[76px] rounded-2xl bg-[#f4f2f7] font-display text-2xl font-semibold text-[#221a33] transition-transform active:scale-90 disabled:opacity-60"
            >
              {key === "del" ? "⌫" : key}
            </button>
          ),
        )}
      </div>

      <button type="button" className={DIALOG_CLOSE} onClick={onClose}>
        {t("cancel")}
      </button>
    </SettingsDialog>
  );
}
