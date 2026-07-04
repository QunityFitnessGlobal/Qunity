// Imports/updates workout content from the real Qunity workouts spreadsheet
// into public.workouts / public.exercises / public.workout_exercises.
//
// Usage (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key from Project Settings -> API>"
//   node scripts/import-workouts.mjs path/to/workouts.xlsx
//
// Usage (bash):
//   SUPABASE_SERVICE_ROLE_KEY="<...>" node scripts/import-workouts.mjs path/to/workouts.xlsx
//
// Requires: supabase/schema.sql's "ADDED FOR JOURNEY MAP" sections (adds
// workouts.exercise_code, plus the exercises/workout_exercises tables)
// already applied to this Supabase project.
//
// Expected sheets (matches Qunity_אימונים_קלוד_קוד.xlsx):
//   exercise_bank        one row per reusable exercise (exercise_id, name_he,
//                        name_en, pattern_he, pattern_en, description_he,
//                        difficulty_tip_he)
//   levels_overview      one row per belt color (color_id, total_duration_sec)
//   workouts_<color>     one row per workout for that belt (workout_id,
//                        workout_number, workout_name_he, slot1..slot5
//                        _exercise_id referencing exercise_bank.exercise_id)
//
// Workouts currently have no English title in the spreadsheet, so
// title.en is set equal to title.he until real translations exist —
// same placeholder approach used for title, not description (which is
// intentionally left for a future per-exercise workout detail screen
// instead of being flattened into free text here).
//
// Import is all-or-nothing: any validation error aborts before writing
// anything, so a bad spreadsheet never leaves partial state.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import XLSX from "xlsx";

const VALID_BELT_COLORS = ["white", "orange", "green", "blue", "purple"];
const SLOT_COUNT = 5;

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
  console.error("Usage: node scripts/import-workouts.mjs path/to/file.xlsx");
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

function sheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  return sheet ? XLSX.utils.sheet_to_json(sheet, { defval: "" }) : null;
}

function nonEmpty(value) {
  return String(value ?? "").trim();
}

async function main() {
  const workbook = XLSX.readFile(filePath);
  const errors = [];

  // --- exercise_bank ---
  const exerciseRows = sheetRows(workbook, "exercise_bank");
  if (!exerciseRows) errors.push('Sheet "exercise_bank" not found.');

  const exercises = [];
  const exerciseIds = new Set();
  (exerciseRows ?? []).forEach((row, i) => {
    const rowNum = i + 2;
    const id = nonEmpty(row.exercise_id);
    const nameHe = nonEmpty(row.name_he);
    const nameEn = nonEmpty(row.name_en);
    if (!id) errors.push(`exercise_bank row ${rowNum}: missing exercise_id`);
    if (!nameHe) errors.push(`exercise_bank row ${rowNum}: missing name_he`);
    if (!nameEn) errors.push(`exercise_bank row ${rowNum}: missing name_en`);
    if (id && exerciseIds.has(id)) errors.push(`exercise_bank row ${rowNum}: duplicate exercise_id "${id}"`);
    if (id) exerciseIds.add(id);

    exercises.push({
      id,
      pattern_en: nonEmpty(row.pattern_en) || null,
      pattern_he: nonEmpty(row.pattern_he) || null,
      name_he: nameHe,
      name_en: nameEn,
      description_he: nonEmpty(row.description_he) || null,
      difficulty_tip_he: nonEmpty(row.difficulty_tip_he) || null,
    });
  });

  // --- levels_overview (per-belt duration) ---
  const levelRows = sheetRows(workbook, "levels_overview");
  if (!levelRows) errors.push('Sheet "levels_overview" not found.');

  const durationSecByColor = new Map();
  (levelRows ?? []).forEach((row, i) => {
    const rowNum = i + 2;
    const color = nonEmpty(row.color_id).toLowerCase();
    const durationSec = Number(row.total_duration_sec);
    if (!VALID_BELT_COLORS.includes(color)) {
      errors.push(`levels_overview row ${rowNum}: unknown color_id "${row.color_id}"`);
    }
    if (!Number.isFinite(durationSec)) {
      errors.push(`levels_overview row ${rowNum}: total_duration_sec "${row.total_duration_sec}" is not a number`);
    }
    durationSecByColor.set(color, durationSec);
  });

  // --- bracelet_levels (live, for recommended_difficulty = belt order_index) ---
  const { data: braceletLevels, error: braceletError } = await supabase
    .from("bracelet_levels")
    .select("color, order_index");
  if (braceletError) {
    errors.push(`Failed to read bracelet_levels: ${braceletError.message}`);
  }
  const orderIndexByColor = new Map((braceletLevels ?? []).map((l) => [l.color, l.order_index]));

  // --- workouts_<color> sheets ---
  const workouts = [];
  const workoutExerciseRefs = []; // { exercise_code, slot_number, exercise_id }
  const seenWorkoutIds = new Set();

  for (const color of VALID_BELT_COLORS) {
    const sheetName = `workouts_${color}`;
    const rows = sheetRows(workbook, sheetName);
    if (!rows) {
      errors.push(`Sheet "${sheetName}" not found.`);
      continue;
    }

    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const context = `${sheetName} row ${rowNum}`;
      const workoutId = nonEmpty(row.workout_id);
      const workoutNumber = Number(row.workout_number);
      const titleHe = nonEmpty(row.workout_name_he);

      if (!workoutId) errors.push(`${context}: missing workout_id`);
      if (!Number.isInteger(workoutNumber)) errors.push(`${context}: workout_number "${row.workout_number}" is not an integer`);
      if (!titleHe) errors.push(`${context}: missing workout_name_he`);
      if (workoutId && seenWorkoutIds.has(workoutId)) errors.push(`${context}: duplicate workout_id "${workoutId}"`);
      if (workoutId) seenWorkoutIds.add(workoutId);

      const durationSec = durationSecByColor.get(color);
      const difficulty = orderIndexByColor.get(color);
      if (difficulty === undefined) {
        errors.push(`${context}: no bracelet_levels row for color "${color}" (needed for recommended_difficulty)`);
      }

      let slotsFound = 0;
      for (let slot = 1; slot <= SLOT_COUNT; slot += 1) {
        const exerciseId = nonEmpty(row[`slot${slot}_exercise_id`]);
        if (!exerciseId) continue;
        slotsFound += 1;
        if (!exerciseIds.has(exerciseId)) {
          errors.push(`${context}: slot${slot}_exercise_id "${exerciseId}" not found in exercise_bank`);
        }
        if (workoutId) {
          workoutExerciseRefs.push({ exercise_code: workoutId, slot_number: slot, exercise_id: exerciseId });
        }
      }
      if (slotsFound === 0) errors.push(`${context}: no exercises found in any slot`);

      workouts.push({
        exercise_code: workoutId,
        title: { he: titleHe, en: titleHe },
        description: null,
        recommended_duration_minutes: Number.isFinite(durationSec) ? Math.round(durationSec / 60) : null,
        recommended_difficulty: difficulty ?? null,
        color,
        order_in_color: Number.isInteger(workoutNumber) ? workoutNumber : null,
      });
    });
  }

  if (errors.length > 0) {
    console.error(`\nAborting — ${errors.length} validation error(s), nothing was written:\n`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`Validated ${exercises.length} exercises and ${workouts.length} workouts. Writing...`);

  const { error: exercisesError } = await supabase
    .from("exercises")
    .upsert(exercises, { onConflict: "id" });
  if (exercisesError) {
    console.error("Upserting exercises failed:", exercisesError.message);
    process.exit(1);
  }

  const { data: upsertedWorkouts, error: workoutsError } = await supabase
    .from("workouts")
    .upsert(workouts, { onConflict: "exercise_code" })
    .select("id, exercise_code");
  if (workoutsError) {
    console.error("Upserting workouts failed:", workoutsError.message);
    process.exit(1);
  }

  const workoutIdByCode = new Map((upsertedWorkouts ?? []).map((w) => [w.exercise_code, w.id]));
  const workoutRowIds = [...workoutIdByCode.values()];

  const { error: deleteError } = await supabase
    .from("workout_exercises")
    .delete()
    .in("workout_id", workoutRowIds);
  if (deleteError) {
    console.error("Clearing old workout_exercises failed:", deleteError.message);
    process.exit(1);
  }

  const workoutExerciseRows = workoutExerciseRefs.map((ref) => ({
    workout_id: workoutIdByCode.get(ref.exercise_code),
    slot_number: ref.slot_number,
    exercise_id: ref.exercise_id,
  }));

  const { error: insertError } = await supabase.from("workout_exercises").insert(workoutExerciseRows);
  if (insertError) {
    console.error("Inserting workout_exercises failed:", insertError.message);
    process.exit(1);
  }

  const perBelt = workouts.reduce((acc, w) => {
    acc[w.color] = (acc[w.color] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`\nDone. Upserted ${exercises.length} exercises, ${workouts.length} workouts, ${workoutExerciseRows.length} workout-exercise links:`);
  Object.entries(perBelt).forEach(([color, count]) => console.log(`  ${color}: ${count}`));
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
