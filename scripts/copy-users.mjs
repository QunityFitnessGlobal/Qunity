// Copies every user from the old Supabase project to the new one — the
// sign-in account with the SAME id, email and password (its encrypted hash,
// so nobody ever sees a password), then all their data: profiles, children
// and links, the children's hidden accounts, workouts and their answers,
// points, challenges and the tips shown to parents.
//
// Before running: supabase/migrations/export_auth_users.sql in the OLD
// project (it lets this script read the encrypted passwords). Run
// scripts/copy-reference-data.mjs first, since workouts, challenges and tips
// that users' data points at must already exist in the new project.
//
// Reads OLD_/NEW_ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
// git-ignored .env.migration, like copy-reference-data.mjs.
//
// Usage:
//   node --env-file=.env.migration scripts/copy-users.mjs --check   (counts only, writes nothing)
//   node --env-file=.env.migration scripts/copy-users.mjs           (copy)
//
// Safe to run again: accounts that already exist are skipped and data rows
// are upserted by their primary key.

import { createClient } from "@supabase/supabase-js";

// In foreign-key order. The new project's sign-up trigger creates a fresh
// users/parents/children row for each account; upserting the old rows over
// them restores the real values (child code, points, stage, PIN...).
const TABLES = [
  { name: "users", key: "id" },
  { name: "parents", key: "id" },
  { name: "children", key: "id" },
  { name: "parent_child_links", key: "id" },
  { name: "child_credentials", key: "child_id" },
  { name: "workout_sessions", key: "id" },
  { name: "workout_results", key: "id" },
  { name: "points_transactions", key: "id" },
  { name: "child_challenges", key: "id" },
  { name: "challenge_sessions", key: "id" },
  { name: "parent_tips", key: "id" },
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

async function existingAccountIds(db) {
  const ids = new Set();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listing new accounts: ${error.message}`);
    data.users.forEach((u) => ids.add(u.id));
    if (data.users.length < 1000) return ids;
  }
}

const checkOnly = process.argv.includes("--check");
const oldP = client("OLD");
const newP = client("NEW");
if (oldP.host === newP.host) {
  console.error("OLD and NEW point at the same project — nothing to copy.");
  process.exit(1);
}
console.log(`From ${oldP.host}  ->  to ${newP.host}${checkOnly ? "  (check only)" : ""}\n`);

// 1. Sign-in accounts.
const { data: accounts, error: exportError } = await oldP.db.rpc("export_auth_users");
if (exportError) {
  console.error(`Can't read the old accounts: ${exportError.message}`);
  console.error("Run supabase/migrations/export_auth_users.sql in the OLD project first.");
  process.exit(1);
}
const already = await existingAccountIds(newP.db);
let created = 0;
let failed = false;
for (const account of accounts) {
  if (already.has(account.id)) continue;
  if (checkOnly) {
    created++;
    continue;
  }
  const { error } = await newP.db.auth.admin.createUser({
    id: account.id,
    email: account.email,
    password_hash: account.encrypted_password,
    email_confirm: true,
    user_metadata: account.raw_user_meta_data ?? {},
  });
  if (error) {
    failed = true;
    console.log(`✗ account ${account.id.slice(0, 8)}…  ${error.message}`);
  } else {
    created++;
  }
}
console.log(
  `${failed ? "✗" : "✓"} accounts           old: ${String(accounts.length).padStart(4)}   ${checkOnly ? "to create" : "created"}: ${created}   already there: ${accounts.filter((a) => already.has(a.id)).length}`,
);

// 2. Their data.
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
    const ok = checkOnly || inNew >= rows.length;
    if (!ok) failed = true;
    console.log(`${ok ? "✓" : "✗"} ${name.padEnd(18)} old: ${String(rows.length).padStart(4)}   new: ${String(inNew).padStart(4)}`);
  } catch (err) {
    failed = true;
    console.log(`✗ ${name.padEnd(18)} ${err.message}`);
  }
}

console.log(
  failed
    ? "\nSomething didn't copy — see the ✗ lines above."
    : `\n${checkOnly ? "Check done." : "All users and their data copied. Remove export_auth_users() from the old project."}`,
);
process.exit(failed ? 1 : 0);
