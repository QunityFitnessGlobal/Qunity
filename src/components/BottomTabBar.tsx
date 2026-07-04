"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { HomeIcon, JourneyIcon, TrophyIcon, FlagIcon, SettingsIcon, DumbbellIcon } from "@/components/navIcons";
import type { ComponentType } from "react";
import type { Role } from "@/lib/types";

interface BottomTabBarProps {
  role: Role;
}

interface TabItem {
  href: string;
  labelKey: string;
  Icon: ComponentType<{ className?: string }>;
}

const CHILD_TABS: TabItem[] = [
  { href: "/dashboard", labelKey: "home", Icon: HomeIcon },
  { href: "/dashboard/journey", labelKey: "journey", Icon: JourneyIcon },
  { href: "/dashboard/leaderboard", labelKey: "leaderboard", Icon: TrophyIcon },
  { href: "/dashboard/challenges", labelKey: "challenges", Icon: FlagIcon },
  { href: "/dashboard/settings", labelKey: "settings", Icon: SettingsIcon },
];

const PARENT_TABS: TabItem[] = [
  { href: "/dashboard", labelKey: "home", Icon: HomeIcon },
  { href: "/dashboard/challenges", labelKey: "challenges", Icon: FlagIcon },
  { href: "/dashboard/recent-workouts", labelKey: "workouts", Icon: DumbbellIcon },
  { href: "/dashboard/settings", labelKey: "settings", Icon: SettingsIcon },
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
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-center text-xs font-medium ${
                isActive ? "text-brand-purple" : "text-text-muted"
              }`}
            >
              <tab.Icon className="h-5 w-5" />
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
