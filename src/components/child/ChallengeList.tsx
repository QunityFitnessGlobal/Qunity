import { getLocale, getTranslations } from "next-intl/server";
import { resolveLocalizedText, type LocalizedText } from "@/lib/i18n-content";

export interface UnlockedChallenge {
  id: string;
  title: LocalizedText;
  completedAt: string | null;
}

interface ChallengeListProps {
  challenges: UnlockedChallenge[];
}

export async function ChallengeList({ challenges }: ChallengeListProps) {
  const t = await getTranslations("challengeList");
  const locale = await getLocale();

  if (challenges.length === 0) {
    return <p className="text-sm text-text-muted">{t("empty")}</p>;
  }

  return (
    <ul className="w-full max-w-sm space-y-2">
      {challenges.map((challenge) => (
        <li key={challenge.id} className="rounded-md bg-zinc-50 p-2 text-sm">
          <span className="font-medium">{resolveLocalizedText(challenge.title, locale)}</span>
          {challenge.completedAt && (
            <span className="text-text-muted-light">
              {" "}
              · {new Date(challenge.completedAt).toLocaleDateString(locale)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
