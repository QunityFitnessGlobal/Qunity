"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { switchToChild } from "@/services/family-mode.service";
import { cacheParentSession } from "@/lib/family-session";
import { PRIMARY_BUTTON } from "@/components/entry/EntryShell";
import { DIALOG_CLOSE, SettingsDialog, SettingsIcons } from "@/components/ui/SettingsUI";
import { STAGE_DOT_CLASS } from "@/lib/stage-colors";
import type { LinkedChild } from "@/services/linking.service";

interface ChildModeSwitcherProps {
  parentId: string;
  linkedChildren: LinkedChild[];
  label?: string;
}

// "מצב ילד" — hands the phone to a linked child without a real login: auto
// picks the child if there's only one, otherwise shows a picker first. The
// parent's own tokens are cached (see family-session.ts) before swapping the
// browser's active session to the child's hidden account, so ReturnToParentButton
// can restore this exact session later via a PIN, on this same device.
export function ChildModeSwitcher({ parentId, linkedChildren, label }: ChildModeSwitcherProps) {
  const t = useTranslations("familyMode");
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSwitch(childId: string) {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const result = await switchToChild(childId);
      if (!result.success || !result.accessToken || !result.refreshToken) {
        setError(t("switchError"));
        return;
      }

      // Read the parent session only AFTER the server action: if the access
      // token had expired, that action refreshed the session (rotating the
      // refresh token and updating the cookie). Reading it beforehand would
      // cache a refresh token that was already used up, and the way back to
      // parent mode would silently fail later.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError(t("switchError"));
        return;
      }

      cacheParentSession({
        parentId,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });

      await supabase.auth.setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      });

      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function handleStart() {
    if (linkedChildren.length === 1) {
      handleSwitch(linkedChildren[0].id);
      return;
    }
    setShowPicker(true);
  }

  if (linkedChildren.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button type="button" className={PRIMARY_BUTTON} disabled={loading} onClick={handleStart}>
        {SettingsIcons.childMode}
        {loading && !showPicker ? t("switching") : (label ?? t("switchToChild"))}
      </button>

      {showPicker && (
        <SettingsDialog title={t("pickChild")} icon={SettingsIcons.childMode}>
          {linkedChildren.map((child) => (
            <button
              key={child.id}
              type="button"
              disabled={loading}
              onClick={() => handleSwitch(child.id)}
              className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[#ece6f2] bg-white px-4 text-start text-[15px] font-medium disabled:opacity-60"
            >
              <span className={`h-2.5 w-2.5 flex-none rounded-full ${STAGE_DOT_CLASS[child.color]}`} aria-hidden />
              {child.nickname}
            </button>
          ))}
          {loading && <p className="text-sm text-[#6c6580]">{t("switching")}</p>}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button type="button" onClick={() => setShowPicker(false)} className={DIALOG_CLOSE}>
            {t("cancel")}
          </button>
        </SettingsDialog>
      )}

      {error && !showPicker && (
        <p role="alert" className="text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
