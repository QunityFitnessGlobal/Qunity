"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { linkChildByCode, type LinkChildErrorCode } from "@/services/linking.service";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

const ERROR_KEYS: Record<LinkChildErrorCode, string> = {
  NOT_AUTHENTICATED: "notAuthenticated",
  CODE_NOT_FOUND: "codeNotFound",
  CODE_ALREADY_USED: "codeAlreadyUsed",
  ALREADY_LINKED: "alreadyLinked",
  UNKNOWN: "genericError",
};

export function AddChildForm() {
  const t = useTranslations("addChild");
  const tLinking = useTranslations("linking");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage({ type: "error", text: tLinking("notAuthenticated") });
        return;
      }

      const result = await linkChildByCode(user.id, code);

      if (result.success) {
        setMessage({ type: "success", text: t("success", { nickname: result.nickname }) });
        setCode("");
      } else {
        setMessage({ type: "error", text: tLinking(ERROR_KEYS[result.errorCode]) });
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
          label={t("codeLabel")}
          name="code"
          value={code}
          onChange={setCode}
          placeholder="QNTY-XXXXX"
          required
        />

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}

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
