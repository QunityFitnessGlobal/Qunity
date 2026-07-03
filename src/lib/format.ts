// mm:ss for any duration in whole seconds, used wherever a workout duration
// is shown so short (sub-minute) durations do not just display as "0".
export function formatDurationClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
