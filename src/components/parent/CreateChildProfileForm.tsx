"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createChildProfile } from "@/services/family-mode.service";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { Gender } from "@/lib/types";

export function CreateChildProfileForm() {
  const t = useTranslations("addChildDirect");
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await createChildProfile(nickname, gender);
      if (result.success) {
        router.push("/dashboard/settings");
        router.refresh();
      } else {
        setError(t("genericError"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-center text-2xl font-bold">{t("title")}</h1>
      <p className="text-center text-sm text-zinc-600">{t("description")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label={t("nicknameLabel")}
          name="nickname"
          value={nickname}
          onChange={setNickname}
          required
        />

        <div className="space-y-1">
          <label htmlFor="gender" className="block text-sm font-medium text-zinc-700">
            {t("genderLabel")}
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="female">{t("genderFemale")}</option>
            <option value="male">{t("genderMale")}</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-600">
        <Link href="/dashboard/settings" className="font-medium text-blue-600">
          {t("backToSettings")}
        </Link>
      </p>
    </div>
  );
}
