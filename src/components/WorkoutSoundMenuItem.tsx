"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SpeakerIcon } from "@/components/ui/SpeakerIcon";
import {
  WORKOUT_SOUND_KINDS,
  getWorkoutSoundPreference,
  previewWorkoutSound,
  setWorkoutSoundPreference,
  stopWorkoutSound,
  unlockWorkoutAudio,
  type WorkoutSoundKind,
} from "@/lib/workout-sounds";

// Settings row "סוג צלצול לאימון" — opens a popup to pick the cue played at
// the workout timer's work<->rest transitions (see workout-sounds.ts). Shown
// to the child only (the one who trains); the choice is per device, not per
// account.
export function WorkoutSoundMenuItem() {
  const t = useTranslations("workoutSound");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<WorkoutSoundKind>("bell");

  function handleOpen() {
    setDraft(getWorkoutSoundPreference());
    setOpen(true);
  }

  function handleClose() {
    stopWorkoutSound();
    setOpen(false);
  }

  function handleSave() {
    setWorkoutSoundPreference(draft);
    handleClose();
  }

  function handlePreview(kind: WorkoutSoundKind) {
    // The tap itself is the user gesture the browser needs before it will
    // play audio.
    unlockWorkoutAudio();
    previewWorkoutSound(kind);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full max-w-sm items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-right text-sm font-semibold text-zinc-700"
      >
        <span>{t("menuLabel")}</span>
        <span className="text-zinc-400">◂</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xs space-y-3 rounded-lg bg-white p-5">
            <p className="text-center text-base font-bold">{t("title")}</p>

            <div className="space-y-1">
              {WORKOUT_SOUND_KINDS.map((kind) => (
                <div
                  key={kind}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-zinc-50"
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-2 py-1 text-sm text-zinc-700">
                    <input
                      type="radio"
                      name="workout-sound"
                      value={kind}
                      checked={draft === kind}
                      onChange={() => setDraft(kind)}
                    />
                    {t(kind)}
                  </label>
                  {kind !== "none" && (
                    <button
                      type="button"
                      onClick={() => handlePreview(kind)}
                      aria-label={t("preview", { name: t(kind) })}
                      className="rounded-full p-2 text-brand-purple hover:bg-brand-purple/10"
                    >
                      <SpeakerIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-zinc-700 hover:bg-zinc-800" onClick={handleClose}>
                {t("cancel")}
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {t("save")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
