import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { testEmails } from "@/lib/admin-access";
import { resolveLocalizedText, type LocalizedText } from "@/lib/i18n-content";
import { plainTipText, type AdminDataset } from "@/lib/admin/metrics";
import type { BraceletColor } from "@/lib/types";

// SERVER-ONLY. Everything the admin dashboard counts, read once per request
// with the admin client (it sees every family). Only ever called from the
// /admin pages, after they've checked the viewer is an admin.

type Admin = ReturnType<typeof createAdminClient>;
const PAGE = 1000;

// PostgREST returns at most 1000 rows per request; page through the rest.
async function fetchAll<T>(admin: Admin, table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}

async function fetchAllUsers(admin: Admin) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) throw new Error(`auth users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < PAGE) return users;
  }
}

const text = (value: LocalizedText | string | null | undefined) =>
  typeof value === "string" ? value : value ? resolveLocalizedText(value, "he") : "";

export const loadAdminDataset = cache(async (): Promise<AdminDataset> => {
  const admin = createAdminClient();
  const [users, profiles, parents, children, links, levels, workouts, sessions, results, challenges, childChallenges, challengeSessions, tips, questions, visits] =
    await Promise.all([
      fetchAllUsers(admin),
      fetchAll<{ id: string; full_name: string }>(admin, "users", "id, full_name"),
      fetchAll<{ id: string; created_at: string }>(admin, "parents", "id, created_at"),
      fetchAll<{
        id: string;
        nickname: string;
        current_color: BraceletColor;
        points_in_color: number;
        workouts_completed_in_color: number;
        total_points: number;
        created_at: string;
      }>(admin, "children", "id, nickname, current_color, points_in_color, workouts_completed_in_color, total_points, created_at"),
      fetchAll<{ parent_id: string; child_id: string }>(admin, "parent_child_links", "parent_id, child_id"),
      fetchAll<{ color: BraceletColor; order_index: number; required_workouts: number; required_points: number }>(
        admin,
        "bracelet_levels",
        "color, order_index, required_workouts, required_points",
      ),
      fetchAll<{ id: string; color: BraceletColor | null; order_in_color: number | null; title: LocalizedText | null }>(
        admin,
        "workouts",
        "id, color, order_in_color, title",
      ),
      fetchAll<{
        id: string;
        child_id: string;
        workout_id: string | null;
        status: string;
        start_time: string;
        actual_duration_seconds: number | null;
        completion_percent: number | null;
      }>(admin, "workout_sessions", "id, child_id, workout_id, status, start_time, actual_duration_seconds, completion_percent"),
      fetchAll<{ session_id: string; difficulty_reported: string | number | null; feeling_after: string | null; parent_trained_together: boolean }>(
        admin,
        "workout_results",
        "session_id, difficulty_reported, feeling_after, parent_trained_together",
      ),
      fetchAll<{
        id: string;
        title: LocalizedText | null;
        bonus_points: number;
        condition_type: string | null;
        challenge_type: string;
        unlock_color: BraceletColor | null;
        min_seconds: number | null;
      }>(admin, "challenges", "id, title, bonus_points, condition_type, challenge_type, unlock_color, min_seconds"),
      fetchAll<{ child_id: string; challenge_id: string; completed_at: string | null }>(admin, "child_challenges", "child_id, challenge_id, completed_at"),
      fetchAll<{ child_id: string; challenge_id: string; status: string; start_time: string; actual_duration_seconds: number | null; points_awarded: number | null }>(
        admin,
        "challenge_sessions",
        "child_id, challenge_id, status, start_time, actual_duration_seconds, points_awarded",
      ),
      fetchAll<{ like_count: number; short_text: LocalizedText | null; tip_text: LocalizedText | string | null }>(
        admin,
        "parent_tip_rules",
        "like_count, short_text, tip_text",
      ),
      fetchAll<{ text: string; matched_rule_id: string | null; rejected: boolean; created_at: string }>(
        admin,
        "parent_chat_questions",
        "text, matched_rule_id, rejected, created_at",
      ),
      // Missing until the site_visits SQL has run: the funnel then simply has no visits line.
      fetchAll<{ created_at: string; source: string | null }>(admin, "site_visits", "created_at, source").catch(() => null),
    ]);

  return {
    now: new Date(),
    users: users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      source: typeof u.user_metadata?.signup_source === "string" ? u.user_metadata.signup_source : null,
    })),
    profiles: profiles.map((p) => ({ id: p.id, fullName: p.full_name ?? "" })),
    parents: parents.map((p) => ({ id: p.id, createdAt: p.created_at })),
    children: children.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      currentColor: c.current_color,
      pointsInColor: c.points_in_color,
      workoutsCompletedInColor: c.workouts_completed_in_color,
      totalPoints: c.total_points,
      createdAt: c.created_at,
    })),
    links: links.map((l) => ({ parentId: l.parent_id, childId: l.child_id })),
    levels: levels.map((l) => ({ color: l.color, orderIndex: l.order_index, requiredWorkouts: l.required_workouts, requiredPoints: l.required_points })),
    workouts: workouts.map((w) => ({ id: w.id, color: w.color, orderInColor: w.order_in_color, title: text(w.title) || "אימון" })),
    sessions: sessions.map((r) => ({
      id: r.id,
      childId: r.child_id,
      workoutId: r.workout_id,
      status: r.status,
      startTime: r.start_time,
      seconds: r.actual_duration_seconds,
      completionPercent: r.completion_percent,
    })),
    results: results.map((r) => {
      const difficulty = Number(r.difficulty_reported);
      return {
        sessionId: r.session_id,
        difficulty: Number.isFinite(difficulty) && difficulty > 0 ? difficulty : null,
        feeling: r.feeling_after,
        parentTogether: r.parent_trained_together,
      };
    }),
    challenges: challenges.map((c) => ({
      id: c.id,
      title: text(c.title) || c.id,
      bonusPoints: c.bonus_points,
      conditionType: c.condition_type,
      challengeType: c.challenge_type,
      unlockColor: c.unlock_color,
      minSeconds: c.min_seconds,
    })),
    childChallenges: childChallenges.map((r) => ({ childId: r.child_id, challengeId: r.challenge_id, completedAt: r.completed_at })),
    challengeSessions: challengeSessions.map((r) => ({
      childId: r.child_id,
      challengeId: r.challenge_id,
      status: r.status,
      startTime: r.start_time,
      seconds: r.actual_duration_seconds,
      points: r.points_awarded,
    })),
    tips: tips.map((t) => ({ likeCount: t.like_count ?? 0, text: plainTipText(text(t.short_text) || text(t.tip_text)) })),
    questions: questions.map((q) => ({ text: q.text, matched: q.matched_rule_id !== null, rejected: q.rejected, createdAt: q.created_at })),
    visits: visits ? visits.map((v) => ({ createdAt: v.created_at, source: v.source })) : null,
    testEmails: testEmails(),
    pilotStart: /^\d{4}-\d{2}-\d{2}$/.test(process.env.ADMIN_PILOT_START ?? "") ? process.env.ADMIN_PILOT_START! : null,
  };
});
