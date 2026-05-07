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
    <div className="flex items-center gap-[var(--q-space-8)]">
      <span className={`q-sh4 tabular-nums transition-colors duration-200 ${ready ? 'text-[var(--q-mint-500)]' : 'text-[var(--q-text-muted)]'}`}>
        {count} words
      </span>
      {!ready && (
        <span className="q-b5 text-[var(--q-text-muted)]">
          · {minWords - count} more to submit
        </span>
      )}
    </div>
  )
}
