"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { LinkedChild } from "@/services/linking.service";

interface ChildSelectorProps {
  items: LinkedChild[];
  selectedId: string;
}

// Selection lives in the URL (?childId=...) rather than local state, so any
// Server Component page can fetch that child's data directly, the choice
// survives a page refresh, and switching child from a non-Home tab (e.g.
// Recent Workouts) stays on that same tab instead of bouncing back to Home.
export function ChildSelector({ items, selectedId }: ChildSelectorProps) {
  const t = useTranslations("childSelector");
  const router = useRouter();
  const pathname = usePathname();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-sm space-y-1">
      <label htmlFor="child-selector" className="block text-sm font-medium text-zinc-700">
        {t("label")}
      </label>
      <select
        id="child-selector"
        value={selectedId}
        onChange={(e) => router.push(`${pathname}?childId=${e.target.value}`)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        {items.map((child) => (
          <option key={child.id} value={child.id}>
            {child.nickname}
          </option>
        ))}
      </select>
    </div>
  );
}
