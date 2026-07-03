"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signUp } from "@/services/auth";
import { matchErrorKey } from "@/lib/auth-errors";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

const ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/already registered/i, "emailTaken"],
  [/password should be at least/i, "weakPassword"],
  [/rate limit/i, "rateLimited"],
];

export default function SignupPage() {
  const t = useTranslations("auth.signup");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("parent");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp({ fullName, email, password, role });
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

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-bold">{t("title")}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label={t("fullName")}
            name="fullName"
            value={fullName}
            onChange={setFullName}
            required
          />
          <TextField
            label={t("email")}
            name="email"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          <TextField
            label={t("password")}
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            minLength={6}
          />

          <div className="space-y-1">
            <label htmlFor="role" className="block text-sm font-medium text-zinc-700">
              {t("roleLabel")}
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="parent">{t("roleParent")}</option>
              <option value="child">{t("roleChild")}</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-600">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-medium text-blue-600">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
