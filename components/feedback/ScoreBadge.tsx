'use client'

import { scoreColorClass } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const bgColor =
    score < 5
      ? 'bg-[var(--q-cherry-300)]/20'
      : score <= 7
      ? 'bg-[var(--q-sherbert-300)]/30'
      : 'bg-[var(--q-mint-100)]'

  const sizeClass = {
    sm: 'q-sh5 px-[var(--q-space-8)] py-[var(--q-space-2)]',
    md: 'q-sh4 px-[var(--q-space-8)] py-[var(--q-space-4)]',
    lg: 'q-h4  px-[var(--q-space-12)] py-[var(--q-space-6)]',
  }[size]

  return (
    <span className={`tabular-nums rounded-[var(--q-radius-full)] ${bgColor} ${scoreColorClass(score)} ${sizeClass}`}>
      {score}/10
    </span>
  )
}
