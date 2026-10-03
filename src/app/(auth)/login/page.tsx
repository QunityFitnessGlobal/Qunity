"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { logIn } from "@/services/auth";
import { matchErrorKey } from "@/lib/auth-errors";
import { CHILD_CODE_CHIP, EntryShell, KeyIcon, PRIMARY_BUTTON } from "@/components/entry/EntryShell";
import { EntryField, PasswordField } from "@/components/entry/EntryField";

const ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "invalidCredentials"],
  [/email not confirmed/i, "emailNotConfirmed"],
  [/rate limit/i, "rateLimited"],
];

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const tEntry = useTranslations("entry");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Bumped on every failed try so the error box shakes again.
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await logIn({ email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const key =
        err instanceof Error
          ? matchErrorKey(err.message, ERROR_PATTERNS, "genericError")
          : "genericError";
      setError(key);
      setAttempt((n) => n + 1);
    } finally {
      setLoading(false);
    }
  }

  const wrongCredentials = error === "invalidCredentials";

  return (
    <EntryShell backHref="/" backLabel={tEntry("back")}>
      <div className="animate-power-fade-up flex flex-col gap-1" style={{ ["--power-fade-delay" as string]: "0.15s" }}>
        <h1 className="font-display text-[26px] font-bold">{t("title")}</h1>
        <span className="text-sm text-text-muted">{t("subtitle")}</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <EntryField
          label={t("email")}
          icon="mail"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          invalid={wrongCredentials}
          required
        />
        <PasswordField
          label={t("password")}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          invalid={wrongCredentials}
          required
        />
        <Link href="/forgot-password" className="-mt-1 self-end text-sm font-semibold text-brand-purple">
          {t("forgot")}
        </Link>

        {error && (
          <div
            key={attempt}
            role="alert"
            className="animate-entry-shake flex items-start gap-2.5 rounded-[14px] border border-[#f7c9cb] bg-[#fff0f0] px-3.5 py-3 text-sm leading-relaxed text-[#8c1d22]"
          >
            <svg viewBox="0 0 20 20" className="mt-0.5 h-[18px] w-[18px] flex-none" fill="none" stroke="#e5484d" strokeWidth={1.9} strokeLinecap="round" aria-hidden>
              <circle cx="10" cy="10" r="7.5" />
              <path d="M10 6v4.5M10 13.6v.1" />
            </svg>
            <span>
              {t(error)}
              {wrongCredentials && (
                <>
                  {" "}
                  <Link href="/forgot-password" className="font-bold text-brand-purple">
                    {t("resetHint")}
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <button type="submit" disabled={loading} className={`${PRIMARY_BUTTON} mt-1`}>
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>

      <div className="mt-auto flex flex-col gap-2.5 pt-4">
        <span className="text-center text-sm text-text-muted">
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-bold text-brand-purple">
            {t("signupLink")}
          </Link>
        </span>
        <Link href="/pair" className={CHILD_CODE_CHIP}>
          <KeyIcon className="h-[18px] w-[18px]" />
          {t("havePairingCode")}
        </Link>
      </div>
    </EntryShell>
  );
}
