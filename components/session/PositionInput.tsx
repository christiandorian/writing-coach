'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface PositionInputProps {
  onSubmit: (position: string) => void
}

export default function PositionInput({ onSubmit }: PositionInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const sentenceCount = value.trim().split(/[.!?]+/).filter((s) => s.trim().length > 0).length

  const handleSubmit = () => {
    if (!value.trim()) { setError('You must declare a position before writing.'); return }
    if (sentenceCount > 2) { setError('Keep your position to 1–2 sentences.'); return }
    onSubmit(value.trim())
  }

  return (
    <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-lg)] border border-[var(--q-border-primary)] shadow-q-sm p-[var(--q-space-20)] space-y-[var(--q-space-16)]">
      <div className="space-y-[var(--q-space-4)]">
        <h2 className="q-h5 text-[var(--q-text-primary)]">What is your position?</h2>
        <p className="q-b4 text-[var(--q-text-secondary)]">
          State your stance in 1–2 sentences. You cannot change this after locking in.
        </p>
      </div>

      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setError('') }}
        placeholder="I believe that..."
        rows={3}
        autoComplete="off"
        spellCheck={false}
        className={[
          'w-full bg-[var(--q-surface-bg)] border border-[var(--q-border-primary)]',
          'rounded-[var(--q-radius-md)] text-[var(--q-text-primary)]',
          'placeholder-[var(--q-text-muted)] p-[var(--q-space-12)] resize-none q-b3',
          'focus:outline-none focus:ring-2 focus:ring-[var(--q-twilight-300)] focus:border-transparent transition-all',
        ].join(' ')}
      />

      {error && <p className="q-b5 text-[var(--q-text-error)]">{error}</p>}

      <Button onClick={handleSubmit} disabled={!value.trim()} size="lg" className="w-full">
        Lock in my position →
      </Button>
    </div>
  )
}
