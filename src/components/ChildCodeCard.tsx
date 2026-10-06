"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ChildCodeCardProps {
  code: string;
}

// The child's own code, for a parent to link to them, with a copy button.
export function ChildCodeCard({ code }: ChildCodeCardProps) {
  const t = useTranslations("childCode");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-[20px] border border-[#ece6f2] bg-white px-4 py-5 text-center">
      <p className="text-sm font-semibold text-[#6c6580]">{t("label")}</p>
      <p dir="ltr" className="font-display text-4xl font-bold tracking-[0.2em] text-brand-purple">
        {code}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className={`mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors ${
          copied ? "border-[#22c55e] bg-[#e3f8ea] text-[#15803d]" : "border-[#e4d3e1] bg-white text-[#7d1f72]"
        }`}
      >
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
