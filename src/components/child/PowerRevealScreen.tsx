"use client";

import { useTranslations } from "next-intl";
import { POWER_REVEAL_THEME } from "@/lib/colors";
import { POWER_ICON } from "@/lib/powers";
import { Button } from "@/components/ui/Button";
import type { BraceletColor } from "@/lib/types";

interface PowerRevealScreenProps {
  color: BraceletColor;
  onContinue: () => void;
}

export function PowerRevealScreen({ color, onContinue }: PowerRevealScreenProps) {
  const t = useTranslations("powers");
  const tColors = useTranslations("colors");
  const theme = POWER_REVEAL_THEME[color];
  const Icon = POWER_ICON[color];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ background: `linear-gradient(180deg, ${theme.gradientFrom}, ${theme.gradientTo})` }}
    >
      <div className="relative flex items-center justify-center">
        <div
          className="animate-power-glow-pulse absolute h-28 w-28 rounded-full blur-xl"
          style={{ backgroundColor: theme.badgeBg }}
        />
        <div
          className="animate-power-badge-pop relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg"
          style={{
            backgroundColor: theme.badgeBg,
            border: theme.badgeBorder ? `2px solid ${theme.badgeBorder}` : undefined,
          }}
        >
          <Icon className="h-11 w-11" style={{ color: theme.badgeIcon }} />
        </div>
      </div>

      <p
        className="animate-power-fade-up text-sm font-semibold"
        style={{ color: theme.muted, ["--power-fade-delay" as string]: "0.5s" }}
      >
        {t("discoveredLabel")}
      </p>

      <h1
        className="animate-power-fade-up text-2xl font-bold"
        style={{ color: theme.heading, ["--power-fade-delay" as string]: "0.6s" }}
      >
        {t(`${color}.name`)}
      </h1>

      <div
        className="animate-power-fade-up space-y-2"
        style={{ ["--power-fade-delay" as string]: "0.7s" }}
      >
        <span
          className="inline-block rounded-full px-4 py-1 text-xs font-bold tracking-wide"
          style={{ backgroundColor: theme.badgeBg, color: theme.badgeIcon }}
        >
          {t(`${color}.code`)}
        </span>
        <p className="text-base italic" style={{ color: theme.heading }}>
          “{t(`${color}.quote`)}”
        </p>
      </div>

      <p
        className="animate-power-fade-up mt-2 text-xs"
        style={{ color: theme.muted, ["--power-fade-delay" as string]: "0.85s" }}
      >
        {t("unlockedAt", { color: tColors(color) })}
      </p>

      <Button
        className="animate-power-fade-up mt-4 w-full max-w-xs"
        style={{
          backgroundColor: theme.buttonBg,
          color: theme.buttonText,
          ["--power-fade-delay" as string]: "0.85s",
        }}
        onClick={onContinue}
      >
        {t("continue")}
      </Button>
    </div>
  );
}
