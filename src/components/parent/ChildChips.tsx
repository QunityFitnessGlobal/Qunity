import Link from "next/link";
import type { LinkedChild } from "@/services/linking.service";
import type { BraceletColor } from "@/lib/types";

interface ChildChipsProps {
  items: LinkedChild[];
  selectedId: string;
  // The page the chips switch the child on.
  basePath?: string;
}

export const STAGE_DOT_CLASS: Record<BraceletColor, string> = {
  white: "bg-bracelet-white shadow-[inset_0_0_0_1.5px_var(--color-bracelet-white-outline)]",
  orange: "bg-bracelet-orange",
  green: "bg-bracelet-green",
  blue: "bg-bracelet-blue",
  purple: "bg-bracelet-purple",
};

// The parent screens' child switcher: one chip per child with their stage
// color. Like ChildSelector, the choice lives in the URL (?childId=).
export function ChildChips({ items, selectedId, basePath = "/dashboard" }: ChildChipsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {items.map((child) => {
        const selected = child.id === selectedId;
        return (
          <Link
            key={child.id}
            href={{ pathname: basePath, query: { childId: child.id } }}
            aria-current={selected ? "true" : undefined}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm ${
              selected
                ? "border-2 border-brand-purple bg-brand-purple/[0.08] font-semibold text-[#7d1f72]"
                : "border border-[#ece6f2] bg-white font-medium text-[#4f4960]"
            }`}
          >
            <span className={`h-2.5 w-2.5 flex-none rounded-full ${STAGE_DOT_CLASS[child.color]}`} />
            {child.nickname}
          </Link>
        );
      })}
    </div>
  );
}
