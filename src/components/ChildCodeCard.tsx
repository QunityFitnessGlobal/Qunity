"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ChildCodeCardProps {
  code: string;
}

export function ChildCodeCard({ code }: ChildCodeCardProps) {
  const t = useTranslations("childCode");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-xs rounded-lg border border-zinc-200 bg-white p-4 text-center shadow-sm">
      <p className="text-sm font-medium text-zinc-600">{t("label")}</p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-blue-700">{code}</p>
      <button
        onClick={handleCopy}
        className="mt-3 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
      >
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
