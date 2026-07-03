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
export async function getLeaderboard(supabase: SupabaseClient): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: LEADERBOARD_LIMIT });

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
