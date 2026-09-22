// One-time update: refreshes public.exercises.description_he from
// אימונים/Qunity_Exercise_Bank_50.xlsx (single sheet "בנק תרגילים"), and
// updates name_he for the 6 exercises that were renamed in that file (the
// "hero push-up" family + the army-crawl rename — see RENAMED_IDS below).
//
// Matching: 44 of 50 rows match an existing exercise by exact name_he;
// the other 6 changed name in the new file and are matched by id via the
// explicit map below (verified by hand against each row's description —
// see the conversation this script was built in for the reasoning).
//
// Usage (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key from Project Settings -> API>"
//   node scripts/update-exercise-descriptions.mjs
//
// Usage (bash):
//   SUPABASE_SERVICE_ROLE_KEY="<...>" node scripts/update-exercise-descriptions.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import XLSX from "xlsx";

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
const filePath = "אימונים/Qunity_Exercise_Bank_50.xlsx";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL (read from .env.local) or SUPABASE_SERVICE_ROLE_KEY (set it yourself, see the comment at the top of this file).",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Row number (in the sheet) -> exercise id, for the 6 rows whose name
// changed in the new file (matched by hand against description content).
const RENAMED_ROW_TO_ID = {
  13: "PU03",
  23: "PU05",
  34: "PU08",
  39: "MV07",
  43: "PU09",
  47: "BE09",
};

async function main() {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets["בנק תרגילים"];
  if (!sheet) {
    console.error('Sheet "בנק תרגילים" not found.');
    process.exit(1);
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const { data: dbRows, error: readError } = await supabase.from("exercises").select("id, name_he");
  if (readError) {
    console.error("Failed to read exercises:", readError.message);
    process.exit(1);
  }
  const idByName = new Map(dbRows.map((r) => [r.name_he.trim(), r.id]));

  const errors = [];
  const updates = [];
  const seenIds = new Set();

  rows.forEach((row, i) => {
    const rowNum = row["מספר התרגיל"];
    const context = `row ${i + 2} (מספר התרגיל ${rowNum})`;
    const name = nonEmpty(row["שם התרגיל"]);
    const description = nonEmpty(row["תיאור"]);

    if (!name) errors.push(`${context}: missing שם התרגיל`);
    if (!description) errors.push(`${context}: missing תיאור`);

    const renameTargetId = RENAMED_ROW_TO_ID[rowNum];
    const id = renameTargetId ?? idByName.get(name);

    if (!id) {
      errors.push(`${context}: no matching exercise found for name "${name}"`);
      return;
    }
    if (seenIds.has(id)) {
      errors.push(`${context}: exercise id "${id}" already matched by an earlier row`);
      return;
    }
    seenIds.add(id);

    updates.push({
      id,
      description_he: description,
      ...(renameTargetId ? { name_he: name } : {}),
    });
  });

  if (seenIds.size !== dbRows.length) {
    errors.push(`Matched ${seenIds.size} of ${dbRows.length} existing exercises — expected all of them.`);
  }

  if (errors.length > 0) {
    console.error(`\nAborting — ${errors.length} validation error(s), nothing was written:\n`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`Validated ${updates.length} exercises (of which ${Object.keys(RENAMED_ROW_TO_ID).length} also get a new name). Writing...`);

  for (const update of updates) {
    const { error } = await supabase.from("exercises").update(update).eq("id", update.id);
    if (error) {
      console.error(`  ✗ ${update.id}: ${error.message}`);
      process.exit(1);
    }
  }

  console.log(`\nDone. Updated ${updates.length} exercises.`);
}

function nonEmpty(value) {
  return String(value ?? "").trim();
}

main().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
