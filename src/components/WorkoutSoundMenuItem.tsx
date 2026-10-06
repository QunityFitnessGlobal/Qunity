"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PRIMARY_BUTTON } from "@/components/entry/EntryShell";
import { DIALOG_CLOSE, SETTINGS_ROW, SettingsDialog, SettingsIcons, SettingsRowContent } from "@/components/ui/SettingsUI";
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
      <button type="button" onClick={handleOpen} className={SETTINGS_ROW}>
        <SettingsRowContent icon={SettingsIcons.sound} label={t("menuLabel")} />
      </button>

      {open && (
        <SettingsDialog title={t("title")} icon={SettingsIcons.sound}>
          <div className="flex flex-col gap-1.5 text-start">
            {WORKOUT_SOUND_KINDS.map((kind) => {
              const selected = draft === kind;
              return (
                <div
                  key={kind}
                  className={`flex items-center gap-2 rounded-2xl border-[1.5px] px-3 ${
                    selected ? "border-brand-purple bg-brand-purple/[0.06]" : "border-[#ece6f2] bg-white"
                  }`}
                >
                  <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-2.5 text-[15px] font-medium">
                    <input
                      type="radio"
                      name="workout-sound"
                      value={kind}
                      checked={selected}
                      onChange={() => setDraft(kind)}
                      className="h-4 w-4 accent-brand-purple"
                    />
                    {t(kind)}
                  </label>
                  {kind !== "none" && (
                    <button
                      type="button"
                      onClick={() => handlePreview(kind)}
                      aria-label={t("preview", { name: t(kind) })}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-brand-purple hover:bg-brand-purple/10"
                    >
                      <SpeakerIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button type="button" className={PRIMARY_BUTTON} onClick={handleSave}>
            {t("save")}
          </button>
          <button type="button" className={DIALOG_CLOSE} onClick={handleClose}>
            {t("cancel")}
          </button>
        </SettingsDialog>
      )}
    </>
  );
}
