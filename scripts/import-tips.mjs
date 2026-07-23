// Upserts an edited tips spreadsheet (see scripts/export-tips.mjs) back into
// public.parent_tip_rules. Same validate-everything-before-writing-anything
// pattern as import-workouts.mjs.
//
// Usage (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key from Project Settings -> API>"
//   node scripts/import-tips.mjs path/to/tips-export.xlsx
//
// Usage (bash):
//   SUPABASE_SERVICE_ROLE_KEY="<...>" node scripts/import-tips.mjs path/to/tips-export.xlsx
//
// Only touches principle, condition_type, trigger_source, priority, tip_text
// — never condition_params, like_count, or created_at, so this can't clobber
// live engagement data or the (code-bound) condition parameters.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import XLSX from "xlsx";

// Keep in sync by hand with src/services/tip-conditions/index.ts's
// TIP_CONDITION_REGISTRY keys, plus "manual_selection" (no registry entry
// on purpose — see that file's comment).
const VALID_CONDITION_TYPES = new Set([
  "no_workout_3_days",
  "no_workout_7_days",
  "high_difficulty_reported",
  "negative_feeling_streak",
  "low_parent_participation",
  "zero_parent_participation",
  "difficulty_plateau",
  "high_total_effort_reminder",
  "low_challenge_unlock_rate",
  "consistent_monthly_activity",
  "abandoned_session",
  "two_consecutive_hard_difficulty",
  "improvement_between_workouts",
  "consecutive_day_streak",
  "comeback_after_break",
  "shorter_than_average_workout",
  "weekly_summary",
  "difficulty_high_last_session",
  "difficulty_very_hard_last_session",
  "feeling_frustrated_last_session",
  "feeling_positive_last_session",
  "difficulty_high_and_positive_feeling",
  "feeling_tired_last_session",
  "feeling_exhausted_last_session",
  "manual_selection",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node scripts/import-tips.mjs path/to/tips-export.xlsx");
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL (read from .env.local) or SUPABASE_SERVICE_ROLE_KEY (set it yourself, see the comment at the top of this file).",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function nonEmpty(value) {
  return String(value ?? "").trim();
}

function bracesBalanced(text) {
  let depth = 0;
  for (const ch of text) {
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

async function main() {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets["tips"];
  if (!sheet) {
    console.error('Sheet "tips" not found in the workbook.');
    process.exit(1);
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const errors = [];
  const seenIds = new Set();
  const updates = [];
  const inserts = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2;
    const id = nonEmpty(row.id);
    const principleHe = nonEmpty(row.principle_he);
    const principleEn = nonEmpty(row.principle_en);
    const conditionType = nonEmpty(row.condition_type);
    const priority = Number(row.priority);
    const tipTextHe = nonEmpty(row.tip_text_he);
    const tipTextEn = nonEmpty(row.tip_text_en);

    if (id && !UUID_RE.test(id)) errors.push(`row ${rowNum}: id "${id}" is not a valid uuid — leave blank for a new tip`);
    if (id && seenIds.has(id)) errors.push(`row ${rowNum}: duplicate id "${id}"`);
    if (id) seenIds.add(id);

    if (!principleHe) errors.push(`row ${rowNum}: missing principle_he`);
    if (!principleEn) errors.push(`row ${rowNum}: missing principle_en`);
    if (!conditionType) errors.push(`row ${rowNum}: missing condition_type`);
    if (conditionType && !VALID_CONDITION_TYPES.has(conditionType)) {
      errors.push(`row ${rowNum}: unknown condition_type "${conditionType}" — see the condition_types_reference sheet`);
    }
    if (!Number.isInteger(priority)) errors.push(`row ${rowNum}: priority "${row.priority}" is not an integer`);
    if (!tipTextHe) errors.push(`row ${rowNum}: missing tip_text_he`);
    if (!tipTextEn) errors.push(`row ${rowNum}: missing tip_text_en`);
    if (tipTextHe && !bracesBalanced(tipTextHe)) errors.push(`row ${rowNum}: tip_text_he has unbalanced { } braces`);
    if (tipTextEn && !bracesBalanced(tipTextEn)) errors.push(`row ${rowNum}: tip_text_en has unbalanced { } braces`);

    const record = {
      principle: { he: principleHe, en: principleEn },
      condition_type: conditionType,
      priority: Number.isInteger(priority) ? priority : 0,
      tip_text: { he: tipTextHe, en: tipTextEn },
    };

    if (id) {
      updates.push({ id, ...record });
    } else {
      inserts.push(record);
    }
  });

  if (errors.length > 0) {
    console.error(`\nAborting — ${errors.length} validation error(s), nothing was written:\n`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`Validated ${updates.length} update(s) and ${inserts.length} new tip(s). Writing...`);

  if (updates.length > 0) {
    const { error: updateError } = await supabase.from("parent_tip_rules").upsert(updates, { onConflict: "id" });
    if (updateError) {
      console.error("Updating existing tips failed:", updateError.message);
      process.exit(1);
    }
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from("parent_tip_rules").insert(inserts);
    if (insertError) {
      console.error("Inserting new tips failed:", insertError.message);
      process.exit(1);
    }
  }

  console.log(`\nDone. Updated ${updates.length} tip(s), inserted ${inserts.length} new tip(s).`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
