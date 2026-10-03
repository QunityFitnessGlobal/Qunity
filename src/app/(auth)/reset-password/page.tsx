"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { matchErrorKey } from "@/lib/auth-errors";
import { MIN_PASSWORD_LENGTH, passwordStrength } from "@/lib/password";
import { EntryShell, PRIMARY_BUTTON } from "@/components/entry/EntryShell";
import { PasswordField } from "@/components/entry/EntryField";

const ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/should be different/i, "samePassword"],
  [/password should be at least|weak/i, "weakPassword"],
  [/session|jwt|not authenticated|auth session missing/i, "expired"],
];

const STRENGTH_COLORS = ["", "#e5484d", "#f59e0b", "#22c55e"];

function Check({ ok, children }: { ok: boolean; children: string }) {
  return (
    <span className={`flex items-center gap-2 text-[13px] ${ok ? "text-green-700" : "text-[#7d778e]"}`}>
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {ok ? <path d="M4.5 10.5l3.5 3.5 7.5-8" /> : <circle cx="10" cy="10" r="6" />}
      </svg>
      {children}
    </span>
  );
}

// Reached from the reset email via /auth/confirm, which has already signed
// the user in for this; here they choose the new password. (A visitor
// without that session is sent back to /forgot-password by the proxy.)
export default function ResetPasswordPage() {
  const t = useTranslations("auth.reset");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = passwordStrength(password);
  const longEnough = password.length >= MIN_PASSWORD_LENGTH;
  const matches = confirm.length > 0 && confirm === password;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!longEnough || !matches) return;
    setError(null);
    setLoading(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) {
        setError(matchErrorKey(updateError.message, ERROR_PATTERNS, "genericError"));
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <EntryShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3.5 pb-8 text-center">
          <span className="relative flex h-[104px] w-[104px] items-center justify-center">
            <span className="animate-entry-ringout absolute inset-0 rounded-full border-[3px] border-green-500" aria-hidden />
            <span className="animate-power-badge-pop flex h-24 w-24 items-center justify-center rounded-full bg-green-600">
              <svg viewBox="0 0 20 20" className="h-[52px] w-[52px]" fill="none" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeDasharray="60" className="animate-entry-draw" />
              </svg>
            </span>
          </span>
          <h1 className="animate-power-fade-up font-display text-[28px] font-bold" style={{ ["--power-fade-delay" as string]: "0.5s" }}>
            {t("doneTitle")}
          </h1>
          <span className="animate-power-fade-up text-[15px] text-[#4f4960]" style={{ ["--power-fade-delay" as string]: "0.6s" }}>
            {t("doneText")}
          </span>
          <button
            type="button"
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
            className={`${PRIMARY_BUTTON} animate-power-fade-up mt-2`}
            style={{ ["--power-fade-delay" as string]: "0.7s" }}
          >
            {t("enter")}
          </button>
        </div>
      </EntryShell>
    );
  }

  return (
    <EntryShell>
      <h1 className="font-display text-[26px] font-bold">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <PasswordField
          label={t("newPassword")}
          name="new-password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
        {strength > 0 && (
          <div className="-mt-1 flex flex-col gap-1.5" aria-live="polite">
            <div className="flex gap-[5px]">
              {[1, 2, 3].map((level) => (
                <span
                  key={level}
                  className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{ background: level <= strength ? STRENGTH_COLORS[strength] : "#ece6f2" }}
                />
              ))}
            </div>
            <span className="text-xs font-semibold" style={{ color: STRENGTH_COLORS[strength] }}>
              {t(`strength${strength}`)}
            </span>
          </div>
        )}
        <PasswordField
          label={t("confirmPassword")}
          name="confirm-password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          invalid={confirm.length > 0 && !matches}
          required
        />
        <div className="flex flex-col gap-1.5">
          <Check ok={longEnough}>{t("ruleLength", { count: MIN_PASSWORD_LENGTH })}</Check>
          <Check ok={matches}>{t("ruleMatch")}</Check>
        </div>

        {error && (
          <p role="alert" className="animate-entry-shake rounded-[14px] border border-[#f7c9cb] bg-[#fff0f0] px-3.5 py-2.5 text-sm text-[#8c1d22]">
            {t(error)}{" "}
            {error === "expired" && (
              <Link href="/forgot-password" className="font-bold text-brand-purple">
                {t("newLink")}
              </Link>
            )}
          </p>
        )}

        <button type="submit" disabled={loading || !longEnough || !matches} className={PRIMARY_BUTTON}>
          {loading ? t("saving") : t("submit")}
        </button>
      </form>
    </EntryShell>
  );
}
