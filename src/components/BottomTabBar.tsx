"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Role } from "@/lib/types";

interface BottomTabBarProps {
  role: Role;
}

interface TabItem {
  href: string;
  labelKey: string;
}

const CHILD_TABS: TabItem[] = [
  { href: "/dashboard", labelKey: "home" },
  { href: "/dashboard/leaderboard", labelKey: "leaderboard" },
  { href: "/dashboard/challenges", labelKey: "challenges" },
  { href: "/dashboard/settings", labelKey: "settings" },
];

const PARENT_TABS: TabItem[] = [
  { href: "/dashboard", labelKey: "home" },
  { href: "/dashboard/challenges", labelKey: "challenges" },
  { href: "/dashboard/recent-workouts", labelKey: "workouts" },
  { href: "/dashboard/settings", labelKey: "settings" },
];

// Persistent bottom navigation. Reads childId from the URL itself (rather
// than a prop) so every tab link carries the parent's currently selected
// child forward, regardless of which tab the parent is switching from.
export function BottomTabBar({ role }: BottomTabBarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabs = role === "child" ? CHILD_TABS : PARENT_TABS;
  const childId = searchParams.get("childId");
  const suffix = role !== "child" && childId ? `?childId=${childId}` : "";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={`${tab.href}${suffix}`}
              className={`flex-1 py-3 text-center text-xs font-medium ${
                isActive ? "text-brand-purple" : "text-text-muted"
              }`}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
