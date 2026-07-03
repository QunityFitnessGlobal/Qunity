// One-time script that creates demo accounts and workout history so the
// Leaderboard, Parent Dashboard, and Tips engine have real data to show on
// first run. Safe to re-run — existing demo users are reused, not duplicated.
//
// Requires the Supabase SERVICE ROLE key (Project Settings -> API -> service_role),
// never the anon key. This key bypasses RLS entirely, so:
//   - Never commit it to the repo or put it in .env.local.
//   - Only ever set it as a throwaway environment variable in your own
//     terminal session, for running this script.
//
// Usage (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = "paste-the-key-here"
//   node scripts/seed-demo-data.mjs
//
// Usage (bash):
//   SUPABASE_SERVICE_ROLE_KEY="paste-the-key-here" node scripts/seed-demo-data.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    const content = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z_0-9]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch {
    // .env.local not found — that's fine, NEXT_PUBLIC_SUPABASE_URL may already be set.
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL (read from .env.local) or SUPABASE_SERVICE_ROLE_KEY (set it yourself, see the comment at the top of this file).",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "Demo1234!";

async function createDemoUser({ email, fullName, role }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email === email);
    if (existing) {
      console.log(`  ${email} already exists, reusing it.`);
      return existing.id;
    }
    throw error;
  }

  return data.user.id;
}

function sessionTimes(daysAgoCount, durationMinutes) {
  const end = new Date();
  end.setDate(end.getDate() - daysAgoCount);
  end.setHours(17, 0, 0, 0);
  const start = new Date(end.getTime() - durationMinutes * 60_000);
  return { start: start.toISOString(), end: end.toISOString(), durationSeconds: durationMinutes * 60 };
}

async function seedChildHistory({ childId, current_color, total_points, points_in_color, workouts_completed_in_color, total_workouts_completed, sessions, challenges }) {
  const { error: updateError } = await supabase
    .from("children")
    .update({
      current_color,
      total_points,
      points_in_color,
      workouts_completed_in_color,
      total_workouts_completed,
      code_shown_at: new Date().toISOString(),
    })
    .eq("id", childId);
  if (updateError) throw updateError;

  for (const s of sessions) {
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .insert({
        child_id: childId,
        workout_id: s.workoutId,
        status: "completed",
        start_time: s.start,
        end_time: s.end,
        actual_duration_seconds: s.durationSeconds,
      })
      .select("id")
      .single();
    if (sessionError) throw sessionError;

    const { error: resultError } = await supabase.from("workout_results").insert({
      session_id: session.id,
      activity_reported: s.activity,
      duration_reported_minutes: Math.round(s.durationSeconds / 60),
      difficulty_reported: s.difficulty,
      trained_longer: s.trainedLonger,
      parent_trained_together: s.parentTogether,
      feeling_after: s.feeling,
    });
    if (resultError) throw resultError;

    if (s.transactions.length > 0) {
      const { error: txError } = await supabase.from("points_transactions").insert(
        s.transactions.map((tx) => ({
          child_id: childId,
          session_id: session.id,
          points: tx.points,
          reason: tx.reason,
        })),
      );
      if (txError) throw txError;
    }
  }

  for (const challengeId of challenges) {
    const { error: challengeError } = await supabase
      .from("child_challenges")
      .upsert(
        { child_id: childId, challenge_id: challengeId, completed_at: new Date().toISOString() },
        { onConflict: "child_id,challenge_id" },
      );
    if (challengeError) throw challengeError;
  }
}

async function main() {
  console.log("Creating demo parents...");
  const parent1Id = await createDemoUser({ email: "parent1@qunity-demo.test", fullName: "רות לוי", role: "parent" });
  const parent2Id = await createDemoUser({ email: "parent2@qunity-demo.test", fullName: "דני כהן", role: "parent" });

  console.log("Creating demo children...");
  const child1Id = await createDemoUser({ email: "child1@qunity-demo.test", fullName: "נועה", role: "child" });
  const child2Id = await createDemoUser({ email: "child2@qunity-demo.test", fullName: "איתי", role: "child" });
  const child3Id = await createDemoUser({ email: "child3@qunity-demo.test", fullName: "מיה", role: "child" });
  const child4Id = await createDemoUser({ email: "child4@qunity-demo.test", fullName: "עומר", role: "child" });

  console.log("Linking parents to children...");
  const { error: linkError } = await supabase.from("parent_child_links").upsert(
    [
      { parent_id: parent1Id, child_id: child1Id },
      { parent_id: parent1Id, child_id: child2Id },
      { parent_id: parent2Id, child_id: child3Id },
      { parent_id: parent2Id, child_id: child4Id },
    ],
    { onConflict: "parent_id,child_id" },
  );
  if (linkError) throw linkError;
  await supabase.from("children").update({ child_code_used: true }).in("id", [child1Id, child2Id, child3Id, child4Id]);

  const { data: whiteWorkouts } = await supabase
    .from("workouts")
    .select("id")
    .eq("color", "white")
    .order("order_in_color")
    .limit(1);
  const { data: orangeWorkouts } = await supabase
    .from("workouts")
    .select("id")
    .eq("color", "orange")
    .order("order_in_color")
    .limit(1);
  const whiteWorkoutId = whiteWorkouts?.[0]?.id;
  const orangeWorkoutId = orangeWorkouts?.[0]?.id;

  console.log("Seeding נועה (white, just starting)...");
  await seedChildHistory({
    childId: child1Id,
    current_color: "white",
    total_points: 20,
    points_in_color: 20,
    workouts_completed_in_color: 1,
    total_workouts_completed: 1,
    sessions: [
      {
        ...sessionTimes(2, 12),
        workoutId: whiteWorkoutId,
        activity: "קפיצות במקום",
        difficulty: 2,
        trainedLonger: false,
        parentTogether: false,
        feeling: "great",
        transactions: [{ points: 20, reason: "base_workout" }],
      },
    ],
    challenges: [],
  });

  console.log("Seeding איתי (white, mid-progress, 1 challenge unlocked)...");
  await seedChildHistory({
    childId: child2Id,
    current_color: "white",
    total_points: 140,
    points_in_color: 140,
    workouts_completed_in_color: 6,
    total_workouts_completed: 6,
    sessions: [
      {
        ...sessionTimes(13, 10),
        workoutId: whiteWorkoutId,
        activity: "קפיצות במקום",
        difficulty: 1,
        trainedLonger: false,
        parentTogether: false,
        feeling: "great",
        transactions: [
          { points: 20, reason: "base_workout" },
          { points: 10, reason: "first_in_color" },
        ],
      },
      {
        ...sessionTimes(11, 15),
        workoutId: whiteWorkoutId,
        activity: "ריצה קלה בחצר",
        difficulty: 2,
        trainedLonger: false,
        parentTogether: false,
        feeling: "ok",
        transactions: [{ points: 20, reason: "base_workout" }],
      },
      {
        ...sessionTimes(9, 15),
        workoutId: whiteWorkoutId,
        activity: "קפיצות במקום",
        difficulty: 2,
        trainedLonger: false,
        parentTogether: false,
        feeling: "great",
        transactions: [{ points: 20, reason: "base_workout" }],
      },
      {
        ...sessionTimes(7, 20),
        workoutId: whiteWorkoutId,
        activity: "ריצה קלה בחצר",
        difficulty: 2,
        trainedLonger: true,
        parentTogether: true,
        feeling: "great",
        transactions: [
          { points: 20, reason: "base_workout" },
          { points: 10, reason: "parent_together" },
        ],
      },
      {
        ...sessionTimes(4, 15),
        workoutId: whiteWorkoutId,
        activity: "קפיצות במקום",
        difficulty: 3,
        trainedLonger: false,
        parentTogether: false,
        feeling: "hard",
        transactions: [{ points: 20, reason: "base_workout" }],
      },
      {
        ...sessionTimes(1, 15),
        workoutId: whiteWorkoutId,
        activity: "ריצה קלה בחצר",
        difficulty: 2,
        trainedLonger: false,
        parentTogether: false,
        feeling: "ok",
        transactions: [{ points: 20, reason: "base_workout" }],
      },
    ],
    challenges: ["first_workout"],
  });

  console.log("Seeding מיה (already leveled up to orange, 3 challenges)...");
  const whiteSessionsForMia = [40, 38, 36, 34, 32, 30, 28, 26, 24, 22].map((d, i) => ({
    ...sessionTimes(d, 15),
    workoutId: whiteWorkoutId,
    activity: i % 2 === 0 ? "קפיצות במקום" : "ריצה קלה בחצר",
    difficulty: i === 5 ? 3 : 2,
    trainedLonger: false,
    parentTogether: i === 3,
    feeling: "great",
    transactions:
      i === 0
        ? [{ points: 20, reason: "base_workout" }, { points: 10, reason: "first_in_color" }]
        : i === 3
          ? [{ points: 20, reason: "base_workout" }, { points: 10, reason: "parent_together" }]
          : i === 5
            ? [{ points: 20, reason: "base_workout" }, { points: 5, reason: "harder_than_recommended" }]
            : [{ points: 20, reason: "base_workout" }],
  }));
  const orangeSessionsForMia = [6, 2].map((d, i) => ({
    ...sessionTimes(d, 20),
    workoutId: orangeWorkoutId,
    activity: "מסלול מכשולים ביתי",
    difficulty: 2,
    trainedLonger: false,
    parentTogether: false,
    feeling: "great",
    transactions:
      i === 0
        ? [{ points: 20, reason: "base_workout" }, { points: 10, reason: "first_in_color" }]
        : [{ points: 20, reason: "base_workout" }],
  }));
  await seedChildHistory({
    childId: child3Id,
    current_color: "orange",
    total_points: 265,
    points_in_color: 50,
    workouts_completed_in_color: 2,
    total_workouts_completed: 12,
    sessions: [...whiteSessionsForMia, ...orangeSessionsForMia],
    challenges: ["first_workout", "color_starter", "color_finisher"],
  });

  console.log("Seeding עומר (gap scenario — triggers a real tip, no manual override needed)...");
  await seedChildHistory({
    childId: child4Id,
    current_color: "white",
    total_points: 80,
    points_in_color: 80,
    workouts_completed_in_color: 4,
    total_workouts_completed: 4,
    sessions: [15, 13, 11, 9].map((d) => ({
      ...sessionTimes(d, 15),
      workoutId: whiteWorkoutId,
      activity: "קפיצות במקום",
      difficulty: 2,
      trainedLonger: false,
      parentTogether: false,
      feeling: "ok",
      transactions: [{ points: 20, reason: "base_workout" }],
    })),
    challenges: [],
  });

  console.log("\nDone. Demo accounts (all use the same password):");
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log("  parent1@qunity-demo.test  (רות לוי — linked to נועה + איתי)");
  console.log("  parent2@qunity-demo.test  (דני כהן — linked to מיה + עומר)");
  console.log("  child1@qunity-demo.test   (נועה — white, 1 workout)");
  console.log("  child2@qunity-demo.test   (איתי — white, 6 workouts, 140 pts)");
  console.log("  child3@qunity-demo.test   (מיה — orange, already leveled up)");
  console.log("  child4@qunity-demo.test   (עומר — white, no workout in 9 days -> real tip)");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
