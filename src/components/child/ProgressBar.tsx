interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
      <div
        className="h-full rounded-full bg-brand-purple transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
