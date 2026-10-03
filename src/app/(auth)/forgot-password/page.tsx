"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { matchErrorKey } from "@/lib/auth-errors";
import { EntryShell, KeyIcon, PRIMARY_BUTTON } from "@/components/entry/EntryShell";
import { EntryField } from "@/components/entry/EntryField";

const RESEND_SECONDS = 30;
const ERROR_PATTERNS: Array<[RegExp, string]> = [[/rate limit|security purposes/i, "rateLimited"]];

// Asks Supabase to email a password-reset link. The link lands on
// /auth/confirm, which signs the user in for the reset and sends them to
// /reset-password. Supabase answers the same whether or not the address has
// an account, so this screen never reveals who is registered.
export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgot");
  const tEntry = useTranslations("entry");
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const [error, setError] = useState<string | null>(searchParams.get("error") === "expired" ? "expired" : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function send(address: string) {
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(address, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      if (resetError) {
        setError(matchErrorKey(resetError.message, ERROR_PATTERNS, "genericError"));
        return;
      }
      setSentTo(address);
      setWait(RESEND_SECONDS);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(email.trim());
  }

  if (sentTo) {
    return (
      <EntryShell backHref="/login" backLabel={tEntry("back")}>
        <div className="flex flex-col items-center gap-3.5 text-center">
          <span className="relative flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-green-600/[0.12]" aria-hidden />
            <svg viewBox="0 0 24 24" className="animate-entry-fly relative h-14 w-14" fill="none" stroke="#16a34a" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6.5h18v11H3z" />
              <path d="M3.5 7l8.5 6.5L20.5 7" />
            </svg>
          </span>
          <h1 className="animate-power-fade-up font-display text-[26px] font-bold" style={{ ["--power-fade-delay" as string]: "0.3s" }}>
            {t("sentTitle")}
          </h1>
          <p className="animate-power-fade-up text-[15px] leading-relaxed text-[#4f4960]" style={{ ["--power-fade-delay" as string]: "0.4s" }}>
            {t("sentTo")}
            <br />
            <b dir="ltr">{sentTo}</b>
          </p>
          <ul
            className="animate-power-fade-up flex w-full list-disc flex-col gap-2 rounded-2xl border border-zinc-200 bg-white py-3 pe-3.5 ps-8 text-right text-sm text-[#4f4960]"
            style={{ ["--power-fade-delay" as string]: "0.5s" }}
          >
            <li>{t("tipExpiry")}</li>
            <li>{t("tipSpam")}</li>
          </ul>
          {error && <p role="alert" className="text-sm text-[#8c1d22]">{t(error)}</p>}
          {wait > 0 ? (
            <span className="text-sm text-[#7d778e]">
              {t("resendIn")} <bdi dir="ltr">0:{String(wait).padStart(2, "0")}</bdi>
            </span>
          ) : (
            <button type="button" onClick={() => send(sentTo)} disabled={loading} className="text-sm font-bold text-brand-purple">
              {t("resend")}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setWait(0);
            }}
            className="text-[13px] text-text-muted underline"
          >
            {t("otherAddress")}
          </button>
          <Link href="/login" className="mt-1 text-sm font-semibold text-brand-purple">
            {t("backToLogin")}
          </Link>
        </div>
      </EntryShell>
    );
  }

  return (
    <EntryShell backHref="/login" backLabel={tEntry("back")}>
      <span className="animate-power-badge-pop flex h-[72px] w-[72px] items-center justify-center self-center rounded-full bg-brand-purple/10 text-brand-purple">
        <span className="animate-entry-wiggle flex">
          <KeyIcon className="h-[34px] w-[34px]" />
        </span>
      </span>
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="font-display text-[26px] font-bold">{t("title")}</h1>
        <span className="text-[15px] leading-relaxed text-text-muted">{t("description")}</span>
      </div>

      {error && (
        <p role="alert" className="animate-entry-shake rounded-[14px] border border-[#f7c9cb] bg-[#fff0f0] px-3.5 py-2.5 text-sm text-[#8c1d22]">
          {t(error)}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <EntryField
          label={t("email")}
          icon="mail"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          required
        />
        <button type="submit" disabled={loading} className={PRIMARY_BUTTON}>
          {loading ? t("sending") : t("submit")}
        </button>
      </form>

      <Link href="/login" className="text-center text-sm font-semibold text-brand-purple">
        {t("backToLogin")}
      </Link>

      <div className="mt-auto flex items-start gap-2.5 rounded-[14px] bg-reward-gold-soft px-3.5 py-3 text-[13px] leading-relaxed text-[#5c4200]">
        <KeyIcon className="mt-px h-[18px] w-[18px] flex-none" />
        <span>{t("childNote")}</span>
      </div>
    </EntryShell>
  );
}
