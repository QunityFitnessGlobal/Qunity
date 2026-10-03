"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { redeemPairingCode } from "@/services/family-mode.service";
import { KeyIcon } from "@/components/entry/EntryShell";

const CODE_LENGTH = 6;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

// Entry point for a child typing the 6-digit code shown on their parent's
// device (see PairChildDeviceButton.tsx) — the manual-entry counterpart of
// scanning the QR, for when scanning isn't convenient. Public route (see
// src/proxy.ts) since the child has no session at all yet. A big on-screen
// keypad (no phone keyboard popping up over it); a real keyboard works too.
export default function PairPage() {
  const t = useTranslations("pair");
  const tEntry = useTranslations("entry");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "invalid" ? "invalidOrExpired" : null,
  );
  // Bumped on every failed try so the boxes shake again.
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const ready = code.length === CODE_LENGTH;

  function press(key: string) {
    if (loading) return;
    setError(null);
    if (key === "del") {
      setCode((c) => c.slice(0, -1));
    } else if (/^\d$/.test(key)) {
      setCode((c) => (c.length < CODE_LENGTH ? c + key : c));
    }
  }

  async function submit() {
    if (code.length !== CODE_LENGTH || loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await redeemPairingCode(code);
      if (!result.success || !result.accessToken || !result.refreshToken) {
        setError("invalidOrExpired");
        setAttempt((n) => n + 1);
        setCode("");
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

  // A physical keyboard types into the boxes as well.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
      else if (e.key === "Enter") submit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="relative flex min-h-dvh flex-col bg-gradient-to-b from-brand-purple to-[#5c1553] text-white">
      <Link
        href="/"
        aria-label={tEntry("back")}
        className="absolute right-3.5 top-3.5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.14]"
      >
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7.5 5l5 5-5 5" />
        </svg>
      </Link>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-3.5 px-6 pb-5 pt-14 text-center">
        <span className="animate-power-badge-pop flex h-16 w-16 items-center justify-center rounded-[20px] bg-reward-gold text-reward-gold-on">
          <span className="animate-entry-wiggle flex">
            <KeyIcon className="h-[34px] w-[34px]" />
          </span>
        </span>
        <h1 className="font-display text-[30px] font-bold">{t("title")}</h1>
        <p className="max-w-[280px] text-[15px] text-[#fdf4ff]">{t("description")}</p>

        <div key={attempt} dir="ltr" className={`mt-2 flex gap-2 ${error ? "animate-entry-shake" : ""}`} aria-label={t("codeLabel")} role="group">
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const digit = code[i];
            return (
              <span
                key={`${i}-${digit ?? ""}`}
                className={`flex h-14 w-11 items-center justify-center rounded-[14px] border-2 font-display text-[28px] font-bold ${
                  error
                    ? "border-[#ffb4b8] bg-white/[0.06]"
                    : digit
                      ? "animate-power-badge-pop border-white/90 bg-white/[0.18]"
                      : i === code.length
                        ? "border-reward-gold bg-white/[0.06]"
                        : "border-white/25 bg-white/[0.06]"
                }`}
              >
                {digit}
              </span>
            );
          })}
        </div>
        <span className="min-h-[18px] text-[13px] text-[#f0abfc]" aria-live="polite">
          {error ? t(error) : ready ? t("ready") : t("digitsLeft", { count: CODE_LENGTH - code.length })}
        </span>

        <div dir="ltr" className="mt-1 grid grid-cols-3 gap-2.5">
          {KEYS.map((key, i) =>
            key === "" ? (
              <span key={`blank-${i}`} />
            ) : (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                aria-label={key === "del" ? t("delete") : key}
                className="h-[54px] w-[76px] rounded-2xl bg-white/[0.14] font-display text-2xl font-semibold transition-transform active:scale-90"
              >
                {key === "del" ? "⌫" : key}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-none flex-col gap-2.5 px-6 pb-[calc(1.6rem+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={submit}
          disabled={!ready || loading}
          className={`flex min-h-14 items-center justify-center rounded-[18px] font-display text-xl font-semibold transition-transform ${
            ready ? "animate-power-badge-pop bg-green-600 text-white shadow-[0_4px_0_theme(colors.green.800)] active:translate-y-[3px]" : "bg-white/[0.12] text-white/60"
          }`}
        >
          {loading ? t("checking") : t("submit")}
        </button>
        <span className="text-center text-[13px] text-[#fdf4ff]">{t("scanHint")}</span>
      </div>
    </div>
  );
}
