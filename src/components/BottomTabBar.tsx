"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { HomeIcon, TrophyIcon, FlagIcon, SettingsIcon, DumbbellIcon, HeartHandIcon } from "@/components/navIcons";
import { StarIcon } from "@/components/child/journeyIcons";
import { createClient } from "@/lib/supabase/client";
import { getNewChallengesCount } from "@/services/challenge.service";
import type { ComponentType } from "react";
import type { Role } from "@/lib/types";

interface BottomTabBarProps {
  role: Role;
  userId: string;
  // Server-rendered count for the child's Challenges tab, refreshed here on
  // every navigation since the layout itself doesn't re-render between tabs.
  initialNewChallenges: number;
}

interface TabItem {
  href: string;
  labelKey: string;
  Icon: ComponentType<{ className?: string }>;
}

const CHALLENGES_HREF = "/dashboard/challenges";

const CHILD_TABS: TabItem[] = [
  { href: "/dashboard", labelKey: "home", Icon: HomeIcon },
  { href: "/dashboard/leaderboard", labelKey: "leaderboard", Icon: TrophyIcon },
  { href: "/dashboard/journey", labelKey: "journey", Icon: StarIcon },
  { href: CHALLENGES_HREF, labelKey: "challenges", Icon: FlagIcon },
  { href: "/dashboard/settings", labelKey: "settings", Icon: SettingsIcon },
];

const PARENT_TABS: TabItem[] = [
  { href: "/dashboard", labelKey: "home", Icon: HomeIcon },
  { href: CHALLENGES_HREF, labelKey: "challenges", Icon: FlagIcon },
  { href: "/dashboard/recent-workouts", labelKey: "workouts", Icon: DumbbellIcon },
  { href: "/dashboard/empowerment", labelKey: "empowerment", Icon: HeartHandIcon },
  { href: "/dashboard/settings", labelKey: "settings", Icon: SettingsIcon },
];

// Persistent bottom navigation. Reads childId from the URL itself (rather
// than a prop) so every tab link carries the parent's currently selected
// child forward, regardless of which tab the parent is switching from.
export function BottomTabBar({ role, userId, initialNewChallenges }: BottomTabBarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabs = role === "child" ? CHILD_TABS : PARENT_TABS;
  const childId = searchParams.get("childId");
  const suffix = role !== "child" && childId ? `?childId=${childId}` : "";
  const [newChallenges, setNewChallenges] = useState(initialNewChallenges);

  useEffect(() => {
    if (role !== "child") {
      return;
    }
    let cancelled = false;
    getNewChallengesCount(createClient(), userId).then((count) => {
      if (!cancelled) {
        setNewChallenges(count);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [role, userId, pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          // Already on the tab, the boxes are opening right there.
          const badge = role === "child" && tab.href === CHALLENGES_HREF && !isActive ? newChallenges : 0;
          return (
            <Link
              key={tab.href}
              href={`${tab.href}${suffix}`}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-center text-xs font-medium ${
                isActive ? "text-brand-purple" : "text-text-muted"
              }`}
            >
              <span className="relative">
                <tab.Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span
                    aria-hidden
                    className="animate-power-badge-pop absolute -end-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-reward-gold px-1 font-display text-[11px] font-bold leading-none text-reward-gold-on"
                  >
                    {badge}
                  </span>
                )}
              </span>
              {t(tab.labelKey)}
              {badge > 0 && <span className="sr-only">{t("newChallenges", { count: badge })}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
