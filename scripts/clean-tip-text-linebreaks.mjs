// One-time content cleanup: strips stray \r\n / \r line breaks out of
// parent_tip_rules.tip_text (Windows-style line breaks, almost certainly
// pasted in from Word when this content was authored). Left as-is, a
// polluted tip can render wide enough to overflow the viewport on some
// Android Chrome builds, and — combined with the continuously-running
// glow-pulse animation on the dashboard (MinimalAvatar/EnergyMeter) —
// that overflow gets re-corrected every animation frame, which looks like
// the whole screen jittering in a loop for as long as that tip is shown.
//
// Collapses \r\n and bare \r into a single space, then collapses any
// resulting double spaces, matching the single-line style every other
// (unpolluted) tip already uses. Safe to re-run — rows with no \r are
// left untouched.
//
// Usage (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key from Project Settings -> API>"
//   node scripts/clean-tip-text-linebreaks.mjs
//
// Usage (bash):
//   SUPABASE_SERVICE_ROLE_KEY="<...>" node scripts/clean-tip-text-linebreaks.mjs

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

function clean(text) {
  return text.replace(/\r\n?/g, " ").replace(/ {2,}/g, " ").trim();
}

async function main() {
  const { data: rules, error } = await supabase.from("parent_tip_rules").select("id, principle, tip_text");
  if (error) {
    console.error("Failed to read parent_tip_rules:", error.message);
    process.exit(1);
  }

  const toFix = rules
    .map((r) => {
      const he = r.tip_text?.he ?? "";
      const en = r.tip_text?.en ?? "";
      if (!he.includes("\r") && !en.includes("\r")) return null;
      return {
        id: r.id,
        principle: r.principle?.he ?? r.id,
        tip_text: { ...r.tip_text, he: clean(he), en: clean(en) },
      };
    })
    .filter(Boolean);

  console.log(`${rules.length} tips total, ${toFix.length} need cleaning.`);

  let succeeded = 0;
  for (const row of toFix) {
    const { error: updateError } = await supabase
      .from("parent_tip_rules")
      .update({ tip_text: row.tip_text })
      .eq("id", row.id);
    if (updateError) {
      console.error(`  ✗ ${row.principle} (${row.id}): ${updateError.message}`);
      continue;
    }
    console.log(`  ✓ ${row.principle} (${row.id})`);
    succeeded += 1;
  }

  console.log(`\nDone. Cleaned ${succeeded} of ${toFix.length}.`);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
