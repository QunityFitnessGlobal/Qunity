// Copies the app's content — stages, exercises, workouts and their exercise
// order, challenges, parent tips — from the old Supabase project to a new one,
// exactly as it is today (including anything edited by hand in Supabase).
// User data (accounts, children, workouts done, points) is NOT copied.
//
// Run AFTER supabase/fresh-install.sql has been run in the new project.
//
// Needs four values, read from .env.migration (git-ignored, like every .env
// file in this repo) so the keys never appear on the command line:
//   OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_ROLE_KEY   (the Tokyo project)
//   NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_ROLE_KEY   (the Frankfurt project)
// The service-role / secret keys are under Project Settings -> API Keys.
//
// Usage:
//   node --env-file=.env.migration scripts/copy-reference-data.mjs --check   (counts only, writes nothing)
//   node --env-file=.env.migration scripts/copy-reference-data.mjs           (copy)
//
// Safe to run again: rows are upserted by their primary key.

import { createClient } from "@supabase/supabase-js";

// In foreign-key order: stages first (workouts and challenges point at them),
// then exercises and workouts, then the order of exercises in each workout.
const TABLES = [
  { name: "bracelet_levels", key: "color" },
  { name: "exercises", key: "id" },
  { name: "workouts", key: "id" },
  { name: "workout_exercises", key: "id" },
  { name: "challenges", key: "id" },
  { name: "parent_tip_rules", key: "id" },
];
const PAGE = 1000;

function client(prefix) {
  const url = process.env[`${prefix}_SUPABASE_URL`];
  const key = process.env[`${prefix}_SUPABASE_SERVICE_ROLE_KEY`];
  if (!url || !key) {
    console.error(`Missing ${prefix}_SUPABASE_URL or ${prefix}_SUPABASE_SERVICE_ROLE_KEY in .env.migration.`);
    process.exit(1);
  }
  return { host: new URL(url).host, db: createClient(url, key, { auth: { persistSession: false } }) };
}

async function readAll(db, table, key) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select("*").order(key).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

async function count(db, table) {
  const { count: n, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return n ?? 0;
}

const checkOnly = process.argv.includes("--check");
const oldP = client("OLD");
const newP = client("NEW");
if (oldP.host === newP.host) {
  console.error("OLD and NEW point at the same project — nothing to copy.");
  process.exit(1);
}

console.log(`From ${oldP.host}  ->  to ${newP.host}${checkOnly ? "  (check only)" : ""}\n`);

let failed = false;
for (const { name, key } of TABLES) {
  try {
    const rows = await readAll(oldP.db, name, key);
    if (!checkOnly && rows.length > 0) {
      for (let i = 0; i < rows.length; i += PAGE) {
        const { error } = await newP.db.from(name).upsert(rows.slice(i, i + PAGE), { onConflict: key });
        if (error) throw new Error(`${name}: ${error.message}`);
      }
    }
    const inNew = await count(newP.db, name);
    const ok = checkOnly || inNew === rows.length;
    if (!ok) failed = true;
    console.log(`${ok ? "✓" : "✗"} ${name.padEnd(18)} old: ${String(rows.length).padStart(4)}   new: ${String(inNew).padStart(4)}`);
  } catch (err) {
    failed = true;
    console.log(`✗ ${name.padEnd(18)} ${err.message}`);
  }
}

console.log(failed ? "\nSomething didn't match — see the ✗ lines above." : `\n${checkOnly ? "Check done." : "All content copied."}`);
process.exit(failed ? 1 : 0);
