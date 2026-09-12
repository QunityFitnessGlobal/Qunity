// One-time backfill: gives every EXISTING child (created via the old
// self-serve /signup flow, before parent/child mode switching existed) a
// hidden-credentials row so "מצב ילד" works for them too — not just children
// created via the new createChildProfile flow.
//
// For each child with no child_credentials row yet: looks up their real
// existing auth email, resets their password to a new random one (via the
// admin API — the child never used that password themselves in practice),
// and stores {email, new password} in child_credentials, exactly like a
// freshly-created child profile. Safe to re-run: already-backfilled
// children are skipped.
//
// Usage (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key from Project Settings -> API>"
//   node scripts/backfill-child-credentials.mjs
//
// Usage (bash):
//   SUPABASE_SERVICE_ROLE_KEY="<...>" node scripts/backfill-child-credentials.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

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

async function main() {
  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id, nickname");
  if (childrenError) {
    console.error("Failed to read children:", childrenError.message);
    process.exit(1);
  }

  const { data: existingCreds, error: credsError } = await supabase
    .from("child_credentials")
    .select("child_id");
  if (credsError) {
    console.error("Failed to read child_credentials:", credsError.message);
    process.exit(1);
  }

  const alreadyProvisioned = new Set(existingCreds.map((c) => c.child_id));
  const toBackfill = children.filter((c) => !alreadyProvisioned.has(c.id));

  console.log(`${children.length} children total, ${toBackfill.length} need backfilling.`);

  let succeeded = 0;
  for (const child of toBackfill) {
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(child.id);
    if (getUserError || !authUser.user?.email) {
      console.error(`  ✗ ${child.nickname} (${child.id}): could not read auth email — ${getUserError?.message ?? "no email"}`);
      continue;
    }

    const newPassword = randomBytes(24).toString("base64url");
    const { error: updateError } = await supabase.auth.admin.updateUserById(child.id, {
      password: newPassword,
    });
    if (updateError) {
      console.error(`  ✗ ${child.nickname} (${child.id}): password reset failed — ${updateError.message}`);
      continue;
    }

    const { error: insertError } = await supabase
      .from("child_credentials")
      .insert({ child_id: child.id, hidden_email: authUser.user.email, hidden_password: newPassword });
    if (insertError) {
      console.error(`  ✗ ${child.nickname} (${child.id}): storing credentials failed — ${insertError.message}`);
      continue;
    }

    console.log(`  ✓ ${child.nickname} (${child.id})`);
    succeeded += 1;
  }

  console.log(`\nDone. Backfilled ${succeeded} of ${toBackfill.length}.`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
