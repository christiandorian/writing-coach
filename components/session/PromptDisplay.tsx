'use client'

interface PromptDisplayProps {
  text: string
  category: string
}

export default function PromptDisplay({ text, category }: PromptDisplayProps) {
  return (
    <div className="bg-[var(--q-twilight-100)] rounded-[var(--q-radius-lg)] p-[var(--q-space-20)] space-y-[var(--q-space-8)]">
      <span className="inline-block q-sh5 uppercase tracking-wider text-[var(--q-twilight-600)] bg-[var(--q-surface-base)] px-[var(--q-space-8)] py-[var(--q-space-4)] rounded-[var(--q-radius-full)]">
        Prompt
      </span>
      <p className="q-sh2 text-[var(--q-text-primary)] leading-relaxed">
        {text}
      </p>
    </div>
  )
}
