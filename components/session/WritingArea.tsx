'use client'

import { forwardRef } from 'react'

interface WritingAreaProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  className?: string
  fill?: boolean
  placeholder?: string
}

const WritingArea = forwardRef<HTMLTextAreaElement, WritingAreaProps>(
  ({ value, onChange, disabled, className, fill, placeholder = 'Your response...' }, ref) => {
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
        placeholder={placeholder}
        className={[
          fill ? 'w-full flex-1 min-h-0 resize-none' : 'w-full h-[30vh] min-h-[200px] resize-none',
          'bg-[var(--q-surface-base)]',
          'rounded-[var(--q-radius-12)]',
          'text-[var(--q-text-primary)] placeholder-[var(--q-text-muted)]',
          'p-[var(--q-space-16)] q-sh3',
          'focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className ?? '',
        ].join(' ')}
      />
    )
  }
)

WritingArea.displayName = 'WritingArea'
export default WritingArea
