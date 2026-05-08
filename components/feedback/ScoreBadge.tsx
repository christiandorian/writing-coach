'use client'

import { scoreColorClass, toDisplayScore } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number  // raw 1-10 score from AI
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const display = toDisplayScore(score) // convert to 0-20
  const bgColor =
    display < 10
      ? 'bg-[var(--q-cherry-300)]/20'
      : display <= 14
      ? 'bg-[var(--q-sherbert-300)]/30'
      : 'bg-[var(--q-mint-100)]'

  const sizeClass = {
    sm: 'q-sh5 px-[var(--q-space-8)] py-[var(--q-space-2)]',
    md: 'q-sh4 px-[var(--q-space-8)] py-[var(--q-space-4)]',
    lg: 'q-h4  px-[var(--q-space-12)] py-[var(--q-space-6)]',
  }[size]

  return (
    <span className={`tabular-nums rounded-[var(--q-radius-full)] ${bgColor} ${scoreColorClass(display, 20)} ${sizeClass}`}>
      {display}/20
    </span>
  )
}
