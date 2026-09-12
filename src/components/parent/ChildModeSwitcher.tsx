"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { switchToChild } from "@/services/family-mode.service";
import { cacheParentSession } from "@/lib/family-session";
import { Button } from "@/components/ui/Button";
import type { LinkedChild } from "@/services/linking.service";

interface ChildModeSwitcherProps {
  parentId: string;
  linkedChildren: LinkedChild[];
}

// "מצב ילד" — hands the phone to a linked child without a real login: auto
// picks the child if there's only one, otherwise shows a picker first. The
// parent's own tokens are cached (see family-session.ts) before swapping the
// browser's active session to the child's hidden account, so ReturnToParentButton
// can restore this exact session later via a PIN, on this same device.
export function ChildModeSwitcher({ parentId, linkedChildren }: ChildModeSwitcherProps) {
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError(t("switchError"));
        return;
      }

      const result = await switchToChild(childId);
      if (!result.success || !result.accessToken || !result.refreshToken) {
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
    <div className="w-full max-w-sm space-y-2">
      {!showPicker && (
        <Button
          className="w-full bg-brand-purple hover:opacity-90"
          disabled={loading}
          onClick={handleStart}
        >
          {loading ? t("switching") : t("switchToChild")}
        </Button>
      )}

      {showPicker && (
        <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
          <p className="text-sm font-medium text-zinc-700">{t("pickChild")}</p>
          {linkedChildren.map((child) => (
            <button
              key={child.id}
              type="button"
              disabled={loading}
              onClick={() => handleSwitch(child.id)}
              className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-right text-sm hover:bg-zinc-50"
            >
              {child.nickname}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
