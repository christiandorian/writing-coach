'use client'

import Link from 'next/link'
import { formatDate, scoreColorClass } from '@/lib/utils'
import type { SessionWithFeedback } from '@/lib/types'

interface RecentSessionsProps {
  sessions: SessionWithFeedback[]
}

export default function RecentSessions({ sessions }: RecentSessionsProps) {
  if (sessions.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--text-muted)] text-sm">
        No sessions yet — start your first practice below.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const feedback = s.feedback?.[0]
        const score = feedback?.overall_score

        return (
          <div
            key={s.id}
            className="bg-white rounded-[var(--radius)] border border-[var(--border)] shadow-sm px-5 py-4 flex items-center gap-4 hover:border-[var(--accent)] transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.prompt_text}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(s.created_at)}</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              {score != null ? (
                <span className={`text-sm font-bold tabular-nums ${scoreColorClass(Math.round(score))}`}>
                  {Number(score).toFixed(1)}/10
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">—</span>
              )}
              <Link
                href={`/session/${s.id}/review`}
                className="text-xs font-semibold text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Review →
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
