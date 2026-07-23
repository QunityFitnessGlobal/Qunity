// Exports public.parent_tip_rules into an .xlsx file for offline editing
// (wording, principle, priority, trigger_source) — pairs with
// scripts/import-tips.mjs, which upserts the edited file back. Same
// spreadsheet-authoring pattern as import-workouts.mjs.
//
// Usage (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key from Project Settings -> API>"
//   node scripts/export-tips.mjs [output-path.xlsx]
//
// Usage (bash):
//   SUPABASE_SERVICE_ROLE_KEY="<...>" node scripts/export-tips.mjs [output-path.xlsx]
//
// Deliberately does NOT export condition_params or like_count: condition_params
// is logic-bound to the functions in src/services/tip-conditions/ (editing it
// blind in a spreadsheet would silently break a tip's trigger), and like_count
// is live engagement data that import-tips.mjs must never overwrite.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
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
const outputPath = process.argv[2] ?? "tips-export.xlsx";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL (read from .env.local) or SUPABASE_SERVICE_ROLE_KEY (set it yourself, see the comment at the top of this file).",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Kept in sync by hand with src/services/tip-conditions/index.ts's
// TIP_CONDITION_REGISTRY keys (plus "manual_selection", which has no
// registry entry on purpose — see that file's comment). Only used to build
// the human-readable reference sheet below; not read back by import-tips.mjs.
const CONDITION_TYPE_DESCRIPTIONS = {
  no_workout_3_days: "לא התאמן 3 ימים ברצף",
  no_workout_7_days: "לא התאמן 7 ימים ברצף (הפסקה ארוכה)",
  high_difficulty_reported: "דיווח על קושי גבוה באימון",
  negative_feeling_streak: "רצף של הרגשות שליליות אחרי אימונים",
  low_parent_participation: "אחוז נמוך של אימונים משותפים עם הורה",
  zero_parent_participation: "ההורה מעולם לא התאמן איתו",
  difficulty_plateau: "רמת הקושי נשארת שטוחה (אין התקדמות)",
  high_total_effort_reminder: "אבן דרך של סך אימונים גבוה",
  low_challenge_unlock_rate: "אחוז נמוך של אתגרים שנפתחו",
  consistent_monthly_activity: "פעילות עקבית לאורך החודש",
  abandoned_session: "אימון שהתחיל ולא הושלם",
  two_consecutive_hard_difficulty: "שני אימונים ברצף שדווחו כקשים",
  improvement_between_workouts: "שיפור בין אימון לאימון",
  consecutive_day_streak: "רצף ימי אימון",
  comeback_after_break: "חזרה לאימונים אחרי הפסקה",
  shorter_than_average_workout: "אימון קצר מהממוצע",
  weekly_summary: "סיכום שבועי",
  difficulty_high_last_session: "קושי גבוה באימון האחרון",
  difficulty_very_hard_last_session: "קושי גבוה מאוד באימון האחרון",
  feeling_frustrated_last_session: "הרגשת תסכול באימון האחרון",
  feeling_positive_last_session: "הרגשה חיובית באימון האחרון",
  difficulty_high_and_positive_feeling: "קושי גבוה + הרגשה חיובית יחד",
  feeling_tired_last_session: "הרגשת עייפות באימון האחרון",
  feeling_exhausted_last_session: "הרגשת תשישות באימון האחרון",
  manual_selection: 'לא אוטומטי — מוצג רק דרך תפריט "מה קורה עכשיו"',
};

async function main() {
  const { data: rows, error } = await supabase
    .from("parent_tip_rules")
    .select("id, principle, condition_type, priority, tip_text, like_count")
    .order("principle->>he", { ascending: true })
    .order("priority", { ascending: false });

  if (error) {
    console.error("Failed to read parent_tip_rules:", error.message);
    process.exit(1);
  }

  const tipsSheetRows = (rows ?? []).map((row) => ({
    id: row.id,
    principle_he: row.principle?.he ?? "",
    principle_en: row.principle?.en ?? "",
    condition_type: row.condition_type ?? "",
    priority: row.priority,
    tip_text_he: row.tip_text?.he ?? "",
    tip_text_en: row.tip_text?.en ?? "",
    like_count_readonly: row.like_count,
  }));

  const referenceSheetRows = Object.entries(CONDITION_TYPE_DESCRIPTIONS).map(([condition_type, description_he]) => ({
    condition_type,
    description_he,
    tips_using_it: tipsSheetRows.filter((r) => r.condition_type === condition_type).length,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(tipsSheetRows), "tips");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(referenceSheetRows), "condition_types_reference");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  writeFileSync(outputPath, buffer);

  console.log(`Exported ${tipsSheetRows.length} tips to ${outputPath}`);
  console.log(
    "\nEditing guide:\n" +
      "  - Safe to edit: principle_he, principle_en, tip_text_he, tip_text_en, priority.\n" +
      "  - To add a NEW tip: leave id blank, and set condition_type to one of the values on the\n" +
      "    condition_types_reference sheet (or 'manual_selection').\n" +
      "  - Do NOT edit condition_type on an existing row unless you mean to move that tip to a\n" +
      "    different trigger — the logic behind each condition_type lives in code, not in this file.\n" +
      "  - like_count_readonly is informational only and is ignored on import.\n" +
      "  - tip_text_he sometimes uses ICU gender syntax like\n" +
      '    "{gender, select, male {...} female {...} other {...}}" — keep the curly braces balanced.\n' +
      "\nWhen ready: node scripts/import-tips.mjs " + outputPath,
  );
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
