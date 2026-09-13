"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { redeemPairingCode } from "@/services/family-mode.service";
import { Button } from "@/components/ui/Button";

// Entry point for a child typing the 6-digit code shown on their parent's
// device (see PairChildDeviceButton.tsx) — the manual-entry counterpart of
// scanning the QR, for when scanning isn't convenient. Public route (see
// src/proxy.ts) since the child has no session at all yet.
export default function PairPage() {
  const t = useTranslations("pair");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "invalid" ? "invalidOrExpired" : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await redeemPairingCode(code);
      if (!result.success || !result.accessToken || !result.refreshToken) {
        setError("invalidOrExpired");
        return;
      }

      const supabase = createClient();
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

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-zinc-600">{t("description")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            autoFocus
            className="w-full rounded-md border border-zinc-300 px-3 py-3 text-center text-2xl tracking-[0.3em] focus:border-blue-500 focus:outline-none"
          />

          {error && <p className="text-sm text-red-600">{t(error)}</p>}

          <Button type="submit" className="w-full" disabled={code.length !== 6 || loading}>
            {loading ? t("checking") : t("submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
