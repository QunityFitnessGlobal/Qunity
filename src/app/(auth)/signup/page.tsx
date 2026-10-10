"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signUp } from "@/services/auth";
import { storedAcquisition } from "@/lib/acquisition";
import { TrackVisit } from "@/components/entry/TrackVisit";
import { matchErrorKey } from "@/lib/auth-errors";
import { EntryShell, PRIMARY_BUTTON } from "@/components/entry/EntryShell";
import { EntryField, PasswordField } from "@/components/entry/EntryField";
import type { Gender, Role } from "@/lib/types";

const ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/already registered/i, "emailTaken"],
  [/password should be at least/i, "weakPassword"],
  [/rate limit/i, "rateLimited"],
];

const MIN_PASSWORD_LENGTH = 6;

interface RoleCardProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  sub: string;
  icon: ReactNode;
}

function RoleCard({ selected, onSelect, label, sub, icon }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-1.5 py-3 transition-colors ${
        selected ? "border-2 border-brand-purple bg-brand-purple/[0.07] text-brand-purple" : "border-[1.5px] border-[#e4dfeb] bg-white text-[#7d778e]"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[30px] w-[30px]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {icon}
      </svg>
      <span className={`text-[15px] text-[#221a33] ${selected ? "font-bold" : "font-medium"}`}>{label}</span>
      <span className="text-[11px] text-text-muted">{sub}</span>
    </button>
  );
}

export default function SignupPage() {
  const t = useTranslations("auth.signup");
  const tEntry = useTranslations("entry");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("parent");
  const [gender, setGender] = useState<Gender>("female");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp({ fullName, email, password, role, gender, acquisition: storedAcquisition() });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const key =
        err instanceof Error
          ? matchErrorKey(err.message, ERROR_PATTERNS, "genericError")
          : "genericError";
      setError(t(key));
    } finally {
      setLoading(false);
    }
  }

  const genders: { value: Gender; label: string }[] = [
    { value: "female", label: role === "parent" ? t("genderFemaleParent") : t("genderFemaleChild") },
    { value: "male", label: role === "parent" ? t("genderMaleParent") : t("genderMaleChild") },
  ];

  return (
    <EntryShell backHref="/" backLabel={tEntry("back")} compact>
      <TrackVisit />
      <h1 className="font-display text-[25px] font-bold">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2.5" role="group" aria-label={t("roleLabel")}>
          <RoleCard
            selected={role === "parent"}
            onSelect={() => setRole("parent")}
            label={t("roleParent")}
            sub={t("roleParentSub")}
            icon={
              <>
                <circle cx="8" cy="7" r="3" />
                <circle cx="16.5" cy="9.5" r="2.2" />
                <path d="M2.5 20a5.5 5.5 0 0111 0M13 20a3.8 3.8 0 017.5 0" />
              </>
            }
          />
          <RoleCard
            selected={role === "child"}
            onSelect={() => setRole("child")}
            label={t("roleChild")}
            sub={t("roleChildSub")}
            icon={
              <>
                <circle cx="12" cy="6" r="3" />
                <path d="M12 9v6M12 15l-3.5 6M12 15l3.5 6M6 11.5h12" />
              </>
            }
          />
        </div>

        <EntryField label={t("fullName")} icon="user" name="fullName" autoComplete="name" value={fullName} onChange={setFullName} required />
        <EntryField label={t("email")} icon="mail" name="email" type="email" autoComplete="email" value={email} onChange={setEmail} required />
        <PasswordField
          label={t("password")}
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          minLength={MIN_PASSWORD_LENGTH}
          hint={t("passwordHint", { count: MIN_PASSWORD_LENGTH })}
          required
        />

        <div className="flex gap-2.5" role="group" aria-label={t("genderLabel")}>
          {genders.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGender(option.value)}
              aria-pressed={gender === option.value}
              className={`min-h-11 flex-1 rounded-full border-[1.5px] text-[15px] font-semibold transition-colors ${
                gender === option.value ? "border-brand-purple bg-brand-purple text-white" : "border-[#e4dfeb] bg-white text-[#221a33]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="animate-entry-shake rounded-[14px] border border-[#f7c9cb] bg-[#fff0f0] px-3.5 py-2.5 text-sm text-[#8c1d22]">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={`${PRIMARY_BUTTON} mt-0.5`}>
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>

      <span className="text-center text-sm text-text-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-bold text-brand-purple">
          {t("loginLink")}
        </Link>
      </span>
    </EntryShell>
  );
}
