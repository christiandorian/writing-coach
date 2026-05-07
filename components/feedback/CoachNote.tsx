'use client'

interface CoachNoteProps {
  note: string
}

export default function CoachNote({ note }: CoachNoteProps) {
  return (
    <div className="bg-[var(--q-twilight-500)] rounded-[var(--q-radius-12)] p-[var(--q-space-16)] space-y-[var(--q-space-4)]">
      <p className="q-sh5 text-[var(--q-twilight-200)] uppercase tracking-wider">Coach's note</p>
      <p className="q-sh3 text-white leading-relaxed">{note}</p>
    </div>
  )
}
