"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { STAGE_DOT_CLASS } from "@/lib/stage-colors";
import type { LinkedChild } from "@/services/linking.service";

interface ChildDropdownProps {
  items: LinkedChild[];
  selectedId: string;
  // The page the dropdown switches the child on.
  basePath: string;
}

// The parent screens' child switcher: the selected child as a pill with
// their stage color; tapping it opens the phone's own list of children.
// The choice lives in the URL (?childId=), so any page can read it and it
// survives a refresh. With one child it's just the pill.
export function ChildDropdown({ items, selectedId, basePath }: ChildDropdownProps) {
  const t = useTranslations("childSelector");
  const router = useRouter();
  const selected = items.find((child) => child.id === selectedId) ?? items[0];
  if (!selected) return null;

  const dot = <span className={`h-2.5 w-2.5 flex-none rounded-full ${STAGE_DOT_CLASS[selected.color]}`} aria-hidden />;

  if (items.length === 1) {
    return (
      <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-purple/[0.08] px-3.5 text-sm font-semibold text-[#7d1f72]">
        {dot}
        {selected.nickname}
      </span>
    );
  }

  return (
    <label className="relative inline-flex min-h-10 items-center rounded-full border-2 border-brand-purple bg-brand-purple/[0.08] focus-within:ring-2 focus-within:ring-brand-purple/30">
      <span className="sr-only">{t("label")}</span>
      <span className="pointer-events-none absolute start-3 flex">{dot}</span>
      <select
        value={selected.id}
        onChange={(e) => router.push(`${basePath}?childId=${e.target.value}`, { scroll: false })}
        className="min-h-10 cursor-pointer appearance-none rounded-full bg-transparent pe-8 ps-7 text-sm font-semibold text-[#7d1f72] focus:outline-none"
      >
        {items.map((child) => (
          <option key={child.id} value={child.id}>
            {child.nickname}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute end-3 h-3.5 w-3.5 text-[#7d1f72]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5 8l5 5 5-5" />
      </svg>
    </label>
  );
}
