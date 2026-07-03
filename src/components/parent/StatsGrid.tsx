export interface StatTile {
  label: string;
  value: string;
}

interface StatsGridProps {
  stats: StatTile[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-200 bg-white p-3 text-center shadow-sm"
        >
          <p className="text-xl font-bold">{stat.value}</p>
          <p className="text-xs text-text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
