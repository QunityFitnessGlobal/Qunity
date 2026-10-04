// Loads reviewed tip wordings into parent_tip_rules — the Hebrew text only,
// for the rows of a review spreadsheet marked "מעודכן", matched by id.
// Nothing else on a row changes (English text, principle, condition,
// priority, like count).
//
// Before writing anything it checks every new text renders cleanly for a
// boy and a girl, read by a father and by a mother (ICU {gender} and
// {parentGender}), and that every id exists.
//
// Usage, from the Qunity folder (uses the project in .env.local):
//   node --env-file=.env.local scripts/apply-tip-review.mjs <review.xlsx> --check   (checks only)
//   node --env-file=.env.local scripts/apply-tip-review.mjs <review.xlsx>
//
// The review file comes with the current texts too ("טקסט נוכחי"), so the
// same file can put them back if ever needed.

import { createClient } from "@supabase/supabase-js";
import { IntlMessageFormat } from "intl-messageformat";
import XLSX from "xlsx";

const SHEET = "טיפים — נוסח חדש";
const file = process.argv[2];
const checkOnly = process.argv.includes("--check");
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/apply-tip-review.mjs <review.xlsx> [--check]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — run with --env-file=.env.local.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const sheet = XLSX.readFile(file).Sheets[SHEET];
if (!sheet) {
  console.error(`No sheet named "${SHEET}" in ${file}.`);
  process.exit(1);
}
const rows = XLSX.utils.sheet_to_json(sheet).filter((r) => r["סטטוס"] === "מעודכן");

const problems = [];
for (const row of rows) {
  const text = String(row["נוסח חדש"] ?? "").trim();
  if (!row.id || !text) {
    problems.push(`row "${row["שם"]}": missing id or new text`);
    continue;
  }
  for (const gender of ["male", "female"]) {
    for (const parentGender of ["male", "female"]) {
      try {
        const out = String(new IntlMessageFormat(text, "he").format({ gender, parentGender }));
        if (/[{}]/.test(out)) problems.push(`"${row["שם"]}": leftover braces (${gender}/${parentGender})`);
      } catch (err) {
        problems.push(`"${row["שם"]}": doesn't render (${gender}/${parentGender}) — ${err.message}`);
      }
    }
  }
}

const { data: existing, error } = await db.from("parent_tip_rules").select("id, tip_text").in("id", rows.map((r) => r.id));
if (error) {
  console.error(`Couldn't read parent_tip_rules: ${error.message}`);
  process.exit(1);
}
const byId = new Map(existing.map((r) => [r.id, r]));
for (const row of rows) if (!byId.has(row.id)) problems.push(`"${row["שם"]}": id ${row.id} not found`);

console.log(`${new URL(url).host} · ${rows.length} rows to update · ${problems.length} problems`);
if (problems.length) {
  problems.forEach((p) => console.log("  ✗ " + p));
  console.log("Nothing was written.");
  process.exit(1);
}
if (checkOnly) {
  console.log("Check passed. Nothing was written (--check).");
} else {
  await apply();
}

async function apply() {
  let written = 0;
  for (const row of rows) {
    const current = byId.get(row.id).tip_text ?? {};
    const { error: updateError } = await db
      .from("parent_tip_rules")
      .update({ tip_text: { ...current, he: String(row["נוסח חדש"]).trim() } })
      .eq("id", row.id);
    if (updateError) {
      console.log(`  ✗ "${row["שם"]}": ${updateError.message}`);
    } else {
      written++;
    }
  }
  console.log(`${written} of ${rows.length} tips updated.`);
  // exitCode rather than exit(): lets open connections close on their own.
  process.exitCode = written === rows.length ? 0 : 1;
}
