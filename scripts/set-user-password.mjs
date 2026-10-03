// Sets a new password for one existing user, chosen by email.
//
// For a child who also has a hidden account (child_credentials — what
// "מצב ילד" and device pairing sign in with), the stored password is updated
// to the same value, so child mode keeps working after the change.
//
// The password is typed into the terminal (hidden, asked twice) rather than
// passed on the command line, so it doesn't end up in the shell's history.
//
// Usage, from the Qunity folder (uses the project in .env.local):
//   node --env-file=.env.local scripts/set-user-password.mjs <email>

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline";

const MIN_LENGTH = 6;

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Echo nothing while the password is typed.
      rl._writeToOutput = (text) => {
        if (text.includes(question)) rl.output.write(text);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

async function findUserByEmail(db, email) {
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Couldn't list users: ${error.message}`);
    const match = data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (match || data.users.length < 1000) return match ?? null;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — run with --env-file=.env.local from the Qunity folder.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const email = process.argv[2] ?? (await ask("Email: "));
const user = await findUserByEmail(db, email);
if (!user) {
  console.error(`No user with the email ${email} in ${new URL(url).host}. Check the spelling.`);
  process.exit(1);
}

const { data: profile } = await db.from("users").select("role, full_name").eq("id", user.id).maybeSingle();
console.log(`Found: ${profile?.full_name ?? "(no name)"} · ${profile?.role ?? "unknown role"} · ${new URL(url).host}`);

const password = await ask("New password: ", { hidden: true });
if (password.length < MIN_LENGTH) {
  console.error(`The password needs at least ${MIN_LENGTH} characters. Nothing was changed.`);
  process.exit(1);
}
const again = await ask("Same password again: ", { hidden: true });
if (again !== password) {
  console.error("The two passwords don't match. Nothing was changed.");
  process.exit(1);
}

const { error: updateError } = await db.auth.admin.updateUserById(user.id, { password });
if (updateError) {
  console.error(`Couldn't set the password: ${updateError.message}`);
  process.exit(1);
}
console.log("✓ Password changed.");

const { data: creds } = await db.from("child_credentials").select("child_id").eq("child_id", user.id).maybeSingle();
if (creds) {
  const { error: credError } = await db
    .from("child_credentials")
    .update({ hidden_password: password })
    .eq("child_id", user.id);
  if (credError) {
    console.error(`✗ The hidden account wasn't updated, so child mode may stop working: ${credError.message}`);
    process.exit(1);
  }
  console.log("✓ Child mode updated to match.");
}
