import type { SupabaseClient } from "@supabase/supabase-js";
import type { BraceletColor } from "@/lib/types";

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  currentColor: BraceletColor;
  totalPoints: number;
}

interface LeaderboardRow {
  id: string;
  nickname: string;
  current_color: BraceletColor;
  total_points: number;
}

const LEADERBOARD_LIMIT = 20;

// Goes through the get_leaderboard() RPC (see schema.sql) rather than
// querying `children` directly — that table's RLS only ever exposes a row to
// itself or its linked parent, so a direct query would return nothing for
// other children. The RPC is a SECURITY DEFINER function that only ever
// returns the four public-safe columns.
export async function getLeaderboard(
  supabase: SupabaseClient,
  limit: number = LEADERBOARD_LIMIT,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: limit });

  if (error) {
    // Surfaced in server logs rather than silently showing as "no data yet"
    // (e.g. this fires if the get_leaderboard() SQL function has not been
    // run against this Supabase project yet).
    console.error("getLeaderboard: get_leaderboard RPC failed", error.message);
    return [];
  }

  if (!data) {
    return [];
  }

  return (data as LeaderboardRow[]).map((row) => ({
    id: row.id,
    nickname: row.nickname,
    currentColor: row.current_color,
    totalPoints: row.total_points,
  }));
}

export interface PointsActivity {
  // Everything earned over the last 7 days — shown as effort on the
  // leaderboard rather than a rank change, which would need a rank history
  // nothing records.
  weekPoints: number;
  // How many separate times the child has ever scored. One award writes all
  // its rows in a single insert (same created_at), so each distinct
  // timestamp is one scoring event; the count goes up every time the score
  // changes.
  scoringEvents: number;
}

// The child's own points history only, via the points_select_own policy.
export async function getPointsActivity(supabase: SupabaseClient, childId: string): Promise<PointsActivity> {
  const { data } = await supabase
    .from("points_transactions")
    .select("points, created_at")
    .eq("child_id", childId);

  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let weekPoints = 0;
  const events = new Set<string>();
  for (const row of data ?? []) {
    const createdAt = row.created_at as string;
    events.add(createdAt);
    if (new Date(createdAt).getTime() >= since) {
      weekPoints += (row.points as number) ?? 0;
    }
  }

  return { weekPoints, scoringEvents: events.size };
}
