'use client'

import ScoreBadge from './ScoreBadge'

interface DimensionCardProps {
  name: string
  label: string
  score: number
  diagnosis: string
  suggestion: string
}

export default function DimensionCard({ name, label, score, diagnosis, suggestion }: DimensionCardProps) {
  return (
    <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-12)] border border-[var(--q-border-primary)] shadow-q-sm p-[var(--q-space-16)] space-y-[var(--q-space-12)]">
      <div className="flex items-start justify-between gap-[var(--q-space-12)]">
        <div>
          <p className="q-sh5 text-[var(--q-text-muted)] uppercase tracking-wider mb-[var(--q-space-4)]">
            {name}
          </p>
          <p className="q-b4 text-[var(--q-text-secondary)]">{label}</p>
        </div>
        <ScoreBadge score={score} />
      </div>

      <p className="q-b4 text-[var(--q-text-secondary)] leading-relaxed">{diagnosis}</p>

      <div className="bg-[var(--q-twilight-100)] rounded-[var(--q-radius-md)] p-[var(--q-space-12)] space-y-[var(--q-space-4)]">
        <p className="q-sh5 text-[var(--q-twilight-600)] uppercase tracking-wider">Next time</p>
        <p className="q-b4 text-[var(--q-text-primary)] leading-relaxed">{suggestion}</p>
      </div>
    </div>
  )
}
