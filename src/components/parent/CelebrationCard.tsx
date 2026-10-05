import { getLocale, getTranslations } from "next-intl/server";
import { resolveGenderedText, resolveLocalizedText } from "@/lib/i18n-content";
import type { Celebration } from "@/services/celebration.service";
import type { Gender } from "@/lib/types";

interface CelebrationCardProps {
  celebration: Celebration;
  name: string;
  gender: Gender | null;
}

// "רגע לחגוג" on the parent home screen: a happy event from the last few
// days ("נועה עלתה לשלב הכתום!") and an idea to celebrate it together.
export async function CelebrationCard({ celebration, name, gender }: CelebrationCardProps) {
  const t = await getTranslations("parentHome.celebrate");
  const tColors = await getTranslations("colors");
  const tPowers = await getTranslations("powers");
  const locale = await getLocale();

  const color = celebration.currentColor;
  const values = {
    name,
    stage: tColors(color),
    power: tPowers(`${color}.name`),
    quote: tPowers(`${color}.quote`, { gender: gender ?? "other" }),
    challenge: celebration.challengeTitle ? resolveLocalizedText(celebration.challengeTitle, locale) : "",
    days: celebration.streakDays ?? 0,
  };
  const when =
    celebration.daysAgo <= 0
      ? t("today")
      : celebration.daysAgo === 1
        ? t("yesterday")
        : celebration.daysAgo === 2
          ? t("twoDaysAgo")
          : t("daysAgo", { count: celebration.daysAgo });

  return (
    <section
      className="animate-power-fade-up flex items-start gap-3 rounded-[20px] border border-[#f3e3b5] bg-reward-gold-soft px-4 py-3.5"
      style={{ ["--power-fade-delay" as string]: "0.1s" }}
    >
      <span className="animate-home-wiggle flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-reward-gold">
        <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" stroke="#3a2800" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 3.5h8V8a4 4 0 0 1-8 0zM6 5H3.5v1.5A2.5 2.5 0 0 0 6 9M14 5h2.5v1.5A2.5 2.5 0 0 1 14 9M10 12v3M7 17h6" />
        </svg>
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-reward-gold-ink">{t("eyebrow", { when })}</span>
        <span className="font-display text-[17px] font-semibold text-reward-gold-on">
          {resolveGenderedText(celebration.title, locale, gender, values)}
        </span>
        <span className="text-sm leading-[1.45] text-[#5c4200]">
          {t("ideaLabel")} {resolveGenderedText(celebration.idea, locale, gender, values)}
        </span>
      </span>
    </section>
  );
}
