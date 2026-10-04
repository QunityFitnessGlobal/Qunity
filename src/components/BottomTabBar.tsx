"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DumbbellIcon,
  FlagIcon,
  HeartIcon,
  HomeIcon,
  SettingsIcon,
  StarOutlineIcon,
  TrophyIcon,
} from "@/components/navIcons";
import { createClient } from "@/lib/supabase/client";
import { getNewChallengesCount } from "@/services/challenge.service";
import type { ComponentType } from "react";
import type { Role } from "@/lib/types";

interface BottomTabBarProps {
  role: Role;
  userId: string;
  // Server-rendered count for the child's Challenges tab, re-read here after
  // leaving that tab since the layout itself doesn't re-render between tabs.
  initialNewChallenges: number;
}

interface TabItem {
  href: string;
  labelKey: string;
  Icon: ComponentType<{ className?: string }>;
  // Settings keeps its original icon at its original size.
  iconClassName?: string;
}

const HOME_HREF = "/dashboard";
const CHALLENGES_HREF = "/dashboard/challenges";
const SETTINGS_TAB: TabItem = {
  href: "/dashboard/settings",
  labelKey: "settings",
  Icon: SettingsIcon,
  iconClassName: "h-5 w-5",
};

const CHILD_TABS: TabItem[] = [
  { href: HOME_HREF, labelKey: "home", Icon: HomeIcon },
  { href: "/dashboard/leaderboard", labelKey: "leaderboard", Icon: TrophyIcon },
  { href: "/dashboard/journey", labelKey: "journey", Icon: StarOutlineIcon },
  { href: CHALLENGES_HREF, labelKey: "challenges", Icon: FlagIcon },
  SETTINGS_TAB,
];

const PARENT_TABS: TabItem[] = [
  { href: HOME_HREF, labelKey: "home", Icon: HomeIcon },
  { href: CHALLENGES_HREF, labelKey: "challenges", Icon: FlagIcon },
  { href: "/dashboard/recent-workouts", labelKey: "workouts", Icon: DumbbellIcon },
  { href: "/dashboard/empowerment", labelKey: "empowerment", Icon: HeartIcon },
  SETTINGS_TAB,
];

// Persistent bottom navigation, as in the mockups: the current tab's icon
// sits in a soft purple pill. Reads childId from the URL itself (rather
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
  const previousPathRef = useRef(pathname);

  // Inside the dashboard the count can only change on the challenges tab
  // (opening a box there), so it's re-read when the child leaves that tab —
  // not on every tab change. Coming back from a workout or a challenge
  // re-renders the layout, which brings a fresh count from the server.
  useEffect(() => {
    const leftChallenges = previousPathRef.current === CHALLENGES_HREF && pathname !== CHALLENGES_HREF;
    previousPathRef.current = pathname;
    if (role !== "child" || !leftChallenges) {
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
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#ece6f2] bg-white">
      <div className="mx-auto flex max-w-md px-2 pb-2.5 pt-1.5">
        {tabs.map((tab) => {
          // A tab's own pages (e.g. settings/code) keep it lit; home only on itself.
          const isActive = tab.href === HOME_HREF ? pathname === HOME_HREF : pathname.startsWith(tab.href);
          // Already on the tab, the boxes are opening right there.
          const badge = role === "child" && tab.href === CHALLENGES_HREF && !isActive ? newChallenges : 0;
          return (
            <Link
              key={tab.href}
              href={`${tab.href}${suffix}`}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-[3px] pt-1 text-center font-ui text-xs ${
                isActive ? "font-semibold text-brand-purple" : "font-medium text-[#6c6580]"
              }`}
            >
              <span
                className={`relative flex h-[30px] w-[54px] items-center justify-center rounded-full ${
                  isActive ? "bg-brand-purple/[0.12]" : ""
                }`}
              >
                <tab.Icon className={tab.iconClassName ?? "h-[22px] w-[22px]"} />
                {badge > 0 && (
                  <span
                    aria-hidden
                    className="animate-power-badge-pop absolute end-2 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-reward-gold px-1 font-display text-[11px] font-bold leading-none text-reward-gold-on"
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
