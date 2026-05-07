'use client'

interface Stat {
  label: string
  value: string | number
  sub?: string
}

interface StatsBarProps {
  stats: Stat[]
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-[var(--radius)] shadow-sm border border-[var(--border)] px-5 py-4"
        >
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums font-display">
            {stat.value}
          </p>
          {stat.sub && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
