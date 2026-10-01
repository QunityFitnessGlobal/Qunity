// mm:ss for any duration in whole seconds, used wherever a workout duration
// is shown so short (sub-minute) durations do not just display as "0".
export function formatDurationClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// "8:00" rather than "08:00" — reads as a time, and is followed by the word
// "minutes" (or sits next to other words) wherever it's shown.
export function formatMinutesSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// Calendar days and weeks (e.g. "this week" on the parent's workouts
// screen) are counted in the families' time zone, not the server's UTC.
export const APP_TIME_ZONE = "Asia/Jerusalem";
