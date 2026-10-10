// The admin dashboard's numbers, worked out from plain rows (loaded by
// services/admin-dataset.ts with the admin client). Pure functions only, so
// every section can be tested without a database. Dates are bucketed by the
// day in Israel. Text is Hebrew: the dashboard is an internal tool.
import { channelOf, CHANNEL_LABELS, type Channel } from "@/lib/acquisition";
import type { BraceletColor } from "@/lib/types";

// ---------------------------------------------------------------- Rows

export interface AuthUserRow {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  source: string | null;
}
export interface ProfileRow {
  id: string;
  fullName: string;
}
export interface ParentRow {
  id: string;
  createdAt: string;
}
export interface ChildRow {
  id: string;
  nickname: string;
  currentColor: BraceletColor;
  pointsInColor: number;
  workoutsCompletedInColor: number;
  totalPoints: number;
  createdAt: string;
}
export interface LinkRow {
  parentId: string;
  childId: string;
}
export interface LevelRow {
  color: BraceletColor;
  orderIndex: number;
  requiredWorkouts: number;
  requiredPoints: number;
}
export interface WorkoutRow {
  id: string;
  color: BraceletColor | null;
  orderInColor: number | null;
  title: string;
}
export interface SessionRow {
  id: string;
  childId: string;
  workoutId: string | null;
  status: string;
  startTime: string;
  seconds: number | null;
  completionPercent: number | null;
}
export interface ResultRow {
  sessionId: string;
  difficulty: number | null;
  feeling: string | null;
  parentTogether: boolean;
}
export interface ChallengeRow {
  id: string;
  title: string;
  bonusPoints: number;
  conditionType: string | null;
  challengeType: string;
  unlockColor: BraceletColor | null;
  minSeconds: number | null;
}
export interface ChildChallengeRow {
  childId: string;
  challengeId: string;
  completedAt: string | null;
}
export interface ChallengeSessionRow {
  childId: string;
  challengeId: string;
  status: string;
  startTime: string;
  seconds: number | null;
  points: number | null;
}
export interface TipRow {
  likeCount: number;
  text: string;
}
export interface QuestionRow {
  text: string;
  matched: boolean;
  rejected: boolean;
  createdAt: string;
}
export interface VisitRow {
  createdAt: string;
  source: string | null;
}

export interface AdminDataset {
  now: Date;
  users: AuthUserRow[];
  profiles: ProfileRow[];
  parents: ParentRow[];
  children: ChildRow[];
  links: LinkRow[];
  levels: LevelRow[];
  workouts: WorkoutRow[];
  sessions: SessionRow[];
  results: ResultRow[];
  challenges: ChallengeRow[];
  childChallenges: ChildChallengeRow[];
  challengeSessions: ChallengeSessionRow[];
  tips: TipRow[];
  questions: QuestionRow[];
  // Null until the site_visits table exists.
  visits: VisitRow[] | null;
  testEmails: string[];
  // The marketing launch, marked on the activity chart (ADMIN_PILOT_START).
  pilotStart: string | null;
}

// ---------------------------------------------------------------- Filters & scope

export type RangeKey = "7" | "30" | "all";
export interface AdminFilters {
  range: RangeKey;
  source: Channel | "all";
  includeTests: boolean;
}

export const STAGE_NAMES: Record<BraceletColor, string> = {
  white: "לבן",
  orange: "כתום",
  green: "ירוק",
  blue: "כחול",
  purple: "סגול",
};
const STAGE_ORDER: BraceletColor[] = ["white", "orange", "green", "blue", "purple"];

const DAY_MS = 86_400_000;
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jerusalem",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "2026-10-10", the day in Israel.
export function dayKey(date: Date | string): string {
  return dayKeyFormat.format(typeof date === "string" ? new Date(date) : date);
}
// "10.10"
export function dayLabel(key: string): string {
  const [, m, d] = key.split("-");
  return `${Number(d)}.${Number(m)}`;
}
function keyToUtc(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
function utcToKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
function addDays(key: string, days: number): string {
  return utcToKey(keyToUtc(key) + days * DAY_MS);
}
function daysBetween(a: string, b: string): number {
  return Math.round((keyToUtc(b) - keyToUtc(a)) / DAY_MS);
}
// The Sunday that starts the week of a day.
function weekStart(key: string): string {
  return addDays(key, -new Date(keyToUtc(key)).getUTCDay());
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function rangeDays(range: RangeKey): number | null {
  return range === "all" ? null : Number(range);
}

export interface Scope {
  parentIds: Set<string>;
  childIds: Set<string>;
  childrenOf: Map<string, string[]>;
  parentChannel: Map<string, Channel>;
  user: Map<string, AuthUserRow>;
  // The selected period, and the one just before it (for the deltas).
  start: number | null;
  prevStart: number | null;
}

// Which families and children the numbers cover: test families out (unless
// asked for), and only the chosen channel's families.
export function buildScope(d: AdminDataset, f: AdminFilters): Scope {
  const user = new Map(d.users.map((u) => [u.id, u]));
  const tests = new Set(d.testEmails.map((e) => e.toLowerCase()));
  const parentChannel = new Map<string, Channel>();
  const parentIds = new Set<string>();
  for (const p of d.parents) {
    const u = user.get(p.id);
    const channel = channelOf(u?.source);
    parentChannel.set(p.id, channel);
    const isTest = !!u?.email && tests.has(u.email.toLowerCase());
    if ((f.includeTests || !isTest) && (f.source === "all" || f.source === channel)) parentIds.add(p.id);
  }
  const childrenOf = new Map<string, string[]>();
  const childIds = new Set<string>();
  for (const l of d.links) {
    if (!parentIds.has(l.parentId)) continue;
    childIds.add(l.childId);
    childrenOf.set(l.parentId, [...(childrenOf.get(l.parentId) ?? []), l.childId]);
  }
  const days = rangeDays(f.range);
  const now = d.now.getTime();
  return {
    parentIds,
    childIds,
    childrenOf,
    parentChannel,
    user,
    start: days === null ? null : now - days * DAY_MS,
    prevStart: days === null ? null : now - 2 * days * DAY_MS,
  };
}

const inPeriod = (iso: string, s: Scope) => s.start === null || new Date(iso).getTime() >= s.start;
const inPrevPeriod = (iso: string, s: Scope) =>
  s.start !== null && s.prevStart !== null && new Date(iso).getTime() >= s.prevStart && new Date(iso).getTime() < s.start;

function completedByChild(d: AdminDataset, s: Scope): Map<string, SessionRow[]> {
  const map = new Map<string, SessionRow[]>();
  for (const row of d.sessions) {
    if (row.status !== "completed" || !s.childIds.has(row.childId)) continue;
    map.set(row.childId, [...(map.get(row.childId) ?? []), row]);
  }
  for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return map;
}

// Channels that have at least one family, for the filter.
export function availableChannels(d: AdminDataset): Channel[] {
  const user = new Map(d.users.map((u) => [u.id, u]));
  const set = new Set(d.parents.map((p) => channelOf(user.get(p.id)?.source)));
  return (Object.keys(CHANNEL_LABELS) as Channel[]).filter((c) => set.has(c));
}

// ---------------------------------------------------------------- א · Funnel

export interface FunnelView {
  visits: number | null;
  signupRate: number | null;
  steps: { label: string; value: number }[];
  twoWorkoutsShare: number | null;
  medianDaysToFirstWorkout: number | null;
  noChild: number;
  childNeverEntered: number;
  channels: { channel: Channel; label: string; visits: number | null; signups: number; firstWorkout: number; conversion: number | null }[];
}

export function funnelView(d: AdminDataset, f: AdminFilters): FunnelView {
  const s = buildScope(d, f);
  const completed = completedByChild(d, s);
  const families = d.parents.filter((p) => s.parentIds.has(p.id) && inPeriod(p.createdAt, s));
  const kidsOf = (id: string) => s.childrenOf.get(id) ?? [];
  const entered = (childId: string) => !!s.user.get(childId)?.lastSignInAt;
  const workouts = (childId: string) => completed.get(childId)?.length ?? 0;

  let withChild = 0;
  let enteredCount = 0;
  let first = 0;
  let second = 0;
  let noChild = 0;
  let childNeverEntered = 0;
  const toFirst: number[] = [];
  const byChannel = new Map<Channel, { signups: number; firstWorkout: number }>();
  for (const p of families) {
    const kids = kidsOf(p.id);
    const channel = s.parentChannel.get(p.id) ?? "direct";
    const entry = byChannel.get(channel) ?? { signups: 0, firstWorkout: 0 };
    entry.signups += 1;
    if (kids.length === 0) {
      noChild += 1;
    } else {
      withChild += 1;
      if (kids.some(entered)) enteredCount += 1;
      else childNeverEntered += 1;
      if (kids.some((k) => workouts(k) >= 1)) {
        first += 1;
        entry.firstWorkout += 1;
        const firstStart = Math.min(...kids.flatMap((k) => (completed.get(k) ?? []).map((w) => new Date(w.startTime).getTime())));
        toFirst.push(Math.max(0, (firstStart - new Date(p.createdAt).getTime()) / DAY_MS));
      }
      if (kids.some((k) => workouts(k) >= 2)) second += 1;
    }
    byChannel.set(channel, entry);
  }

  const visitRows =
    d.visits?.filter((v) => inPeriod(v.createdAt, s) && (f.source === "all" || channelOf(v.source) === f.source)) ?? null;
  const visitsByChannel = new Map<Channel, number>();
  for (const v of visitRows ?? []) visitsByChannel.set(channelOf(v.source), (visitsByChannel.get(channelOf(v.source)) ?? 0) + 1);

  const channels = [...new Set<Channel>([...byChannel.keys(), ...visitsByChannel.keys()])]
    .map((channel) => {
      const fam = byChannel.get(channel) ?? { signups: 0, firstWorkout: 0 };
      const visits = visitRows ? (visitsByChannel.get(channel) ?? 0) : null;
      return {
        channel,
        label: CHANNEL_LABELS[channel],
        visits,
        signups: fam.signups,
        firstWorkout: fam.firstWorkout,
        conversion: visits ? round1((fam.firstWorkout / visits) * 100) : null,
      };
    })
    .sort((a, b) => (b.visits ?? 0) - (a.visits ?? 0) || b.signups - a.signups);

  const visits = visitRows ? visitRows.length : null;
  const med = median(toFirst);
  return {
    visits,
    signupRate: visits ? round1((families.length / visits) * 100) : null,
    steps: [
      { label: "נרשמו", value: families.length },
      { label: "הוסיפו ילד", value: withChild },
      { label: "הילד נכנס לאפליקציה", value: enteredCount },
      { label: "אימון ראשון", value: first },
      { label: "חזרו לאימון שני", value: second },
    ],
    twoWorkoutsShare: pct(second, families.length),
    medianDaysToFirstWorkout: med === null ? null : round1(med),
    noChild,
    childNeverEntered,
    channels,
  };
}

// ---------------------------------------------------------------- ב · Activity

export interface Kpi {
  label: string;
  value: string;
  // Change against the period before ("+18%"), null when there's nothing to compare.
  delta: string | null;
  up: boolean | null;
}
export interface ActivityView {
  periodLabel: string;
  kpis: Kpi[];
  daily: { key: string; label: string; value: number }[];
  markerIndex: number | null;
  cohorts: { label: string; size: number; weeks: (number | null)[] }[];
  perKid: { label: string; value: number }[];
  activeKidsWeek: number;
}

function changeKpi(label: string, cur: number, prev: number | null, format: (n: number) => string = String): Kpi {
  if (prev === null) return { label, value: format(cur), delta: null, up: null };
  if (prev === 0) return { label, value: format(cur), delta: cur > 0 ? "חדש" : null, up: cur > 0 ? true : null };
  const change = Math.round(((cur - prev) / prev) * 100);
  return { label, value: format(cur), delta: `${change >= 0 ? "+" : ""}${change}%`, up: change >= 0 };
}

export function activityView(d: AdminDataset, f: AdminFilters): ActivityView {
  const s = buildScope(d, f);
  const days = rangeDays(f.range);
  const completed = d.sessions.filter((r) => r.status === "completed" && s.childIds.has(r.childId));
  const cur = completed.filter((r) => inPeriod(r.startTime, s));
  const prev = days === null ? null : completed.filter((r) => inPrevPeriod(r.startTime, s));
  const families = d.parents.filter((p) => s.parentIds.has(p.id));
  const activeCur = new Set(cur.map((r) => r.childId)).size;
  const activePrev = prev === null ? null : new Set(prev.map((r) => r.childId)).size;
  const perKidCur = activeCur ? cur.length / activeCur : 0;
  const perKidPrev = prev === null || !activePrev ? null : prev.length / activePrev;

  const kpis: Kpi[] = [
    changeKpi("משפחות חדשות", families.filter((p) => inPeriod(p.createdAt, s)).length, prev === null ? null : families.filter((p) => inPrevPeriod(p.createdAt, s)).length),
    changeKpi("ילדים שהתאמנו", activeCur, activePrev),
    changeKpi("אימונים שהושלמו", cur.length, prev === null ? null : prev.length),
    {
      label: "אימונים לילד פעיל",
      value: perKidCur.toFixed(1),
      delta: perKidPrev === null ? null : `${perKidCur - perKidPrev >= 0 ? "+" : ""}${(perKidCur - perKidPrev).toFixed(1)}`,
      up: perKidPrev === null ? null : perKidCur >= perKidPrev,
    },
  ];

  // Daily completed workouts: the last 14/30 days, or since the first one (up to 120).
  const today = dayKey(d.now);
  const firstKey = completed.length ? dayKey(completed.reduce((a, b) => (a.startTime < b.startTime ? a : b)).startTime) : today;
  const span = days === 7 ? 14 : days === 30 ? 30 : Math.min(120, Math.max(14, daysBetween(firstKey, today) + 1));
  const counts = new Map<string, number>();
  for (const r of completed) counts.set(dayKey(r.startTime), (counts.get(dayKey(r.startTime)) ?? 0) + 1);
  const daily = Array.from({ length: span }, (_, i) => {
    const key = addDays(today, i - span + 1);
    return { key, label: dayLabel(key), value: counts.get(key) ?? 0 };
  });
  const markerIndex = d.pilotStart ? daily.findIndex((day) => day.key === d.pilotStart) : -1;

  // Return by cohort: children grouped by the week of their first workout.
  const byChild = new Map<string, string[]>();
  for (const r of completed) byChild.set(r.childId, [...(byChild.get(r.childId) ?? []), dayKey(r.startTime)]);
  const cohortKids = new Map<string, string[]>();
  for (const [child, keys] of byChild) {
    const week = weekStart(keys.reduce((a, b) => (a < b ? a : b)));
    cohortKids.set(week, [...(cohortKids.get(week) ?? []), child]);
  }
  const todayWeek = weekStart(today);
  const cohorts = [...cohortKids.keys()]
    .sort()
    .slice(-6)
    .map((week) => {
      const kids = cohortKids.get(week)!;
      const weeks = [0, 1, 2, 3].map((k) => {
        const target = addDays(week, 7 * k);
        if (target > todayWeek) return null;
        const active = kids.filter((c) => byChild.get(c)!.some((key) => weekStart(key) === target)).length;
        return pct(active, kids.length);
      });
      return { label: `${dayLabel(week)}–${dayLabel(addDays(week, 6))}`, size: kids.length, weeks };
    });

  // Workouts per active child in the last 7 days.
  const weekAgo = d.now.getTime() - 7 * DAY_MS;
  const lastWeek = new Map<string, number>();
  for (const r of completed) if (new Date(r.startTime).getTime() >= weekAgo) lastWeek.set(r.childId, (lastWeek.get(r.childId) ?? 0) + 1);
  const buckets = [0, 0, 0, 0, 0];
  for (const n of lastWeek.values()) buckets[Math.min(n, 5) - 1] += 1;

  return {
    periodLabel: days === null ? "מתחילת הבדיקה" : `${days} הימים האחרונים`,
    kpis,
    daily,
    markerIndex: markerIndex >= 0 ? markerIndex : null,
    cohorts,
    perKid: ["אימון אחד", "2 אימונים", "3 אימונים", "4 אימונים", "5 ומעלה"].map((label, i) => ({ label, value: buckets[i] })),
    activeKidsWeek: lastWeek.size,
  };
}

// ---------------------------------------------------------------- ג · Workout quality

export const FEELING_LABELS: Record<string, string> = {
  fun: "😄 כיף",
  fine: "🙂 בסדר גמור",
  frustrated: "😤 מתוסכל",
  tired: "😔 עייף",
  exhausted: "😢 מותש",
};

export interface QualityView {
  stages: { color: BraceletColor; total: number; parts: [number, number, number, number] | null }[];
  tired: { color: BraceletColor; value: number | null }[];
  difficulty: { color: BraceletColor; value: number | null }[];
  problems: {
    title: string;
    color: BraceletColor | null;
    order: number | null;
    starts: number;
    fullPct: number;
    abandonPct: number;
    topFeeling: string | null;
    level: "critical" | "serious" | null;
  }[];
}

// A session left unfinished for 3 hours counts as abandoned (a later one
// might still be running).
const ABANDON_AFTER_MS = 3 * 60 * 60 * 1000;

export function qualityView(d: AdminDataset, f: AdminFilters): QualityView {
  const s = buildScope(d, f);
  const workout = new Map(d.workouts.map((w) => [w.id, w]));
  const result = new Map(d.results.map((r) => [r.sessionId, r]));
  const cutoff = d.now.getTime() - ABANDON_AFTER_MS;
  const sessions = d.sessions.filter(
    (r) => s.childIds.has(r.childId) && inPeriod(r.startTime, s) && (r.status === "completed" || new Date(r.startTime).getTime() < cutoff),
  );
  const colorOf = (r: SessionRow) => (r.workoutId ? (workout.get(r.workoutId)?.color ?? null) : null);

  const stages = STAGE_ORDER.map((color) => {
    const rows = sessions.filter((r) => colorOf(r) === color);
    if (rows.length === 0) return { color, total: 0, parts: null };
    const done = rows.filter((r) => r.status === "completed");
    const full = done.filter((r) => (r.completionPercent ?? 100) >= 100).length;
    const passed = done.filter((r) => (r.completionPercent ?? 100) >= 60 && (r.completionPercent ?? 100) < 100).length;
    const low = done.length - full - passed;
    const abandoned = rows.length - done.length;
    const parts = [full, passed, low, abandoned].map((n) => Math.round((n / rows.length) * 100)) as [number, number, number, number];
    return { color, total: rows.length, parts };
  });

  const resultsIn = (color: BraceletColor) =>
    sessions.filter((r) => r.status === "completed" && colorOf(r) === color).map((r) => result.get(r.id)).filter((r): r is ResultRow => !!r);
  const tired = STAGE_ORDER.map((color) => {
    const rows = resultsIn(color).filter((r) => r.feeling);
    return { color, value: pct(rows.filter((r) => r.feeling === "tired" || r.feeling === "exhausted").length, rows.length) };
  });
  const difficulty = STAGE_ORDER.map((color) => {
    const values = resultsIn(color).map((r) => r.difficulty).filter((v): v is number => v !== null && v >= 1 && v <= 4);
    return { color, value: values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null };
  });

  const byWorkout = new Map<string, SessionRow[]>();
  for (const r of sessions) if (r.workoutId) byWorkout.set(r.workoutId, [...(byWorkout.get(r.workoutId) ?? []), r]);
  const problems = [...byWorkout.entries()]
    .filter(([, rows]) => rows.length >= 3)
    .map(([id, rows]) => {
      const w = workout.get(id);
      const done = rows.filter((r) => r.status === "completed");
      const abandonPct = Math.round(((rows.length - done.length) / rows.length) * 100);
      const feelings = new Map<string, number>();
      for (const r of done) {
        const feeling = result.get(r.id)?.feeling;
        if (feeling) feelings.set(feeling, (feelings.get(feeling) ?? 0) + 1);
      }
      const top = [...feelings.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        title: w?.title ?? "אימון",
        color: w?.color ?? null,
        order: w?.orderInColor ?? null,
        starts: rows.length,
        fullPct: Math.round((done.filter((r) => (r.completionPercent ?? 100) >= 100).length / rows.length) * 100),
        abandonPct,
        topFeeling: top ? (FEELING_LABELS[top] ?? top) : null,
        level: abandonPct >= 20 ? ("critical" as const) : abandonPct >= 12 ? ("serious" as const) : null,
      };
    })
    .sort((a, b) => b.abandonPct - a.abandonPct || b.starts - a.starts)
    .slice(0, 6);

  return { stages, tired, difficulty, problems };
}

// ---------------------------------------------------------------- ד · Stage progress

export interface ProgressView {
  kidsInProgram: number;
  perStage: { color: BraceletColor; count: number }[];
  daysPerStage: { color: BraceletColor; avg: number | null; fastest: number | null }[];
  stuck: { name: string; color: BraceletColor; workouts: string; points: string; missing: number; extra: number }[];
  stuckCount: number;
  parentShare: { color: BraceletColor; value: number | null }[];
}

export function progressView(d: AdminDataset, f: AdminFilters): ProgressView {
  const s = buildScope(d, f);
  const completed = completedByChild(d, s);
  const workout = new Map(d.workouts.map((w) => [w.id, w]));
  const level = new Map(d.levels.map((l) => [l.color, l]));
  const kids = d.children.filter((c) => s.childIds.has(c.id) && (completed.get(c.id)?.length ?? 0) > 0);

  const perStage = STAGE_ORDER.map((color) => ({ color, count: kids.filter((k) => k.currentColor === color).length }));

  // Days from a stage's first workout to its last one before the next stage began.
  const spans = new Map<BraceletColor, number[]>();
  for (const kid of kids) {
    const rows = completed.get(kid.id) ?? [];
    const colorOf = (r: SessionRow) => (r.workoutId ? workout.get(r.workoutId)?.color : undefined);
    STAGE_ORDER.forEach((color, i) => {
      const next = STAGE_ORDER[i + 1];
      if (!next) return;
      const nextStart = rows.find((r) => colorOf(r) === next)?.startTime;
      if (!nextStart) return;
      const inStage = rows.filter((r) => colorOf(r) === color && r.startTime < nextStart);
      if (inStage.length === 0) return;
      const span = daysBetween(dayKey(inStage[0].startTime), dayKey(inStage[inStage.length - 1].startTime)) + 1;
      spans.set(color, [...(spans.get(color) ?? []), span]);
    });
  }
  const daysPerStage = STAGE_ORDER.map((color) => {
    const values = spans.get(color) ?? [];
    return {
      color,
      avg: values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null,
      fastest: values.length ? Math.min(...values) : null,
    };
  });

  const stuckAll = kids
    .map((k) => ({ kid: k, level: level.get(k.currentColor) }))
    .filter(({ kid, level: l }) => !!l && kid.workoutsCompletedInColor >= l.requiredWorkouts && kid.pointsInColor < l.requiredPoints)
    .map(({ kid, level: l }) => ({
      name: kid.nickname,
      color: kid.currentColor,
      workouts: `${kid.workoutsCompletedInColor}/${l!.requiredWorkouts}`,
      points: `${kid.pointsInColor}/${l!.requiredPoints}`,
      missing: l!.requiredPoints - kid.pointsInColor,
      extra: kid.workoutsCompletedInColor - l!.requiredWorkouts,
    }))
    .sort((a, b) => b.missing - a.missing);

  const result = new Map(d.results.map((r) => [r.sessionId, r]));
  const parentShare = STAGE_ORDER.map((color) => {
    const rows = [...completed.values()]
      .flat()
      .filter((r) => inPeriod(r.startTime, s) && r.workoutId && workout.get(r.workoutId)?.color === color)
      .map((r) => result.get(r.id))
      .filter((r): r is ResultRow => !!r);
    return { color, value: pct(rows.filter((r) => r.parentTogether).length, rows.length) };
  });

  return { kidsInProgram: kids.length, perStage, daysPerStage, stuck: stuckAll.slice(0, 8), stuckCount: stuckAll.length, parentShare };
}

// ---------------------------------------------------------------- ה · Challenges

export interface ChallengesView {
  kidsInProgram: number;
  once: { title: string; pct: number }[];
  stairs: { title: string; max: number; unlocked: number; runs: number; medianSeconds: number | null; zeroPct: number | null; avgPoints: number | null }[];
  histogram: { title: string; max: number; minSeconds: number | null; runs: number; zero: number; zeroPct: number; buckets: { label: string; value: number }[] } | null;
}

export function challengesView(d: AdminDataset, f: AdminFilters): ChallengesView {
  const s = buildScope(d, f);
  const completed = completedByChild(d, s);
  const kidsInProgram = [...s.childIds].filter((id) => (completed.get(id)?.length ?? 0) > 0);
  const has = new Set(d.childChallenges.filter((r) => s.childIds.has(r.childId)).map((r) => `${r.childId}:${r.challengeId}`));

  const once = d.challenges
    .filter((c) => c.challengeType === "condition")
    .map((c) => ({ title: c.title, pct: pct(kidsInProgram.filter((k) => has.has(`${k}:${c.id}`)).length, kidsInProgram.length) ?? 0 }))
    .sort((a, b) => b.pct - a.pct);

  const order = (c: ChallengeRow) => (c.unlockColor ? STAGE_ORDER.indexOf(c.unlockColor) : 99);
  const repeatables = d.challenges.filter((c) => c.challengeType === "repeatable_workout").sort((a, b) => order(a) - order(b));
  const runsOf = (c: ChallengeRow) =>
    d.challengeSessions.filter((r) => r.challengeId === c.id && r.status === "completed" && s.childIds.has(r.childId) && inPeriod(r.startTime, s));
  const stairs = repeatables.map((c) => {
    const runs = runsOf(c);
    const points = runs.map((r) => r.points ?? 0);
    const secs = runs.map((r) => r.seconds).filter((v): v is number => v !== null);
    const med = median(secs);
    return {
      title: c.title,
      max: c.bonusPoints,
      unlocked: [...s.childIds].filter((k) => has.has(`${k}:${c.id}`)).length,
      runs: runs.length,
      medianSeconds: med === null ? null : Math.round(med),
      zeroPct: pct(points.filter((p) => p === 0).length, points.length),
      avgPoints: points.length ? round1(points.reduce((a, b) => a + b, 0) / points.length) : null,
    };
  });

  const first = repeatables.find((c) => runsOf(c).length > 0);
  let histogram: ChallengesView["histogram"] = null;
  if (first) {
    const max = first.bonusPoints;
    const a = Math.max(1, Math.round(max / 3));
    const b = Math.max(a + 1, Math.round((2 * max) / 3));
    const ranges: [string, (p: number) => boolean][] = [
      ["0", (p) => p === 0],
      [`1–${a}`, (p) => p >= 1 && p <= a],
      [`${a + 1}–${b}`, (p) => p > a && p <= b],
      [`${b + 1}–${max - 1}`, (p) => p > b && p < max],
      [String(max), (p) => p >= max],
    ];
    const points = runsOf(first).map((r) => r.points ?? 0);
    const buckets = ranges.map(([label, test]) => ({ label, value: points.filter(test).length }));
    histogram = {
      title: first.title,
      max,
      minSeconds: first.minSeconds,
      runs: points.length,
      zero: buckets[0].value,
      zeroPct: pct(buckets[0].value, points.length) ?? 0,
      buckets,
    };
  }

  return { kidsInProgram: kidsInProgram.length, once, stairs, histogram };
}

// ---------------------------------------------------------------- ו · Parents

export interface ParentsView {
  likes: number;
  questions: number;
  matchedPct: number | null;
  rejectedPct: number | null;
  topTips: { text: string; likes: number }[];
  open: { text: string; count: number; status: "none" | "wrong"; last: string }[];
}

export function parentsView(d: AdminDataset, f: AdminFilters): ParentsView {
  const s = buildScope(d, f);
  const questions = d.questions.filter((q) => inPeriod(q.createdAt, s));
  const grouped = new Map<string, { text: string; count: number; status: "none" | "wrong"; last: string }>();
  for (const q of questions) {
    if (q.matched && !q.rejected) continue;
    const key = q.text.trim().replace(/\s+/g, " ").toLowerCase();
    const entry = grouped.get(key) ?? { text: q.text.trim(), count: 0, status: q.matched ? ("wrong" as const) : ("none" as const), last: q.createdAt };
    entry.count += 1;
    if (q.createdAt > entry.last) entry.last = q.createdAt;
    grouped.set(key, entry);
  }
  return {
    likes: d.tips.reduce((sum, t) => sum + t.likeCount, 0),
    questions: questions.length,
    matchedPct: pct(questions.filter((q) => q.matched).length, questions.length),
    rejectedPct: pct(questions.filter((q) => q.rejected).length, questions.length),
    topTips: d.tips
      .filter((t) => t.likeCount > 0)
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 6)
      .map((t) => ({ text: t.text, likes: t.likeCount })),
    open: [...grouped.values()]
      .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
      .slice(0, 8)
      .map((q) => ({ ...q, last: dayLabel(dayKey(q.last)) })),
  };
}

// ---------------------------------------------------------------- ז · Families

export type FamilyStatus = "active" | "risk" | "inactive" | "new";

export interface FamilyRow {
  id: string;
  parentName: string;
  kids: { name: string; color: BraceletColor }[];
  joined: string;
  channel: string;
  lastWorkout: string | null;
  ago: string;
  workouts: number;
  status: FamilyStatus;
}
export interface FamilyDetail extends FamilyRow {
  kidCards: { name: string; color: BraceletColor; workouts: number; points: number }[];
  timeline: { date: string; text: string }[];
}
export interface FamiliesView {
  rows: FamilyRow[];
  counts: Record<FamilyStatus | "all", number>;
  selected: FamilyDetail | null;
}

export function familyStatus(lastWorkout: string | null, now: Date): FamilyStatus {
  if (!lastWorkout) return "new";
  const days = daysBetween(dayKey(lastWorkout), dayKey(now));
  return days < 7 ? "active" : days < 14 ? "risk" : "inactive";
}

function agoText(lastWorkout: string | null, now: Date): string {
  if (!lastWorkout) return "";
  const days = daysBetween(dayKey(lastWorkout), dayKey(now));
  return days <= 0 ? "היום" : days === 1 ? "אתמול" : days === 2 ? "לפני יומיים" : `לפני ${days} ימים`;
}

export function familiesView(d: AdminDataset, f: AdminFilters, status: FamilyStatus | "all", selectedId: string | null): FamiliesView {
  const s = buildScope(d, f);
  const completed = completedByChild(d, s);
  const child = new Map(d.children.map((c) => [c.id, c]));
  const name = new Map(d.profiles.map((p) => [p.id, p.fullName.trim().split(/\s+/)[0] || "הורה"]));

  const all = d.parents
    .filter((p) => s.parentIds.has(p.id))
    .map((p) => {
      const kidIds = s.childrenOf.get(p.id) ?? [];
      const sessions = kidIds.flatMap((k) => completed.get(k) ?? []);
      const last = sessions.reduce<string | null>((a, r) => (a === null || r.startTime > a ? r.startTime : a), null);
      const st = familyStatus(last, d.now);
      const kids = kidIds.map((k) => child.get(k)).filter((c): c is ChildRow => !!c);
      const noWorkoutReason =
        kids.length === 0 ? "לא הוסיפו ילד" : kids.some((k) => s.user.get(k.id)?.lastSignInAt) ? "עוד לא התאמנו" : "הילד לא נכנס";
      const row: FamilyRow = {
        id: p.id,
        parentName: name.get(p.id) ?? "הורה",
        kids: kids.map((k) => ({ name: k.nickname, color: k.currentColor })),
        joined: dayLabel(dayKey(p.createdAt)),
        channel: CHANNEL_LABELS[s.parentChannel.get(p.id) ?? "direct"],
        lastWorkout: last ? dayLabel(dayKey(last)) : null,
        ago: last ? agoText(last, d.now) : noWorkoutReason,
        workouts: sessions.length,
        status: st,
      };
      return { row, sort: last ?? p.createdAt };
    })
    .sort((a, b) => b.sort.localeCompare(a.sort));

  const counts = { all: all.length, active: 0, risk: 0, inactive: 0, new: 0 };
  for (const { row } of all) counts[row.status] += 1;
  const rows = all.filter(({ row }) => status === "all" || row.status === status).map(({ row }) => row);

  let selected: FamilyDetail | null = null;
  const pick = all.find(({ row }) => row.id === selectedId) ?? (rows[0] ? all.find(({ row }) => row.id === rows[0].id) : undefined);
  if (pick) {
    const p = d.parents.find((x) => x.id === pick.row.id)!;
    const kidIds = s.childrenOf.get(p.id) ?? [];
    const result = new Map(d.results.map((r) => [r.sessionId, r]));
    const workout = new Map(d.workouts.map((w) => [w.id, w]));
    const challenge = new Map(d.challenges.map((c) => [c.id, c]));
    const events: { at: string; text: string }[] = [
      { at: p.createdAt, text: pick.row.channel === CHANNEL_LABELS.direct ? "נרשמו" : `נרשמו דרך ${pick.row.channel}` },
    ];
    for (const k of kidIds) {
      const kid = child.get(k);
      if (!kid) continue;
      events.push({ at: kid.createdAt, text: `הוסיפו את ${kid.nickname}` });
      const rows = completed.get(k) ?? [];
      const describe = (r: SessionRow, what: string) => {
        const w = r.workoutId ? workout.get(r.workoutId) : undefined;
        const feeling = result.get(r.id)?.feeling;
        const stage = w?.color ? ` בשלב ה${STAGE_NAMES[w.color]}` : "";
        return `${kid.nickname} · ${what}${stage} · ${r.completionPercent ?? 100}%${feeling ? ` · ${FEELING_LABELS[feeling] ?? feeling}` : ""}`;
      };
      if (rows[0]) events.push({ at: rows[0].startTime, text: describe(rows[0], "אימון ראשון") });
      if (rows.length > 1) events.push({ at: rows[rows.length - 1].startTime, text: describe(rows[rows.length - 1], `אימון אחרון (${rows.length} בסך הכול)`) });
      for (const cc of d.childChallenges.filter((r) => r.childId === k && r.completedAt)) {
        const c = challenge.get(cc.challengeId);
        if (!c) continue;
        if (c.id.startsWith("power_")) {
          const color = c.id.slice(6) as BraceletColor;
          if (color !== "white") events.push({ at: cc.completedAt!, text: `${kid.nickname} · שלב חדש: ${STAGE_NAMES[color] ?? color}` });
        } else if (c.challengeType === "condition") {
          events.push({ at: cc.completedAt!, text: `${kid.nickname} · אתגר: ${c.title}` });
        }
      }
    }
    selected = {
      ...pick.row,
      kidCards: kidIds
        .map((k) => child.get(k))
        .filter((c): c is ChildRow => !!c)
        .map((c) => ({ name: c.nickname, color: c.currentColor, workouts: completed.get(c.id)?.length ?? 0, points: c.totalPoints })),
      timeline: events
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 14)
        .map((e) => ({ date: dayLabel(dayKey(e.at)), text: e.text })),
    };
  }

  return { rows, counts, selected };
}

// The short text of a tip: the gender-neutral ("other") branch of an ICU
// gender select, or the plain text.
export function plainTipText(text: string): string {
  const marker = "other {";
  const at = text.indexOf(marker);
  if (at === -1) return text;
  let depth = 1;
  let i = at + marker.length;
  while (i < text.length && depth > 0) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") depth -= 1;
    i += 1;
  }
  return text.slice(at + marker.length, i - 1).replace(/\{[^}]*\}/g, "…").trim();
}
