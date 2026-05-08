'use client'

import { countWords } from '@/lib/utils'

interface WordCountProps {
  text: string
  minWords?: number
}

export default function WordCount({ text, minWords = 50 }: WordCountProps) {
  const count = countWords(text)
  const ready = count >= minWords

  return (
    <span className={`q-sh4 tabular-nums transition-colors duration-200 ${ready ? 'text-[var(--q-mint-500)]' : 'text-[var(--q-text-muted)]'}`}>
      {count} / {minWords} words
    </span>
  )
}
