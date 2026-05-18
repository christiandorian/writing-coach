'use client'

import { countWords } from '@/lib/utils'

interface WordCountProps {
  text: string
  minWords?: number
  maxWords?: number
}

export default function WordCount({ text, minWords = 100, maxWords = 500 }: WordCountProps) {
  const count = countWords(text)

  const colorClass =
    count >= 400
      ? 'text-[var(--q-text-success)]'
      : count >= minWords
      ? 'text-[var(--q-text-warning)]'
      : 'text-[var(--q-text-muted)]'

  return (
    <span className={`q-sh4 tabular-nums transition-colors duration-200 ${colorClass}`}>
      {count} / {maxWords} words
    </span>
  )
}
