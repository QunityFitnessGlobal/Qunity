import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import type { LeaderboardEntry } from "@/services/leaderboard.service";
import { BRACELET_CSS_VAR } from "@/lib/colors";
import type { BraceletColor, Gender } from "@/lib/types";

// The table shows the top of the ranking, but the child's own place and the
// gap to whoever is just above them come from the full ranking — a child in
// place 25 still gets their climb card.
const SHOWN_ROWS = 20;

interface PodiumLook {
  height: number;
  fill: string;
  edge: string;
  ink: string;
  riseDelay: number;
}

// Index = rank - 1. Heights make the podium's silhouette; the rise delays
// build it up from third place to first.
const PODIUM: PodiumLook[] = [
  { height: 142, fill: "var(--color-reward-gold)", edge: "#d99a0b", ink: "var(--color-reward-gold-on)", riseDelay: 0.5 },
  { height: 108, fill: "#e2e5ec", edge: "#b9bfcc", ink: "#4f5566", riseDelay: 0.35 },
  { height: 84, fill: "#f6c9a6", edge: "#d99b6c", ink: "#6b3a12", riseDelay: 0.2 },
];

// Bracelet white vanishes on the white page, so it's drawn in its outline shade.
function stageColor(color: BraceletColor): string {
  return color === "white" ? "var(--color-bracelet-white-outline)" : BRACELET_CSS_VAR[color];
}

const CLIMB_SENTENCES = ["climbPoints1", "climbPoints2", "climbPoints3"] as const;
const SENTENCE_ORDERS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

// Each child gets their own shuffled order of the three sentences (fixed by
// their id), and every new scoring event steps to the next one in it — so
// the sentence reads as random but always changes when the score does, and
// stays put on a reload with no new points.
function climbSentence(userId: string, scoringEvents: number) {
  let seed = 0;
  for (const char of userId) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }
  const order = SENTENCE_ORDERS[seed % SENTENCE_ORDERS.length];
  return CLIMB_SENTENCES[order[scoringEvents % CLIMB_SENTENCES.length]];
}

interface LeaderboardViewProps {
  // The full ranking, in the order get_leaderboard() returns it: stage
  // first, then points within the stage. Never re-sorted here.
  ranking: LeaderboardEntry[];
  userId: string;
  weekPoints: number;
  scoringEvents: number;
  gender: Gender;
}

export async function LeaderboardView({ ranking, userId, weekPoints, scoringEvents, gender }: LeaderboardViewProps) {
  const t = await getTranslations("leaderboard");
  const shown = ranking.slice(0, SHOWN_ROWS);
  const podium = shown.slice(0, 3);
  const rows = shown.slice(3).map((entry, i) => ({ entry, rank: i + 4 }));
  const myIndex = ranking.findIndex((entry) => entry.id === userId);
  const me = myIndex >= 0 ? ranking[myIndex] : null;
  const above = myIndex > 0 ? ranking[myIndex - 1] : null;
  const outsideShown = myIndex >= SHOWN_ROWS;

  // Ranking goes by stage first, then points — so only a child in the same
  // stage can be overtaken on points alone.
  const pointsToPass =
    me && above && above.currentColor === me.currentColor ? above.totalPoints - me.totalPoints + 1 : null;
  const climbProgress =
    me && above && pointsToPass !== null ? Math.min(100, Math.round((me.totalPoints / (above.totalPoints + 1)) * 100)) : null;

  // Podium columns sit in second-first-third order so the winner stands in
  // the middle.
  const podiumOrder = [podium[1], podium[0], podium[2]]
    .map((entry, slot) => ({ entry, rank: [2, 1, 3][slot] }))
    .filter((item): item is { entry: LeaderboardEntry; rank: number } => item.entry !== undefined);

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 pb-6 pt-8">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>

      {ranking.length === 0 ? (
        <p className="text-sm text-text-muted">{t("empty")}</p>
      ) : (
        <>
          <div className="flex w-full max-w-sm items-end justify-center gap-2.5 pt-2">
            {podiumOrder.map(({ entry, rank }) => {
              const look = PODIUM[rank - 1];
              const isYou = entry.id === userId;
              return (
                <div key={entry.id} className="flex w-[104px] flex-col items-center gap-1.5">
                  {rank === 1 && (
                    <svg
                      width="30"
                      height="22"
                      viewBox="0 0 30 22"
                      aria-hidden
                      className="animate-leader-crown"
                    >
                      <path
                        d="M3 18 1.5 5l7.5 6L15 2l6 9 7.5-6L27 18z"
                        fill="var(--color-reward-gold)"
                        stroke="var(--color-reward-gold-ink)"
                        strokeWidth={1.4}
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <span
                    className="animate-power-badge-pop flex h-[50px] w-[50px] items-center justify-center rounded-full border-4 bg-white font-display text-xl font-semibold text-zinc-600"
                    style={{ borderColor: stageColor(entry.currentColor), animationDelay: `${look.riseDelay + 0.45}s` }}
                  >
                    {entry.nickname.trim().charAt(0)}
                  </span>
                  <span className={`max-w-full truncate text-sm ${isYou ? "font-bold text-brand-purple" : "font-semibold"}`}>
                    {entry.nickname}
                  </span>
                  <span className="font-display text-[13px] font-semibold text-text-muted">
                    {t("points", { points: entry.totalPoints })}
                  </span>
                  <div
                    className="animate-leader-rise flex w-full justify-center rounded-t-[14px] rounded-b-md pt-2"
                    style={{
                      height: look.height,
                      backgroundColor: look.fill,
                      boxShadow: `inset 0 -4px 0 ${look.edge}`,
                      animationDelay: `${look.riseDelay}s`,
                    }}
                  >
                    <span className="font-display text-3xl font-bold" style={{ color: look.ink }}>
                      {rank}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {me && (
            <section
              className="animate-power-fade-up flex w-full max-w-sm flex-col gap-2.5 rounded-2xl border-2 border-brand-purple bg-white px-3.5 py-3"
              style={{ ["--power-fade-delay" as string]: "0.9s" } as CSSProperties}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-lg font-bold">{t("rank", { gender, rank: myIndex + 1 })}</span>
                {weekPoints > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[13px] font-semibold text-green-700">
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M10 16V4M4.5 9.5 10 4l5.5 5.5" />
                    </svg>
                    {t("weekPoints", { points: weekPoints })}
                  </span>
                )}
              </div>
              {climbProgress !== null && (
                <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="animate-leader-fill h-full rounded-full bg-reward-gold"
                    style={{ width: `${climbProgress}%` }}
                  />
                </div>
              )}
              <p className="text-sm text-zinc-700">
                {myIndex === 0
                  ? t("top", { gender })
                  : pointsToPass !== null
                    ? t.rich(climbSentence(userId, scoringEvents), {
                        gender,
                        points: pointsToPass,
                        b: (chunks) => <b>{chunks}</b>,
                      })
                    : t("climbStage", { gender })}
              </p>
            </section>
          )}

          <ol className="flex w-full max-w-sm flex-col gap-2">
            {rows.map(({ entry, rank }, i) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                rank={rank}
                isYou={entry.id === userId}
                youLabel={t("you", { gender })}
                pointsLabel={t("points", { points: entry.totalPoints })}
                delay={1 + Math.min(i, 10) * 0.05}
              />
            ))}
            {me && outsideShown && (
              <>
                <li aria-hidden className="text-center text-sm font-bold tracking-widest text-text-muted">
                  ···
                </li>
                <LeaderboardRow
                  entry={me}
                  rank={myIndex + 1}
                  isYou
                  youLabel={t("you", { gender })}
                  pointsLabel={t("points", { points: me.totalPoints })}
                  delay={1.1}
                />
              </>
            )}
          </ol>
        </>
      )}
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  isYou: boolean;
  youLabel: string;
  pointsLabel: string;
  delay: number;
}

function LeaderboardRow({ entry, rank, isYou, youLabel, pointsLabel, delay }: LeaderboardRowProps) {
  return (
    <li
      className={`animate-power-fade-up flex min-h-11 items-center gap-3 rounded-2xl border px-3.5 py-1.5 ${
        isYou ? "border-brand-purple bg-brand-purple/5" : "border-zinc-200 bg-white"
      }`}
      style={{ ["--power-fade-delay" as string]: `${delay}s` } as CSSProperties}
    >
      <span className="w-6 text-center font-display font-semibold text-text-muted">{rank}</span>
      <span
        aria-hidden
        className="h-3.5 w-3.5 flex-none rounded-full"
        style={{
          backgroundColor: BRACELET_CSS_VAR[entry.currentColor],
          boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.15)",
        }}
      />
      <span className={`flex-1 truncate text-[15px] ${isYou ? "font-bold" : "font-medium"}`}>
        {entry.nickname} {isYou && youLabel}
      </span>
      <span className="font-display text-sm font-semibold text-brand-purple">{pointsLabel}</span>
    </li>
  );
}
