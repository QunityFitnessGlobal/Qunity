"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { logIn } from "@/services/auth";
import { matchErrorKey } from "@/lib/auth-errors";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

const ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "invalidCredentials"],
  [/email not confirmed/i, "emailNotConfirmed"],
  [/rate limit/i, "rateLimited"],
];

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-600">
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-medium text-blue-600">
            {t("signupLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
