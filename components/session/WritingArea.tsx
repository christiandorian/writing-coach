'use client'

import { forwardRef } from 'react'

interface WritingAreaProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

const WritingArea = forwardRef<HTMLTextAreaElement, WritingAreaProps>(
  ({ value, onChange, disabled }, ref) => {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Write your argument here..."
        className={[
          'w-full h-[50vh] min-h-[320px] resize-none',
          'bg-[var(--q-surface-base)] border border-[var(--q-border-primary)]',
          'rounded-[var(--q-radius-12)] shadow-q-sm',
          'text-[var(--q-text-primary)] placeholder-[var(--q-text-muted)]',
          'p-[var(--q-space-16)] q-b3 leading-relaxed',
          'focus:outline-none focus:ring-2 focus:ring-[var(--q-twilight-300)] focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-all',
        ].join(' ')}
      />
    )
  }
)

WritingArea.displayName = 'WritingArea'
export default WritingArea
